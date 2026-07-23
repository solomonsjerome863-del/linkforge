import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/api-auth";

// Vercel Hobby caps at 10s regardless, but after() gets the remaining budget
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.nextUrl.searchParams.get("userId");

    // ── Auth ──
    if (userId) {
      const user = await validateUser(userId);
      if (!user) {
        console.error(`[Crawl] Auth failed: user ${userId} not found`);
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }
    }

    // ── Find site ──
    const site = await db.site.findUnique({ where: { id } });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // ── Ownership check ──
    if (userId && site.userId !== userId) {
      return NextResponse.json({ error: "You do not have permission to crawl this site" }, { status: 403 });
    }

    // ── SSRF prevention ──
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(site.url);
    } catch {
      return NextResponse.json({ error: "Invalid site URL" }, { status: 400 });
    }
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return NextResponse.json({ error: "Site URL must use HTTP or HTTPS" }, { status: 400 });
    }
    const hostname = parsedUrl.hostname;
    const blocked = ["localhost", "127.0.0.1", "::1", "0.0.0.0"];
    if (
      blocked.includes(hostname) ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^169\.254\./.test(hostname) ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return NextResponse.json({ error: "Cannot crawl internal or private URLs" }, { status: 400 });
    }

    // ── Check if already crawling ──
    if (site.status === "crawling") {
      const recentJob = await db.crawlJob.findFirst({
        where: { siteId: id, status: "running" },
        orderBy: { createdAt: "desc" },
      });
      if (recentJob) {
        const elapsed = Date.now() - new Date(recentJob.startedAt || recentJob.createdAt).getTime();
        if (elapsed < 120000) {
          return NextResponse.json({ error: "A crawl is already in progress" }, { status: 409 });
        }
        await db.crawlJob.update({
          where: { id: recentJob.id },
          data: { status: "failed", error: "Timed out", completedAt: new Date() },
        });
      }
    }

    console.log(`[Crawl] Starting crawl for "${site.name}" (${site.url})`);

    // ── Create crawl job and set status ──
    const crawlJob = await db.crawlJob.create({
      data: { siteId: id, status: "running", startedAt: new Date() },
    });
    await db.site.update({
      where: { id },
      data: { status: "crawling", error: null },
    });

    const maxPages = Math.min(site.pageLimit || 50, 20);
    const siteUrl = site.url;
    const crawlJobId = crawlJob.id;

    // ── Run crawl in background with after() ──
    // after() gives us remaining time after the response is sent.
    // The new fetch()-based crawler completes in 2-5s, well within the 10s budget.
    after(async () => {
      try {
        console.log(`[Crawl] Background crawl started for ${siteUrl}, max ${maxPages} pages`);

        // Inline the crawl logic to avoid module-level issues in after() context
        const { crawlSite } = await import("@/lib/crawler");

        // Delete old data
        await db.linkSuggestion.deleteMany({ where: { siteId: id } });
        await db.page.deleteMany({ where: { siteId: id } });

        const crawlResult = await crawlSite(siteUrl, maxPages);
        console.log(`[Crawl] Crawler returned ${crawlResult.pages.length} pages, ${crawlResult.errors.length} errors`);

        if (crawlResult.pages.length === 0) {
          await db.site.update({
            where: { id },
            data: {
              status: "error",
              error: `No readable pages found at ${siteUrl}. The site may block automated requests.`,
            },
          });
          await db.crawlJob.update({
            where: { id: crawlJobId },
            data: { status: "failed", error: "No pages found", completedAt: new Date() },
          });
          return;
        }

        // Save pages
        const pagesToCreate = crawlResult.pages.map((page) => ({
          url: page.url,
          title: page.title,
          content: page.content.slice(0, 50000),
          textContent: page.textContent.slice(0, 30000),
          headings: JSON.stringify(page.headings.length > 0 ? page.headings : ["Page"]),
          wordCount: page.wordCount,
          status: "active" as const,
          siteId: id,
        }));

        if (pagesToCreate.length > 0) {
          await db.page.createMany({ data: pagesToCreate });
        }

        await db.site.update({
          where: { id },
          data: {
            status: "ready",
            pagesCount: pagesToCreate.length,
            lastCrawled: new Date(),
          },
        });
        await db.crawlJob.update({
          where: { id: crawlJobId },
          data: {
            status: "completed",
            pagesFound: crawlResult.discoveredUrlCount,
            pagesSaved: pagesToCreate.length,
            completedAt: new Date(),
          },
        });

        console.log(`[Crawl] ✓ Complete: ${pagesToCreate.length} pages saved`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Crawl] ✗ Background crawl failed:`, msg);

        try {
          await db.site.update({
            where: { id },
            data: { status: "error", error: msg.slice(0, 200) },
          });
          await db.crawlJob.update({
            where: { id: crawlJobId },
            data: { status: "failed", error: msg.slice(0, 200), completedAt: new Date() },
          });
        } catch (dbErr) {
          console.error("[Crawl] Failed to update DB with error:", dbErr);
        }
      }
    });

    console.log(`[Crawl] after() registered — returning 200 immediately`);
    return NextResponse.json({ message: "Crawl started", crawlJobId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Crawl] Route error:", message);
    return NextResponse.json({ error: `Internal error: ${message}` }, { status: 500 });
  }
}
