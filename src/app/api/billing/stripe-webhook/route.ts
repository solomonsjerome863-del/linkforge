import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

/**
 * POST /api/billing/stripe-webhook
 *
 * Stripe lifecycle events for the INTERNATIONAL payment rail
 * (Systeme.io checkout runs on your own Stripe account, so every
 * subscription event lands in your Stripe dashboard and can be
 * forwarded here for automatic provisioning).
 *
 * Setup (Stripe Dashboard → Developers → Webhooks → Add endpoint):
 *   URL:    https://linkforge.digital/api/billing/stripe-webhook
 *   Events: checkout.session.completed,
 *           customer.subscription.created,
 *           customer.subscription.updated,
 *           customer.subscription.deleted,
 *           invoice.paid,
 *           invoice.payment_failed
 *
 * Required env vars:
 *   STRIPE_WEBHOOK_SECRET   whsec_... (signing secret of THIS endpoint)
 *   STRIPE_SECRET_KEY       sk_live_... (used to resolve customer emails)
 *   STRIPE_PRICE_PRO        price_... → maps to plan "pro"
 *   STRIPE_PRICE_BUSINESS   price_... → maps to plan "business"
 *
 * Safety: if STRIPE_WEBHOOK_SECRET is not set, events are audit-logged
 * but NEVER applied — this prevents forged "upgrade me" requests.
 */

type InternalPlan = "pro" | "business" | null;

function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(",")) {
    const idx = part.indexOf("=");
    if (idx > -1) parts[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  // Replay protection: reject events older than 10 minutes
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 600) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function planFromPriceId(priceId: string | null | undefined): InternalPlan {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return "business";
  return null;
}

async function resolveCustomerEmail(
  customerId: string | null | undefined,
  directEmail: string | null | undefined
): Promise<string | null> {
  if (directEmail) return directEmail.toLowerCase().trim();
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !customerId) return null;
  try {
    const res = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.email ? String(data.email).toLowerCase().trim() : null;
  } catch {
    return null;
  }
}

async function fetchLineItemPriceId(sessionId: string): Promise<string | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}/line_items`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0]?.price?.id || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
      // Audit but never mutate — forged requests must not upgrade accounts.
      console.warn("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set — event ignored");
      await db.subscriptionEvent.create({
        data: { eventType: "stripe:unverified_ignored", payload: rawBody.slice(0, 10000), processed: false },
      });
      return NextResponse.json({ received: true, processed: false, reason: "webhook secret not configured" });
    }

    if (!verifyStripeSignature(rawBody, signature, secret)) {
      console.warn("[Stripe Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const type: string = event.type || "unknown";
    const obj = event.data?.object || {};

    console.log(`[Stripe Webhook] Event: ${type} (${obj.id || "unknown"})`);

    // Audit-log every verified event
    const audit = await db.subscriptionEvent.create({
      data: { eventType: `stripe:${type}`, payload: rawBody.slice(0, 10000), processed: false },
    });

    // Only act on events we understand
    const HANDLED = [
      "checkout.session.completed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.paid",
      "invoice.payment_failed",
    ];
    if (!HANDLED.includes(type)) {
      return NextResponse.json({ received: true, processed: false, reason: "unhandled event type" });
    }

    // ─── Resolve email ─────────────────────────────────────────────────────
    const email = await resolveCustomerEmail(
      obj.customer,
      obj.customer_email || obj.customer_details?.email || null
    );

    if (!email) {
      console.warn(`[Stripe Webhook] No email resolvable for ${type} (${obj.id})`);
      return NextResponse.json({ received: true, processed: false, reason: "no email" });
    }

    const normalized = email.toLowerCase().trim();
    let user = await db.user.findFirst({ where: { email: { equals: normalized } } });
    if (!user) {
      // Customer hasn't created their LinkForge account yet.
      // Confirmation page instructs them to sign up with the paid email;
      // on their first signup+login the admin panel (or a later webhook retry
      // via Systeme.io) covers it. Weekly reconciliation catches stragglers.
      console.warn(`[Stripe Webhook] No user account for ${normalized} (${type})`);
      return NextResponse.json({ received: true, processed: false, reason: "no user account yet" });
    }

    // ─── Resolve plan from price ───────────────────────────────────────────
    let priceId: string | null = null;
    const items = obj.items?.data || obj.lines?.data || [];
    for (const item of items) {
      const p = item?.price?.id || item?.pricing?.price_details?.price || null;
      if (typeof p === "string") { priceId = p; break; }
    }
    if (!priceId && type === "checkout.session.completed" && typeof obj.id === "string") {
      priceId = await fetchLineItemPriceId(obj.id);
    }
    const plan = planFromPriceId(priceId);

    // ─── Apply event semantics ─────────────────────────────────────────────
    let actioned = false;

    switch (type) {
      case "checkout.session.completed": {
        if (obj.status === "complete" || obj.payment_status === "paid") {
          if (plan) {
            const d = new Date();
            d.setMonth(d.getMonth() + 1);
            await db.user.update({
              where: { id: user.id },
              data: { plan, subscriptionStatus: "active", subscriptionEndsAt: d },
            });
            actioned = true;
            console.log(`[Stripe Webhook] Checkout: ${user.email} → ${plan}`);
          } else {
            console.warn(`[Stripe Webhook] Checkout for ${user.email}: unmapped price ${priceId || "(none)"} — set STRIPE_PRICE_* env vars`);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const status = String(obj.status || "");
        const periodEnd = obj.current_period_end ? new Date(obj.current_period_end * 1000) : null;

        if (status === "active" || status === "trialing") {
          if (!plan) {
            console.warn(`[Stripe Webhook] Subscription for ${user.email}: unmapped price ${priceId || "(none)"} — set STRIPE_PRICE_* env vars`);
            break;
          }
          await db.user.update({
            where: { id: user.id },
            data: {
              plan,
              subscriptionStatus: status === "trialing" ? "on_trial" : "active",
              subscriptionEndsAt: periodEnd,
            },
          });
          actioned = true;
          console.log(`[Stripe Webhook] Subscription ${type.includes("created") ? "created" : "updated"}: ${user.email} → ${plan}`);
        } else if (status === "past_due") {
          await db.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: "unpaid" },
          });
          actioned = true;
        } else if (status === "canceled") {
          await db.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: "cancelled", subscriptionEndsAt: periodEnd },
          });
          actioned = true;
        } else if (status === "unpaid") {
          await db.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: "expired" },
          });
          actioned = true;
        } else {
          console.log(`[Stripe Webhook] Ignoring subscription status "${status}" for ${user.email}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        // Mirror manage-plan "starter" semantics: clear subscription data
        await db.user.update({
          where: { id: user.id },
          data: {
            plan: "starter",
            subscriptionStatus: null,
            subscriptionEndsAt: null,
          },
        });
        actioned = true;
        console.log(`[Stripe Webhook] Subscription deleted: ${user.email} → starter`);
        break;
      }

      case "invoice.paid": {
        if (plan && (user.subscriptionStatus === "unpaid" || user.subscriptionStatus === "expired")) {
          const periodEnd = obj.lines?.data?.[0]?.period?.end
            ? new Date(obj.lines.data[0].period.end * 1000)
            : null;
          await db.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: "active", subscriptionEndsAt: periodEnd },
          });
          actioned = true;
          console.log(`[Stripe Webhook] Invoice paid: ${user.email} re-activated`);
        }
        break;
      }

      case "invoice.payment_failed": {
        await db.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: "unpaid" },
        });
        actioned = true;
        console.log(`[Stripe Webhook] Payment failed: ${user.email} marked unpaid`);
        break;
      }
    }

    if (actioned) {
      await db.subscriptionEvent.update({
        where: { id: audit.id },
        data: { processed: true, userId: user.id },
      });
    }

    return NextResponse.json({ received: true, processed: actioned });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/billing/stripe-webhook
 * Health/verification ping
 */
export async function GET() {
  return NextResponse.json({ status: "ok", service: "LinkForge Stripe webhook" });
}
