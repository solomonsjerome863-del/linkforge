import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const userId = resolveUserId(request, request.nextUrl.searchParams.get("userId"));
    const siteId = request.nextUrl.searchParams.get("siteId");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId query parameter is required" },
        { status: 400 }
      );
    }

    // Validate site ownership
    const site = await db.site.findUnique({
      where: { id: siteId },
    });

    if (!site || site.userId !== userId) {
      return NextResponse.json(
        { error: "Site not found or access denied" },
        { status: 403 }
      );
    }

    // Run aggregate queries in parallel
    const [total, newCount, unlinked, linked, avgScoreResult, citations] =
      await Promise.all([
        db.citation.count({ where: { siteId } }),
        db.citation.count({ where: { siteId, status: "new" } }),
        db.citation.count({ where: { siteId, hasBacklink: false } }),
        db.citation.count({ where: { siteId, hasBacklink: true } }),
        db.citation.aggregate({
          where: { siteId },
          _avg: { opportunityScore: true },
        }),
        db.citation.findMany({
          where: { siteId },
          select: {
            sourceType: true,
            status: true,
          },
        }),
      ]);

    // Group by source type
    const bySource: Record<string, number> = {};
    for (const citation of citations) {
      const st = citation.sourceType || "other";
      bySource[st] = (bySource[st] || 0) + 1;
    }

    // Group by status
    const byStatus: Record<string, number> = {};
    for (const citation of citations) {
      const s = citation.status || "new";
      byStatus[s] = (byStatus[s] || 0) + 1;
    }

    return NextResponse.json({
      total,
      new: newCount,
      unlinked,
      linked,
      bySource,
      byStatus,
      avgOpportunityScore:
        avgScoreResult._avg.opportunityScore != null
          ? Math.round(avgScoreResult._avg.opportunityScore * 10) / 10
          : 0,
    });
  } catch (error: unknown) {
    console.error("Citation stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
