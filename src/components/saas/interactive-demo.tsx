"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Globe,
  Loader2,
} from "lucide-react";

/* ─── Types ─── */
interface PageNode {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface PageLink {
  from: string;
  to: string;
}

type Phase =
  | "idle"
  | "crawling"
  | "mapping"
  | "analyzing"
  | "suggesting"
  | "complete";

/* ─── Demo Data: "FreshBite Food Blog" ─── */
const SITE_NAME = "FreshBite Food Blog";
const SITE_URL = "freshbite.co.za";

const pages: PageNode[] = [
  { id: "home", x: 350, y: 36, label: "Home" },
  { id: "blog", x: 140, y: 116, label: "Blog" },
  { id: "shop", x: 350, y: 116, label: "Shop" },
  { id: "about", x: 560, y: 116, label: "About" },
  { id: "pasta", x: 70, y: 200, label: "Pasta Recipes" },
  { id: "chocolate", x: 210, y: 200, label: "Chocolate Cake" },
  { id: "kitchen", x: 350, y: 200, label: "Kitchen Tools" },
  { id: "contact", x: 560, y: 200, label: "Contact" },
  { id: "smoothie", x: 140, y: 284, label: "Smoothie Guide" },
  { id: "faq", x: 560, y: 284, label: "FAQ" },
];

const existingLinks: PageLink[] = [
  { from: "home", to: "blog" },
  { from: "home", to: "shop" },
  { from: "home", to: "about" },
  { from: "blog", to: "pasta" },
  { from: "blog", to: "chocolate" },
  { from: "shop", to: "kitchen" },
  { from: "about", to: "contact" },
];

const suggestedLinks: PageLink[] = [
  { from: "blog", to: "smoothie" },
  { from: "pasta", to: "smoothie" },
  { from: "chocolate", to: "smoothie" },
  { from: "faq", to: "contact" },
  { from: "faq", to: "about" },
  { from: "chocolate", to: "kitchen" },
  { from: "smoothie", to: "pasta" },
  { from: "kitchen", to: "shop" },
];

const orphanPages = ["smoothie", "faq"];

function getPage(id: string) {
  return pages.find((p) => p.id === id)!;
}

/* ─── Phase Config ─── */
const phaseConfig: Record<
  Phase,
  { label: string; icon: typeof Search; color: string; bgColor: string }
> = {
  idle: { label: "Ready", icon: Globe, color: "text-muted-foreground", bgColor: "bg-muted" },
  crawling: { label: "Crawling site...", icon: Search, color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-950" },
  mapping: { label: "Mapping links...", icon: Link2, color: "text-amber-500", bgColor: "bg-amber-100 dark:bg-amber-950" },
  analyzing: { label: "Finding orphan pages...", icon: AlertTriangle, color: "text-rose-500", bgColor: "bg-rose-100 dark:bg-rose-950" },
  suggesting: { label: "AI generating suggestions...", icon: Brain, color: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-950" },
  complete: { label: "All pages connected!", icon: CheckCircle2, color: "text-emerald-500", bgColor: "bg-emerald-100 dark:bg-emerald-950" },
};

/* ─── InternalLinkingDemo Component ─── */
export function InternalLinkingDemo({ compact = false }: { compact?: boolean }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set());
  const [visibleExisting, setVisibleExisting] = useState<Set<string>>(new Set());
  const [visibleSuggested, setVisibleSuggested] = useState<Set<string>>(new Set());
  const [highlightedOrphans, setHighlightedOrphans] = useState<Set<string>>(new Set());
  const [linkScore, setLinkScore] = useState(0);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    let cancelled = false;

    function schedule(fn: () => void, delay: number) {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, delay);
      timeoutsRef.current.push(id);
    }

    function runSequence() {
      // Reset state
      setPhase("idle");
      setVisibleNodes(new Set());
      setVisibleExisting(new Set());
      setVisibleSuggested(new Set());
      setHighlightedOrphans(new Set());
      setLinkScore(0);

      // Phase 1: Crawl — reveal nodes one by one
      schedule(() => setPhase("crawling"), 400);
      pages.forEach((page, i) => {
        schedule(() => {
          setVisibleNodes((prev) => new Set([...prev, page.id]));
        }, 600 + i * 220);
      });

      // Phase 2: Mapping — show existing links
      const mapStart = 600 + pages.length * 220 + 400;
      schedule(() => setPhase("mapping"), mapStart);
      existingLinks.forEach((link, i) => {
        schedule(() => {
          setVisibleExisting((prev) =>
            new Set([...prev, `${link.from}-${link.to}`])
          );
        }, mapStart + 300 + i * 180);
      });

      // Phase 3: Analyzing — highlight orphans
      const analyzeStart = mapStart + 300 + existingLinks.length * 180 + 600;
      schedule(() => setPhase("analyzing"), analyzeStart);
      schedule(() => setLinkScore(38), analyzeStart);
      schedule(() => setHighlightedOrphans(new Set(orphanPages)), analyzeStart + 400);

      // Phase 4: Suggesting — show AI suggestions
      const suggestStart = analyzeStart + 2000;
      schedule(() => setPhase("suggesting"), suggestStart);
      suggestedLinks.forEach((link, i) => {
        schedule(() => {
          setVisibleSuggested((prev) =>
            new Set([...prev, `${link.from}-${link.to}`])
          );
          setLinkScore(Math.min(100, 38 + Math.round(((i + 1) / suggestedLinks.length) * 62)));
        }, suggestStart + 400 + i * 280);
      });

      // Phase 5: Complete
      const completeStart = suggestStart + 400 + suggestedLinks.length * 280 + 600;
      schedule(() => setPhase("complete"), completeStart);
      schedule(() => setHighlightedOrphans(new Set()), completeStart);
      schedule(() => setLinkScore(100), completeStart);

      // Loop
      const loopStart = completeStart + 3500;
      schedule(() => {
        const restartId = setTimeout(() => {
          if (!cancelled) runSequence();
        }, 1500);
        timeoutsRef.current.push(restartId);
      }, loopStart);
    }

    runSequence();

    return () => {
      cancelled = true;
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  const getNodeColor = (nodeId: string) => {
    if (!visibleNodes.has(nodeId)) return "transparent";
    if (phase === "complete") return "#10b981"; // emerald-500
    if (phase === "crawling") return "#3b82f6"; // blue-500
    if (highlightedOrphans.has(nodeId)) return "#ef4444"; // red-500
    if (phase === "suggesting" || phase === "mapping") return "#f97316"; // orange-500
    return "#6b7280"; // gray-500
  };

  const getNodeStroke = (nodeId: string) => {
    if (!visibleNodes.has(nodeId)) return "transparent";
    if (phase === "complete") return "#059669"; // emerald-600
    if (highlightedOrphans.has(nodeId)) return "#dc2626"; // red-600
    return "transparent";
  };

  const getExistingLinkColor = () => {
    if (phase === "complete") return "#10b981";
    return "#94a3b8"; // slate-400
  };

  const currentConfig = phaseConfig[phase];
  const PhaseIcon = currentConfig.icon;
  const nodesFound = visibleNodes.size;
  const linksFound = visibleExisting.size;
  const orphansFound = highlightedOrphans.size;
  const suggestionsApplied = visibleSuggested.size;

  return (
    <div
      className={`relative rounded-2xl border border-border/60 shadow-2xl shadow-orange-500/5 overflow-hidden ${
        compact ? "" : "bg-card"
      }`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
          </div>
          <span className="text-xs font-medium text-muted-foreground ml-2 hidden sm:inline">
            {SITE_URL}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${currentConfig.bgColor} ${currentConfig.color}`}
            >
              {phase === "crawling" || phase === "mapping" || phase === "suggesting" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <PhaseIcon className="w-3 h-3" />
              )}
              {currentConfig.label}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* SVG Visualization */}
      <div className="relative bg-gradient-to-b from-background to-muted/20" style={{ padding: compact ? "12px" : "16px" }}>
        <svg
          viewBox="0 0 700 320"
          className="w-full h-auto"
          style={{ maxHeight: compact ? "260px" : "380px" }}
        >
          <defs>
            {/* Glow filter for orphan pages */}
            <filter id="orphan-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Glow for suggested links */}
            <filter id="link-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Existing Links */}
          {existingLinks.map((link) => {
            const key = `${link.from}-${link.to}`;
            const from = getPage(link.from);
            const to = getPage(link.to);
            const visible = visibleExisting.has(key);
            return (
              <line
                key={key}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={getExistingLinkColor()}
                strokeWidth={1.5}
                strokeOpacity={visible ? 0.6 : 0}
                style={{ transition: "stroke-opacity 0.4s ease, stroke 0.4s ease" }}
              />
            );
          })}

          {/* Suggested Links */}
          {suggestedLinks.map((link) => {
            const key = `${link.from}-${link.to}`;
            const from = getPage(link.from);
            const to = getPage(link.to);
            const visible = visibleSuggested.has(key);
            const isComplete = phase === "complete";
            return (
              <line
                key={`s-${key}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isComplete ? "#10b981" : "#f97316"}
                strokeWidth={isComplete ? 1.5 : 1.2}
                strokeDasharray={isComplete ? "none" : "6 4"}
                strokeOpacity={visible ? (isComplete ? 0.6 : 0.7) : 0}
                filter={visible && !isComplete ? "url(#link-glow)" : "none"}
                style={{
                  transition: "stroke-opacity 0.4s ease, stroke 0.4s ease, stroke-dasharray 0.4s ease",
                }}
              />
            );
          })}

          {/* Nodes */}
          {pages.map((page) => {
            const visible = visibleNodes.has(page.id);
            const isOrphan = highlightedOrphans.has(page.id);
            return (
              <g key={page.id}>
                {/* Outer ring for orphan pages */}
                {isOrphan && (
                  <circle
                    cx={page.x}
                    cy={page.y}
                    r={16}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeOpacity={0.4}
                    filter="url(#orphan-glow)"
                    style={{
                      animation: "orphan-pulse 1.5s ease-in-out infinite",
                    }}
                  />
                )}
                {/* Node circle */}
                <circle
                  cx={page.x}
                  cy={page.y}
                  r={8}
                  fill={getNodeColor(page.id)}
                  stroke={getNodeStroke(page.id)}
                  strokeWidth={phase === "complete" ? 2 : 0}
                  strokeOpacity={visible ? 1 : 0}
                  style={{
                    transition: "fill 0.5s ease, stroke-opacity 0.3s ease, stroke 0.5s ease",
                  }}
                />
                {/* Node label */}
                <text
                  x={page.x}
                  y={page.y + 20}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize={compact ? "9.5" : "10.5"}
                  fontWeight={isOrphan ? "600" : "400"}
                  style={{
                    opacity: visible ? 1 : 0,
                    transition: "opacity 0.3s ease",
                    fill: isOrphan ? "#ef4444" : undefined,
                  }}
                >
                  {page.label}
                </text>
                {/* Orphan badge */}
                {isOrphan && (
                  <g style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease" }}>
                    <rect
                      x={page.x - 16}
                      y={page.y - 24}
                      width={32}
                      height={14}
                      rx={3}
                      fill="#ef4444"
                    />
                    <text
                      x={page.x}
                      y={page.y - 14}
                      textAnchor="middle"
                      fontSize="7"
                      fontWeight="700"
                      fill="white"
                    >
                      ORPHAN
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Stats Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-t border-border/40">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Pages Found */}
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-foreground">{nodesFound}</span>
            <span className="text-[10px] text-muted-foreground">Pages</span>
          </div>

          {/* Existing Links */}
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-foreground">{linksFound}</span>
            <span className="text-[10px] text-muted-foreground">Links</span>
          </div>

          {/* Orphan Pages */}
          <div className="flex flex-col items-center">
            <span
              className={`text-sm font-bold ${
                orphansFound > 0 ? "text-rose-500" : "text-muted-foreground"
              }`}
            >
              {orphansFound}
            </span>
            <span className="text-[10px] text-muted-foreground">Orphans</span>
          </div>

          {/* Suggestions */}
          <div className="hidden sm:flex flex-col items-center">
            <span className="text-sm font-bold text-orange-500">
              {suggestionsApplied}
            </span>
            <span className="text-[10px] text-muted-foreground">New Links</span>
          </div>
        </div>

        {/* Link Score */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Link Score</span>
          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${linkScore}%`,
                background:
                  linkScore < 40
                    ? "#ef4444"
                    : linkScore < 70
                    ? "#f97316"
                    : "#10b981",
              }}
            />
          </div>
          <span
            className={`text-sm font-bold tabular-nums ${
              linkScore < 40
                ? "text-rose-500"
                : linkScore < 70
                ? "text-orange-500"
                : "text-emerald-500"
            }`}
          >
            {linkScore}%
          </span>
        </div>
      </div>

      {/* CSS for orphan pulse animation */}
      <style jsx global>{`
        @keyframes orphan-pulse {
          0%,
          100% {
            stroke-opacity: 0.2;
            r: 16;
          }
          50% {
            stroke-opacity: 0.6;
            r: 20;
          }
        }
      `}</style>
    </div>
  );
}
