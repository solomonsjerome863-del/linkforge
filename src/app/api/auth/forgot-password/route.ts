import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit: 5/hour per IP, 3/hour per email
    const ip = clientIp(request);
    const byIp = checkRateLimit(`forgot:${ip}`, 5, 3600000);
    const byEmail = checkRateLimit(`forgot:${normalizedEmail}`, 3, 3600000);
    if (!byIp.ok || !byEmail.ok) {
      return NextResponse.json(
        { error: "Too many reset requests. Please try again later." },
        { status: 429 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset link has been sent.",
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    // Send the reset email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const { subject, html, text } = passwordResetEmail(appUrl, token);
    const result = await sendEmail({ to: user.email, subject, html, text });

    if (!result.sent) {
      console.error(
        `[Forgot Password] Email NOT delivered to ${user.email} (${result.reason}). Token is valid in DB for 1 hour — configure RESEND_API_KEY / EMAIL_FROM.`
      );
    } else {
      console.log(`[Forgot Password] Reset email sent to: ${user.email}`);
    }

    const response: Record<string, unknown> = {
      success: true,
      message: "If an account exists, a reset link has been sent.",
    };

    // Dev convenience only — never expose the token in production responses
    if (process.env.NODE_ENV === "development") {
      response.devToken = token;
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
