import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveUserId } from "@/lib/session";

/**
 * GET /api/suggestions?siteId=xxx[&status=...]
 *
 * Lists link suggestions for a site. Identity is resolved from the
 * session cookie (transitional client-supplied fallback is logged),
 * and the target site MUST belong to the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const siteId = request.nextUrl.searchParams.get("siteId");
    const status = request.nextUrl.searchParams.get("status");

    if (!siteId) {
      return NextResponse.json({ error: "siteId query parameter is required" }, { status: 400 });
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

    const where: Record<string, unknown> = { siteId };
    if (status) {
      where.status = status;
    }

    const suggestions = await db.linkSuggestion.findMany({
      where,
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

    return NextResponse.json({ suggestions });
  } catch (error: unknown) {
    console.error("List suggestions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
