import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

/**
 * POST /api/auth/verify-email
 *
 * Marks the authenticated user's email as verified. Session-only: a
 * user can only ever verify their own account. (Signup auto-verifies
 * while no verification-email service is wired — this endpoint exists
 * for the client flow and future re-verification.)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getSessionUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    return NextResponse.json({ success: true, emailVerified: user.emailVerified });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
