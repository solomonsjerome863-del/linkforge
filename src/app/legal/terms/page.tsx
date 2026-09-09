"use client";

import Link from "next/link";

const sections: { title: string; body: string[] }[] = [
  {
    title: "1. About these Terms",
    body: [
      "These Terms of Service (\"Terms\") govern your use of LinkForge, an AI-powered internal linking and citation monitoring service provided through linkforge.digital (the \"Service\"), operated by Jerome Solomon as a sole proprietor in South Africa (\"we\", \"us\", \"our\").",
      "By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.",
    ],
  },
  {
    title: "2. Accounts",
    body: [
      "You must provide a valid email address and a password to create an account. You are responsible for keeping your credentials secure and for all activity under your account.",
      "You must be at least 18 years old, or have the permission and supervision of a parent or guardian, to use the Service.",
    ],
  },
  {
    title: "3. The Service",
    body: [
      "LinkForge crawls websites you add, analyzes their content, and suggests internal links using AI. It also monitors public web and AI-search mentions of brands you track (\"Citations\").",
      "You may only add websites you own or have permission to analyze. We crawl only the pages of the URLs you register, and we never modify your website without your explicit action (you choose which suggestions to apply).",
    ],
  },
  {
    title: "4. Plans, trials and limits",
    body: [
      "The Service is offered on a free Starter plan and paid subscription plans (Pro, Business, Enterprise), each with its own limits (for example, number of sites, pages crawled per site, and monthly suggestions). Current limits are shown on the pricing page and in your dashboard.",
      "During any trial period, accounts are limited to one (1) site regardless of the plan being trialed.",
      "We may change plan limits from time to time. Material reductions to paid limits will be communicated in advance and apply from your next billing period.",
    ],
  },
  {
    title: "5. Billing and cancellation",
    body: [
      "Paid subscriptions renew automatically each month (or year, if you choose an annual plan) until cancelled. South African customers are billed in South African Rand via Paystack; international customers are billed in US Dollars via Stripe checkout.",
      "You can cancel at any time from your account settings or by contacting support. Cancellation stops future charges; your plan remains active until the end of the current billing period.",
      "See our Refund Policy for details on refunds.",
    ],
  },
  {
    title: "6. Acceptable use",
    body: [
      "You agree not to: misuse the Service (including excessive automated crawling of sites you do not own), attempt to access other users' data, reverse-engineer or resell the Service, upload unlawful content, or use the Service to violate any applicable law, including copyright and data-protection laws.",
      "We may suspend or terminate accounts that violate these Terms, with notice where practical.",
    ],
  },
  {
    title: "7. Your data and content",
    body: [
      "You keep ownership of the websites you register and the content we crawl from them. You grant us a limited licence to store and process that content solely to operate the Service for you.",
      "You can delete a site (and its crawled data) at any time from your dashboard. Deleting your account deletes all associated data. See our Privacy Policy for details.",
    ],
  },
  {
    title: "8. AI-generated suggestions",
    body: [
      "Link suggestions and citation insights are AI-assisted recommendations. While we work hard to make them accurate and useful, you are responsible for reviewing suggestions before applying them to your website.",
    ],
  },
  {
    title: "9. Disclaimers and liability",
    body: [
      "The Service is provided \"as is\" without warranties of any kind, except those that cannot be excluded by law. We do not guarantee specific SEO or ranking outcomes.",
      "To the maximum extent permitted by law, our total liability to you for any claim arising from the Service is limited to the amount you paid us in the 3 months before the claim.",
    ],
  },
  {
    title: "10. Governing law and disputes",
    body: [
      "These Terms are governed by the laws of South Africa, applied without regard to conflict-of-law principles.",
      "If you reside in the EU, UK, US or anywhere else and mandatory consumer-protection law in your country gives you rights that cannot be waived by agreement, those rights are unaffected — in all other respects these Terms apply as written.",
      "We will first attempt to resolve any dispute informally by email. Any dispute that cannot be resolved may be brought before the courts of South Africa, except where your local consumer law gives you the right to bring proceedings in your own jurisdiction.",
    ],
  },
  {
    title: "11. Contact",
    body: [
      "Questions about these Terms? Contact us at support@linkforge.digital.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-teal-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400">← Back to LinkForge</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-6 mb-2">Terms of Service</h1>
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
          <Link href="/legal/privacy" className="text-orange-600 hover:text-orange-700 dark:text-orange-400">Privacy Policy →</Link>
          <Link href="/legal/refunds" className="text-orange-600 hover:text-orange-700 dark:text-orange-400">Refund Policy →</Link>
        </div>
      </div>
    </div>
  );
}
