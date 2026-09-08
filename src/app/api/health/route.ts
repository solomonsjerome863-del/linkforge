import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const results: Record<string, string | boolean | number> = {};

  // 1. Check DATABASE_URL
  results.database_url_set = !!process.env.DATABASE_URL;
  results.database_url_prefix = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.split(":")[0]
    : "NOT_SET";

  // 2. Check if Prisma can connect
  try {
    await db.$connect();
    results.prisma_connected = true;
    await db.$disconnect();
  } catch (err: unknown) {
    results.prisma_connected = false;
    results.prisma_error = err instanceof Error ? err.message : String(err);
  }

  // 3. Check if we can query the User table
  //    (boolean only — the public endpoint must not leak user counts)
  try {
    await db.user.findFirst({ select: { id: true } });
    results.user_query = "OK";
  } catch (err: unknown) {
    results.user_query = "FAILED";
    results.user_query_error = err instanceof Error ? err.message : String(err);
  }

  // 4. Check bcryptjs
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bcrypt = require("bcryptjs");
    results.bcryptjs_loaded = true;
    const hash = await bcrypt.hash("test", 4);
    results.bcryptjs_hash = hash ? "OK" : "FAILED";
  } catch (err: unknown) {
    results.bcryptjs_loaded = false;
    results.bcryptjs_error = err instanceof Error ? err.message : String(err);
  }

  // 5. Check environment
  results.node_env = process.env.NODE_ENV || "NOT_SET";
  results.admin_email_set = !!process.env.ADMIN_EMAIL;
  results.vercel = !!process.env.VERCEL;

  // 6. Check Paystack configuration (key presence only, never expose values)
  results.paystack_secret_key_set = !!process.env.PAYSTACK_SECRET_KEY;
  results.paystack_plan_pro_set = !!process.env.PAYSTACK_PLAN_PRO;
  results.paystack_plan_business_set = !!process.env.PAYSTACK_PLAN_BUSINESS;

  // 7. Check email configuration (Resend)
  results.email_configured = !!process.env.RESEND_API_KEY;

  // 8. Check Stripe (international rail) configuration
  results.stripe_webhook_secret_set = !!process.env.STRIPE_WEBHOOK_SECRET;
  results.stripe_price_pro_set = !!process.env.STRIPE_PRICE_PRO;
  results.stripe_price_business_set = !!process.env.STRIPE_PRICE_BUSINESS;

  // 9. Check callback URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "NOT_SET";
  results.app_url = appUrl;
  results.expected_callback_url = `${appUrl}/?checkout=paystack`;

  return NextResponse.json(results);
}
