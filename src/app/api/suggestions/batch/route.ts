import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveUserId } from "@/lib/session";

/**
 * POST /api/suggestions/batch
 * Approve or reject many suggestions at once. Identity from the session
 * cookie (transitional body fallback is logged). Only suggestions whose
 * site belongs to the authenticated user are touched — the rest are
 * skipped and reported.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, action } = body;

    const userId = resolveUserId(
      request,
      typeof body.userId === "string" ? body.userId : null
    );
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required and must not be empty" }, { status: 400 });
    }

    if (ids.length > 500) {
      return NextResponse.json({ error: "Batch size exceeds maximum of 500" }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const status = action === "approve" ? "approved" : "rejected";

    // Scope to the user's own sites — never touch suggestions on other users' sites
    const userSites = await db.site.findMany({
      where: { userId },
      select: { id: true },
    });
    const ownedSiteIds = new Set(userSites.map((s) => s.id));

    const targets = await db.linkSuggestion.findMany({
      where: { id: { in: ids } },
      select: { id: true, siteId: true },
    });

    const ownedIds: string[] = [];
    for (const t of targets) {
      if (ownedSiteIds.has(t.siteId)) {
        ownedIds.push(t.id);
      }
    }

    if (ownedIds.length === 0) {
      return NextResponse.json({ error: "No matching suggestions found" }, { status: 404 });
    }

    const result = await db.linkSuggestion.updateMany({
      where: { id: { in: ownedIds } },
      data: { status },
    });

    return NextResponse.json({
      updated: result.count,
      skipped: targets.length - ownedIds.length,
      status,
    });
  } catch (error: unknown) {
    console.error("Batch update suggestions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
