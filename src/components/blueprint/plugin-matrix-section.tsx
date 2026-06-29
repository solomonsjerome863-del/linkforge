"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCode,
  ShoppingCart,
  Globe,
  Ghost,
  Code2,
  Plug,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Zap,
  Shield,
  Crown,
  Building2,
  Check,
  X,
  FileCode2,
  Webhook,
  Palette,
  BarChart3,
  RefreshCw,
  Users,
  Database,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Types & Data                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

type TierKey = "starter" | "pro" | "business" | "enterprise";

interface PluginFeature {
  name: string;
  description: string;
  tiers: Partial<Record<TierKey, boolean | string>>;
  icon?: LucideIcon;
}

interface Plugin {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  bgGradient: string;
  borderAccent: string;
  description: string;
  minTier: TierKey;
  tagline: string;
  installPrompt: string;
  capabilities: string[];
  features: PluginFeature[];
}

const tierConfig: Record<
  TierKey,
  { label: string; color: string; bg: string; border: string; icon: LucideIcon }
> = {
  starter: {
    label: "Starter",
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    icon: Zap,
  },
  pro: {
    label: "Pro",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    icon: Zap,
  },
  business: {
    label: "Business",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: Crown,
  },
  enterprise: {
    label: "Enterprise",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    icon: Building2,
  },
};

const plugins: Plugin[] = [
  {
    id: "wordpress",
    name: "WordPress Plugin",
    icon: FileCode,
    color: "text-teal-600 dark:text-teal-400",
    bgGradient: "from-teal-500/10 to-teal-500/5",
    borderAccent: "border-teal-500/30 hover:border-teal-500/50",
    description:
      "One-click install from wp.org. Scans your posts via REST API, suggests internal links directly in the Gutenberg editor.",
    minTier: "starter",
    tagline: "The foundation. Install in 60 seconds.",
    installPrompt:
      "wp plugin install linkforge-ai --activate && wp linkforge register --token=YOUR_API_KEY --site-limit=1",
    capabilities: [
      "Gutenberg block for inline link suggestions",
      "Bulk apply suggestions from dashboard",
      "Orphan post detection & auto-linking",
      "XML sitemap auto-import on activation",
    ],
    features: [
      {
        name: "Manual Suggestion Trigger",
        description: "Click 'Scan & Suggest' to generate links for a single post on demand",
        tiers: { starter: true, pro: true, business: true, enterprise: true },
        icon: RefreshCw,
      },
      {
        name: "Inline Editor Suggestions",
        description: "See link suggestions directly inside the Gutenberg block editor as you write",
        tiers: { starter: true, pro: true, business: true, enterprise: true },
        icon: FileCode2,
      },
      {
        name: "Auto-Sync on Publish",
        description: "Automatically re-scan and suggest links every time you hit 'Publish' or 'Update'",
        tiers: { starter: false, pro: "Auto on publish", business: "Auto + scheduled re-scan", enterprise: "Auto + real-time webhook" },
        icon: RefreshCw,
      },
      {
        name: "Anchor Text A/B Testing",
        description: "Serve different anchor text variants and track CTR impact on rankings",
        tiers: { starter: false, pro: true, business: true, enterprise: true },
        icon: BarChart3,
      },
      {
        name: "Multi-Site Network Support",
        description: "Manage link suggestions across an entire WordPress multisite network from one dashboard",
        tiers: { starter: false, pro: "Up to 5 sites", business: "Unlimited sites", enterprise: "Unlimited + network-level analytics" },
        icon: Users,
      },
      {
        name: "White-Label Mode",
        description: "Remove all LinkForge branding. Your clients see only your agency brand",
        tiers: { starter: false, pro: false, business: true, enterprise: true },
        icon: Palette,
      },
    ],
  },
  {
    id: "shopify",
    name: "Shopify App",
    icon: ShoppingCart,
    color: "text-[#96bf48] dark:text-[#a8d65a]",
    bgGradient: "from-[#96bf48]/10 to-[#96bf48]/5",
    borderAccent: "border-[#96bf48]/30 hover:border-[#96bf48]/50",
    description:
      "Connect via Shopify REST API. Links blog posts, product pages, and collection pages together for SEO juice flow.",
    minTier: "pro",
    tagline: "E-commerce link architecture. Product ↔ Blog ↔ Collection.",
    installPrompt:
      "Add LinkForge AI from the Shopify App Store. Authenticate with your LinkForge account. Select collections to index.",
    capabilities: [
      "Product-to-blog linking (pDP → educational content)",
      "Collection hierarchy linking (parent ↔ child collections)",
      "Blog post cross-linking with product mentions",
      "Redirect mapping for migrated storefronts",
    ],
    features: [
      {
        name: "Product Page Linking",
        description: "Automatically suggest links from product descriptions to relevant blog posts and guides",
        tiers: { pro: true, business: true, enterprise: true },
        icon: ShoppingCart,
      },
      {
        name: "Collection Hierarchy Links",
        description: "Build internal link trees between parent/child collections and related product groups",
        tiers: { pro: true, business: true, enterprise: true },
        icon: Database,
      },
      {
        name: "Blog-to-Product Backlinks",
        description: "Insert product links inside blog content where product mentions are detected",
        tiers: { pro: "Manual approval", business: "Auto-insert with rules", enterprise: "Auto + AI context matching" },
        icon: ArrowRight,
      },
      {
        name: "Redirect Preservation",
        description: "Maintain internal link equity when URLs change during storefront migrations or redesigns",
        tiers: { pro: false, business: true, enterprise: true },
        icon: Shield,
      },
    ],
  },
  {
    id: "webflow",
    name: "Webflow Integration",
    icon: Globe,
    color: "text-[#4353ff] dark:text-[#6366f1]",
    bgGradient: "from-[#4353ff]/10 to-[#4353ff]/5",
    borderAccent: "border-[#4353ff]/30 hover:border-[#4353ff]/50",
    description:
      "Native Webflow app via their Developer Platform. Syncs CMS collections and generates link suggestions in the Webflow editor.",
    minTier: "pro",
    tagline: "For design-first teams who live in Webflow.",
    installPrompt:
      "Install LinkForge AI from the Webflow App Marketplace. Grant CMS read/write permissions. Configure which collections to link.",
    capabilities: [
      "CMS collection cross-linking",
      "Static page ↔ CMS item linking",
      "Design-preserving link insertion (no layout breakage)",
      "Multi-locale site support",
    ],
    features: [
      {
        name: "CMS Collection Linking",
        description: "Link between CMS items across different collections (Blog → Portfolio → Services)",
        tiers: { pro: true, business: true, enterprise: true },
        icon: Database,
      },
      {
        name: "Design-Safe Insertion",
        description: "Links are inserted as rich text links preserving Webflow's design system — no broken layouts",
        tiers: { pro: true, business: true, enterprise: true },
        icon: Shield,
      },
      {
        name: "Multi-Locale Support",
        description: "Link across language versions of the same site (en-US blog → fr-FR blog)",
        tiers: { pro: false, business: true, enterprise: true },
        icon: Globe,
      },
    ],
  },
  {
    id: "ghost",
    name: "Ghost Plugin",
    icon: Ghost,
    color: "text-purple-600 dark:text-purple-400",
    bgGradient: "from-purple-500/10 to-purple-500/5",
    borderAccent: "border-purple-500/30 hover:border-purple-500/50",
    description:
      "Lightweight integration via Ghost Admin API + Content API. Perfect for newsletter-driven publishers who need link architecture.",
    minTier: "business",
    tagline: "For serious publishers running on Ghost Pro or self-hosted.",
    installPrompt:
      "Generate an Admin API key in Ghost Settings → Integrations → Add Custom Integration. Paste into LinkForge dashboard under Sites → Add Site → Ghost.",
    capabilities: [
      "Post-to-post linking across tags and authors",
      "Newsletter content link optimization",
      "Member-gated content aware linking",
      "Ghost theme injection for suggestion display",
    ],
    features: [
      {
        name: "Tag-Aware Linking",
        description: "Prioritize links between posts sharing the same tags for topical cluster building",
        tiers: { business: true, enterprise: true },
        icon: FileCode2,
      },
      {
        name: "Member-Gate Awareness",
        description: "Never suggest links from public posts to member-only content (prevents crawl errors)",
        tiers: { business: true, enterprise: true },
        icon: Lock,
      },
      {
        name: "Author Cross-Linking",
        description: "Build author authority by linking posts from the same author together",
        tiers: { business: true, enterprise: true },
        icon: Users,
      },
    ],
  },
  {
    id: "api",
    name: "REST API & Webhooks",
    icon: Code2,
    color: "text-sky-600 dark:text-sky-400",
    bgGradient: "from-sky-500/10 to-sky-500/5",
    borderAccent: "border-sky-500/30 hover:border-sky-500/50",
    description:
      "Headless CMS, custom frameworks, or build your own integration. Full REST API with OpenAPI spec plus webhook events.",
    minTier: "business",
    tagline: "For developers who want full programmatic control.",
    installPrompt:
      "POST /api/v1/sites  { \"name\": \"My Headless Site\", \"platform\": \"custom\", \"webhook_url\": \"https://your-app.com/webhooks/linkforge\" }",
    capabilities: [
      "Full CRUD for sites, posts, suggestions, embeddings",
      "Webhook events: post.created, post.updated, suggestion.ready",
      "Batch operations for bulk imports (up to 10K posts/request)",
      "OpenAPI 3.1 spec for auto-generated SDKs",
    ],
    features: [
      {
        name: "REST API Access",
        description: "Full API with authentication via API keys. Create sites, manage posts, fetch and apply suggestions programmatically",
        tiers: { business: true, enterprise: true },
        icon: Code2,
      },
      {
        name: "Webhook Events",
        description: "Receive real-time notifications when suggestions are ready, posts change, or processing completes",
        tiers: { business: "5 webhook endpoints", enterprise: "Unlimited + retry config" },
        icon: Webhook,
      },
      {
        name: "Batch Import API",
        description: "Bulk-import up to 10,000 posts in a single request with automatic chunking and embedding",
        tiers: { business: "1 batch at a time", enterprise: "Parallel batches + priority queue" },
        icon: Database,
      },
      {
        name: "Custom Embedding Pipeline",
        description: "Bring your own embedding model. Send pre-computed vectors directly via API, bypassing our embedding step",
        tiers: { business: false, enterprise: true },
        icon: Cpu,
      },
    ],
  },
  {
    id: "sdk",
    name: "Plugin SDK",
    icon: Plug,
    color: "text-rose-600 dark:text-rose-400",
    bgGradient: "from-rose-500/10 to-rose-500/5",
    borderAccent: "border-rose-500/30 hover:border-rose-500/50",
    description:
      "Build and publish your own LinkForge connectors for any CMS or framework. React component library + TypeScript SDK.",
    minTier: "enterprise",
    tagline: "Build once, resell forever. Your connector, our engine.",
    installPrompt:
      "npm install @linkforge/sdk\nnpx linkforge-sdk init my-custom-connector\ncd my-custom-connector && npm run dev",
    capabilities: [
      "TypeScript SDK with full type definitions",
      "React component library for suggestion UI",
      "Pre-built adapter templates (REST, GraphQL, Webhook)",
      "Publish to LinkForge Marketplace for revenue sharing",
    ],
    features: [
      {
        name: "TypeScript SDK",
        description: "Full type-safe SDK with auth, site management, suggestion fetching, and link application methods",
        tiers: { enterprise: true },
        icon: Code2,
      },
      {
        name: "React Component Library",
        description: "Drop-in React components: <LinkSuggestionPanel>, <LinkApplyButton>, <LinkHealthChart>",
        tiers: { enterprise: true },
        icon: FileCode2,
      },
      {
        name: "Marketplace Publishing",
        description: "Publish your connector to the LinkForge Marketplace. Earn 30% revenue share on every user who installs it",
        tiers: { enterprise: true },
        icon: Globe,
      },
      {
        name: "Custom LLM Routing",
        description: "Route anchor text generation to your own LLM endpoint while still using LinkForge's vector search",
        tiers: { enterprise: true },
        icon: Cpu,
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Component                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */

export function PluginMatrixSection() {
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>("wordpress");

  const togglePlugin = (id: string) => {
    setExpandedPlugin((prev) => (prev === id ? null : id));
  };

  return (
    <section id="plugins" className="scroll-mt-24 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* ── Header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Plug className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Plugin & Integration Access
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Entry-level plugins gated by plan. Upgrade to unlock more platforms.
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every plan starts with the <strong className="text-foreground">WordPress plugin</strong> — install from wp.org in 60 seconds. 
            Higher tiers unlock additional CMS connectors, API access, and the ability to build your own.
          </p>
        </motion.div>

        {/* ── Tier Legend ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {(Object.entries(tierConfig) as [TierKey, typeof tierConfig[TierKey]][]).map(
            ([key, cfg]) => (
              <div
                key={key}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium",
                  cfg.bg,
                  cfg.border,
                  cfg.color
                )}
              >
                <cfg.icon className="w-3.5 h-3.5" />
                {cfg.label}
              </div>
            )
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-xs font-medium text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            Requires Upgrade
          </div>
        </motion.div>

        {/* ── Plugin Cards ────────────────────────────────────────── */}
        <div className="space-y-3">
          {plugins.map((plugin, i) => {
            const isExpanded = expandedPlugin === plugin.id;
            const PluginIcon = plugin.icon;

            return (
              <motion.div
                key={plugin.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
              >
                <Card
                  className={cn(
                    "border transition-all duration-300 overflow-hidden",
                    isExpanded
                      ? cn("border-border/80 shadow-lg", plugin.borderAccent)
                      : "border-border/50 hover:border-border/80 hover:shadow-md"
                  )}
                >
                  {/* ── Collapsed Header ──────────────────────────── */}
                  <button
                    type="button"
                    onClick={() => togglePlugin(plugin.id)}
                    className="w-full text-left p-4 sm:p-5 flex items-start gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br",
                        plugin.bgGradient
                      )}
                    >
                      <PluginIcon className={cn("w-5 h-5", plugin.color)} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h3 className="text-base font-semibold text-foreground">
                          {plugin.name}
                        </h3>
                        <Badge
                          className={cn(
                            "self-start sm:self-center text-[10px] font-medium w-fit",
                            tierConfig[plugin.minTier].bg,
                            tierConfig[plugin.minTier].border,
                            tierConfig[plugin.minTier].color
                          )}
                        >
                          {tierConfig[plugin.minTier].label}+
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {plugin.tagline}
                      </p>
                    </div>

                    {/* Expand icon */}
                    <div className="flex-shrink-0 mt-1 text-muted-foreground">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                  </button>

                  {/* ── Expanded Content ─────────────────────────── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-5 pb-5">
                          <Separator className="mb-5" />

                          {/* Description */}
                          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                            {plugin.description}
                          </p>

                          {/* Install Prompt */}
                          <div className="mb-6">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                              Quick Install
                            </p>
                            <div className="bg-neutral-950 dark:bg-neutral-900 rounded-lg p-3 sm:p-4 font-mono text-xs leading-relaxed overflow-x-auto">
                              <span className="text-neutral-500">$ </span>
                              <span className="text-neutral-300">
                                {plugin.installPrompt}
                              </span>
                            </div>
                          </div>

                          {/* Capabilities */}
                          <div className="mb-6">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                              Core Capabilities
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {plugin.capabilities.map((cap) => (
                                <div
                                  key={cap}
                                  className="flex items-start gap-2 text-xs text-muted-foreground"
                                >
                                  <Check
                                    className={cn(
                                      "w-3.5 h-3.5 mt-0.5 flex-shrink-0",
                                      plugin.color
                                    )}
                                  />
                                  {cap}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Feature Matrix */}
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                              Feature Access by Plan
                            </p>
                            <div className="space-y-2.5">
                              {plugin.features.map((feature) => (
                                <FeatureRow
                                  key={feature.name}
                                  feature={feature}
                                  pluginColor={plugin.color}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* ── Bottom CTA ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-5 rounded-xl border border-dashed border-border/60 bg-muted/20 text-center"
        >
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Don&apos;t see your platform?</strong>{" "}
            Business and Enterprise plans include API access to build custom integrations. 
            Enterprise gets the full Plugin SDK for marketplace publishing.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 gap-2 text-xs"
          >
            <Code2 className="w-3.5 h-3.5" />
            View API Documentation
            <ArrowRight className="w-3 h-3" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Feature Row Sub-Component                                          */
/* ═══════════════════════════════════════════════════════════════════════ */

function FeatureRow({
  feature,
  pluginColor,
}: {
  feature: PluginFeature;
  pluginColor: string;
}) {
  const allTiers: TierKey[] = ["starter", "pro", "business", "enterprise"];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg bg-muted/20 border border-border/30">
      {/* Feature name + description */}
      <div className="flex items-start gap-2.5 flex-1 min-w-0 sm:w-[45%]">
        {feature.icon && (
          <feature.icon
            className={cn("w-4 h-4 mt-0.5 flex-shrink-0", pluginColor)}
          />
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground leading-snug">
            {feature.name}
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
            {feature.description}
          </p>
        </div>
      </div>

      {/* Tier access cells */}
      <div className="flex items-center gap-2 sm:gap-3 sm:ml-auto sm:w-[55%] sm:justify-end">
        {allTiers.map((tier) => {
          const value = feature.tiers[tier];
          const cfg = tierConfig[tier];
          const TierIcon = cfg.icon;

          if (value === undefined || value === false) {
            return (
              <div
                key={tier}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-muted/40 border border-border/20 min-w-[90px] justify-center"
                title={`Not available on ${cfg.label}`}
              >
                <X className="w-3 h-3 text-muted-foreground/40" />
                <span className="text-[10px] text-muted-foreground/50 font-medium hidden sm:inline">
                  {cfg.label}
                </span>
              </div>
            );
          }

          if (typeof value === "string") {
            return (
              <div
                key={tier}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-md border min-w-[90px] justify-center",
                  cfg.bg,
                  cfg.border
                )}
                title={value}
              >
                <Check className={cn("w-3 h-3", cfg.color)} />
                <span className="text-[10px] font-medium truncate max-w-[65px]">
                  {value}
                </span>
              </div>
            );
          }

          return (
            <div
              key={tier}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-md border min-w-[90px] justify-center",
                cfg.bg,
                cfg.border
              )}
            >
              <TierIcon className={cn("w-3 h-3", cfg.color)} />
              <span className={cn("text-[10px] font-medium hidden sm:inline", cfg.color)}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}