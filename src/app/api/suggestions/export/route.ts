import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const siteId = request.nextUrl.searchParams.get("siteId");
    const userId = request.nextUrl.searchParams.get("userId");
    const format = request.nextUrl.searchParams.get("format") || "csv";

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId query parameter is required" },
        { status: 400 }
      );
    }

    if (userId) {
      const user = await validateUser(userId);
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 401 }
        );
      }
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