"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Crown,
  Zap,
  Building2,
  Rocket,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Feature {
  text: string;
  included: boolean;
}

interface Tier {
  name: string;
  icon: React.ReactNode;
  monthlyPrice: number | null;
  annualPrice: number | null;
  anchorMonthly?: number;
  anchorAnnual?: number;
  description: string;
  features: Feature[];
  cta: string;
  badge?: string;
  highlight?: boolean;
  premium?: boolean;
  trial?: string;
}

const tiers: Tier[] = [
  {
    name: "Starter",
    icon: <Rocket className="size-5" />,
    monthlyPrice: 0,
    annualPrice: 0,
    description: "For personal blogs getting started with internal linking.",
    features: [
      { text: "1 WordPress site", included: true },
      { text: "Up to 500 posts", included: true },
      { text: "100 link suggestions/month", included: true },
      { text: "Basic paragraph-aware chunking", included: true },
      { text: "Community support", included: true },
      { text: "Smart re-suggestion on updates", included: false },
      { text: "Anchor text A/B testing", included: false },
      { text: "API & webhook access", included: false },
    ],
    cta: "Get Started Free",
  },
  {
    name: "Pro",
    icon: <Zap className="size-5" />,
    monthlyPrice: 49,
    annualPrice: 39,
    anchorMonthly: 69,
    anchorAnnual: 69,
    description: "For growing sites that need serious linking power.",
    features: [
      { text: "5 sites (WordPress + Shopify)", included: true },
      { text: "Up to 10,000 posts per site", included: true },
      { text: "2,500 link suggestions/month", included: true },
      { text: "Smart re-suggestion on content updates", included: true },
      { text: "Priority email support", included: true },
      { text: "Anchor text A/B testing", included: true },
      { text: "Self-hosted LLM option", included: false },
      { text: "White-label reports", included: false },
    ],
    cta: "Start Pro Trial",
    badge: "Most Popular",
    highlight: true,
    trial: "14-day free trial, no credit card required",
  },
  {
    name: "Business",
    icon: <Crown className="size-5" />,
    monthlyPrice: 149,
    annualPrice: 119,
    description:
      "For agencies and teams that need full control and scale.",
    features: [
      { text: "Unlimited sites", included: true },
      { text: "Up to 50,000 posts per site", included: true },
      { text: "15,000 link suggestions/month", included: true },
      { text: "Self-hosted LLM option (Llama 3.1)", included: true },
      { text: "Custom chunking strategies", included: true },
      { text: "Webhook + API access", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "White-label reports", included: true },
    ],
    cta: "Contact Sales",
    badge: "Best Value",
  },
  {
    name: "Enterprise",
    icon: <Building2 className="size-5" />,
    monthlyPrice: null,
    annualPrice: null,
    description: "For agencies & large organizations with custom needs.",
    features: [
      { text: "Everything in Business", included: true },
      { text: "Unlimited posts & suggestions", included: true },
      { text: "SOC 2 compliance", included: true },
      { text: "SSO (SAML/OIDC)", included: true },
      { text: "Plugin SDK access", included: true },
      { text: "Custom integrations", included: true },
      { text: "SLA guarantee", included: true },
      { text: "Dedicated onboarding team", included: true },
    ],
    cta: "Talk to Us",
    premium: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="scroll-mt-24 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ---- Header ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          {/* Social-proof badge */}
          <Badge
            variant="outline"
            className="mb-4 border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs sm:text-sm px-3 py-1"
          >
            <Sparkles className="size-3.5 mr-1.5" />
            Trusted by 200+ SEO agencies
          </Badge>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Pick the plan that fits your linking ambitions. Upgrade or
            downgrade anytime — no lock-in, ever.
          </p>
        </motion.div>

        {/* ---- Toggle ---- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex items-center justify-center gap-3 mb-10"
        >
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              !annual ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            onClick={() => setAnnual((v) => !v)}
            className={cn(
              "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              annual ? "bg-orange-500" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "pointer-events-none block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                annual ? "translate-x-5" : "translate-x-0.5"
              )}
            />
          </button>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              annual ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Annual
          </span>
          {/* Loss-aversion badge */}
          {annual && (
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 text-xs px-2 py-0.5 gap-1">
              Save $120/yr
            </Badge>
          )}
        </motion.div>

        {/* ---- Cards ---- */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-5 items-start"
        >
          {tiers.map((tier) => (
            <TierCard key={tier.name} tier={tier} annual={annual} />
          ))}
        </motion.div>

        {/* ---- Bottom reassurance ---- */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs sm:text-sm text-muted-foreground mt-10"
        >
          All plans include SSL encryption, 99.9% uptime SLA on paid tiers,
          and GDPR-compliant data handling.
        </motion.p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  TierCard                                                           */
/* ------------------------------------------------------------------ */

function TierCard({ tier, annual }: { tier: Tier; annual: boolean }) {
  const price = annual ? tier.annualPrice : tier.monthlyPrice;
  const anchor = annual ? tier.anchorAnnual : tier.anchorMonthly;

  return (
    <motion.div
      variants={cardVariants}
      className={cn(
        "relative",
        tier.highlight && "xl:-mt-2 xl:mb-[-0.5rem]"
      )}
    >
      {/* Pro "Most Popular" ribbon */}
      {tier.highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-orange-500 text-white border-0 shadow-md shadow-orange-500/30 px-3 py-1 text-xs font-semibold gap-1">
            <Crown className="size-3" />
            {tier.badge}
          </Badge>
        </div>
      )}

      <Card
        className={cn(
          "relative h-full flex flex-col transition-shadow duration-300",
          tier.highlight &&
            "scale-[1.02] border-2 border-orange-500/50 shadow-xl shadow-orange-500/10",
          tier.premium &&
            "bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 border-neutral-800 text-neutral-100",
          !tier.highlight &&
            !tier.premium &&
            "border-border/60 hover:border-border hover:shadow-lg"
        )}
      >
        <CardHeader className="pb-0">
          {/* Tier badge (non-Pro) */}
          {!tier.highlight && tier.badge && (
            <Badge
              variant="outline"
              className="self-start border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-semibold mb-3"
            >
              {tier.badge}
            </Badge>
          )}
          {/* Spacer for Pro (badge is in the ribbon) */}
          {tier.highlight && <div className="h-5 mb-1" />}
          {/* No badge for others */}
          {!tier.badge && !tier.highlight && <div className="h-5 mb-1" />}

          <div
            className={cn(
              "flex items-center gap-2 mb-1",
              tier.premium
                ? "text-neutral-200"
                : "text-foreground"
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg",
                tier.highlight &&
                  "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                tier.premium &&
                  "bg-neutral-800 text-neutral-300",
                !tier.highlight &&
                  !tier.premium &&
                  "bg-muted text-muted-foreground"
              )}
            >
              {tier.icon}
            </span>
            <h3 className="text-lg font-bold">{tier.name}</h3>
          </div>
          <p
            className={cn(
              "text-sm leading-relaxed",
              tier.premium ? "text-neutral-400" : "text-muted-foreground"
            )}
          >
            {tier.description}
          </p>
        </CardHeader>

        {/* ---- Price ---- */}
        <CardContent className="pt-4 pb-0 flex-1">
          <div className="mb-5">
            {price !== null ? (
              <div className="flex items-baseline gap-1.5">
                <span
                  className={cn(
                    "text-4xl font-extrabold tracking-tight",
                    tier.highlight && "text-orange-600 dark:text-orange-400",
                    tier.premium && "text-neutral-100",
                    !tier.highlight &&
                      !tier.premium &&
                      "text-foreground"
                  )}
                >
                  ${price}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    tier.premium
                      ? "text-neutral-500"
                      : "text-muted-foreground"
                  )}
                >
                  /mo
                </span>
              </div>
            ) : (
              <span
                className={cn(
                  "text-4xl font-extrabold tracking-tight",
                  tier.premium
                    ? "text-neutral-100"
                    : "text-foreground"
                )}
              >
                Custom
              </span>
            )}

            {/* Anchoring — show crossed-out higher price */}
            {anchor && annual && (
              <p
                className={cn(
                  "text-sm line-through mt-0.5",
                  tier.premium
                    ? "text-neutral-600"
                    : "text-muted-foreground/60"
                )}
              >
                Was ${anchor}/mo
              </p>
            )}

            {/* Annual billing note for paid tiers */}
            {price !== null && price > 0 && annual && (
              <p
                className={cn(
                  "text-xs mt-1.5",
                  tier.premium
                    ? "text-neutral-500"
                    : "text-muted-foreground"
                )}
              >
                Billed annually (${(price ?? 0) * 12}/yr)
              </p>
            )}

            {/* Risk-reversal trial note */}
            {tier.trial && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                <Check className="size-3" />
                {tier.trial}
              </p>
            )}
          </div>

          {/* ---- Features ---- */}
          <ul className="space-y-2.5">
            {tier.features.map((f) => (
              <li
                key={f.text}
                className={cn(
                  "flex items-start gap-2.5 text-sm",
                  f.included
                    ? tier.premium
                      ? "text-neutral-300"
                      : "text-foreground"
                    : tier.premium
                      ? "text-neutral-600"
                      : "text-muted-foreground/50"
                )}
              >
                {f.included ? (
                  <Check
                    className={cn(
                      "size-4 mt-0.5 shrink-0",
                      tier.premium
                        ? "text-emerald-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  />
                ) : (
                  <X
                    className={cn(
                      "size-4 mt-0.5 shrink-0",
                      tier.premium
                        ? "text-neutral-700"
                        : "text-muted-foreground/30"
                    )}
                  />
                )}
                <span className={cn(!f.included && "line-through")}>
                  {f.text}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>

        {/* ---- CTA ---- */}
        <CardFooter className="pt-4">
          <Button
            className={cn(
              "w-full gap-2 text-sm font-semibold transition-all",
              tier.highlight &&
                "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/30",
              tier.premium &&
                "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
              !tier.highlight &&
                !tier.premium &&
                (tier.monthlyPrice === 0
                  ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                  : "bg-amber-500 hover:bg-amber-600 text-white shadow-sm")
            )}
          >
            {tier.cta}
            <ArrowRight className="size-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}