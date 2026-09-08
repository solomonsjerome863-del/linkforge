import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

function stripPasswordHash<T extends { passwordHash?: string | null }>(obj: T): Omit<T, "passwordHash"> {
  const { passwordHash: _, ...rest } = obj;
  return rest;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password } = body;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit: 5 signups per hour per IP
    const ip = clientIp(request);
    if (!checkRateLimit(`signup:${ip}`, 5, 3600000).ok) {
      return NextResponse.json(
        { error: "Too many sign-up attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Validate inputs
    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    if (password.length > 128) {
      return NextResponse.json({ error: "Password is too long" }, { status: 400 });
    }

    if (name && name.length > 200) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({ where: { email: { equals: normalizedEmail } } });
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    // Create user
    // Note: accounts are auto-verified for now — email verification is a
    // separate work item once the transactional email provider is live.
    // No demo data is seeded: the onboarding wizard drives the user's real
    // first site, and demo sites would consume the Starter 1-site allowance.
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name: name || null,
        passwordHash: await hashPassword(password),
        emailVerified: true,
      },
    });

    const safeUser = stripPasswordHash(user);

    // Determine admin status at runtime (not build-time)
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const isAdmin = adminEmail ? safeUser.email?.toLowerCase().trim() === adminEmail : false;

    return NextResponse.json({
      user: { ...safeUser, isAdmin },
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
