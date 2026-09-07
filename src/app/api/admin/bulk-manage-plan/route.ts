import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { PlanType } from "@/lib/types";

/**
 * POST /api/admin/bulk-manage-plan
 *
 * Changes the subscription plan for multiple users at once.
 * Body: { userIds: string[], plan: PlanType, reason?: string }
 * Used by the batch "Apply Plan" action in the admin dashboard.
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
    const { userIds, plan, reason } = body;

    if (!Array.isArray(userIds) || userIds.length === 0 || !plan) {
      return NextResponse.json(
        { error: "Missing required fields: userIds (non-empty array), plan" },
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

    // Same status rules as single-user manage-plan:
    // starter clears subscription data; paid plans become active for 1 month.
    let newStatus: string | null;
    let subscriptionEndsAt: Date | null;

    if (plan === "starter") {
      newStatus = null;
      subscriptionEndsAt = null;
    } else {
      newStatus = "active";
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      subscriptionEndsAt = d;
    }

    const result = await db.user.updateMany({
      where: { id: { in: userIds } },
      data: {
        plan,
        subscriptionStatus: newStatus,
        subscriptionEndsAt,
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
      `[Admin] Bulk plan change: ${result.count} user(s) → ${plan}${reason ? ` (reason: ${reason})` : ""}`
    );

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      plan,
    });
  } catch (error) {
    console.error("[Admin Bulk Manage Plan]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
