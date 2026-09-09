import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveUserId } from "@/lib/session";

/**
 * GET    /api/sites/[id] — site detail with counts
 * DELETE /api/sites/[id] — permanently delete a site (cascade)
 *
 * Identity from the session cookie (transitional query fallback is
 * logged); the site MUST belong to the authenticated user.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const userId = resolveUserId(request, request.nextUrl.searchParams.get("userId"));
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const site = await db.site.findUnique({
      where: { id },
      include: {
        _count: {
          select: { pages: true, suggestions: true, crawlJobs: true },
        },
      },
    });

    if (!site || site.userId !== userId) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json({ site });
  } catch (error: unknown) {
    console.error("Get site error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const userId = resolveUserId(request, request.nextUrl.searchParams.get("userId"));
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const site = await db.site.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!site || site.userId !== userId) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Cascade deletes are handled by Prisma schema (onDelete: Cascade)
    await db.site.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete site error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
