"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Sparkles,
  Loader2,
  Link2,
  FileText,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Clock,
  BarChart3,
  Target,
  Zap,
  ExternalLink,
  Scissors,
  Search,
  PenLine,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TargetPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
}

interface Suggestion {
  target_post: TargetPost;
  relevance_score: number;
  anchor_text: string;
  context_sentence: string;
  confidence: "high" | "medium" | "low";
}

interface SuggestResponse {
  chunks_count: number;
  processing_time_ms: number;
  suggestions: Suggestion[];
}

type PipelineStep = "idle" | "chunking" | "retrieval" | "generation" | "done";

/* ------------------------------------------------------------------ */
/*  Sample Posts                                                       */
/* ------------------------------------------------------------------ */

const SAMPLE_POSTS: { label: string; title: string; content: string }[] = [
  {
    label: "My WordPress SEO Journey",
    title: "My WordPress SEO Journey",
    content:
      "When I first launched my WordPress blog back in 2021, I had no idea how much work went into proper search engine optimization. My posts were sitting on page five of Google, barely getting any organic traffic. I started by auditing my existing content and realized I had zero internal links connecting related articles together. This was a massive missed opportunity. I spent the next few weeks building out content clusters around my core topics — each pillar post linked out to at least five supporting articles, and those articles linked back to the pillar. The results were incredible. Within two months, my average time on page increased by 40%, and my crawl budget improved because Googlebot could discover deeper pages through sensible internal linking paths. I also tackled technical SEO issues: compressing images with WebP, implementing lazy loading, and setting up proper canonical tags. Site speed went from a dismal 4.2-second load time to under 1.8 seconds. I added schema markup for my how-to articles and saw rich snippets appear in search results within weeks. The biggest takeaway? Internal linking isn't just an SEO tactic — it's a user experience improvement that keeps readers engaged and exploring your site longer.",
  },
  {
    label: "Beginner's Guide to Content Marketing",
    title: "The Beginner's Guide to Content Marketing",
    content:
      "Content marketing is one of the most cost-effective strategies for growing your online presence, but getting started can feel overwhelming. The first step is understanding your audience deeply — what questions are they asking, what problems do they need solved, and where do they spend their time online? Once you have that clarity, keyword research becomes your compass. Tools like Google's own Keyword Planner, Ubersuggest, or Ahrefs can help you identify topics with decent search volume and manageable competition. Next, build a content calendar. I recommend planning at least three months ahead, with a mix of blog posts, infographics, and maybe short video scripts. Consistency matters more than volume — publishing one high-quality piece per week beats five mediocre ones. Distribution is where most beginners stumble. Don't just hit publish and pray. Share your content across social media, engage in relevant online communities, and consider building an email list from day one. Measuring ROI in content marketing takes patience. Track organic traffic growth, backlinks earned, lead generation, and engagement metrics over time. Tools like Google Analytics and Search Console will show you which pieces are driving results so you can double down on what works.",
  },
  {
    label: "Fixing Technical SEO Issues",
    title: "How I Fixed My Site's Technical SEO Issues",
    content:
      "Technical SEO was the elephant in the room that I ignored for far too long. My site had accumulated over 300 crawl errors in Google Search Console — mostly 404 pages from old URLs that I had changed during a site migration. I started by creating a comprehensive redirect map using a spreadsheet and implemented 301 redirects for every broken URL. Within a month, crawl errors dropped to under 20. Next up was site speed. I ran my pages through PageSpeed Insights and was shocked to see scores in the low 30s. The culprits were unoptimized hero images, render-blocking JavaScript, and no browser caching. I compressed all images, deferred non-critical JS, and set up caching headers. Scores jumped to the 80s across the board. I also implemented structured data using JSON-LD for my articles, FAQs, and how-to guides. This gave me rich snippets in search results almost immediately — my click-through rate improved by roughly 25% on pages with schema markup. Finally, I audited my internal link structure. Many important pages were buried three or four clicks from the homepage. I reorganized my navigation, added contextual internal links within content, and created a proper HTML sitemap. The combination of fixing crawl errors, improving speed, adding structured data, and optimizing internal links led to a 60% increase in organic traffic over three months.",
  },
];

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut", delay: i * 0.1 },
  }),
};

const stepVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35 } },
  completed: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35 },
  },
};

/* ------------------------------------------------------------------ */
/*  Pipeline Step Component                                             */
/* ------------------------------------------------------------------ */

function PipelineStepCard({
  step,
  icon: Icon,
  label,
  status,
  result,
}: {
  step: number;
  icon: React.ElementType;
  label: string;
  status: "pending" | "active" | "done";
  result?: string;
}) {
  return (
    <motion.div
      variants={stepVariants}
      initial="hidden"
      animate={status === "active" ? "visible" : status === "done" ? "completed" : "hidden"}
      className="flex items-center gap-3"
    >
      <div
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors shrink-0",
          status === "done" && "bg-teal-500 border-teal-500 text-white",
          status === "active" && "border-teal-500/60 text-teal-600 dark:text-teal-400 bg-teal-500/10",
          status === "pending" && "border-muted-foreground/25 text-muted-foreground/40"
        )}
      >
        {status === "done" ? (
          <CheckCircle2 className="size-5" />
        ) : status === "active" ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Icon className="size-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium transition-colors",
            status === "done" && "text-foreground",
            status === "active" && "text-foreground",
            status === "pending" && "text-muted-foreground/50"
          )}
        >
          <span className="text-muted-foreground/60 mr-1.5 text-xs">Step {step}</span>
          {label}
        </p>
        {status === "active" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-teal-600 dark:text-teal-400 mt-0.5"
          >
            Processing...
          </motion.p>
        )}
        {status === "done" && result && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium"
          >
            {result}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Suggestion Card                                                    */
/* ------------------------------------------------------------------ */

function SuggestionCard({ suggestion, index }: { suggestion: Suggestion; index: number }) {
  const { target_post, relevance_score, anchor_text, context_sentence, confidence } =
    suggestion;

  // Color-code relevance score
  const relevanceColor =
    relevance_score > 0.2
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
      : relevance_score > 0.1
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25"
        : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/25";

  // Color-code confidence
  const confidenceColor =
    confidence === "high"
      ? "bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/25"
      : confidence === "medium"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25"
        : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/25";

  // Highlight anchor text in context sentence
  const renderContext = () => {
    const parts = context_sentence.split(new RegExp(`(${escapeRegex(anchor_text)})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === anchor_text.toLowerCase() ? (
        <strong key={i} className="font-bold text-amber-900 dark:text-amber-200">
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="border-border/60 hover:border-border hover:shadow-md transition-shadow">
        <CardContent className="p-4 sm:p-5 space-y-3">
          {/* Target Post */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <a
                href={`#${target_post.slug}`}
                className="text-sm font-semibold text-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center gap-1.5 group"
              >
                <ExternalLink className="size-3.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                <span className="truncate">{target_post.title}</span>
              </a>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {target_post.excerpt}
              </p>
            </div>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("text-xs", relevanceColor)}>
              <BarChart3 className="size-3 mr-1" />
              {relevance_score.toFixed(2)} relevance
            </Badge>
            <Badge variant="outline" className={cn("text-xs capitalize", confidenceColor)}>
              <Target className="size-3 mr-1" />
              {confidence}
            </Badge>
          </div>

          {/* Anchor Text Highlight */}
          <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 p-3 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
              <Zap className="size-3" />
              Suggested Anchor
            </p>
            <p className="text-sm sm:text-base leading-relaxed text-foreground/90">
              &ldquo;{renderContext()}&rdquo;
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Utility                                                            */
/* ------------------------------------------------------------------ */

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function DemoSection() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedSample, setSelectedSample] = useState<string>("");
  const [pipeline, setPipeline] = useState<PipelineStep>("idle");
  const [results, setResults] = useState<SuggestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [engineLive, setEngineLive] = useState(false);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  /* ---- Check engine status ---- */
  useEffect(() => {
    const checkEngine = async () => {
      try {
        const res = await fetch("/?XTransformPort=3030/posts");
        if (res.ok) setEngineLive(true);
      } catch {
        setEngineLive(false);
      }
    };
    checkEngine();
    const interval = setInterval(checkEngine, 15000);
    return () => clearInterval(interval);
  }, []);

  /* ---- Load sample post ---- */
  const handleSampleSelect = useCallback((value: string) => {
    setSelectedSample(value);
    const sample = SAMPLE_POSTS.find((s) => s.label === value);
    if (sample) {
      setTitle(sample.title);
      setContent(sample.content);
      // Reset results when loading new content
      setResults(null);
      setError(null);
      setPipeline("idle");
    }
  }, []);

  /* ---- Generate suggestions ---- */
  const handleGenerate = useCallback(async () => {
    if (!content.trim()) return;

    // Reset
    setError(null);
    setResults(null);
    setPipeline("chunking");

    // Step 1: Chunking (simulate 1.2s)
    await new Promise((r) => setTimeout(r, 1200));
    setPipeline("retrieval");

    // Step 2: Retrieval (simulate 1s)
    await new Promise((r) => setTimeout(r, 1000));
    setPipeline("generation");

    // Step 3: Generation — fire API in parallel with simulated delay
    try {
      const res = await fetch("/?XTransformPort=3030/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, title: title || undefined }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const data: SuggestResponse = await res.json();
      // Small delay to let generation animation play
      await new Promise((r) => setTimeout(r, 600));
      setPipeline("done");
      setResults(data);
    } catch (err) {
      setPipeline("idle");
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please check that the demo engine is running and try again."
      );
    }
  }, [content, title]);

  /* ---- Try Again ---- */
  const handleRetry = useCallback(() => {
    setError(null);
    setPipeline("idle");
  }, []);

  /* ---- Pipeline step status helper ---- */
  const stepStatus = (step: "chunking" | "retrieval" | "generation") => {
    if (pipeline === "idle") return "pending" as const;
    const order: PipelineStep[] = ["chunking", "retrieval", "generation", "done"];
    const currentIdx = order.indexOf(pipeline);
    const stepIdx = order.indexOf(step);
    if (stepIdx < currentIdx) return "done" as const;
    if (stepIdx === currentIdx) return "active" as const;
    return "pending" as const;
  };

  return (
    <section id="demo" className="scroll-mt-24 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ---- Header ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Try It Now — Live Demo
            </h2>
            {/* ENGINE LIVE badge */}
            <span className="relative flex h-3 w-3">
              {engineLive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              )}
              <span
                className={cn(
                  "relative inline-flex rounded-full h-3 w-3",
                  engineLive ? "bg-teal-500" : "bg-muted-foreground/40"
                )}
              />
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-semibold px-2.5 py-0.5 transition-colors",
                engineLive
                  ? "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-400"
                  : "border-muted-foreground/25 bg-muted text-muted-foreground"
              )}
            >
              {engineLive ? "ENGINE LIVE" : "OFFLINE"}
            </Badge>
          </div>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Paste any blog post and watch LinkForge generate real internal link
            suggestions in real-time.
          </p>
        </motion.div>

        {/* ---- Two-Column Layout ---- */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start"
        >
          {/* ========================= */}
          {/* Left Column — Input        */}
          {/* ========================= */}
          <div className="space-y-5">
            {/* Sample Post Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <FileText className="size-4 text-muted-foreground" />
                Or try a sample post:
              </label>
              <Select value={selectedSample} onValueChange={handleSampleSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a sample blog post..." />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_POSTS.map((s) => (
                    <SelectItem key={s.label} value={s.label}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <label
                htmlFor="demo-title"
                className="text-sm font-medium text-foreground"
              >
                Post Title{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                id="demo-title"
                placeholder="e.g., My Latest Blog Post"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background"
              />
            </div>

            {/* Content Textarea */}
            <div className="space-y-2">
              <label
                htmlFor="demo-content"
                className="text-sm font-medium text-foreground"
              >
                Blog Post Content
              </label>
              <Textarea
                id="demo-content"
                placeholder="Paste your blog post content here... LinkForge will analyze the text and find the best opportunities for internal links within your existing content library."
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  // Reset results if content changes significantly
                  if (results) {
                    setResults(null);
                    setPipeline("idle");
                  }
                }}
                className="min-h-[300px] resize-y bg-background text-sm leading-relaxed"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {charCount.toLocaleString()} characters
                </span>
                <span>
                  {wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}
                </span>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={pipeline !== "idle" || !content.trim()}
              className={cn(
                "w-full gap-2.5 text-base font-semibold shadow-lg transition-all",
                pipeline === "idle" &&
                  content.trim() &&
                  "bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-teal-500/25 hover:shadow-teal-500/35",
                (pipeline !== "idle" || !content.trim()) &&
                  "bg-muted text-muted-foreground shadow-none cursor-not-allowed"
              )}
            >
              {pipeline !== "idle" ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="size-5" />
                  Generate Link Suggestions
                  <ArrowRight className="size-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* ========================= */}
          {/* Right Column — Results     */}
          {/* ========================= */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {/* ---- Pipeline Progress ---- */}
              {(pipeline === "chunking" ||
                pipeline === "retrieval" ||
                pipeline === "generation") && (
                <motion.div
                  key="pipeline"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-teal-500/30 bg-teal-500/5">
                    <CardHeader className="pb-3">
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <Wand2 className="size-4 text-teal-600 dark:text-teal-400" />
                        Processing Pipeline
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <PipelineStepCard
                        step={1}
                        icon={Scissors}
                        label="Chunking"
                        status={stepStatus("chunking")}
                        result={
                          results
                            ? `${results.chunks_count} chunks created`
                            : "Splitting into paragraphs..."
                        }
                      />
                      <div className="border-l-2 border-dashed border-muted-foreground/20 ml-4 h-3" />
                      <PipelineStepCard
                        step={2}
                        icon={Search}
                        label="Retrieval"
                        status={stepStatus("retrieval")}
                        result={
                          results
                            ? `${results.suggestions.length + 1} candidates found`
                            : "Searching for relevant posts..."
                        }
                      />
                      <div className="border-l-2 border-dashed border-muted-foreground/20 ml-4 h-3" />
                      <PipelineStepCard
                        step={3}
                        icon={PenLine}
                        label="Generation"
                        status={stepStatus("generation")}
                        result={
                          results
                            ? `${results.suggestions.length} suggestions ready`
                            : "Generating anchor text..."
                        }
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ---- Error State ---- */}
              {error && pipeline === "idle" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-rose-500/40 bg-rose-500/5">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/10">
                        <AlertCircle className="size-7 text-rose-500" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground mb-1">
                          Something went wrong
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          {error}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleRetry}
                        className="border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 gap-2"
                      >
                        <ArrowRight className="size-4 rotate-[-135deg]" />
                        Try Again
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ---- Results Display ---- */}
              {results && pipeline === "done" && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Link2 className="size-4 text-teal-600 dark:text-teal-400" />
                      Link Suggestions
                    </h3>
                    <Badge
                      variant="outline"
                      className="border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-400 text-xs"
                    >
                      {results.suggestions.length} found
                    </Badge>
                  </div>

                  {/* Suggestion Cards */}
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                    <AnimatePresence>
                      {results.suggestions.map((s, i) => (
                        <SuggestionCard key={s.target_post.id} suggestion={s} index={i} />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Processing Stats */}
                  <Card className="bg-muted/40 border-border/40">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5" />
                          <span className="font-medium text-foreground">
                            {results.processing_time_ms}ms
                          </span>{" "}
                          processing time
                        </span>
                        <span className="hidden sm:inline text-muted-foreground/40">|</span>
                        <span className="flex items-center gap-1.5">
                          <BarChart3 className="size-3.5" />
                          <span className="font-medium text-foreground">
                            {results.chunks_count}
                          </span>{" "}
                          chunks analyzed
                        </span>
                        <span className="hidden sm:inline text-muted-foreground/40">|</span>
                        <span className="flex items-center gap-1.5">
                          <Target className="size-3.5" />
                          <span className="font-medium text-foreground">
                            {results.suggestions.length}
                          </span>{" "}
                          suggestions
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ---- Empty State ---- */}
              {!error && pipeline === "idle" && !results && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-dashed border-border/60 bg-muted/20 h-full min-h-[400px] flex items-center justify-center">
                    <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-muted/60">
                        <Link2 className="size-10 text-muted-foreground/30" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-foreground/70">
                          Your link suggestions will appear here
                        </p>
                        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
                          Paste content above or select a sample post to get started
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}