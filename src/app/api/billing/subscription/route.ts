import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveUserId } from "@/lib/session";

/**
 * Refresh user subscription info from the database.
 * Called by the frontend after a successful checkout redirect.
 * Identity is resolved from the session cookie (transitional
 * client-supplied fallback is logged).
 */
export async function GET(req: NextRequest) {
  try {
    const userId = resolveUserId(req, req.nextUrl.searchParams.get("userId"));
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndsAt: user.subscriptionEndsAt,
      trialEndsAt: user.trialEndsAt,
    });
  } catch (error) {
    console.error("[Subscription] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
