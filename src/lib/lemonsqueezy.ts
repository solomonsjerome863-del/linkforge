/**
 * LemonSqueezy Server-Side API Helper
 *
 * Docs: https://docs.lemonsqueezy.com/help/api-reference
 */

const BASE_URL = "https://api.lemonsqueezy.com/v1";

function getApiKey(): string {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key) throw new Error("LEMONSQUEEZY_API_KEY is not set");
  return key;
}

function getStoreId(): string {
  const id = process.env.LEMONSQUEEZY_STORE_ID;
  if (!id) throw new Error("LEMONSQUEEZY_STORE_ID is not set");
  return id;
}

// Product variant IDs — set these as env vars after creating products in LemonSqueezy
function getVariantId(plan: string): string {
  const map: Record<string, string> = {
    pro: process.env.LEMONSQUEEZY_VARIANT_PRO || "",
    business: process.env.LEMONSQUEEZY_VARIANT_BUSINESS || "",
  };
  const id = map[plan];
  if (!id) throw new Error(`No LemonSqueezy variant ID configured for plan: ${plan}`);
  return id;
}

interface LemonSqueezyResponse<T> {
  data: T;
  errors?: Array<{ status: number; title: string; detail: string }>;
}

interface CheckoutAttributes {
  custom_data: Record<string, string>;
  checkout_data: {
    email: string;
    name?: string;
    billing_address: {
      country?: string;
    };
  };
  checkout_options: {
    embed: boolean;
    media_width?: number;
    media_height?: number;
  };
  product_options: {
    redirect_url: string;
  };
  expires_at?: string;
}

export interface CheckoutData {
  id: string;
  attributes: {
    url: string;
    custom_price?: number;
  };
}

export async function createCheckout(params: {
  plan: "pro" | "business";
  userEmail: string;
  userName: string;
  userId: string;
}): Promise<string> {
  const variantId = getVariantId(params.plan);
  const storeId = getStoreId();
  const apiKey = getApiKey();

  const body: LemonSqueezyResponse<CheckoutAttributes> = {
    data: {
      type: "checkouts",
      attributes: {
        custom_data: {
          user_id: params.userId,
          plan: params.plan,
        },
        checkout_data: {
          email: params.userEmail,
          name: params.userName,
          billing_address: {},
        },
        checkout_options: {
          embed: false,
        },
        product_options: {
          redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://linkforge.digital"}/?checkout=success&plan=${params.plan}`,
        },
      },
      relationships: {
        store: {
          data: { type: "stores", id: storeId },
        },
        variant: {
          data: { type: "variants", id: variantId },
        },
      },
    },
  };

  const res = await fetch(`${BASE_URL}/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (data.errors) {
    throw new Error(data.errors[0]?.detail || "Failed to create checkout");
  }

  return data.data.attributes.url;
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const apiKey = getApiKey();

  const res = await fetch(`${BASE_URL}/subscriptions/${subscriptionId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to cancel subscription");
  }
}

export async function verifyWebhookSignature(
  body: string,
  signature: string | null
): Promise<boolean> {
  if (!signature) return false;

  // LemonSqueezy uses HMAC-SHA256 with LEMONSQUEEZY_WEBHOOK_SECRET
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[Webhook] LEMONSQUEEZY_WEBHOOK_SECRET not set");
    return false;
  }

  // For Vercel serverless, we need crypto from Node.js
  try {
    const crypto = await import("node:crypto");
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(body);
    const expected = `sha256=${hmac.digest("hex")}`;
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    console.error("[Webhook] Signature verification failed");
    return false;
  }
}

export interface WebhookPayload {
  meta: {
    event_name: string;
    custom_data: {
      user_id?: string;
      plan?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      status?: string;
      renews_at?: string;
      ends_at?: string;
      trial_ends_at?: string;
      created_at?: string;
      updated_at?: string;
      customer_id?: number;
      order_id?: number;
      product_id?: number;
      variant_id?: number;
      user_email?: string;
      user_name?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      total?: number;
      currency?: string;
      subtotal?: number;
      discount_total?: number;
      tax?: number;
      refunded_amount?: number;
      referrer?: string;
      receipt_url?: string;
    };
    relationships?: {
      order?: {
        data: { id: string };
      };
      variant?: {
        data: { id: string };
      };
      customer?: {
        data: { id: string };
      };
      "subscription-invoice"?: {
        data: { id: string };
      };
    };
  };
}

/**
 * Map LemonSqueezy variant ID to our plan name
 */
export function variantIdToPlan(variantId: string): string | null {
  const proId = process.env.LEMONSQUEEZY_VARIANT_PRO;
  const businessId = process.env.LEMONSQUEEZY_VARIANT_BUSINESS;
  if (variantId === proId) return "pro";
  if (variantId === businessId) return "business";
  return null;
}

/**
 * Map LemonSqueezy subscription status to our status
 */
export function mapSubscriptionStatus(status: string): string {
  const map: Record<string, string> = {
    active: "active",
    on_trial: "on_trial",
    paused: "paused",
    cancelled: "cancelled",
    expired: "expired",
    unpaid: "unpaid",
    past_due: "unpaid",
  };
  return map[status] || status;
}