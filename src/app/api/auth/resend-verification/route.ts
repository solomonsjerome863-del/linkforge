import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { verificationEmail, sendEmail, isEmailConfigured } from "@/lib/email";

/**
 * POST /api/auth/resend-verification
 *
 * Sends a fresh verification email to the authenticated (but unverified)
 * user. Throttled by the token expiry: a new token is only issued once the
 * previous one has expired (24h), preventing inbox spam.
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

    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: true, message: "Your email is already verified." },
        { status: 200 }
      );
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Email delivery is not configured on this deployment." },
        { status: 503 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    let verifyToken = user.verifyToken;
    if (!verifyToken || !user.verifyTokenExpiry || user.verifyTokenExpiry < new Date()) {
      verifyToken = crypto.randomUUID().replace(/-/g, "");
      await db.user.update({
        where: { id: user.id },
        data: {
          verifyToken,
          verifyTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    const ve = verificationEmail(appUrl, verifyToken);
    const mailResult = await sendEmail({ to: user.email, subject: ve.subject, html: ve.html, text: ve.text });

    if (!mailResult.sent) {
      console.error(`[Verify] Resend failed for ${user.email}: ${mailResult.reason}`);
      return NextResponse.json(
        { error: "Could not send the verification email right now. Please try again shortly." },
        { status: 503 }
      );
    }

    console.log(`[Verify] Verification email resent to ${user.email}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
