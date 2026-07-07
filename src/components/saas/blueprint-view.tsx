"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  BookOpen,
  Globe,
  Search,
  Link2,
  FileSearch,
  MailCheck,
  KeyRound,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  CircleDot,
  Zap,
  Database,
  Palette,
  Layout,
  Layers,
  Server,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Reusable fade-in wrapper                                          */
/* ------------------------------------------------------------------ */
function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  1. Hero Section                                                   */
/* ------------------------------------------------------------------ */
function HeroSection() {
  return (
    <FadeIn>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-8 md:p-12 text-white">
        {/* Decorative dots */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>
        <div className="relative z-10 max-w-2xl">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/30">
            <BookOpen className="w-3 h-3 mr-1" />
            System Architecture
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Technical Blueprint
          </h2>
          <p className="text-white/90 text-base md:text-lg leading-relaxed">
            A deep dive into the architecture powering LinkForge — from
            intelligent web crawling and content analysis to AI-driven internal
            link suggestions, all built on a modern, type-safe full-stack
            foundation.
          </p>
        </div>
      </div>
    </FadeIn>
  );
}

/* ------------------------------------------------------------------ */
/*  2. Architecture Overview                                           */
/* ------------------------------------------------------------------ */
const ARCH_STEPS = [
  {
    label: "User",
    icon: CircleDot,
    desc: "Submits a site URL through the dashboard",
  },
  {
    label: "LinkForge",
    icon: Zap,
    desc: "Orchestrates the pipeline & stores results",
  },
  {
    label: "Crawl Engine",
    icon: Globe,
    desc: "Fetches pages & extracts internal links",
  },
  {
    label: "Content Analyzer",
    icon: FileSearch,
    desc: "Parses headings, keywords & metadata",
  },
  {
    label: "Link Suggestions",
    icon: Link2,
    desc: "TF-overlap scoring & anchor generation",
  },
  {
    label: "Apply",
    icon: CheckCircle2,
    desc: "Approve & apply links to your site",
  },
];

function ArchitectureOverview() {
  return (
    <FadeIn delay={0.1}>
      <section>
        <h3 className="text-xl font-semibold mb-1">Architecture Overview</h3>
        <p className="text-sm text-muted-foreground mb-6">
          How a request flows through the system from input to actionable link
          suggestions.
        </p>

        {/* Desktop: horizontal flow */}
        <div className="hidden lg:grid lg:grid-cols-6 lg:gap-0 items-stretch">
          {ARCH_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-stretch">
              <div className="flex flex-col items-center flex-1 text-center group">
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300",
                    "bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40",
                    "group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-orange-500/10"
                  )}
                >
                  <step.icon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-sm font-semibold">{step.label}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug max-w-[130px]">
                  {step.desc}
                </p>
              </div>
              {/* Arrow connector */}
              {i < ARCH_STEPS.length - 1 && (
                <div className="flex items-center -mx-1 mt-[-2rem]">
                  <ChevronRight className="w-5 h-5 text-orange-400 dark:text-orange-500 shrink-0" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile / Tablet: vertical flow */}
        <div className="lg:hidden space-y-0">
          {ARCH_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    "bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40"
                  )}
                >
                  <step.icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                {i < ARCH_STEPS.length - 1 && (
                  <div className="w-px h-8 bg-gradient-to-b from-orange-300 to-orange-100 dark:from-orange-700 dark:to-orange-900/40 my-1" />
                )}
              </div>
              <div className="pb-6">
                <p className="text-sm font-semibold">{step.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </FadeIn>
  );
}

/* ------------------------------------------------------------------ */
/*  3. Feature Grid                                                   */
/* ------------------------------------------------------------------ */
const FEATURES = [
  {
    title: "Smart Crawling",
    desc: "Real web page fetching via CLI subprocess with full HTML content extraction, internal link discovery, and recursive page traversal.",
    icon: Globe,
    tag: "Core",
  },
  {
    title: "Keyword Analysis",
    desc: "TF-overlap scoring algorithm compares page keywords to identify semantically relevant link opportunities across your site.",
    icon: Search,
    tag: "AI",
  },
  {
    title: "Internal Linking",
    desc: "AI-powered anchor text generation creates natural, contextually relevant link text that improves both UX and SEO.",
    icon: Link2,
    tag: "AI",
  },
  {
    title: "Content Analysis",
    desc: "Extracts headings hierarchy, word counts, and detects orphan pages — pages with zero incoming internal links.",
    icon: FileSearch,
    tag: "Core",
  },
  {
    title: "Email Verification",
    desc: "Secure verification flow with token-based email confirmation, preventing unauthorized account access during signup.",
    icon: MailCheck,
    tag: "Auth",
  },
  {
    title: "Password Reset",
    desc: "Token-based password recovery with 1-hour expiry, anti-enumeration protection, and secure hash-based token validation.",
    icon: KeyRound,
    tag: "Auth",
  },
];

function FeatureGrid() {
  const tagColors: Record<string, string> = {
    Core: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    AI: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    Auth: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <FadeIn delay={0.15}>
      <section>
        <h3 className="text-xl font-semibold mb-1">Core Capabilities</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Six pillars that make LinkForge a complete internal linking
          solution.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={0.05 * i}>
              <Card className="group h-full transition-all duration-300 hover:shadow-md hover:shadow-orange-500/5 hover:border-orange-200 dark:hover:border-orange-900/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <f.icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn("text-[10px]", tagColors[f.tag])}
                    >
                      {f.tag}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </section>
    </FadeIn>
  );
}

/* ------------------------------------------------------------------ */
/*  4. Tech Stack                                                     */
/* ------------------------------------------------------------------ */
const TECH_ITEMS = [
  {
    name: "Next.js 16",
    desc: "App Router, React Server Components, API routes",
    icon: Layers,
  },
  {
    name: "Prisma ORM",
    desc: "Type-safe database access with SQLite",
    icon: Database,
  },
  {
    name: "SQLite",
    desc: "Lightweight, zero-config embedded database",
    icon: Server,
  },
  {
    name: "Tailwind CSS 4",
    desc: "Utility-first styling with dark mode",
    icon: Palette,
  },
  {
    name: "shadcn/ui",
    desc: "Accessible, composable UI component library",
    icon: Layout,
  },
  {
    name: "Framer Motion",
    desc: "Smooth page transitions & scroll animations",
    icon: Zap,
  },
];

function TechStack() {
  return (
    <FadeIn delay={0.2}>
      <section>
        <h3 className="text-xl font-semibold mb-1">Tech Stack</h3>
        <p className="text-sm text-muted-foreground mb-6">
          The modern, type-safe stack behind every feature.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {TECH_ITEMS.map((t, i) => (
            <FadeIn key={t.name} delay={0.04 * i}>
              <Card className="group text-center transition-all duration-300 hover:shadow-md hover:shadow-orange-500/5 hover:border-orange-200 dark:hover:border-orange-900/50">
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <t.icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {t.desc}
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </section>
    </FadeIn>
  );
}

/* ------------------------------------------------------------------ */
/*  5. API Status Table                                               */
/* ------------------------------------------------------------------ */
const API_ENDPOINTS = [
  {
    group: "Auth APIs",
    endpoints: [
      { method: "POST", path: "/api/auth/signup", status: "Operational" },
      { method: "POST", path: "/api/auth/signin", status: "Operational" },
      { method: "POST", path: "/api/auth/forgot-password", status: "Operational" },
      { method: "POST", path: "/api/auth/reset-password", status: "Operational" },
      { method: "POST", path: "/api/auth/verify-email", status: "Operational" },
    ],
  },
  {
    group: "Sites API",
    endpoints: [
      { method: "GET", path: "/api/sites", status: "Operational" },
      { method: "POST", path: "/api/sites", status: "Operational" },
      { method: "DELETE", path: "/api/sites/:id", status: "Operational" },
      { method: "POST", path: "/api/sites/:id/crawl", status: "Operational" },
    ],
  },
  {
    group: "Crawl API",
    endpoints: [
      { method: "POST", path: "/api/crawl", status: "Operational" },
      { method: "GET", path: "/api/crawl/:id/status", status: "Operational" },
    ],
  },
  {
    group: "Suggestions API",
    endpoints: [
      { method: "GET", path: "/api/suggestions", status: "Operational" },
      { method: "PATCH", path: "/api/suggestions/:id", status: "Operational" },
      { method: "POST", path: "/api/suggestions/bulk", status: "Operational" },
      { method: "GET", path: "/api/suggestions/export", status: "Operational" },
    ],
  },
  {
    group: "Pages API",
    endpoints: [
      { method: "GET", path: "/api/pages", status: "Operational" },
    ],
  },
  {
    group: "Analytics API",
    endpoints: [
      { method: "GET", path: "/api/analytics/summary", status: "Operational" },
      { method: "GET", path: "/api/analytics/funnel", status: "Operational" },
      { method: "GET", path: "/api/analytics/top-pages", status: "Operational" },
    ],
  },
];

function methodColor(method: string) {
  switch (method) {
    case "GET":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "POST":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "PATCH":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "DELETE":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function ApiStatusTable() {
  return (
    <FadeIn delay={0.25}>
      <section>
        <h3 className="text-xl font-semibold mb-1">API Status</h3>
        <p className="text-sm text-muted-foreground mb-6">
          All system endpoints are fully operational and authenticated.
        </p>

        <Card>
          <CardContent className="p-0">
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground w-[140px]">
                      Group
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground w-[70px]">
                      Method
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Endpoint
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right w-[110px]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {API_ENDPOINTS.map((group) =>
                    group.endpoints.map((ep, idx) => (
                      <tr
                        key={`${group.group}-${ep.method}-${ep.path}`}
                        className="border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                      >
                        {idx === 0 && (
                          <td
                            className="px-4 py-2.5 font-medium align-top"
                            rowSpan={group.endpoints.length}
                          >
                            {group.group}
                          </td>
                        )}
                        <td className="px-4 py-2.5">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] font-mono font-semibold px-1.5 py-0",
                              methodColor(ep.method)
                            )}
                          >
                            {ep.method}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                          {ep.path}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {ep.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </FadeIn>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported Blueprint View                                            */
/* ------------------------------------------------------------------ */
export function BlueprintView() {
  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <HeroSection />

      <Separator />

      <ArchitectureOverview />

      <Separator />

      <FeatureGrid />

      <Separator />

      <TechStack />

      <Separator />

      <ApiStatusTable />

      {/* Footer note */}
      <FadeIn delay={0.3}>
        <div className="text-center py-6">
          <p className="text-xs text-muted-foreground">
            Built with <Shield className="w-3 h-3 inline mx-0.5" /> type-safe
            patterns, authenticated API routes, and a modern component
            architecture.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}