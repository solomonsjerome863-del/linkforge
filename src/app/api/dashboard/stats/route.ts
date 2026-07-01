import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required" }, { status: 400 });
    }

    const user = await validateUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
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
      // Orphan pages: active pages that don't appear as a target of any suggestion
      // We count pages that are NOT referenced as a targetPageId in any suggestion
      db.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM Page p
        WHERE p.siteId IN (SELECT id FROM Site WHERE userId = ${userId})
        AND p.status = 'active'
        AND p.id NOT IN (
          SELECT DISTINCT targetPageId FROM LinkSuggestion
          WHERE siteId IN (SELECT id FROM Site WHERE userId = ${userId})
        )
      `,
    ]);

    const stats = {
      totalSites,
      totalPages,
      totalSuggestions,
      pendingSuggestions,
      appliedLinks,
      orphanPages: Number(orphanPages[0]?.count ?? 0),
    };

    return NextResponse.json({ stats });
  } catch (error: unknown) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
