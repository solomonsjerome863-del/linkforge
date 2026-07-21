import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createCheckout } from "@/lib/lemonsqueezy";

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

    // Check for env var — if not configured, return demo URL
    if (!process.env.LEMONSQUEEZY_API_KEY || !process.env.LEMONSQUEEZY_STORE_ID) {
      // Demo mode: return a mock checkout URL
      console.log(`[Checkout] Demo mode — would create checkout for ${email}, plan: ${plan}`);
      const demoUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}?checkout=success&plan=${plan}`;
      return NextResponse.json({ url: demoUrl, demo: true });
    }

    const checkoutUrl = await createCheckout({
      plan,
      userEmail: email,
      userName: name || "",
      userId,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("[Checkout]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}