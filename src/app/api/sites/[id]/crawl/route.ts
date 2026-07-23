import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/api-auth";

// Allow up to 60s (Vercel caps at 10 on Hobby, more on Pro)
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.nextUrl.searchParams.get("userId");

    // ── Auth: validate user exists ──
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
      console.error(`[Crawl] Site ${id} not found`);
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // ── Ownership check ──
    if (userId && site.userId !== userId) {
      console.error(`[Crawl] Ownership mismatch: site.userId=${site.userId}, userId=${userId}`);
      return NextResponse.json({ error: "You do not have permission to crawl this site" }, { status: 403 });
    }

    // ── SSRF prevention: validate the site URL ──
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
    const blocked = [
      "localhost", "127.0.0.1", "::1", "0.0.0.0",
    ];
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
      // Check if there's a recent running crawl job
      const recentJob = await db.crawlJob.findFirst({
        where: { siteId: id, status: "running" },
        orderBy: { createdAt: "desc" },
      });
      if (recentJob) {
        const elapsed = Date.now() - new Date(recentJob.startedAt || recentJob.createdAt).getTime();
        if (elapsed < 120000) { // within last 2 minutes
          return NextResponse.json({ error: "A crawl is already in progress for this site" }, { status: 409 });
        }
      }
    }

    console.log(`[Crawl] Starting crawl for site "${site.name}" (${site.url}) by user ${userId}`);

    // ── Create crawl job and set status ──
    const crawlJob = await db.crawlJob.create({
      data: { siteId: id, status: "running", startedAt: new Date() },
    });

    await db.site.update({
      where: { id },
      data: { status: "crawling", error: null },
    });

    const maxPages = site.pageLimit || 50;
    const siteUrl = site.url;
    const crawlJobId = crawlJob.id;

    // ── Run crawl in background using after() ──
    try {
      after(async () => {
        try {
          console.log(`[Crawl] Background crawl started for ${siteUrl}, max ${maxPages} pages`);

          // Dynamic import crawler to avoid loading SDK until needed
          const { crawlSite } = await import("@/lib/crawler");

          // Delete old data inside after() to not block the initial response
          await db.linkSuggestion.deleteMany({ where: { siteId: id } });
          await db.page.deleteMany({ where: { siteId: id } });

          const crawlResult = await crawlSite(siteUrl, maxPages);

          if (crawlResult.pages.length === 0) {
            await db.site.update({
              where: { id },
              data: {
                status: "error",
                error: `Could not read ${siteUrl}. Make sure the URL is accessible and has content.`,
              },
            });
            await db.crawlJob.update({
              where: { id: crawlJobId },
              data: { status: "failed", error: "No pages found", completedAt: new Date() },
            });
            return;
          }

          // Save crawled pages to database
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

          console.log(`[Crawl] Background crawl complete: ${pagesToCreate.length} pages saved`);
        } catch (crawlError) {
          const errorMessage =
            crawlError instanceof Error ? crawlError.message : "Crawl failed";

          await db.site.update({
            where: { id },
            data: { status: "error", error: errorMessage },
          });
          await db.crawlJob.update({
            where: { id: crawlJobId },
            data: { status: "failed", error: errorMessage, completedAt: new Date() },
          });

          console.error("[Crawl] Background crawl failed:", crawlError);
        }
      });

      console.log("[Crawl] after() registered successfully");
    } catch (afterError) {
      console.error("[Crawl] after() failed to register:", afterError);
      // after() failed — set site to error so the user knows to retry
      await db.crawlJob.update({
        where: { id: crawlJobId },
        data: { status: "failed", error: "Background executor unavailable", completedAt: new Date() },
      });
      await db.site.update({
        where: { id },
        data: { status: "error", error: "Crawl executor unavailable — please try again" },
      });
      // Still return 200 since we handled the error gracefully
    }

    // ── Return immediately — frontend polls for completion ──
    return NextResponse.json({
      crawlJob: {
        id: crawlJob.id,
        status: "running",
      },
      message: "Crawl started",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Crawl] Route error:", message, error);
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}
