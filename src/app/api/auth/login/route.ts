import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { applySessionCookie } from "@/lib/session";
import { verificationEmail, sendEmail } from "@/lib/email";

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email + password.
 *
 * Security features:
 * - Email normalization (lowercase, trimmed)
 * - Legacy password hash re-hashing (bcrypt rounds upgrade)
 * - Generic error messages (no user enumeration)
 * - Simple per-IP/email rate limiting (in-memory)
 * - Sets a signed, httpOnly session cookie on success
 * - Auto-resends the verification email for unverified accounts (throttled by token expiry)
 */

// Simple in-memory rate limiting (per server instance)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

// Clean old entries every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of loginAttempts.entries()) {
    if (now - data.lastAttempt > ATTEMPT_WINDOW) {
      loginAttempts.delete(key);
    }
  }
}, 10 * 60 * 1000).unref?.();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Rate limiting: max 5 attempts per email per 15 minutes
    const attemptKey = normalizedEmail;
    const now = Date.now();
    const attemptData = loginAttempts.get(attemptKey);

    if (attemptData && (now - attemptData.lastAttempt < ATTEMPT_WINDOW)) {
      if (attemptData.count >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: "Too many login attempts. Please try again in a few minutes." },
          { status: 429 }
        );
      }
      attemptData.count += 1;
      attemptData.lastAttempt = now;
    } else {
      loginAttempts.set(attemptKey, { count: 1, lastAttempt: now });
    }

    // Fetch user by email
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Generic error to prevent user enumeration
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password against bcrypt hash
    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Re-hash password if it uses old bcrypt rounds (auto-upgrade)
    const currentRounds = bcrypt.getRounds(user.passwordHash);
    const targetRounds = 10;

    if (currentRounds < targetRounds) {
      const newHash = await bcrypt.hash(password, targetRounds);
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
      console.log(
        `[Auth] Re-hashed password for ${user.email} (${currentRounds} → ${targetRounds} rounds)`
      );
    }

    // Unverified account: auto-resend the verification email (throttled by token expiry)
    if (!user.emailVerified) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        let verifyToken = user.verifyToken;
        if (!verifyToken || !user.verifyTokenExpiry || user.verifyTokenExpiry < new Date()) {
          verifyToken = crypto.randomBytes(32).toString("hex");
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
        console.log(
          `[Auth] Unverified login for ${user.email} — verification email ${mailResult.sent ? "resent" : "NOT sent (" + mailResult.reason + ")"}`
        );
      } catch (mailErr) {
        console.error("[Auth] Verification resend failed:", mailErr);
      }
    }

    // Remove sensitive fields from response
    const { passwordHash: _, resetToken: __, resetTokenExpiry: ___, verifyToken: ____, verifyTokenExpiry: _____, ...safeUser } = user;

    // Determine admin status
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const isAdmin = adminEmail
      ? user.email.toLowerCase().trim() === adminEmail
      : false;

    console.log(`[Auth] Login: ${user.email} (admin: ${isAdmin}, verified: ${user.emailVerified})`);

    // Return the user object (without sensitive fields) and a message
    const response = NextResponse.json(
      { user: { ...safeUser, isAdmin }, message: "Login successful" },
      { status: 200 }
    );

    // Issue the signed session cookie (httpOnly) so subsequent API calls
    // authenticate via the cookie instead of a client-supplied userId.
    applySessionCookie(response, user.id);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error during login" },
      { status: 500 }
    );
  }
}
