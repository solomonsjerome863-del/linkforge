"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  FileText,
  Link2Icon,
  CheckCircle2,
  Plus,
  Sparkles,
  ExternalLink,
  Loader2,
  Inbox,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DashboardStats, Site, SiteStatus } from "@/lib/types";

type StatCardColor = "teal" | "orange" | "amber" | "green";

const STAT_CARDS: {
  key: keyof DashboardStats;
  label: string;
  icon: React.ElementType;
  color: StatCardColor;
}[] = [
  { key: "totalSites", label: "Total Sites", icon: Globe, color: "teal" },
  { key: "totalPages", label: "Pages Indexed", icon: FileText, color: "orange" },
  { key: "pendingSuggestions", label: "Pending Suggestions", icon: Link2Icon, color: "amber" },
  { key: "appliedLinks", label: "Links Applied", icon: CheckCircle2, color: "green" },
];

function getStatColorClasses(color: StatCardColor) {
  const map = {
    teal: {
      bg: "bg-teal-100 dark:bg-teal-900/30",
      icon: "text-teal-600 dark:text-teal-400",
      ring: "ring-teal-500/20",
    },
    orange: {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      icon: "text-orange-600 dark:text-orange-400",
      ring: "ring-orange-500/20",
    },
    amber: {
      bg: "bg-amber-100 dark:bg-amber-900/30",
      icon: "text-amber-600 dark:text-amber-400",
      ring: "ring-amber-500/20",
    },
    green: {
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      icon: "text-emerald-600 dark:text-emerald-400",
      ring: "ring-emerald-500/20",
    },
  };
  return map[color];
}

function getStatusBadge(status: SiteStatus) {
  const styles: Record<SiteStatus, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    crawling: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    ready: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    error: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };
  return styles[status];
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export function DashboardView() {
  const user = useAppStore((s) => s.user);
  const sites = useAppStore((s) => s.sites);
  const setSites = useAppStore((s) => s.setSites);
  const dashboardStats = useAppStore((s) => s.dashboardStats);
  const setDashboardStats = useAppStore((s) => s.setDashboardStats);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const setSelectedSiteId = useAppStore((s) => s.setSelectedSiteId);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    async function fetchData() {
      try {
        const [statsRes, sitesRes] = await Promise.all([
          fetch(`/api/dashboard/stats?userId=${user.id}`).catch(() => null),
          fetch(`/api/sites?userId=${user.id}`).catch(() => null),
        ]);
        if (statsRes?.ok) {
          const data = await statsRes.json();
          setDashboardStats(data.stats);
        }
        if (sitesRes?.ok) {
          const data = await sitesRes.json();
          setSites(data.sites);
        }
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [user?.id, setDashboardStats, setSites]);

  function handleGenerateSuggestions() {
    if (sites.length === 0) return;
    const firstSite = sites[0];
    setIsGenerating(true);
    fetch(`/api/suggestions/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId: firstSite.id, userId: user?.id }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => {
        setSelectedSiteId(firstSite.id);
        setActiveView("suggestions");
      })
      .catch(() => {
        toast.error("Failed to generate suggestions");
        setSelectedSiteId(firstSite.id);
        setActiveView("suggestions");
      })
      .finally(() => setIsGenerating(false));
  }

  function handleSiteClick(site: Site) {
    setSelectedSiteId(site.id);
    setActiveView("suggestions");
  }

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h2>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your internal links.
        </p>
      </div>

      {/* Stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map((stat, i) => {
            const colors = getStatColorClasses(stat.color);
            const Icon = stat.icon;
            const value = dashboardStats?.[stat.key] ?? 0;
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-3xl font-bold mt-1">{value}</p>
                      </div>
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center ring-4",
                          colors.bg,
                          colors.ring
                        )}
                      >
                        <Icon className={cn("w-6 h-6", colors.icon)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => setActiveView("sites")}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Site
        </Button>
        {sites.length > 0 && (
          <Button
            variant="outline"
            onClick={handleGenerateSuggestions}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Suggestions
          </Button>
        )}
      </div>

      {/* Recent Sites */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Sites</h3>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : sites.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-orange-500" />
              </div>
              <h4 className="text-lg font-semibold mb-1">No sites yet</h4>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Add your first website to start generating AI-powered internal link suggestions.
              </p>
              <Button
                onClick={() => setActiveView("sites")}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Site
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sites.map((site, i) => (
              <motion.div
                key={site.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 group"
                  onClick={() => handleSiteClick(site)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base truncate group-hover:text-orange-600 transition-colors">
                          {site.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          {site.url}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn("text-[10px] shrink-0 ml-2", getStatusBadge(site.status))}
                      >
                        {site.status === "crawling" && (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        )}
                        {site.status.charAt(0).toUpperCase() + site.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {site.pagesCount} pages
                      </span>
                      <span className="flex items-center gap-1">
                        <Link2Icon className="w-3.5 h-3.5" />
                        {site.linksCount} links
                      </span>
                    </div>
                    {site.lastCrawled && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last crawled {formatRelativeDate(site.lastCrawled)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
