import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cancelSubscription } from "@/lib/lemonsqueezy";

/**
 * GET /api/billing/portal?userId=xxx
 * Returns the user's current subscription info
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        lemonSqueezyCustomerId: true,
        lemonSqueezySubscriptionId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isActive = user.subscriptionStatus === "active" || user.subscriptionStatus === "on_trial";

    return NextResponse.json({
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndsAt: user.subscriptionEndsAt?.toISOString() ?? null,
      trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
      isActive,
      hasPaymentMethod: !!user.lemonSqueezyCustomerId,
    });
  } catch (error) {
    console.error("[Billing Portal GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription info" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing/portal
 * Cancel the user's subscription
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.lemonSqueezySubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription to cancel" },
        { status: 400 }
      );
    }

    // If not in demo mode, cancel via LemonSqueezy API
    if (process.env.LEMONSQUEEZY_API_KEY) {
      try {
        await cancelSubscription(user.lemonSqueezySubscriptionId);
      } catch (err) {
        console.error("[Billing Portal] LemonSqueezy cancel failed:", err);
        // Still update DB — the subscription might already be cancelled
      }
    }

    // Update local DB
    await db.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "cancelled",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Billing Portal POST]", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}