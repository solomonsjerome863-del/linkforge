import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/api-auth";
import { crawlSite } from "@/lib/crawler";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.nextUrl.searchParams.get("userId");
    if (userId) {
      const user = await validateUser(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }
    }

    const site = await db.site.findUnique({ where: { id } });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    if (userId && site.userId !== userId) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // SSRF prevention: validate the site URL before crawling
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(site.url);
    } catch {
      return NextResponse.json({ error: "Invalid site URL" }, { status: 400 });
    }

    if (parsedUrl.protocol !== "https:") {
      return NextResponse.json({ error: "Site URL must use HTTPS" }, { status: 400 });
    }

    const hostname = parsedUrl.hostname;
    // Reject private/reserved IP ranges
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0" ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^169\.254\./.test(hostname) ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return NextResponse.json({ error: "Cannot crawl internal or private URLs" }, { status: 400 });
    }

    // Create crawl job
    const crawlJob = await db.crawlJob.create({
      data: { siteId: id, status: "running", startedAt: new Date() },
    });

    await db.site.update({
      where: { id },
      data: { status: "crawling", error: null },
    });

    // Delete existing pages and suggestions
    await db.linkSuggestion.deleteMany({ where: { siteId: id } });
    await db.page.deleteMany({ where: { siteId: id } });

    const maxPages = site.pageLimit || 50;

    // ── Return immediately, crawl in background ──
    // after() runs AFTER the response is sent and is NOT subject to Vercel's 10s timeout
    after(async () => {
      try {
        console.log(`[Crawl] Background crawl started for ${site.url}, max ${maxPages} pages`);

        const crawlResult = await crawlSite(site.url, maxPages);

        if (crawlResult.pages.length === 0) {
          await db.site.update({
            where: { id },
            data: {
              status: "error",
              error: `Could not read ${site.url}. Make sure the URL is accessible and has content.`,
            },
          });
          await db.crawlJob.update({
            where: { id: crawlJob.id },
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
          where: { id: crawlJob.id },
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
          where: { id: crawlJob.id },
          data: { status: "failed", error: errorMessage, completedAt: new Date() },
        });

        console.error("[Crawl] Background crawl failed:", crawlError);
      }
    });

    // Return immediately — frontend polls for completion
    return NextResponse.json({
      crawlJob: {
        id: crawlJob.id,
        status: "running",
      },
      message: "Crawl started",
    });
  } catch (error: unknown) {
    console.error("Crawl error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
