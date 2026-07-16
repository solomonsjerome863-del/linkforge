import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

/**
 * Admin-only endpoint to directly set a user's password by email.
 * Requires the ADMIN_EMAIL env var to match the caller's email or
 * the X-Admin-Secret header for server-side use.
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminSecret = process.env.ADMIN_SECRET;

    // Accept either admin secret header or admin email in body
    const authHeader = request.headers.get("x-admin-secret");
    const body = await request.json();
    const { email, newPassword, requesterEmail } = body;

    const isAdmin =
      (adminSecret && authHeader === adminSecret) ||
      (adminEmail && requesterEmail?.toLowerCase().trim() === adminEmail.toLowerCase().trim());

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newHash = await hashPassword(newPassword);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    console.log(`[Admin Reset] Password updated for user: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: `Password has been reset for ${user.email}`,
    });
  } catch (error: unknown) {
    console.error("Admin reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}