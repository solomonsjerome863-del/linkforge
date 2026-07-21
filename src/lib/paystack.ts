import crypto from "crypto";

const PAYSTACK_BASE = "https://api.paystack.co";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

// ─── Initialize a checkout transaction ─────────────────────────────────────────

interface InitializeCheckoutParams {
  email: string;
  amount: number; // in smallest currency unit (cents for USD, kobo for NGN/ZAR)
  plan: string; // Paystack plan code
  userId: string;
  userName: string;
  internalPlan: "pro" | "business";
}

export async function initializeCheckout(params: InitializeCheckoutParams): Promise<{
  authorization_url: string;
  reference: string;
}> {
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/?checkout=paystack`;

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      plan: params.plan, // Paystack recurring plan code
      callback_url: callbackUrl,
      metadata: {
        cancel_action: process.env.NEXT_PUBLIC_APP_URL || "",
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: params.userId,
          },
          {
            display_name: "Plan",
            variable_name: "plan",
            value: params.internalPlan,
          },
        ],
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Paystack initialize failed: ${err.message || res.status}`);
  }

  const data = await res.json();
  if (!data.status) {
    throw new Error(`Paystack initialize error: ${data.message}`);
  }

  return {
    authorization_url: data.data.authorization_url,
    reference: data.data.reference,
  };
}

// ─── Verify a transaction ──────────────────────────────────────────────────────

export async function verifyTransaction(reference: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: headers(),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.status ? data.data : null;
}

// ─── Fetch a subscription ──────────────────────────────────────────────────────

export async function fetchSubscription(subscriptionCode: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${PAYSTACK_BASE}/subscription/${subscriptionCode}`, {
    headers: headers(),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.status ? data.data : null;
}

// ─── Disable a subscription (cancel non-renewal) ───────────────────────────────

export async function disableSubscription(subscriptionCode: string): Promise<boolean> {
  const res = await fetch(`${PAYSTACK_BASE}/subscription/disable`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ code: subscriptionCode }),
  });

  return res.ok;
}

// ─── Enable a subscription ─────────────────────────────────────────────────────

export async function enableSubscription(subscriptionCode: string, emailToken: string): Promise<boolean> {
  const res = await fetch(`${PAYSTACK_BASE}/subscription/enable`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ code: subscriptionCode, token: emailToken }),
  });

  return res.ok;
}

// ─── Verify webhook signature ──────────────────────────────────────────────────

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!process.env.PAYSTACK_SECRET_KEY || !signature) return false;

  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
}

// ─── Map Paystack plan code to internal plan ───────────────────────────────────

export function paystackPlanToInternal(planCode: string): "pro" | "business" | null {
  if (planCode === process.env.PAYSTACK_PLAN_PRO) return "pro";
  if (planCode === process.env.PAYSTACK_PLAN_BUSINESS) return "business";
  return null;
}

export function internalPlanToPaystackCode(plan: "pro" | "business"): string | null {
  if (plan === "pro") return process.env.PAYSTACK_PLAN_PRO || null;
  if (plan === "business") return process.env.PAYSTACK_PLAN_BUSINESS || null;
  return null;
}