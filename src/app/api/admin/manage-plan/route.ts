import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { PlanType } from "@/lib/types";

/**
 * POST /api/admin/manage-plan
 *
 * Allows the admin to manually upgrade/downgrade/remove a user's plan.
 * Used for dispute resolution, comped accounts, or manual adjustments.
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
    const { userId, plan, subscriptionStatus, reason } = body;

    if (!userId || !plan) {
      return NextResponse.json(
        { error: "Missing required fields: userId, plan" },
        { status: 400 }
      );
    }

    const validPlans: PlanType[] = ["starter", "pro", "business", "enterprise"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${validPlans.join(", ")}` },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const previousPlan = user.plan;
    const previousStatus = user.subscriptionStatus;

    // Determine subscription status based on plan change
    let newStatus = subscriptionStatus || previousStatus;
    if (plan === "starter") {
      // Downgrading to free — clear subscription fields
      newStatus = null;
    } else if (!newStatus || newStatus === "expired" || newStatus === "cancelled") {
      // Upgrading or re-activating
      newStatus = "active";
    }

    // Set subscription end date if activating
    const subscriptionEndsAt =
      newStatus === "active" && plan !== "starter"
        ? (() => {
            const d = new Date();
            d.setMonth(d.getMonth() + 1);
            return d;
          })()
        : plan === "starter"
          ? null
          : user.subscriptionEndsAt;

    // Update the user
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        plan,
        subscriptionStatus: newStatus,
        subscriptionEndsAt,
        // Clear Paystack fields if downgrading to starter
        ...(plan === "starter"
          ? {
              paystackSubscriptionCode: null,
              paystackCustomerId: null,
              paystackAuthorizationCode: null,
            }
          : {}),
      },
    });

    console.log(
      `[Admin] Plan changed for ${user.email}: ${previousPlan} → ${plan}, status: ${previousStatus} → ${newStatus}${reason ? ` (reason: ${reason})` : ""}`
    );

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        plan: updated.plan,
        subscriptionStatus: updated.subscriptionStatus,
        subscriptionEndsAt: updated.subscriptionEndsAt?.toISOString() || null,
      },
      previousPlan,
      previousStatus,
    });
  } catch (error) {
    console.error("[Admin Manage Plan]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
