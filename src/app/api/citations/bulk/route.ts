import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveUserId } from "@/lib/session";

const VALID_STATUSES = [
  "new",
  "reviewed",
  "outreach_sent",
  "converted",
  "dismissed",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, status } = body;
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

    if (!ids || !status) {
      return NextResponse.json(
        { error: "ids and status are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids must be a non-empty array" },
        { status: 400 }
      );
    }

    if (ids.length > 500) {
      return NextResponse.json(
        { error: "Batch size exceeds maximum of 500" },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify all citations belong to sites owned by the user
    const userSites = await db.site.findMany({
      where: { userId },
      select: { id: true },
    });

    const userSiteIds = new Set(userSites.map((s) => s.id));

    const targetCitations = await db.citation.findMany({
      where: { id: { in: ids } },
      select: { id: true, siteId: true },
    });

    // Filter to only IDs that belong to user's sites
    const validIds = targetCitations
      .filter((c) => userSiteIds.has(c.siteId))
      .map((c) => c.id);

    if (validIds.length === 0) {
      return NextResponse.json(
        { error: "No valid citations found to update" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = { status };
    if (status !== "new") {
      updateData.reviewedAt = new Date();
    }

    const result = await db.citation.updateMany({
      where: { id: { in: validIds } },
      data: updateData,
    });

    return NextResponse.json({
      updated: result.count,
      status,
    });
  } catch (error: unknown) {
    console.error("Bulk update citations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
