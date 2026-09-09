import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveUserId } from "@/lib/session";

/**
 * GET /api/session
 *
 * Returns the full user data for the authenticated user.
 * Used by the client to restore session state on page load.
 *
 * User identity: resolved from the httpOnly session cookie first
 * (transitional fallback to client-supplied userId is logged).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = resolveUserId(request, searchParams.get("userId"));

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { sites: { include: { pages: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove sensitive fields
    const { passwordHash: _, resetToken: __, resetTokenExpiry: ___, ...safeUser } = user;

    return NextResponse.json({ user: safeUser }, { status: 200 });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
