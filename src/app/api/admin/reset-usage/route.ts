import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/admin/reset-usage
 *
 * Resets a user's usage counters (links + queries) back to 0.
 * Body: { userId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Admin auth
    const adminEmail = process.env.ADMIN_EMAIL;
    const requestEmail = request.headers.get("x-admin-email");
    if (!adminEmail || requestEmail !== adminEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required field: userId" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { usageLinks: 0, usageQueries: 0 },
    });

    console.log(
      `[Admin] Usage reset for ${user.email} (was ${user.usageLinks} links / ${user.usageQueries} queries)`
    );

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        usageLinks: updated.usageLinks,
        usageQueries: updated.usageQueries,
      },
    });
  } catch (error) {
    console.error("[Admin Reset Usage]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
