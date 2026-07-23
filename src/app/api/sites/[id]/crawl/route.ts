import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/api-auth";
import { crawlSite } from "@/lib/crawler";

// Allow up to 60s on Pro; capped at 10 on Hobby
export const maxDuration = 60;

/**
 * POST /api/sites/[id]/crawl
 *
 * Runs the crawl **synchronously** inside the route handler.
 * This avoids the unreliable `after()` experimental API and ensures
 * the crawl either completes or the function times out with a clear error.
 *
 * On Vercel Hobby (10s cap), the fetch()‑based crawler can complete a
 * useful crawl of 5‑10 pages within that window.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

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
      console.error(`[Crawl] Site ${id} not found`);
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // ── Ownership check ──
    if (userId && site.userId !== userId) {
      console.error(`[Crawl] Ownership mismatch: site.userId=${site.userId}, userId=${userId}`);
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
        // Stale job — reset it
        await db.crawlJob.update({
          where: { id: recentJob.id },
          data: { status: "failed", error: "Stale — timed out", completedAt: new Date() },
        });
      }
    }

    console.log(`[Crawl] Starting crawl for site "${site.name}" (${site.url}) by user ${userId}`);

    // ── Create crawl job ──
    const crawlJob = await db.crawlJob.create({
      data: { siteId: id, status: "running", startedAt: new Date() },
    });

    await db.site.update({
      where: { id },
      data: { status: "crawling", error: null },
    });

    const maxPages = Math.min(site.pageLimit || 50, 30); // Cap at 30 for serverless
    const siteUrl = site.url;
    const setupTime = Date.now() - startTime;
    console.log(`[Crawl] Setup done in ${setupTime}ms, crawling up to ${maxPages} pages`);

    // ── Run crawl synchronously ──
    try {
      // Delete old data
      await db.linkSuggestion.deleteMany({ where: { siteId: id } });
      await db.page.deleteMany({ where: { siteId: id } });

      const crawlResult = await crawlSite(siteUrl, maxPages);
      const crawlTime = Date.now() - startTime;

      if (crawlResult.pages.length === 0) {
        await db.site.update({
          where: { id },
          data: {
            status: "error",
            error: `Could not read any pages from ${siteUrl}. Make sure the URL is accessible and has content.`,
          },
        });
        await db.crawlJob.update({
          where: { id: crawlJob.id },
          data: { status: "failed", error: "No pages found", completedAt: new Date() },
        });
        console.log(`[Crawl] No pages found in ${crawlTime}ms`);
        return NextResponse.json({
          success: false,
          message: "No pages could be crawled. The site might be unreachable or blocking automated requests.",
          crawlTime,
          pagesSaved: 0,
        });
      }

      // Save crawled pages
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
        where: { id: crawlJob.id },
        data: {
          status: "completed",
          pagesFound: crawlResult.discoveredUrlCount,
          pagesSaved: pagesToCreate.length,
          completedAt: new Date(),
        },
      });

      console.log(`[Crawl] Complete in ${crawlTime}ms — ${pagesToCreate.length} pages saved, ${crawlResult.errors.length} errors`);

      return NextResponse.json({
        success: true,
        message: `Crawled ${pagesToCreate.length} pages successfully`,
        crawlTime,
        pagesSaved: pagesToCreate.length,
        pagesDiscovered: crawlResult.discoveredUrlCount,
        errors: crawlResult.errors.length,
      });
    } catch (crawlError) {
      const errorMessage = crawlError instanceof Error ? crawlError.message : "Crawl failed";
      const crawlTime = Date.now() - startTime;

      console.error(`[Crawl] Crawl failed after ${crawlTime}ms:`, errorMessage);

      await db.site.update({
        where: { id },
        data: { status: "error", error: errorMessage },
      });
      await db.crawlJob.update({
        where: { id: crawlJob.id },
        data: { status: "failed", error: errorMessage, completedAt: new Date() },
      });

      return NextResponse.json({
        success: false,
        message: `Crawl failed: ${errorMessage}`,
        crawlTime,
        pagesSaved: 0,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Crawl] Route error:", message);
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}
