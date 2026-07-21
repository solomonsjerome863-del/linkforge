import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const result = await verifyPassword(password, user.passwordHash);

    if (!result.valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // If the password was stored with the legacy SHA-256 hash, upgrade it to bcrypt now
    if (result.needsRehash) {
      const newHash = await hashPassword(password);
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
    }

    const { passwordHash: _, ...safeUser } = user;

    // Determine admin status at runtime (not build-time)
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const isAdmin = adminEmail ? safeUser.email?.toLowerCase().trim() === adminEmail : false;

    return NextResponse.json({ user: { ...safeUser, isAdmin } });
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}