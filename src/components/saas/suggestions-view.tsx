"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Check,
  X,
  Loader2,
  Inbox,
  ArrowDownUp,
  CheckCheck,
  Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { LinkSuggestion, SuggestionStatus } from "@/lib/types";

type FilterStatus = "all" | SuggestionStatus;
type SortBy = "score" | "date";

function getScoreColor(score: number): string {
  if (score > 80)
    return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400";
  if (score > 50)
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
}

function getStatusStyle(status: SuggestionStatus): string {
  const map: Record<SuggestionStatus, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    approved: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    applied: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  };
  return map[status];
}

export function SuggestionsView() {
  const user = useAppStore((s) => s.user);
  const sites = useAppStore((s) => s.sites);
  const suggestions = useAppStore((s) => s.suggestions);
  const setSuggestions = useAppStore((s) => s.setSuggestions);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const setSelectedSiteId = useAppStore((s) => s.setSelectedSiteId);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("score");
  const [isGenerating, setIsGenerating] = useState(false);
  const [approvingAll, setApprovingAll] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currentSiteId =
    selectedSiteId ?? (sites.length > 0 ? sites[0].id : null);

  useEffect(() => {
    if (!currentSiteId) {
      setIsLoading(false);
      return;
    }
    fetchSuggestions();
  }, [currentSiteId]);

  async function fetchSuggestions() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ siteId: currentSiteId! });
      if (user?.id) params.set("userId", user.id);
      const res = await fetch(`/api/suggestions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions);
      }
    } catch {
      toast.error("Failed to load suggestions");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerate() {
    if (!currentSiteId) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/suggestions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: currentSiteId, userId: user?.id }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`Generated ${data.count ?? 0} new suggestions`);
      await fetchSuggestions();
    } catch {
      toast.error("Failed to generate suggestions");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleApprove(suggestionId: string) {
    setActionLoading(suggestionId);
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}/approve`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) throw new Error();
      setSuggestions(
        suggestions.map((s) =>
          s.id === suggestionId ? { ...s, status: "approved" as SuggestionStatus } : s
        )
      );
      toast.success("Link suggestion approved");
    } catch {
      toast.error("Failed to approve");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(suggestionId: string) {
    setActionLoading(suggestionId);
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}/reject`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) throw new Error();
      setSuggestions(
        suggestions.map((s) =>
          s.id === suggestionId ? { ...s, status: "rejected" as SuggestionStatus } : s
        )
      );
      toast.success("Link suggestion rejected");
    } catch {
      toast.error("Failed to reject");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproveAll() {
    const pendingIds = suggestions
      .filter((s) => s.status === "pending")
      .map((s) => s.id);
    if (pendingIds.length === 0) {
      toast.info("No pending suggestions to approve");
      return;
    }
    setApprovingAll(true);
    try {
      const res = await fetch("/api/suggestions/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: pendingIds, action: "approve", userId: user?.id }),
      });
      if (!res.ok) throw new Error();
      setSuggestions(
        suggestions.map((s) =>
          s.status === "pending" ? { ...s, status: "approved" as SuggestionStatus } : s
        )
      );
      toast.success(`${pendingIds.length} suggestions approved`);
    } catch {
      toast.error("Failed to approve all");
    } finally {
      setApprovingAll(false);
    }
  }

  const filteredSuggestions = useMemo(() => {
    let list = [...suggestions];
    if (filter !== "all") {
      list = list.filter((s) => s.status === filter);
    }
    list.sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    return list;
  }, [suggestions, filter, sortBy]);

  const pendingCount = suggestions.filter((s) => s.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* No sites empty state */}
      {sites.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-orange-500" />
            </div>
            <h4 className="text-lg font-semibold mb-1">No sites yet</h4>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Add and crawl a website first to generate link suggestions.
            </p>
            <Button
              onClick={() => setActiveView("sites")}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
              <Globe className="w-4 h-4 mr-2" />
              Add Your First Site
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      {sites.length > 0 && (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Link Suggestions
            </h2>
            <p className="text-muted-foreground mt-1">
              Review AI-generated internal link recommendations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sites.length > 1 && (
            <Select
              value={currentSiteId ?? ""}
              onValueChange={setSelectedSiteId}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      )}

      {/* Filter bar and content - only when sites exist */}
      {sites.length > 0 && (
      <>
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as FilterStatus)}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              {pendingCount > 0 && (
                <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="applied">Applied</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortBy)}
          >
            <SelectTrigger className="w-36 h-9">
              <ArrowDownUp className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Score</SelectItem>
              <SelectItem value="date">Date</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleApproveAll}
            disabled={approvingAll || pendingCount === 0}
          >
            {approvingAll ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
            )}
            Approve All
          </Button>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            )}
            Generate New
          </Button>
        </div>
      </div>

      {/* Suggestions list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : filteredSuggestions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-orange-500" />
            </div>
            <h4 className="text-lg font-semibold mb-1">No suggestions yet</h4>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              {filter === "all"
                ? "Generate AI-powered link suggestions for your site."
                : `No ${filter} suggestions found.`}
            </p>
            {filter === "all" && (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Suggestions
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-18rem)]">
          <div className="space-y-3 pr-4">
            <AnimatePresence>
              {filteredSuggestions.map((suggestion, i) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Source → Target */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {suggestion.sourcePage?.title ?? "Unknown Page"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {suggestion.sourcePage?.url ?? ""}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-orange-500 shrink-0 hidden sm:block" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {suggestion.targetPage?.title ?? "Unknown Page"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {suggestion.targetPage?.url ?? ""}
                              </p>
                            </div>
                          </div>

                          {/* Anchor + context */}
                          <div className="mt-2 flex items-start gap-2 text-sm">
                            <span className="text-muted-foreground shrink-0 text-xs pt-0.5">
                              Anchor:
                            </span>
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              &quot;{suggestion.anchorText}&quot;
                            </span>
                          </div>
                          {suggestion.surroundingText && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                              ...{suggestion.surroundingText}...
                            </p>
                          )}
                        </div>

                        {/* Right side: score + actions */}
                        <div className="flex items-center gap-3 lg:shrink-0">
                          <Badge
                            variant="secondary"
                            className={cn("text-xs font-mono", getScoreColor(suggestion.score * 100))}
                          >
                            {Math.round(suggestion.score * 100)}%
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={cn("text-[10px]", getStatusStyle(suggestion.status))}
                          >
                            {suggestion.status.charAt(0).toUpperCase() +
                              suggestion.status.slice(1)}
                          </Badge>
                          {suggestion.status === "pending" && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-500/10"
                                onClick={() => handleApprove(suggestion.id)}
                                disabled={actionLoading === suggestion.id}
                              >
                                {actionLoading === suggestion.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                                onClick={() => handleReject(suggestion.id)}
                                disabled={actionLoading === suggestion.id}
                              >
                                {actionLoading === suggestion.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
      </>
      )}
    </div>
  );
}