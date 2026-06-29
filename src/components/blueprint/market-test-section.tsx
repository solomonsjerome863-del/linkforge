"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  FlaskConical,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// ── Variant definitions ──────────────────────────────────────────────
const VARIANT_LABELS: Record<string, string> = {
  A: "Original Layout",
  B: "Social Proof Heavy",
  C: "Anchor Pricing",
  D: "Fear of Missing Out",
  E: "Minimalist Design",
  F: "Feature Comparison Table",
  G: "Testimonial Carousel",
  H: "Urgency Banner",
  I: "Money-Back Guarantee",
  J: "Annual Discount Focus",
  K: "ROI Calculator",
  L: "Competitor Comparison",
  M: "Video Background",
  N: "Chatbot Upsell",
  O: "Progressive Disclosure",
  P: "Plan Highlight Default",
  Q: "Enterprise First",
  R: "Free Trial CTA",
  S: "Usage Meter Preview",
  T: "Team Pricing Tab",
  U: "Startup Badge",
  V: "Migration Offer",
  W: "Dark Theme Default",
  X: "Gamified Onboarding",
  Y: "Partner Logo Wall",
  Z: "AI Demo Integration",
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Seeded random for consistent initial data
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface VariantData {
  letter: string;
  label: string;
  visitors: number;
  conversions: number;
  convRate: number;
  revenue: number;
  confidence: number;
  pValue: number;
  status: "significant" | "running" | "inconclusive";
}

function generateInitialVariants(): VariantData[] {
  const rng = seededRand(42);
  // Give specific variants different performance profiles
  const performanceProfile: Record<string, number> = {
    A: 0.045,
    B: 0.058,
    C: 0.062,
    D: 0.052,
    E: 0.038,
    F: 0.048,
    G: 0.041,
    H: 0.055,
    I: 0.051,
    J: 0.056,
    K: 0.044,
    L: 0.049,
    M: 0.037,
    N: 0.042,
    O: 0.046,
    P: 0.065,
    Q: 0.034,
    R: 0.053,
    S: 0.039,
    T: 0.043,
    U: 0.047,
    V: 0.054,
    W: 0.050,
    X: 0.036,
    Y: 0.040,
    Z: 0.060,
  };

  return LETTERS.map((letter) => {
    const baseRate = performanceProfile[letter]!;
    const visitors = Math.floor(1200 + rng() * 2200);
    const conversions = Math.round(visitors * baseRate);
    const confidence = Math.min(99, Math.floor(30 + rng() * 70));
    const pValue = Math.max(0.001, 0.15 - (confidence / 100) * 0.14 + rng() * 0.02);
    const status: VariantData["status"] =
      confidence >= 95 ? "significant" : confidence >= 60 ? "running" : "inconclusive";

    return {
      letter,
      label: VARIANT_LABELS[letter]!,
      visitors,
      conversions,
      convRate: parseFloat((conversions / visitors * 100).toFixed(2)),
      revenue: Math.round(conversions * (14 + rng() * 8)),
      confidence,
      pValue: parseFloat(pValue.toFixed(3)),
      status,
    };
  });
}

// ── Funnel stage data ────────────────────────────────────────────────
interface FunnelStage {
  name: string;
  count: number;
  dropoff: number;
  color: string;
  bgGradient: string;
}

function generateInitialFunnel(): FunnelStage[] {
  const pageViews = 47832;
  const pricingView = Math.round(pageViews * 0.68);
  const planSelect = Math.round(pricingView * 0.42);
  const checkout = Math.round(planSelect * 0.73);
  const payment = Math.round(checkout * 0.82);

  return [
    { name: "Page Views", count: pageViews, dropoff: 0, color: "from-orange-500 to-orange-400", bgGradient: "bg-orange-500/10" },
    { name: "Pricing View", count: pricingView, dropoff: 32, color: "from-amber-500 to-amber-400", bgGradient: "bg-amber-500/10" },
    { name: "Plan Selection", count: planSelect, dropoff: 58, color: "from-teal-500 to-teal-400", bgGradient: "bg-teal-500/10" },
    { name: "Checkout", count: checkout, dropoff: 73, color: "from-emerald-500 to-emerald-400", bgGradient: "bg-emerald-500/10" },
    { name: "Payment Success", count: payment, dropoff: 78, color: "from-rose-500 to-rose-400", bgGradient: "bg-rose-500/10" },
  ];
}

// ── Revenue distribution ─────────────────────────────────────────────
interface RevenueTier {
  name: string;
  mrr: number;
  color: string;
  barColor: string;
}

function generateInitialRevenue(): RevenueTier[] {
  return [
    { name: "Starter", mrr: 8240, color: "text-orange-600 dark:text-orange-400", barColor: "bg-gradient-to-r from-orange-500 to-orange-400" },
    { name: "Pro", mrr: 15680, color: "text-amber-600 dark:text-amber-400", barColor: "bg-gradient-to-r from-amber-500 to-amber-400" },
    { name: "Business", mrr: 9450, color: "text-teal-600 dark:text-teal-400", barColor: "bg-gradient-to-r from-teal-500 to-teal-400" },
    { name: "Enterprise", mrr: 5050, color: "text-rose-600 dark:text-rose-400", barColor: "bg-gradient-to-r from-rose-500 to-rose-400" },
  ];
}

// ── Helpers ──────────────────────────────────────────────────────────
function jitter(value: number, range: number, min = 0): number {
  return Math.max(min, value + (Math.random() - 0.5) * 2 * range);
}

function rateColor(rate: number): string {
  if (rate > 5) return "text-emerald-600 dark:text-emerald-400";
  if (rate >= 3) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function rateBg(rate: number): string {
  if (rate > 5) return "bg-emerald-500/10 border-emerald-500/20";
  if (rate >= 3) return "bg-amber-500/10 border-amber-500/20";
  return "bg-rose-500/10 border-rose-500/20";
}

// ── Component ────────────────────────────────────────────────────────
export function MarketTestSection() {
  const [variants, setVariants] = useState<VariantData[]>(() =>
    generateInitialVariants().sort((a, b) => b.convRate - a.convRate),
  );
  const [showAll, setShowAll] = useState(false);
  const [kpi, setKpi] = useState({
    visitors: 47832,
    conversions: 2341,
    rate: 4.89,
    revenue: 38420,
    visitorsDelta: 12.4,
    convDelta: 8.7,
    rateDelta: 0.3,
    revDelta: 15.2,
  });
  const [funnel, setFunnel] = useState<FunnelStage[]>(() => generateInitialFunnel());
  const [revenue, setRevenue] = useState<RevenueTier[]>(() => generateInitialRevenue());
  const [tick, setTick] = useState(0);

  // Real-time update loop
  const updateData = useCallback(() => {
    setKpi((prev) => {
      const newVisitors = prev.visitors + Math.floor(Math.random() * 15) + 3;
      const newConversions = prev.conversions + Math.floor(Math.random() * 3);
      const newRate = parseFloat((newConversions / newVisitors * 100).toFixed(2));
      const newRevenue = prev.revenue + Math.floor(Math.random() * 80) + 10;
      return {
        visitors: newVisitors,
        conversions: newConversions,
        rate: newRate,
        revenue: newRevenue,
        visitorsDelta: jitter(prev.visitorsDelta, 0.5, 5),
        convDelta: jitter(prev.convDelta, 0.8, 2),
        rateDelta: jitter(prev.rateDelta, 0.2, -1),
        revDelta: jitter(prev.revDelta, 1.2, 5),
      };
    });

    setVariants((prev) =>
      prev.map((v) => {
        const newVisitors = v.visitors + Math.floor(Math.random() * 5) + 1;
        const didConvert = Math.random() < v.convRate / 100;
        const newConversions = v.conversions + (didConvert ? 1 : 0);
        const newRate = parseFloat((newConversions / newVisitors * 100).toFixed(2));
        const newConfidence = Math.min(99.9, v.confidence + (Math.random() > 0.6 ? 0.3 : 0));
        const newPValue = parseFloat(Math.max(0.001, v.pValue - Math.random() * 0.005).toFixed(3));
        const status: VariantData["status"] =
          newConfidence >= 95 ? "significant" : newConfidence >= 60 ? "running" : "inconclusive";

        return {
          ...v,
          visitors: newVisitors,
          conversions: newConversions,
          convRate: newRate,
          revenue: v.revenue + (didConvert ? Math.floor(Math.random() * 20) + 10 : 0),
          confidence: parseFloat(newConfidence.toFixed(1)),
          pValue: newPValue,
          status,
        };
      }).sort((a, b) => b.convRate - a.convRate),
    );

    setFunnel((prev) =>
      prev.map((stage, i) => {
        const increment = Math.floor(Math.random() * 8) + 2;
        return { ...stage, count: stage.count + increment };
      }),
    );

    setRevenue((prev) =>
      prev.map((tier) => ({
        ...tier,
        mrr: Math.max(2000, tier.mrr + Math.floor((Math.random() - 0.35) * 120)),
      })),
    );

    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    const interval = setInterval(updateData, 2500);
    return () => clearInterval(interval);
  }, [updateData]);

  const displayedVariants = useMemo(
    () => (showAll ? variants : variants.slice(0, 8)),
    [variants, showAll],
  );

  const topPerformer = variants[0];
  const maxFunnel = funnel[0]?.count ?? 1;
  const maxRevenue = Math.max(...revenue.map((r) => r.mrr));

  const kpiCards = [
    {
      label: "Total Visitors",
      value: kpi.visitors.toLocaleString(),
      delta: kpi.visitorsDelta,
      icon: <Users className="w-4 h-4 text-orange-500" />,
      iconBg: "bg-orange-500/10",
    },
    {
      label: "Conversions",
      value: kpi.conversions.toLocaleString(),
      delta: kpi.convDelta,
      icon: <Activity className="w-4 h-4 text-amber-500" />,
      iconBg: "bg-amber-500/10",
    },
    {
      label: "Conversion Rate",
      value: `${kpi.rate}%`,
      delta: kpi.rateDelta,
      icon: <TrendingUp className="w-4 h-4 text-teal-500" />,
      iconBg: "bg-teal-500/10",
    },
    {
      label: "Projected MRR",
      value: `$${kpi.revenue.toLocaleString()}`,
      delta: kpi.revDelta,
      icon: <DollarSign className="w-4 h-4 text-rose-500" />,
      iconBg: "bg-rose-500/10",
    },
  ];

  return (
    <section id="market-test" className="scroll-mt-24 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                A/Z Market Readiness Test — Live
              </h2>
              <p className="mt-1 text-muted-foreground text-sm sm:text-base max-w-2xl">
                26 pricing page variants running concurrently. Real-time conversion, revenue, and engagement metrics.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto flex-shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15">
              LIVE
            </Badge>
            <Badge variant="outline" className="text-muted-foreground font-normal">
              Tick #{tick}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                    {card.icon}
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${card.delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {card.delta >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {Math.abs(card.delta).toFixed(1)}%
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Tabs for sub-sections ───────────────────────────────────── */}
      <Tabs defaultValue="variants" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="variants" className="gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">A/Z Variants</span>
            <span className="sm:hidden">Variants</span>
          </TabsTrigger>
          <TabsTrigger value="funnel" className="gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Conversion Funnel</span>
            <span className="sm:hidden">Funnel</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Revenue</span>
            <span className="sm:hidden">Revenue</span>
          </TabsTrigger>
          <TabsTrigger value="significance" className="gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Significance</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Variants ─────────────────────────────────────────── */}
        <TabsContent value="variants">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {showAll ? 26 : 8} of 26 variants, sorted by conversion rate
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-xs"
              >
                {showAll ? "Show Top 8" : "Show All 26 Variants"}
              </Button>
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
              {displayedVariants.map((v, i) => {
                const isWinner = topPerformer?.letter === v.letter;
                return (
                  <motion.div
                    key={v.letter}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card
                      className={`border-border/60 bg-card/60 backdrop-blur-sm hover:shadow-md transition-all ${
                        isWinner ? "ring-1 ring-teal-500/30 shadow-teal-500/10" : ""
                      }`}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          {/* Letter + Label */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0 sm:w-52">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                              isWinner
                                ? "bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {v.letter}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-foreground truncate">
                                  {v.label}
                                </span>
                                {isWinner && (
                                  <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20 text-[10px] px-1.5 py-0">
                                    Winning
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Metrics row */}
                          <div className="flex items-center gap-4 sm:gap-6 flex-1 flex-wrap text-xs">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Visitors:</span>
                              <span className="font-medium text-foreground tabular-nums">{v.visitors.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Activity className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Conv:</span>
                              <span className="font-medium text-foreground tabular-nums">{v.conversions}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Rate:</span>
                              <span className={`font-semibold tabular-nums ${rateColor(v.convRate)}`}>
                                {v.convRate}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Rev:</span>
                              <span className="font-medium text-foreground tabular-nums">${v.revenue.toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Confidence bar */}
                          <div className="flex items-center gap-2.5 min-w-0 sm:w-44 flex-shrink-0">
                            <Progress
                              value={v.confidence}
                              className="h-2 flex-1 [&>div]:bg-gradient-to-r [&>div]:from-teal-500 [&>div]:to-emerald-400"
                            />
                            <span className="text-[11px] font-medium text-muted-foreground tabular-nums w-10 text-right">
                              {v.confidence.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </TabsContent>

        {/* ── Tab: Conversion Funnel ────────────────────────────────── */}
        <TabsContent value="funnel">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-base font-semibold text-foreground mb-1">Conversion Funnel</h3>
                <p className="text-xs text-muted-foreground mb-6">Real-time drop-off analysis across the pricing flow</p>

                <div className="space-y-3">
                  {funnel.map((stage, i) => {
                    const widthPct = (stage.count / maxFunnel) * 100;
                    return (
                      <motion.div
                        key={stage.name}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{stage.name}</span>
                            {i > 0 && stage.dropoff > 0 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-rose-600 dark:text-rose-400 border-rose-500/20">
                                -{stage.dropoff}% drop
                              </Badge>
                            )}
                          </div>
                          <span className="font-semibold text-foreground tabular-nums">
                            {stage.count.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-7 rounded-lg bg-muted/50 overflow-hidden relative">
                          <motion.div
                            className={`h-full rounded-lg bg-gradient-to-r ${stage.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                          <div className="absolute inset-0 flex items-center justify-end pr-3">
                            <span className="text-[10px] font-medium text-white/90 tabular-nums drop-shadow-sm">
                              {widthPct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Tab: Revenue Distribution ─────────────────────────────── */}
        <TabsContent value="revenue">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-base font-semibold text-foreground mb-1">MRR by Tier</h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Projected monthly recurring revenue distribution across pricing tiers
                </p>

                <div className="space-y-4">
                  {revenue.map((tier, i) => {
                    const widthPct = (tier.mrr / maxRevenue) * 100;
                    return (
                      <motion.div
                        key={tier.name}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground">{tier.name}</span>
                          <span className={`font-semibold tabular-nums ${tier.color}`}>
                            ${tier.mrr.toLocaleString()}/mo
                          </span>
                        </div>
                        <div className="h-6 rounded-md bg-muted/50 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-md ${tier.barColor}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                        <div className="text-[10px] text-muted-foreground tabular-nums text-right">
                          {((tier.mrr / revenue.reduce((s, r) => s + r.mrr, 0)) * 100).toFixed(1)}% of total
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Total */}
                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Total Projected MRR</span>
                  <span className="text-lg font-bold text-foreground tabular-nums">
                    ${revenue.reduce((s, r) => s + r.mrr, 0).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Tab: Statistical Significance ─────────────────────────── */}
        <TabsContent value="significance">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-base font-semibold text-foreground">Statistical Significance</h3>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    α = 0.05
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-5">
                  Variants that have reached or are approaching 95% confidence level
                </p>

                {/* Summary badges */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {(() => {
                    const sig = variants.filter((v) => v.status === "significant").length;
                    const run = variants.filter((v) => v.status === "running").length;
                    const inc = variants.filter((v) => v.status === "inconclusive").length;
                    return (
                      <>
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {sig} Significant
                        </Badge>
                        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                          <Clock className="w-3 h-3 mr-1" />
                          {run} Running
                        </Badge>
                        <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {inc} Inconclusive
                        </Badge>
                      </>
                    );
                  })()}
                </div>

                {/* Significance list */}
                <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                  {variants.map((v, i) => (
                    <motion.div
                      key={v.letter}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        v.status === "significant"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : v.status === "running"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}>
                        {v.letter}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{v.label}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 text-xs tabular-nums">
                        <span className="text-muted-foreground">p =</span>
                        <span className="font-medium text-foreground">{v.pValue.toFixed(3)}</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 text-xs tabular-nums w-16 justify-end">
                        <span className="text-muted-foreground">CI:</span>
                        <span className="font-medium text-foreground">{v.confidence.toFixed(1)}%</span>
                      </div>
                      <Badge
                        className={`text-[10px] px-2 py-0.5 border ${
                          v.status === "significant"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                            : v.status === "running"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {v.status === "significant" && <CheckCircle2 className="w-3 h-3 mr-0.5" />}
                        {v.status === "running" && <Clock className="w-3 h-3 mr-0.5" />}
                        {v.status === "inconclusive" && <AlertCircle className="w-3 h-3 mr-0.5" />}
                        {v.status === "significant" ? "Significant" : v.status === "running" ? "Running" : "Inconclusive"}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
      </div>
    </section>
  );
}