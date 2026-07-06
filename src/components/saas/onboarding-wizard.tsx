"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ArrowRight, Loader2, Sparkles, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/lib/store";

const STORAGE_KEY = "linkforge-onboarded";

function isOnboarded(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function markOnboarded() {
  localStorage.setItem(STORAGE_KEY, "true");
}

/* ─── Step 1: Welcome ─── */
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="text-center space-y-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome to LinkForge AI
        </h2>
        <p className="mt-3 text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Add your website and we&apos;ll crawl it, find orphan pages, and generate
          AI-powered internal link suggestions to boost your SEO.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto text-center">
        {[
          { step: "1", label: "Add Site" },
          { step: "2", label: "Crawl" },
          { step: "3", label: "Get Links" },
        ].map((item) => (
          <div key={item.step} className="space-y-1">
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto">
              <span className="text-sm font-bold text-orange-600">{item.step}</span>
            </div>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
      <Button
        size="lg"
        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 px-8"
        onClick={onNext}
      >
        Add Your First Site
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
}

/* ─── Step 2: Add Site Form ─── */
function AddSiteStep({
  onComplete,
}: {
  onComplete: (id: string, name: string, url: string) => void;
}) {
  const user = useAppStore((s) => s.user);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function validateUrl(val: string): boolean {
    try {
      new URL(val.startsWith("http") ? val : `https://${val}`);
      return true;
    } catch {
      return false;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !url.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (!validateUrl(url.trim())) {
      setError("Please enter a valid URL (e.g. https://example.com)");
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedUrl = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          name: name.trim(),
          url: normalizedUrl,
          platform: "custom",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create site");
      }

      const data = await res.json();
      onComplete(data.site.id, name.trim(), normalizedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div
      key="add-site"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
          <Globe className="w-6 h-6 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Add Your Website</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll crawl your site and discover linking opportunities.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="onboard-name">Site Name</Label>
          <Input
            id="onboard-name"
            placeholder="My Blog"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="onboard-url">Website URL</Label>
          <Input
            id="onboard-url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        {error && (
          <p className="text-sm text-rose-500">{error}</p>
        )}
        <Button
          type="submit"
          size="lg"
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
          disabled={isSubmitting || !name.trim() || !url.trim()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create &amp; Start Crawl
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}

/* ─── Step 3: Crawling ─── */
function CrawlingStep({
  siteName,
  siteUrl,
  onDone,
}: {
  siteName: string;
  siteUrl: string;
  onDone: () => void;
}) {
  const user = useAppStore((s) => s.user);
  const [progress, setProgress] = useState(10);
  const [crawlDone, setCrawlDone] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) {
          clearInterval(interval);
          return 95;
        }
        return p + Math.random() * 15;
      });
    }, 500);

    // Trigger actual crawl in background
    async function startCrawl() {
      try {
        const res = await fetch(`/api/sites?userId=${user?.id}`);
        if (res.ok) {
          const data = await res.json();
          const site = data.sites?.find(
            (s: { name: string }) => s.name === siteName
          );
          if (site) {
            await fetch(`/api/sites/${site.id}/crawl?userId=${user?.id}`, {
              method: "POST",
            });
          }
        }
      } catch {
        // Non-blocking — the wizard shows progress regardless
      }
    }

    startCrawl();

    const timer = setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setCrawlDone(true);
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [siteName, user?.id]);

  return (
    <motion.div
      key="crawling"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="text-center space-y-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto">
        {crawlDone ? (
          <CheckCircle2 className="w-8 h-8 text-teal-600" />
        ) : (
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {crawlDone ? "Site Added!" : "Crawling Your Site..."}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {crawlDone
            ? "Your site has been added and is being analyzed."
            : `Discovering pages on ${siteUrl}`}
        </p>
      </div>

      <div className="max-w-xs mx-auto">
        <Progress value={Math.min(progress, 100)} className="h-2" />
        <p className="mt-2 text-xs text-muted-foreground">
          {crawlDone ? "Complete" : `${Math.min(Math.round(progress), 100)}%`}
        </p>
      </div>

      {crawlDone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <p className="text-sm text-muted-foreground">
            Go to your dashboard to generate AI link suggestions.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 px-8"
            onClick={onDone}
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─── Main Onboarding Wizard ─── */
export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [siteInfo, setSiteInfo] = useState({ name: "", url: "" });
  const setActiveView = useAppStore((s) => s.setActiveView);

  useEffect(() => {
    if (!isOnboarded()) {
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    markOnboarded();
  }, []);

  function handleSiteCreated(id: string, name: string, url: string) {
    setSiteInfo({ name, url });
    setStep(2);
  }

  function handleDone() {
    setVisible(false);
    markOnboarded();
    setActiveView("sites");
  }

  if (!visible) return null;

  const stepLabels = ["Welcome", "Add Site", "Crawling"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors"
          aria-label="Skip onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            {/* Progress indicator */}
            <div className="flex items-center gap-2 mb-8">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0 ${
                      i <= step
                        ? "bg-orange-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i < step ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 rounded-full transition-colors ${
                        i < step ? "bg-orange-500" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Steps */}
            <AnimatePresence mode="wait">
              {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
              {step === 1 && <AddSiteStep onComplete={handleSiteCreated} />}
              {step === 2 && (
                <CrawlingStep
                  siteName={siteInfo.name}
                  siteUrl={siteInfo.url}
                  onDone={handleDone}
                />
              )}
            </AnimatePresence>

            {/* Skip link */}
            {step < 2 && (
              <p className="text-center mt-6">
                <button
                  onClick={dismiss}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip for now
                </button>
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}