"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Server,
  Cpu,
  MessageSquare,
  Database,
  Rocket,
  ChevronRight,
  Link2,
  Shield,
  Zap,
  Target,
  ArrowUp,
  BookOpen,
  Layers,
  Sparkles,
  CreditCard,
  FlaskConical,
  Plug,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Phase1Architecture } from "@/components/blueprint/phase-1-architecture";
import { Phase2TechStack } from "@/components/blueprint/phase-2-techstack";
import { Phase3RAG } from "@/components/blueprint/phase-3-rag";
import { Phase4Anchor } from "@/components/blueprint/phase-4-anchor";
import { Phase5Schema } from "@/components/blueprint/phase-5-schema";
import { Phase6Roadmap } from "@/components/blueprint/phase-6-roadmap";
import { PricingSection } from "@/components/blueprint/pricing-section";
import { MarketTestSection } from "@/components/blueprint/market-test-section";
import { PluginMatrixSection } from "@/components/blueprint/plugin-matrix-section";
import { DemoSection } from "@/components/blueprint/demo-section";

const navItems = [
  { id: "phase-1", label: "Architecture", icon: <Globe className="w-4 h-4" /> },
  { id: "phase-2", label: "Tech Stack", icon: <Server className="w-4 h-4" /> },
  { id: "phase-3", label: "RAG Strategy", icon: <Cpu className="w-4 h-4" /> },
  { id: "phase-4", label: "Anchor Text", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "phase-5", label: "DB Schema", icon: <Database className="w-4 h-4" /> },
  { id: "phase-6", label: "Roadmap", icon: <Rocket className="w-4 h-4" /> },
  { id: "pricing", label: "Pricing", icon: <CreditCard className="w-4 h-4" /> },
  { id: "plugins", label: "Plugins", icon: <Plug className="w-4 h-4" /> },
  { id: "demo", label: "Demo", icon: <Wand2 className="w-4 h-4" /> },
  { id: "market-test", label: "A/Z Test", icon: <FlaskConical className="w-4 h-4" /> },
];

const stats = [
  { value: "$0.0013", label: "Cost per query", icon: <Zap className="w-4 h-4 text-orange-500" /> },
  { value: "~8", label: "Avg chunks/post", icon: <Layers className="w-4 h-4 text-teal-500" /> },
  { value: "10K+", label: "Posts per batch", icon: <Target className="w-4 h-4 text-amber-500" /> },
  { value: "0", label: "Hallucinated URLs", icon: <Shield className="w-4 h-4 text-rose-500" /> },
];

const corePrinciples = [
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Vector Search for Retrieval",
    description: "LLMs never find links. Vector similarity does the heavy lifting. LLMs only generate anchor text. This saves 40-100x on API costs.",
    color: "text-teal-600 dark:text-teal-400 bg-teal-500/10",
  },
  {
    icon: <Link2 className="w-5 h-5" />,
    title: "Zero Hallucination Guarantee",
    description: "Every suggested URL references a real post_id in the database. DB-level CHECK constraints prevent self-links. URLs are never generated from scratch.",
    color: "text-orange-600 dark:text-orange-400 bg-orange-500/10",
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "Paragraph-Aware Chunking",
    description: "Unlike competitors, we preserve heading context in every chunk. This captures 20-30% more semantically relevant links.",
    color: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "Privacy-First Architecture",
    description: "Self-hosted LLM option (Llama 3.1) and self-hosted vector DB (Qdrant). Data never leaves the customer's infrastructure.",
    color: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
  },
];

export default function BlueprintPage() {
  const [activeSection, setActiveSection] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setShowScrollTop(window.scrollY > 600);

    const sections = navItems.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
    const scrollPos = window.scrollY + 120;

    for (let i = sections.length - 1; i >= 0; i--) {
      if (sections[i]!.offsetTop <= scrollPos) {
        setActiveSection(navItems[i].id);
        break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToPhase = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileNavOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm shadow-orange-500/25">
                <Link2 className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground leading-tight">LinkForge AI</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Technical Blueprint</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToPhase(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    activeSection === item.id
                      ? "bg-orange-500/10 text-orange-700 dark:text-orange-400 shadow-sm shadow-orange-500/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {item.icon}
                  <span className="hidden xl:inline">{item.label}</span>
                  <span className="xl:hidden">{item.id.replace("phase-", "P")}</span>
                </button>
              ))}
            </nav>

            {/* Mobile nav toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              <BookOpen className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden"
            >
              <nav className="max-w-6xl mx-auto px-4 py-2 flex flex-col gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToPhase(item.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      activeSection === item.id
                        ? "bg-orange-500/10 text-orange-700 dark:text-orange-400"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/50">
          {/* Warm mesh gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.07] via-amber-500/[0.04] to-teal-500/[0.03]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_var(--tw-gradient-stops))] from-orange-400/10 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-amber-500/[0.06] to-transparent rounded-full blur-3xl" />
          
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <div className="flex items-center gap-2 mb-5">
                <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/15">
                  Next-Gen Internal Linking Engine
                </Badge>
                <Badge variant="outline" className="text-muted-foreground">
                  v1.0 Blueprint
                </Badge>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold tracking-tight text-foreground leading-[1.1]">
                The Technical Blueprint for a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-teal-500 dark:from-orange-400 dark:via-amber-400 dark:to-teal-400">
                  LinkWhisper-Killing
                </span>{" "}
                Internal Linking Engine
              </h1>
              
              <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                A comprehensive 6-phase technical architecture for building an LLM-powered internal linking SaaS 
                that uses <strong className="text-foreground">RAG + Vector Search</strong> for retrieval 
                and <strong className="text-foreground">LLMs only for anchor text generation</strong> — achieving 
                40-100x cost savings over naive approaches.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => scrollToPhase("phase-1")}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all duration-200"
                >
                  Explore the Architecture
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Button variant="outline" onClick={() => scrollToPhase("phase-6")} className="hover:bg-muted/80">
                  View Roadmap
                </Button>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
            >
              {stats.map((stat) => (
                <Card key={stat.label} className="border-border/60 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-3">
                    {stat.icon}
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Core Principles */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Core Architectural Principles</h2>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">
              The four non-negotiable design decisions that differentiate this system from every competitor.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {corePrinciples.map((principle, i) => (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-border/60 bg-card/50 backdrop-blur-sm h-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <CardContent className="p-5 flex gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${principle.color}`}>
                      {principle.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm mb-1">{principle.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{principle.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <Separator className="max-w-6xl mx-auto" />

        {/* All 6 Phases */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16 sm:space-y-24">
          <Phase1Architecture />
          <Phase2TechStack />
          <Phase3RAG />
          <Phase4Anchor />
          <Phase5Schema />
          <Phase6Roadmap />
        </div>

        <Separator className="max-w-6xl mx-auto" />

        {/* Pricing Section */}
        <PricingSection />

        <Separator className="max-w-6xl mx-auto" />

        {/* Plugin Matrix Section */}
        <PluginMatrixSection />

        <Separator className="max-w-6xl mx-auto" />

        {/* Live Demo Section */}
        <DemoSection />

        <Separator className="max-w-7xl mx-auto" />

        {/* A/Z Market Test Section */}
        <MarketTestSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Link2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">LinkForge AI</span>
              <span className="text-xs text-muted-foreground">— Technical Blueprint v1.0</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>RAG Architecture</span>
              <span className="text-border">|</span>
              <span>Vector-First Search</span>
              <span className="text-border">|</span>
              <span>Zero Hallucination</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center hover:shadow-orange-500/45 transition-shadow"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}