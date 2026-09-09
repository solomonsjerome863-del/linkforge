import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveUserId } from "@/lib/session";

/**
 * GET /api/pages?siteId=xxx
 *
 * Lists crawled pages for a site with link counts and orphan detection.
 * Identity is resolved from the session cookie (transitional
 * client-supplied fallback is logged), and the target site MUST
 * belong to the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const siteId = request.nextUrl.searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId query parameter is required" },
        { status: 400 }
      );
    }

    const userId = resolveUserId(request, request.nextUrl.searchParams.get("userId"));
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    // Verify the site belongs to the authenticated user (mandatory)
    const site = await db.site.findUnique({ where: { id: siteId } });
    if (!site || site.userId !== userId) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const pages = await db.page.findMany({
      where: { siteId },
      select: {
        id: true,
        url: true,
        title: true,
        wordCount: true,
        status: true,
        headings: true,
        _count: {
          select: {
            sourceSuggestions: true,
            targetSuggestions: true,
          },
        },
      },
      orderBy: { title: "asc" },
    });

    const mappedPages = pages.map((page) => ({
      id: page.id,
      url: page.url,
      title: page.title,
      wordCount: page.wordCount,
      status: page.status,
      headings: page.headings,
      incomingLinks: page._count.targetSuggestions,
      outgoingLinks: page._count.sourceSuggestions,
      isOrphan: page._count.targetSuggestions === 0,
    }));

    return NextResponse.json({ pages: mappedPages });
  } catch (error: unknown) {
    console.error("List pages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
