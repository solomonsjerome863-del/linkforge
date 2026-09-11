import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/auth/verify-email-token
 *
 * Consumes the token from the emailed verification link and marks the
 * account as verified. Single-use; the token expires after 24 hours.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Verification token is missing" },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: {
        verifyToken: token,
        verifyTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "This verification link is invalid or has expired. Log in to receive a new one." },
        { status: 400 }
      );
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null,
        verifyTokenExpiry: null,
      },
      select: { id: true, email: true, emailVerified: true },
    });

    console.log(`[Auth] Email verified: ${user.email}`);

    return NextResponse.json({
      success: true,
      email: updated.email,
      emailVerified: updated.emailVerified,
    });
  } catch (error) {
    console.error("Verify email token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
