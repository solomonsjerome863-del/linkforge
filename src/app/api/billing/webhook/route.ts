import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifyWebhookSignature,
  mapSubscriptionStatus,
  variantIdToPlan,
  type WebhookPayload,
} from "@/lib/lemonsqueezy";

/**
 * POST /api/billing/webhook
 * Receives LemonSqueezy webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Check if this is a redirect-back (user returned from checkout)
    const isRedirect = request.nextUrl.searchParams.get("redirect") === "true";
    if (isRedirect) {
      const plan = request.nextUrl.searchParams.get("plan") || "pro";
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linkforge.digital";
      return NextResponse.redirect(`${baseUrl}/?checkout=success&plan=${plan}`);
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");

    // Verify webhook signature (skip in dev/demo mode)
    if (process.env.LEMONSQUEEZY_WEBHOOK_SECRET && !await verifyWebhookSignature(rawBody, signature)) {
      console.warn("[Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload: WebhookPayload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    const userId = payload.meta?.custom_data?.user_id;
    const plan = payload.meta?.custom_data?.plan;

    console.log(`[Webhook] Event: ${eventName}, User: ${userId || "unknown"}, Plan: ${plan || "unknown"}`);

    // Store the event for audit
    await db.subscriptionEvent.create({
      data: {
        userId: userId || null,
        eventType: eventName,
        payload: rawBody,
        processed: false,
      },
    });

    if (!userId) {
      console.warn("[Webhook] No user_id in custom_data");
      return NextResponse.json({ received: true });
    }

    // Look up user
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.warn(`[Webhook] User ${userId} not found`);
      return NextResponse.json({ received: true });
    }

    const attrs = payload.data?.attributes;
    const variantId = payload.data?.relationships?.variant?.data?.id;
    const customerId = String(attrs?.customer_id || "");
    const subscriptionId = payload.data?.id;

    // Handle different events
    switch (eventName) {
      case "order_created": {
        // One-time order — could be a subscription renewal payment
        // Update customer ID if we don't have one
        if (customerId && !user.lemonSqueezyCustomerId) {
          await db.user.update({
            where: { id: userId },
            data: { lemonSqueezyCustomerId: customerId },
          });
        }
        break;
      }

      case "subscription_created": {
        // New subscription started (including trial)
        const status = mapSubscriptionStatus(attrs?.status || "active");
        const variantPlan = variantId ? variantIdToPlan(variantId) : plan;

        await db.user.update({
          where: { id: userId },
          data: {
            plan: variantPlan || "pro",
            subscriptionStatus: status,
            lemonSqueezyCustomerId: customerId || user.lemonSqueezyCustomerId,
            lemonSqueezySubscriptionId: subscriptionId,
            subscriptionEndsAt: attrs?.renews_at ? new Date(attrs.renews_at) : null,
            trialEndsAt: attrs?.trial_ends_at ? new Date(attrs.trial_ends_at) : null,
          },
        });
        console.log(`[Webhook] Subscription created: ${variantPlan} for ${user.email}`);
        break;
      }

      case "subscription_updated": {
        // Plan change, pause, resume, etc.
        const status = mapSubscriptionStatus(attrs?.status || "active");
        const variantPlan = variantId ? variantIdToPlan(variantId) : null;

        const updateData: Record<string, unknown> = {
          subscriptionStatus: status,
          subscriptionEndsAt: attrs?.renews_at ? new Date(attrs.renews_at) : null,
        };
        if (variantPlan) updateData.plan = variantPlan;
        if (customerId) updateData.lemonSqueezyCustomerId = customerId;

        await db.user.update({
          where: { id: userId },
          data: updateData,
        });
        console.log(`[Webhook] Subscription updated: ${status} for ${user.email}`);
        break;
      }

      case "subscription_cancelled": {
        await db.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: "cancelled",
            subscriptionEndsAt: attrs?.ends_at ? new Date(attrs.ends_at) : new Date(),
          },
        });
        console.log(`[Webhook] Subscription cancelled for ${user.email}`);
        break;
      }

      case "subscription_expired": {
        // Downgrade to starter
        await db.user.update({
          where: { id: userId },
          data: {
            plan: "starter",
            subscriptionStatus: "expired",
            subscriptionEndsAt: null,
            lemonSqueezySubscriptionId: null,
          },
        });
        console.log(`[Webhook] Subscription expired for ${user.email} — downgraded to starter`);
        break;
      }

      case "subscription_payment_failed":
      case "subscription_payment_recovered": {
        const status = eventName === "subscription_payment_failed" ? "unpaid" : "active";
        await db.user.update({
          where: { id: userId },
          data: { subscriptionStatus: status },
        });
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${eventName}`);
    }

    // Mark event as processed
    const latestEvent = await db.subscriptionEvent.findFirst({
      where: { userId, eventType: eventName },
      orderBy: { createdAt: "desc" },
    });
    if (latestEvent) {
      await db.subscriptionEvent.update({
        where: { id: latestEvent.id },
        data: { processed: true },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/webhook
 * Used by LemonSqueezy to verify the endpoint during setup
 */
export async function GET() {
  return NextResponse.json({ status: "ok", service: "LinkForge billing webhook" });
}