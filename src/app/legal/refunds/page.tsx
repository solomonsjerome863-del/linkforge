"use client";

import Link from "next/link";

const sections: { title: string; body: string[] }[] = [
  {
    title: "1. Free plan",
    body: [
      "The Starter plan is free forever. No payment details are required, and nothing to refund.",
    ],
  },
  {
    title: "2. Monthly and annual subscriptions",
    body: [
      "Paid plans (Pro, Business) renew automatically at the end of each billing period until cancelled.",
      "You can cancel at any time from your billing settings or by emailing support@linkforge.digital. Cancelling stops all future charges — your plan stays active until the end of the period you already paid for.",
      "We do not provide partial refunds for unused time within a billing period, because the full plan remains available until that period ends.",
    ],
  },
  {
    title: "3. 7-day satisfaction guarantee",
    body: [
      "If a paid subscription does not work for you, contact us within 7 days of your first payment and we will refund it in full — no questions asked. This guarantee applies to your first subscription payment only.",
    ],
  },
  {
    title: "4. Billing errors and duplicate charges",
    body: [
      "Mistakes happen. If you were charged twice or charged after cancelling, email us and we will refund the erroneous charge in full, usually within 5 business days.",
    ],
  },
  {
    title: "5. How refunds are processed",
    body: [
      "Refunds are returned via the original payment method (Paystack for ZAR payments, Stripe for USD payments). Depending on your bank, refunds can take 5–10 business days to appear.",
    ],
  },
  {
    title: "6. Contact",
    body: [
      "Refund or billing questions: support@linkforge.digital — we aim to reply within one business day.",
    ],
  },
];

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-teal-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400">← Back to LinkForge</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-6 mb-2">Refund Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: September 2026</p>
        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold mb-2">{s.title}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground/80 mb-2">{p}</p>
              ))}
            </section>
          ))}
        </div>
        <div className="mt-10 flex gap-4 text-sm">
          <Link href="/legal/terms" className="text-orange-600 hover:text-orange-700 dark:text-orange-400">Terms of Service →</Link>
          <Link href="/legal/privacy" className="text-orange-600 hover:text-orange-700 dark:text-orange-400">Privacy Policy →</Link>
        </div>
      </div>
    </div>
  );
}
