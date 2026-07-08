import { NextRequest, NextResponse } from "next/server";
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

    try {
      // Crawl using the SDK-based crawler (works on Vercel serverless)
      const crawlResult = await crawlSite(site.url, maxPages);

      if (crawlResult.pages.length === 0) {
        throw new Error(
          `Could not read ${site.url}. Make sure the URL is accessible and has content.`
        );
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

      return NextResponse.json({
        crawlJob: {
          id: crawlJob.id,
          status: "completed",
          pagesFound: crawlResult.discoveredUrlCount,
          pagesSaved: pagesToCreate.length,
          completedAt: new Date().toISOString(),
        },
        pagesCount: pagesToCreate.length,
      });
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

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error("Crawl error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}