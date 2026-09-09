import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { initializeTransaction } from "@/lib/paystack";
import { resolveUserId } from "@/lib/session";

/**
 * POST /api/billing/checkout
 *
 * Creates a Paystack transaction for the chosen plan and returns the
 * payment URL.
 *
 * South Africa / ZA rail — international customers use the Systeme.io +
 * Stripe funnel (see the Funnel Playbook).
 *
 * Identity from the session cookie (transitional body fallback is
 * logged). The billing email always comes from the database record —
 * never from the client.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan } = body;

    const userId = resolveUserId(
      request,
      typeof body.userId === "string" ? body.userId : null
    );

    if (!userId || !plan) {
      return NextResponse.json(
        { error: "Missing required fields: plan (and an active session)" },
        { status: 400 }
      );
    }

    const validPlans = ["pro", "business", "enterprise"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${validPlans.join(", ")}` },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const planCodes: Record<string, string | undefined> = {
      pro: process.env.PAYSTACK_PLAN_PRO,
      business: process.env.PAYSTACK_PLAN_BUSINESS,
      enterprise: process.env.PAYSTACK_PLAN_ENTERPRISE,
    };
    const planCode = planCodes[plan];
    if (!planCode) {
      return NextResponse.json(
        { error: `Plan "${plan}" is not configured on this deployment` },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // ── Demo mode (no Paystack key) ──
    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.warn("[Checkout] PAYSTACK_SECRET_KEY not set — returning demo checkout URL");
      const demoUrl = `${appUrl}/?checkout=paystack&plan=${plan}`;
      return NextResponse.json({
        authorization_url: demoUrl,
        demo: true,
        message: "Demo checkout — set PAYSTACK_SECRET_KEY to enable real payments.",
      });
    }

    // ── Real Paystack transaction ──
    const amountsKobo: Record<string, number> = {
      pro: 82500,       // R825.00
      business: 245500, // R2,455.00
      enterprise: 0,    // custom — handled outside self-serve checkout
    };
    const amount = amountsKobo[plan];

    if (!amount) {
      return NextResponse.json(
        { error: "Enterprise plans are arranged with our team. Contact support@linkforge.digital." },
        { status: 400 }
      );
    }

    const metadata = {
      userId: user.id,
      plan,
      custom_fields: [
        { display_name: "Plan", variable_name: "plan", value: plan },
        { display_name: "User", variable_name: "user_email", value: user.email },
      ],
    };

    const initResult = await initializeTransaction({
      email: user.email,
      amount,
      plan: planCode,
      callback_url: `${appUrl}/?checkout=paystack`,
      metadata,
      channels: ["card", "bank_transfer", "ussd"],
    });

    if (!initResult.status) {
      console.error("[Checkout] Paystack init failed:", initResult);
      return NextResponse.json(
        { error: initResult.message || "Could not start checkout. Please try again." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      authorization_url: initResult.data.authorization_url,
      reference: initResult.data.reference,
    });
  } catch (error) {
    console.error("[Checkout] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
