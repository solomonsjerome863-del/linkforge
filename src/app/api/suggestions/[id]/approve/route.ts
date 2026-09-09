import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveUserId } from "@/lib/session";

/**
 * POST /api/suggestions/[id]/approve
 * Marks a suggestion as approved. Identity from the session cookie
 * (transitional body fallback is logged); the suggestion's site MUST
 * belong to the authenticated user.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let clientUserId: string | null = null;
    try {
      const body = await request.json();
      clientUserId = typeof body?.userId === "string" ? body.userId : null;
    } catch {
      // no/invalid body is fine — cookie is authoritative
    }

    const userId = resolveUserId(request, clientUserId);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const suggestion = await db.linkSuggestion.findUnique({ where: { id } });
    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    // Ownership: the suggestion's site must belong to the authenticated user
    const site = await db.site.findUnique({
      where: { id: suggestion.siteId },
      select: { userId: true },
    });
    if (!site || site.userId !== userId) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    const updated = await db.linkSuggestion.update({
      where: { id },
      data: { status: "approved" },
    });

    return NextResponse.json({ suggestion: updated });
  } catch (error: unknown) {
    console.error("Approve suggestion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
