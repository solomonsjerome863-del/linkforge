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

const navItems = [
  { id: "phase-1", label: "Architecture", icon: <Globe className="w-4 h-4" /> },
  { id: "phase-2", label: "Tech Stack", icon: <Server className="w-4 h-4" /> },
  { id: "phase-3", label: "RAG Strategy", icon: <Cpu className="w-4 h-4" /> },
  { id: "phase-4", label: "Anchor Text", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "phase-5", label: "DB Schema", icon: <Database className="w-4 h-4" /> },
  { id: "phase-6", label: "Roadmap", icon: <Rocket className="w-4 h-4" /> },
];

const stats = [
  { value: "$0.0013", label: "Cost per query", icon: <Zap className="w-4 h-4 text-emerald-500" /> },
  { value: "~8", label: "Avg chunks/post", icon: <Layers className="w-4 h-4 text-cyan-500" /> },
  { value: "10K+", label: "Posts per batch", icon: <Target className="w-4 h-4 text-amber-500" /> },
  { value: "0", label: "Hallucinated URLs", icon: <Shield className="w-4 h-4 text-rose-500" /> },
];

const corePrinciples = [
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Vector Search for Retrieval",
    description: "LLMs never find links. Vector similarity does the heavy lifting. LLMs only generate anchor text. This saves 40-100x on API costs.",
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  },
  {
    icon: <Link2 className="w-5 h-5" />,
    title: "Zero Hallucination Guarantee",
    description: "Every suggested URL references a real post_id in the database. DB-level CHECK constraints prevent self-links. URLs are never generated from scratch.",
    color: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10",
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "Paragraph-Aware Chunking",
    description: "Unlike competitors, we preserve heading context in every chunk. This captures 20-30% more semantically relevant links.",
    color: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Privacy-First Architecture",
    description: "Self-hosted LLM option (Llama 3.1) and self-hosted vector DB (Qdrant). Data never leaves the customer's infrastructure.",
    color: "text-violet-600 dark:text-violet-400 bg-violet-500/10",
  },
];

export default function BlueprintPage() {
  const [activeSection, setActiveSection] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setShowScrollTop(window.scrollY > 600);

    // Detect active section
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
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeSection === item.id
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
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
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
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
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,_var(--tw-gradient-stops))] from-transparent via-border/30 to-transparent" />
          
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15">
                  Next-Gen Internal Linking Engine
                </Badge>
                <Badge variant="outline" className="text-muted-foreground">
                  v1.0 Blueprint
                </Badge>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                The Technical Blueprint for a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400">
                  LinkWhisper-Killing
                </span>{" "}
                Internal Linking Engine
              </h1>
              
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                A comprehensive 6-phase technical architecture for building an LLM-powered internal linking SaaS 
                that uses <strong className="text-foreground">RAG + Vector Search</strong> for retrieval 
                and <strong className="text-foreground">LLMs only for anchor text generation</strong> — achieving 
                40-100x cost savings over naive approaches.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => scrollToPhase("phase-1")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Explore the Architecture
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Button variant="outline" onClick={() => scrollToPhase("phase-6")}>
                  View Roadmap
                </Button>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
            >
              {stats.map((stat) => (
                <Card key={stat.label} className="border-border/60 bg-card/50 backdrop-blur-sm">
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
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Core Architectural Principles</h2>
            <p className="mt-1 text-sm text-muted-foreground">
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
                <Card className="border-border/60 bg-card/50 backdrop-blur-sm h-full hover:shadow-md transition-shadow">
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-16 sm:space-y-24">
          <Phase1Architecture />
          <Phase2TechStack />
          <Phase3RAG />
          <Phase4Anchor />
          <Phase5Schema />
          <Phase6Roadmap />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
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
            className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center hover:bg-foreground/90 transition-colors"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}