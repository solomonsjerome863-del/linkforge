import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/password";

/**
 * Change password for an authenticated user.
 * 
 * Two modes:
 * 1. With currentPassword: verifies the old password before setting new one
 * 2. Without currentPassword: sets new password directly (user is already authenticated via session)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword } = body;

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: "User ID and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If current password is provided, verify it (supports both bcrypt and legacy SHA-256)
    if (currentPassword) {
      if (!user.passwordHash) {
        return NextResponse.json(
          { error: "No password set on this account" },
          { status: 400 }
        );
      }
      const result = await verifyPassword(currentPassword, user.passwordHash);
      if (!result.valid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        );
      }
    }

    // Hash and save the new password with bcrypt
    const newHash = await hashPassword(newPassword);
    await db.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    console.log(`[Change Password] Password updated for user: ${user.email} (currentPwd${currentPassword ? " verified" : " skipped"})`);

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error: unknown) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}