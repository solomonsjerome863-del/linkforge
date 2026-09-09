import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const userId = resolveUserId(request, request.nextUrl.searchParams.get("userId"));

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const [
      totalSites,
      totalPages,
      totalSuggestions,
      pendingSuggestions,
      appliedLinks,
      orphanPages,
    ] = await Promise.all([
      db.site.count({ where: { userId } }),
      db.page.count({
        where: {
          site: { userId },
          status: "active",
        },
      }),
      db.linkSuggestion.count({
        where: {
          site: { userId },
        },
      }),
      db.linkSuggestion.count({
        where: {
          site: { userId },
          status: "pending",
        },
      }),
      db.linkSuggestion.count({
        where: {
          site: { userId },
          status: { in: ["approved", "applied"] },
        },
      }),
      // Orphan pages: active pages not referenced as a target in any suggestion
      (async () => {
        const allActivePages = await db.page.findMany({
          where: {
            site: { userId },
            status: "active",
          },
          select: { id: true },
        });
        const referencedTargetIds = await db.linkSuggestion.findMany({
          where: { site: { userId } },
          select: { targetPageId: true },
          distinct: ["targetPageId"],
        });
        const referencedSet = new Set(referencedTargetIds.map((r) => r.targetPageId));
        return allActivePages.filter((p) => !referencedSet.has(p.id)).length;
      })(),
    ]);

    const stats = {
      totalSites,
      totalPages,
      totalSuggestions,
      pendingSuggestions,
      appliedLinks,
      orphanPages,
    };

    return NextResponse.json({ stats });
  } catch (error: unknown) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
