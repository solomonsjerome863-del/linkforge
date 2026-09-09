"use client";

import Link from "next/link";

const sections: { title: string; body: string[] }[] = [
  {
    title: "1. What we collect",
    body: [
      "Account data: your name, email address and password (stored only as a secure bcrypt hash — we never see or store your actual password).",
      "Website data: the URLs of sites you register, and the pages we crawl from them (titles, headings, text content, word counts, link structure).",
      "Usage data: how many sites, pages and suggestions you consume, and basic actions you take in the app.",
      "Billing data: your plan, subscription status and payment references. Payments are processed by Paystack (South Africa, ZAR) or Stripe via Systeme.io (international, USD) — we never see or store your full card details.",
      "Communications: emails we send you (password resets, receipts, product updates you can unsubscribe from).",
    ],
  },
  {
    title: "2. Why we process it",
    body: [
      "To provide the Service you signed up for: crawling your registered sites, generating AI link suggestions, monitoring citations, and showing your dashboard.",
      "To manage your account and billing, prevent abuse, and provide support.",
      "To send you service emails and — only if you opt in — product updates. Marketing emails always include an unsubscribe link.",
      "Legal basis: performance of our contract with you (the Terms of Service), legitimate interests in operating and securing the Service, and consent where required (e.g. optional marketing emails).",
    ],
  },
  {
    title: "3. Who we share it with",
    body: [
      "Payment processors: Paystack and Stripe (they receive only the billing information needed to process your payment).",
      "Email delivery: Resend (used for transactional emails such as password resets).",
      "AI processing: website content you register may be processed by our AI provider to generate suggestions.",
      "We do not sell your personal information. We do not share it with advertisers.",
    ],
  },
  {
    title: "4. Cookies and local storage",
    body: [
      "We use a single httpOnly session cookie to keep you logged in (it contains a signed identifier, not personal data).",
      "We use browser local storage to remember your preferences between visits. No third-party advertising or tracking cookies are used.",
    ],
  },
  {
    title: "5. How long we keep it",
    body: [
      "Account and billing records are kept while your account is active. Crawled website data is kept until you delete the site or your account.",
      "Deleting your account permanently removes your sites, pages, suggestions, citations and personal data from our active systems.",
    ],
  },
  {
    title: "6. Your rights",
    body: [
      "You can access, correct or delete your personal data at any time: most of it directly in the app, the rest by emailing support@linkforge.digital.",
      "If you are in the EU/UK you have additional rights under GDPR (access, portability, objection, complaint to a supervisory authority). If you are in South Africa, POPIA applies similarly.",
    ],
  },
  {
    title: "7. Security",
    body: [
      "Passwords are hashed with bcrypt. Sessions use signed, httpOnly cookies. Data is stored in a managed cloud database with access restricted to the Service.",
      "No system is perfectly secure — if a breach affecting your data occurs, we will notify you as required by law.",
    ],
  },
  {
    title: "8. International transfers",
    body: [
      "The Service is operated using cloud infrastructure that may process data outside your country. By using LinkForge you consent to these transfers, which are protected by the safeguards described above.",
    ],
  },
  {
    title: "9. Contact",
    body: [
      "Privacy questions or requests: support@linkforge.digital.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-teal-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400">← Back to LinkForge</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-6 mb-2">Privacy Policy</h1>
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
          <Link href="/legal/refunds" className="text-orange-600 hover:text-orange-700 dark:text-orange-400">Refund Policy →</Link>
        </div>
      </div>
    </div>
  );
}
