import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature, paystackPlanToInternal, fetchSubscription } from "@/lib/paystack";

/**
 * POST /api/billing/webhook
 * Receives Paystack webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    // Verify webhook signature (skip if secret not set — dev mode)
    if (process.env.PAYSTACK_SECRET_KEY && signature) {
      if (!verifyWebhookSignature(rawBody, signature)) {
        console.warn("[Webhook] Invalid Paystack signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    console.log(`[Webhook] Event: ${event}, Reference: ${data?.reference || "unknown"}`);

    // Store the event for audit
    await db.subscriptionEvent.create({
      data: {
        eventType: event,
        payload: rawBody,
        processed: false,
      },
    });

    // ─── Extract user_id and plan from metadata ──────────────────────────────
    const metadata = data?.metadata?.custom_fields || [];
    let userId: string | null = null;
    let plan: string | null = null;
    for (const field of metadata) {
      if (field.variable_name === "user_id") userId = field.value;
      if (field.variable_name === "plan") plan = field.value;
    }

    // Also try direct metadata fields (some Paystack events use flat metadata)
    if (!userId) userId = data?.metadata?.user_id || null;
    if (!plan) plan = data?.metadata?.plan || null;

    // For subscription events, we might need to look up the customer email
    const customerEmail = data?.customer?.email;

    if (!userId && customerEmail) {
      // Fallback: find user by email
      const emailUser = await db.user.findUnique({ where: { email: customerEmail } });
      if (emailUser) userId = emailUser.id;
    }

    if (!userId) {
      console.warn(`[Webhook] No user found for event ${event}, email: ${customerEmail || "unknown"}`);
      return NextResponse.json({ received: true });
    }

    // Look up user
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.warn(`[Webhook] User ${userId} not found`);
      return NextResponse.json({ received: true });
    }

    // ─── Handle events ──────────────────────────────────────────────────────
    switch (event) {
      case "charge.success": {
        // One-time or first recurring charge succeeded
        const planCode = data?.plan?.plan_code;
        const internalPlan = planCode ? paystackPlanToInternal(planCode) : (plan as "pro" | "business" | null);

        if (internalPlan) {
          const subCode = data?.subscription?.subscription_code;
          const subStatus = data?.subscription?.status; // active, non-renewing

          const status = subStatus === "non-renewing" ? "cancelled" : "active";
          const endDate = data?.subscription?.next_payment_date
            ? new Date(data.subscription.next_payment_date)
            : null;

          await db.user.update({
            where: { id: userId },
            data: {
              plan: internalPlan,
              subscriptionStatus: status,
              paystackCustomerId: data?.customer?.customer_code || user.paystackCustomerId,
              paystackSubscriptionCode: subCode || user.paystackSubscriptionCode,
              paystackAuthorizationCode: data?.authorization?.authorization_code || user.paystackAuthorizationCode,
              subscriptionEndsAt: endDate,
            },
          });
          console.log(`[Webhook] Charge success: ${internalPlan} for ${user.email}`);
        }
        break;
      }

      case "subscription.create": {
        const planCode = data?.plan?.plan_code;
        const internalPlan = planCode ? paystackPlanToInternal(planCode) : (plan as "pro" | "business" | null);
        const endDate = data?.next_payment_date ? new Date(data.next_payment_date) : null;

        await db.user.update({
          where: { id: userId },
          data: {
            plan: internalPlan || "pro",
            subscriptionStatus: "active",
            paystackCustomerId: data?.customer?.customer_code || user.paystackCustomerId,
            paystackSubscriptionCode: data?.subscription_code,
            subscriptionEndsAt: endDate,
          },
        });
        console.log(`[Webhook] Subscription created: ${internalPlan} for ${user.email}`);
        break;
      }

      case "subscription.not_renew": {
        // Customer disabled auto-renewal (cancelled)
        const endDate = data?.next_payment_date ? new Date(data.next_payment_date) : new Date();
        await db.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: "cancelled",
            subscriptionEndsAt: endDate,
          },
        });
        console.log(`[Webhook] Subscription not renewing for ${user.email}`);
        break;
      }

      case "subscription.disable": {
        // Subscription disabled (e.g., failed payments)
        await db.user.update({
          where: { id: userId },
          data: { subscriptionStatus: "expired" },
        });
        console.log(`[Webhook] Subscription disabled for ${user.email}`);
        break;
      }

      case "subscription.enable": {
        await db.user.update({
          where: { id: userId },
          data: { subscriptionStatus: "active" },
        });
        console.log(`[Webhook] Subscription re-enabled for ${user.email}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${event}`);
    }

    // Mark event as processed
    const latestEvent = await db.subscriptionEvent.findFirst({
      where: { eventType: event },
      orderBy: { createdAt: "desc" },
    });
    if (latestEvent) {
      await db.subscriptionEvent.update({
        where: { id: latestEvent.id },
        data: { processed: true, userId },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/billing/webhook
 * Used by Paystack to verify the endpoint during setup
 */
export async function GET() {
  return NextResponse.json({ status: "ok", service: "LinkForge billing webhook" });
}
