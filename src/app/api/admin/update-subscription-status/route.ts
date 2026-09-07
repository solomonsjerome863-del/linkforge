import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID_STATUSES = [
  "active",
  "paused",
  "cancelled",
  "expired",
  "unpaid",
  "on_trial",
];

/**
 * POST /api/admin/update-subscription-status
 *
 * Manually sets a user's subscription status
 * (active | paused | cancelled | expired | unpaid | on_trial).
 * Body: { userId: string, status: string }
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
    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: userId, status" },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const previousStatus = user.subscriptionStatus;

    const updated = await db.user.update({
      where: { id: userId },
      data: { subscriptionStatus: status },
    });

    console.log(
      `[Admin] Subscription status for ${user.email}: ${previousStatus ?? "null"} → ${status}`
    );

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        plan: updated.plan,
        subscriptionStatus: updated.subscriptionStatus,
      },
      previousStatus,
    });
  } catch (error) {
    console.error("[Admin Update Subscription Status]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
