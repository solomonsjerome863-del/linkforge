"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Link2,
  ArrowRight,
  Search,
  Brain,
  Globe,
  BarChart3,
  Check,
  Menu,
  AlertTriangle,
  Layers,
  Sparkles,
  TrendingUp,
  X,
  Twitter,
  Linkedin,
  Github,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";

/* ─── Scroll animation wrapper ─── */
function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── CTA handler ─── */
function handleGetStarted() {
  useAppStore.getState().setShowLanding(false);
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/* ─── 1. Navbar ─── */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  function handleNavClick(href: string) {
    setMobileOpen(false);
    const id = href.replace("#", "");
    scrollToId(id);
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Link<span className="text-orange-500">Forge</span>{" "}
            <span className="text-muted-foreground font-normal text-base">AI</span>
          </span>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={handleGetStarted}
          >
            Sign In
          </Button>
          <Button
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
            onClick={handleGetStarted}
          >
            Get Started Free
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <Link2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-lg font-bold tracking-tight">
                    Link<span className="text-orange-500">Forge</span>{" "}
                    <span className="text-muted-foreground font-normal text-sm">AI</span>
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4 mt-4">
                {links.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => handleNavClick(link.href)}
                    className="w-full text-left px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
                <Separator className="my-3" />
                <Button
                  variant="ghost"
                  className="justify-start text-sm text-muted-foreground hover:text-foreground"
                  onClick={handleGetStarted}
                >
                  Sign In
                </Button>
                <Button
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 w-full"
                  onClick={handleGetStarted}
                >
                  Get Started Free
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

/* ─── 2. Hero Section ─── */
function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 px-4 sm:pt-36 sm:pb-28 overflow-hidden">
      {/* Decorative blurred circles */}
      <div className="absolute top-20 -left-32 w-72 h-72 bg-orange-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-72 h-72 bg-teal-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-200/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <FadeIn>
            <Badge
              variant="secondary"
              className="mb-6 px-4 py-1.5 text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Now in Public Beta
            </Badge>
          </FadeIn>

          {/* Headline */}
          <FadeIn delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl leading-tight">
              Smart Internal Linking{" "}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                for Any Website
              </span>
            </h1>
          </FadeIn>

          {/* Subheadline */}
          <FadeIn delay={0.2}>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Automatically crawl your site, discover orphan pages, and get
              AI-powered link suggestions. Works with WordPress, Shopify,
              Webflow, or any website.
            </p>
          </FadeIn>

          {/* CTA Buttons */}
          <FadeIn delay={0.3}>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 px-8 h-12 text-base"
                onClick={handleGetStarted}
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base"
                onClick={() => scrollToId("how-it-works")}
              >
                See How It Works
              </Button>
            </div>
          </FadeIn>

          {/* Trust line */}
          <FadeIn delay={0.4}>
            <p className="mt-6 text-sm text-muted-foreground">
              Free to start. No credit card required.
            </p>
          </FadeIn>

          {/* Hero Image */}
          <FadeIn delay={0.5}>
            <div className="mt-14 w-full max-w-4xl">
              <div className="relative rounded-2xl border border-border/60 shadow-2xl shadow-orange-500/5 overflow-hidden bg-card">
                <img
                  src="/hero-illustration.png"
                  alt="LinkForge AI Dashboard"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ─── 3. Social Proof Bar ─── */
function SocialProofBar() {
  const stats = [
    { value: "2.8B", label: "Link Building Market Size" },
    { value: "47%", label: "Pages Are Orphans" },
    { value: "40%", label: "Ranking Boost from Smart Links" },
    { value: "Any CMS", label: "WordPress, Shopify, Webflow, Next.js" },
  ];

  return (
    <section className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-6 sm:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── 4. Features Section ─── */
function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Suggestions",
      description:
        "Understands semantic context, not just keyword matching. Get links that actually make sense.",
      color: "bg-orange-100 text-orange-600",
    },
    {
      icon: Globe,
      title: "Works With Any Website",
      description:
        "WordPress, Shopify, Webflow, Next.js, or any custom site. No plugins needed.",
      color: "bg-teal-100 text-teal-600",
    },
    {
      icon: Search,
      title: "Real Web Crawling",
      description:
        "Actually crawls your website to discover pages, analyze structure, and find linking opportunities.",
      color: "bg-amber-100 text-amber-600",
    },
    {
      icon: AlertTriangle,
      title: "Orphan Page Detection",
      description:
        "Find pages with zero internal links and fix them in clicks. Never lose traffic to dead-end pages again.",
      color: "bg-rose-100 text-rose-600",
    },
    {
      icon: Layers,
      title: "Bulk Operations",
      description:
        "Review, approve, and apply hundreds of link suggestions at once. Export to CSV for manual implementation.",
      color: "bg-orange-100 text-orange-600",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description:
        "Track your link health over time. Monitor orphan pages, link growth, and site structure improvements.",
      color: "bg-teal-100 text-teal-600",
    },
  ];

  return (
    <section id="features" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything You Need to Master{" "}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Internal Linking
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed to help SEO professionals, agencies, and
              website owners build smarter internal link structures.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <FadeIn key={i} delay={i * 0.08}>
                <Card className="h-full border-border/60 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div
                      className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── 5. How It Works Section ─── */
function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: Globe,
      title: "Add Your Website",
      description:
        "Enter your URL. We'll crawl your entire site in minutes, mapping every page and its content.",
      color: "bg-orange-100 text-orange-600",
    },
    {
      number: "02",
      icon: Sparkles,
      title: "Get AI Suggestions",
      description:
        "Our AI analyzes every page pair and suggests contextually relevant internal links with optimal anchor text.",
      color: "bg-teal-100 text-teal-600",
    },
    {
      number: "03",
      icon: TrendingUp,
      title: "Apply & Rank",
      description:
        "Review suggestions, approve the best ones, and watch your rankings improve. Export or apply directly.",
      color: "bg-amber-100 text-amber-600",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Start Getting Better Rankings{" "}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                in 3 Steps
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From adding your site to seeing ranking improvements — it takes
              minutes, not hours.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-20 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-gradient-to-r from-orange-300 via-teal-300 to-amber-300" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <FadeIn key={i} delay={i * 0.15}>
                <div className="relative flex flex-col items-center text-center">
                  {/* Step number + icon */}
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-background border border-border/60 shadow-sm flex items-center justify-center mb-6">
                    <Icon className={`w-7 h-7 ${step.color.split(" ")[1]}`} />
                  </div>

                  {/* Number badge */}
                  <div className="absolute -top-2 -right-2 z-20 w-7 h-7 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold flex items-center justify-center">
                    {step.number}
                  </div>

                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── 6. Competitor Comparison ─── */
function ComparisonSection() {
  const rows = [
    {
      feature: "Any CMS / Framework",
      linkforge: true,
      linkwhisper: false,
      linkwhisperNote: "WP only",
      linkboss: true,
    },
    {
      feature: "AI Semantic Analysis",
      linkforge: true,
      linkwhisper: false,
      linkwhisperNote: "keywords",
      linkboss: true,
    },
    {
      feature: "Real Web Crawling",
      linkforge: true,
      linkwhisper: false,
      linkwhisperNote: null,
      linkboss: false,
    },
    {
      feature: "Cloud-Based",
      linkforge: true,
      linkwhisper: false,
      linkwhisperNote: "plugin",
      linkboss: true,
    },
    {
      feature: "Orphan Detection",
      linkforge: true,
      linkwhisper: true,
      linkwhisperNote: null,
      linkboss: true,
    },
    {
      feature: "Starting Price",
      linkforge: null,
      linkwhisper: null,
      linkboss: null,
      linkforgePrice: "Free",
      linkwhisperPrice: "$97/yr",
      linkbossPrice: "$11/mo",
    },
  ];

  function CellValue({
    isLinkforge,
    value,
    note,
    price,
  }: {
    isLinkforge?: boolean;
    value?: boolean | null;
    note?: string | null;
    price?: string;
  }) {
    if (price) {
      return (
        <span className={`font-semibold ${isLinkforge ? "text-orange-600" : ""}`}>
          {price}
        </span>
      );
    }
    if (value === true) {
      return (
        <span className="inline-flex items-center justify-center">
          <Check className="w-5 h-5 text-teal-500" />
        </span>
      );
    }
    if (value === false) {
      return (
        <span className="inline-flex items-center gap-1">
          <X className="w-5 h-5 text-rose-500" />
          {note && (
            <span className="text-xs text-muted-foreground">({note})</span>
          )}
        </span>
      );
    }
    return null;
  }

  return (
    <section id="comparison" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Why Teams Choose{" "}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                LinkForge AI
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              See how we compare to the competition across the features that
              matter most.
            </p>
          </div>
        </FadeIn>

        <FadeIn>
          <div className="rounded-2xl border border-border/60 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-left pl-6 py-4 text-sm font-semibold">
                    Feature
                  </TableHead>
                  <TableHead className="text-center py-4 bg-orange-50 text-orange-700 text-sm font-bold">
                    LinkForge AI
                  </TableHead>
                  <TableHead className="text-center py-4 text-sm font-medium text-muted-foreground">
                    LinkWhisper
                  </TableHead>
                  <TableHead className="text-center pr-6 py-4 text-sm font-medium text-muted-foreground">
                    LinkBoss
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6 py-4 font-medium text-sm">
                      {row.feature}
                    </TableCell>
                    <TableCell className="py-4 text-center bg-orange-50/50">
                      {row.linkforgePrice ? (
                        <CellValue
                          isLinkforge
                          price={row.linkforgePrice}
                        />
                      ) : (
                        <CellValue isLinkforge value={row.linkforge} />
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      {row.linkwhisperPrice ? (
                        <CellValue price={row.linkwhisperPrice} />
                      ) : (
                        <CellValue
                          value={row.linkwhisper}
                          note={row.linkwhisperNote}
                        />
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-center pr-6">
                      {row.linkbossPrice ? (
                        <CellValue price={row.linkbossPrice} />
                      ) : (
                        <CellValue value={row.linkboss} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── 7. Pricing Preview ─── */
function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "",
      description: "For personal blogs and small sites",
      features: [
        "1 site",
        "50 pages crawled",
        "100 suggestions/mo",
        "Basic orphan detection",
        "CSV export",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$49",
      period: "/mo",
      description: "For growing businesses and agencies",
      features: [
        "5 sites",
        "500 pages crawled",
        "2,000 suggestions/mo",
        "Analytics dashboard",
        "Bulk operations",
        "Priority support",
      ],
      cta: "Start Free Trial",
      highlighted: true,
      badge: "Popular",
    },
    {
      name: "Agency",
      price: "$149",
      period: "/mo",
      description: "For large agencies and enterprises",
      features: [
        "25 sites",
        "5,000 pages crawled",
        "10,000 suggestions/mo",
        "API access",
        "White-label reports",
        "Dedicated support",
      ],
      cta: "Start Free Trial",
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Simple,{" "}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Transparent
              </span>{" "}
              Pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {plans.map((plan, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <Card
                className={`relative h-full ${
                  plan.highlighted
                    ? "border-orange-300 shadow-xl shadow-orange-500/10 scale-[1.02]"
                    : "border-border/60"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 px-4 py-1 text-xs font-semibold">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.description}
                  </p>
                  <div className="mt-4 mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground text-sm">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <Button
                    className={`w-full mb-6 h-11 ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
                        : ""
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={handleGetStarted}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <li
                        key={j}
                        className="flex items-center gap-3 text-sm text-muted-foreground"
                      >
                        <Check
                          className={`w-4 h-4 shrink-0 ${
                            plan.highlighted
                              ? "text-orange-500"
                              : "text-teal-500"
                          }`}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 8. FAQ Section ─── */
function FAQSection() {
  const faqs = [
    {
      question: "What is internal linking and why does it matter?",
      answer:
        "Internal links are hyperlinks that connect one page of your website to another page on the same site. They're critical for SEO because they help search engines understand your site's structure, distribute page authority (link equity) across your pages, and help visitors discover related content. Pages with more internal links tend to rank higher because search engines crawl them more frequently and understand their importance within your site hierarchy.",
    },
    {
      question: "How is LinkForge AI different from LinkWhisper?",
      answer:
        "LinkForge AI is a cloud-based platform that works with any website or CMS — not just WordPress. Unlike LinkWhisper, which is a WordPress plugin that relies on keyword matching, LinkForge AI uses real semantic AI to understand the context and meaning of your content. We also actually crawl your website (like a search engine would) to discover pages and analyze your site structure, giving you more accurate and comprehensive link suggestions.",
    },
    {
      question: "Does it work with my website platform?",
      answer:
        "Yes! LinkForge AI works with any website that has a URL. Whether you're using WordPress, Shopify, Webflow, Next.js, Gatsby, Wix, Squarespace, or a fully custom-built site — as long as we can crawl it, we can analyze it. There are no plugins or integrations required. Just enter your URL and we handle the rest.",
    },
    {
      question: "How does the AI generate link suggestions?",
      answer:
        "Our AI first crawls your website to discover all pages and extract their content. It then uses semantic analysis to understand the topic, context, and intent of each page. For every pair of pages, it evaluates whether a link between them would be contextually relevant and beneficial for both users and search engines. It also suggests optimal anchor text that reads naturally within the source page's content.",
    },
    {
      question: "Is there a free plan?",
      answer:
        "Yes! Our Starter plan is free forever and includes 1 site, up to 50 crawled pages, and 100 AI-powered link suggestions per month. It's perfect for personal blogs, small websites, or anyone who wants to try LinkForge AI before upgrading to a paid plan. No credit card required to sign up.",
    },
    {
      question: "Can I cancel anytime?",
      answer:
        "Absolutely. There are no contracts, no commitments, and no cancellation fees. You can upgrade, downgrade, or cancel your plan at any time from your account settings. If you cancel a paid plan, you'll continue to have access until the end of your current billing period, and your account will then revert to the free Starter plan.",
    },
  ];

  return (
    <section id="faq" className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <FadeIn>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Frequently Asked{" "}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to know about LinkForge AI.
            </p>
          </div>
        </FadeIn>

        <FadeIn>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-sm sm:text-base font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── 9. Final CTA Section ─── */
function FinalCTASection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="relative rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-6 py-16 sm:px-12 sm:py-20 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Ready to Boost Your Rankings?
              </h2>
              <p className="mt-4 text-lg text-neutral-400 max-w-2xl mx-auto">
                Join thousands of SEO professionals who trust LinkForge AI for
                smarter internal linking.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 px-8 h-12 text-base"
                  onClick={handleGetStarted}
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  onClick={() => scrollToId("how-it-works")}
                >
                  View Demo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── 10. Footer ─── */
function Footer() {
  const footerLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
    { label: "Blog", href: "#" },
  ];

  return (
    <footer className="border-t border-border/60 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Link2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Link<span className="text-orange-500">Forge</span>{" "}
                <span className="text-muted-foreground font-normal text-sm">AI</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered internal linking for better SEO.
            </p>
          </div>

          {/* Footer links */}
          <nav className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  if (link.href === "#") return;
                  scrollToId(link.href.replace("#", ""));
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </button>
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </button>
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </button>
          </div>
        </div>

        <Separator className="my-8" />

        <p className="text-center text-xs text-muted-foreground">
          © 2025 LinkForge AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ─── Main Landing Page ─── */
export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <SocialProofBar />
        <FeaturesSection />
        <HowItWorksSection />
        <ComparisonSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}