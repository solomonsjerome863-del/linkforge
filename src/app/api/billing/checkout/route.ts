import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { initializeCheckout, internalPlanToPaystackCode } from "@/lib/paystack";

const PLAN_AMOUNTS: Record<string, number> = {
  pro: 4900, // $49 USD in cents
  business: 14900, // $149 USD in cents
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, plan, email, name } = body;

    if (!userId || !plan || !email) {
      return NextResponse.json(
        { error: "Missing required fields: userId, plan, email" },
        { status: 400 }
      );
    }

    if (!["pro", "business"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'pro' or 'business'" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for Paystack env vars — if not configured, return demo URL
    if (!process.env.PAYSTACK_SECRET_KEY || !process.env.PAYSTACK_PLAN_PRO || !process.env.PAYSTACK_PLAN_BUSINESS) {
      console.log(`[Checkout] Demo mode — would create checkout for ${email}, plan: ${plan}`);
      const demoUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}?checkout=paystack&plan=${plan}`;
      return NextResponse.json({ authorization_url: demoUrl, demo: true });
    }

    // Get the Paystack plan code for this internal plan
    const paystackPlanCode = internalPlanToPaystackCode(plan as "pro" | "business");
    if (!paystackPlanCode) {
      return NextResponse.json(
        { error: "Paystack plan not configured" },
        { status: 500 }
      );
    }

    const result = await initializeCheckout({
      email,
      amount: PLAN_AMOUNTS[plan] || 4900,
      plan: paystackPlanCode,
      userId,
      userName: name || "",
      internalPlan: plan as "pro" | "business",
    });

    return NextResponse.json({
      authorization_url: result.authorization_url,
      reference: result.reference,
    });
  } catch (error) {
    console.error("[Checkout]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}