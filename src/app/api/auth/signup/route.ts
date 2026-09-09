import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { applySessionCookie } from "@/lib/session";

/**
 * POST /api/auth/signup
 *
 * Creates a new user account.
 *
 * - Normalizes email (lowercase/trim) and rejects duplicates
 * - Hashes the password with bcrypt (10 rounds)
 * - Marks the account email-verified (verification emails not yet wired)
 * - Applies simple per-IP rate limiting
 * - Issues a signed, httpOnly session cookie on success
 *
 * NOTE: no demo data is seeded anymore — new users start clean and the
 * onboarding wizard drives their first real site.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 signups per hour per IP
    const ip = clientIp(request);
    const limit = checkRateLimit(`signup:${ip}`, 5, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: `Too many signup attempts. Please try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = String(email).toLowerCase().trim();

    // Prevent duplicate accounts
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in instead." },
        { status: 409 }
      );
    }

    // Hash password and create the account
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name: String(name).trim().slice(0, 100),
        email: normalizedEmail,
        passwordHash,
        plan: "starter",
        emailVerified: true, // auto-verified for now (no verification email service yet)
      },
    });

    // Remove sensitive fields from response
    const { passwordHash: _, ...safeUser } = user;

    // Determine admin status
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const isAdmin = adminEmail
      ? user.email.toLowerCase().trim() === adminEmail
      : false;

    console.log(`[Auth] New signup: ${user.email} (admin: ${isAdmin})`);

    const response = NextResponse.json(
      { user: { ...safeUser, isAdmin } },
      { status: 200 }
    );

    // Issue the signed session cookie so the user is immediately logged in
    applySessionCookie(response, user.id);

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error during signup" },
      { status: 500 }
    );
  }
}
