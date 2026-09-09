import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveUserId } from "@/lib/session";

/**
 * GET /api/suggestions/export?siteId=xxx[&format=csv|json]
 * Exports a site's suggestions as CSV or JSON.
 * Identity from the session cookie (transitional query fallback is
 * logged); the target site MUST belong to the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const siteId = request.nextUrl.searchParams.get("siteId");
    const format = request.nextUrl.searchParams.get("format") || "csv";

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
    const site = await db.site.findUnique({
      where: { id: siteId },
      select: { userId: true },
    });
    if (!site || site.userId !== userId) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const suggestions = await db.linkSuggestion.findMany({
      where: { siteId },
      orderBy: { score: "desc" },
      include: {
        sourcePage: {
          select: { id: true, title: true, url: true },
        },
        targetPage: {
          select: { id: true, title: true, url: true },
        },
      },
    });

    if (format === "json") {
      return NextResponse.json(suggestions);
    }

    const csvHeader = "Source Title,Source URL,Target Title,Target URL,Anchor Text,Score,Status";
    const csvRows = suggestions.map((s) => {
      const sourceTitle = (s.sourcePage?.title ?? "").replace(/"/g, '""');
      const sourceUrl = (s.sourcePage?.url ?? "").replace(/"/g, '""');
      const targetTitle = (s.targetPage?.title ?? "").replace(/"/g, '""');
      const targetUrl = (s.targetPage?.url ?? "").replace(/"/g, '""');
      const anchorText = (s.anchorText ?? "").replace(/"/g, '""');
      const score = String(s.score ?? "");
      const status = s.status ?? "";

      return `"${sourceTitle}","${sourceUrl}","${targetTitle}","${targetUrl}","${anchorText}","${score}","${status}"`;
    });

    const csv = [csvHeader, ...csvRows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="suggestions-${siteId}.csv"`,
      },
    });
  } catch (error: unknown) {
    console.error("Export suggestions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
