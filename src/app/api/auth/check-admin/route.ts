import { NextRequest, NextResponse } from "next/server";

/**
 * Lightweight endpoint to check if a user is an admin.
 * Called on app load to update the isAdmin flag without requiring re-login.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ isAdmin: false });
    }

    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const isAdmin = adminEmail ? email.toLowerCase().trim() === adminEmail : false;

    return NextResponse.json({ isAdmin });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}