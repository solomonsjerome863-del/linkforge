"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Newspaper,
  MessageSquare,
  Hash,
  Share2,
  Link as LinkIcon,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Plus,
  Filter,
  Star,
  TrendingUp,
  Eye,
  EyeOff,
  Loader2,
  Inbox,
  Radar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  Citation,
  CitationBrand,
  CitationSourceType,
  CitationStatus,
  CitationSentiment,
} from "@/lib/types";

// ─── Filter Types ───
type FilterStatus = "all" | CitationStatus;
type FilterSource = "all" | CitationSourceType;
type SortBy = "opportunity" | "newest" | "authority";

// ─── Source Type Config ───
const SOURCE_TYPE_CONFIG: Record<
  CitationSourceType,
  { icon: React.ElementType; label: string; color: string; bg: string }
> = {
  blog: {
    icon: Globe,
    label: "Blog",
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-100 dark:bg-teal-900/30",
  },
  news: {
    icon: Newspaper,
    label: "News",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-100 dark:bg-sky-900/30",
  },
  forum: {
    icon: MessageSquare,
    label: "Forum",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  reddit: {
    icon: Hash,
    label: "Reddit",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  social: {
    icon: Share2,
    label: "Social",
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-100 dark:bg-pink-900/30",
  },
  other: {
    icon: LinkIcon,
    label: "Other",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-900/30",
  },
};

// ─── Status Badge Styles ───
function getStatusStyle(status: CitationStatus): string {
  const map: Record<CitationStatus, string> = {
    new: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    reviewed:
      "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
    outreach_sent:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    converted:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    dismissed: "bg-muted text-muted-foreground",
  };
  return map[status];
}

function getStatusLabel(status: CitationStatus): string {
  const map: Record<CitationStatus, string> = {
    new: "New",
    reviewed: "Reviewed",
    outreach_sent: "Outreach",
    converted: "Converted",
    dismissed: "Dismissed",
  };
  return map[status];
}

// ─── Sentiment Dot ───
function SentimentDot({ sentiment }: { sentiment: CitationSentiment }) {
  const colors: Record<CitationSentiment, string> = {
    positive: "bg-emerald-500",
    neutral: "bg-amber-400",
    negative: "bg-gray-400",
  };
  return (
    <span
      className={cn("w-2 h-2 rounded-full shrink-0", colors[sentiment])}
      title={sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
    />
  );
}

// ─── Score Badge ───
function ScoreBadge({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: "authority" | "relevance" | "opportunity";
}) {
  const colors: Record<string, string> = {
    authority:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    relevance:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    opportunity:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };
  return (
    <span
      className={cn(
        "text-[10px] font-mono px-1.5 py-0.5 rounded",
        colors[variant]
      )}
    >
      {label} {value}
    </span>
  );
}

// ─── Stat Card ───
interface StatCardData {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  ring: string;
  sub?: string;
}

function StatCard({ data }: { data: StatCardData }) {
  const Icon = data.icon;
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{data.label}</p>
            <p className="text-2xl md:text-3xl font-bold mt-1">{data.value}</p>
            {data.sub && (
              <p className="text-xs text-muted-foreground mt-1">{data.sub}</p>
            )}
          </div>
          <div
            className={cn(
              "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ring-4",
              data.bg,
              data.ring
            )}
          >
            <Icon className={cn("w-5 h-5 md:w-6 md:h-6", data.color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Stat Skeleton ───
function StatSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

// ─── Citation Row Skeleton ───
function CitationRowSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-64 mb-1" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-3 w-full mt-2" />
            <Skeleton className="h-3 w-3/4 mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
            <div className="flex gap-1">
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="w-8 h-8 rounded" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───
export function CitationsView() {
  const user = useAppStore((s) => s.user);
  const sites = useAppStore((s) => s.sites);

  // State
  const [brands, setBrands] = useState<CitationBrand[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterSource, setFilterSource] = useState<FilterSource>("all");
  const [unlinkedOnly, setUnlinkedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("opportunity");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Computed
  const currentBrandId =
    selectedBrandId || (brands.length > 0 ? brands[0].id : "");

  // Stats
  const stats = useMemo(() => {
    const total = citations.length;
    const unlinked = citations.filter((c) => !c.hasBacklink).length;
    const linked = citations.filter((c) => c.hasBacklink).length;
    const avgOpportunity =
      total > 0
        ? Math.round(
            citations.reduce((sum, c) => sum + c.opportunityScore, 0) / total
          )
        : 0;
    return { total, unlinked, linked, avgOpportunity };
  }, [citations]);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch(`/api/citations/brands?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setBrands(data.brands ?? []);
      }
    } catch {
      // silently fail — empty state will show
    }
  }, [user?.id]);

  const fetchCitations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        brandId: currentBrandId,
        userId: user?.id ?? "",
      });
      const res = await fetch(`/api/citations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCitations(data.citations ?? []);
      }
    } catch {
      toast.error("Failed to load citations");
    } finally {
      setIsLoading(false);
    }
  }, [currentBrandId, user?.id]);

  // Fetch brands on mount
  useEffect(() => {
    if (!user?.id) return;
    fetchBrands();
  }, [user?.id, fetchBrands]);

  // Fetch citations when brand changes
  useEffect(() => {
    if (!user?.id || !currentBrandId) {
      setIsLoading(false);
      return;
    }
    fetchCitations();
  }, [user?.id, currentBrandId, fetchCitations]);

  // Scan for mentions
  async function handleScan() {
    if (!currentBrandId) return;
    setIsScanning(true);
    try {
      const params = new URLSearchParams({ brandId: currentBrandId });
      const res = await fetch(`/api/citations/scan?${params}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Scan failed" }));
        throw new Error(err.error || "Scan failed");
      }
      const data = await res.json();
      toast.success(
        `Found ${data.count ?? 0} new mentions for ${brands.find((b) => b.id === currentBrandId)?.name ?? "brand"}`
      );
      await fetchCitations();
      await fetchBrands(); // refresh brand's lastScanned
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setIsScanning(false);
    }
  }

  // Add brand
  async function handleAddBrand() {
    const name = newBrandName.trim();
    if (!name || !sites.length) return;
    setIsAddingBrand(true);
    try {
      const res = await fetch("/api/citations/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          siteId: sites[0].id,
          userId: user?.id,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Brand \"${name}\" added`);
      setBrandDialogOpen(false);
      setNewBrandName("");
      await fetchBrands();
    } catch {
      toast.error("Failed to add brand");
    } finally {
      setIsAddingBrand(false);
    }
  }

  // Mark as reviewed
  async function handleMarkReviewed(citationId: string) {
    setActionLoading(citationId);
    try {
      const res = await fetch(`/api/citations/${citationId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) throw new Error();
      setCitations((prev) =>
        prev.map((c) =>
          c.id === citationId
            ? { ...c, status: "reviewed" as CitationStatus }
            : c
        )
      );
      toast.success("Citation marked as reviewed");
    } catch {
      toast.error("Failed to update citation");
    } finally {
      setActionLoading(null);
    }
  }

  // Dismiss
  async function handleDismiss(citationId: string) {
    setActionLoading(citationId);
    try {
      const res = await fetch(`/api/citations/${citationId}/dismiss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) throw new Error();
      setCitations((prev) =>
        prev.map((c) =>
          c.id === citationId
            ? { ...c, status: "dismissed" as CitationStatus }
            : c
        )
      );
      toast.success("Citation dismissed");
    } catch {
      toast.error("Failed to dismiss citation");
    } finally {
      setActionLoading(null);
    }
  }

  // Filtered + sorted citations
  const filteredCitations = useMemo(() => {
    let list = [...citations];
    if (filterStatus !== "all") {
      list = list.filter((c) => c.status === filterStatus);
    }
    if (filterSource !== "all") {
      list = list.filter((c) => c.sourceType === filterSource);
    }
    if (unlinkedOnly) {
      list = list.filter((c) => !c.hasBacklink);
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "opportunity":
          return b.opportunityScore - a.opportunityScore;
        case "newest":
          return (
            new Date(b.discoveredAt).getTime() -
            new Date(a.discoveredAt).getTime()
          );
        case "authority":
          return b.authorityScore - a.authorityScore;
        default:
          return 0;
      }
    });
    return list;
  }, [citations, filterStatus, filterSource, unlinkedOnly, sortBy]);

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: citations.length };
    for (const c of citations) {
      counts[c.status] = (counts[c.status] ?? 0) + 1;
    }
    return counts;
  }, [citations]);

  // Stat card data
  const statCards: StatCardData[] = [
    {
      label: "Total Mentions",
      value: stats.total,
      icon: TrendingUp,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-100 dark:bg-teal-900/30",
      ring: "ring-teal-500/20",
    },
    {
      label: "Unlinked Mentions",
      value: stats.unlinked,
      icon: AlertCircle,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-100 dark:bg-rose-900/30",
      ring: "ring-rose-500/20",
      sub: "opportunity to convert",
    },
    {
      label: "Linked",
      value: stats.linked,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      ring: "ring-emerald-500/20",
      sub: "backlinks earned",
    },
    {
      label: "Avg. Opportunity Score",
      value: stats.avgOpportunity,
      icon: Star,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/30",
      ring: "ring-amber-500/20",
      sub: "across all mentions",
    },
  ];

  // ─── No Sites Setup Prompt ───
  if (sites.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Citations</h2>
          <p className="text-muted-foreground mt-1">
            Track who&apos;s talking about your brand
          </p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <Radar className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="text-lg font-semibold mb-1">Set up your site first</h4>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Add and crawl a website to start tracking brand citations and
              finding backlink opportunities.
            </p>
            <Button
              onClick={() => useAppStore.getState().setActiveView("sites")}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            >
              <Globe className="w-4 h-4 mr-2" />
              Add Your First Site
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── No Brands Empty State ───
  if (brands.length === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Citations</h2>
            <p className="text-muted-foreground mt-1">
              Track who&apos;s talking about your brand
            </p>
          </div>
        </div>

        {/* Empty state */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <Radar className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="text-lg font-semibold mb-1">No citations found</h4>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Add a brand to track and scan for mentions across the web.
            </p>

            {/* Inline brand add */}
            <div className="flex items-center gap-2 w-full max-w-sm">
              <Input
                placeholder="Brand name (e.g. LinkForge)"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setBrandDialogOpen(true);
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={() => setBrandDialogOpen(true)}
                disabled={!newBrandName.trim()}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Track Brand
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              We&apos;ll suggest the name from your first site: {sites[0]?.name}
            </p>
          </CardContent>
        </Card>

        {/* Add Brand Dialog */}
        <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Track a New Brand</DialogTitle>
              <DialogDescription>
                We&apos;ll scan the web for mentions of this brand and find
                backlink opportunities.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                Brand Name
              </label>
              <Input
                placeholder="e.g. LinkForge"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddBrand();
                }}
              />
              {sites.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Suggestion: {sites[0].name}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBrandDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddBrand}
                disabled={!newBrandName.trim() || isAddingBrand}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                {isAddingBrand && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                <Plus className="w-4 h-4 mr-1.5" />
                Track Brand
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── Main Citations Dashboard ───
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Citations</h2>
          <p className="text-muted-foreground mt-1">
            Track who&apos;s talking about your brand
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Brand Selector */}
          {brands.length > 1 && (
            <Select
              value={currentBrandId}
              onValueChange={setSelectedBrandId}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Add Brand Button */}
          <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Brand
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Track a New Brand</DialogTitle>
                <DialogDescription>
                  We&apos;ll scan the web for mentions of this brand and find
                  backlink opportunities.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <label className="text-sm font-medium mb-2 block">
                  Brand Name
                </label>
                <Input
                  placeholder="e.g. LinkForge"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddBrand();
                  }}
                />
                {sites.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Suggestion: {sites[0].name}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setBrandDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddBrand}
                  disabled={!newBrandName.trim() || isAddingBrand}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                >
                  {isAddingBrand && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  <Plus className="w-4 h-4 mr-1.5" />
                  Track Brand
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Scan Button */}
          <Button
            size="sm"
            onClick={handleScan}
            disabled={isScanning || !currentBrandId}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
          >
            {isScanning ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Radar className="w-3.5 h-3.5 mr-1.5" />
            )}
            Scan for Mentions
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((data, i) => (
            <motion.div
              key={data.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <StatCard data={data} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Opportunity Score Bar (when we have data) */}
      {!isLoading && stats.total > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Opportunity Score</span>
              <span className="text-sm font-mono text-emerald-600 dark:text-emerald-400">
                {stats.avgOpportunity}%
              </span>
            </div>
            <Progress value={stats.avgOpportunity} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col gap-4">
        {/* Status Tabs + Source Filter + Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Tabs
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as FilterStatus)}
          >
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="all">
                All
                {statusCounts.all > 0 && (
                  <span className="ml-1.5 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                    {statusCounts.all}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="new">
                New
                {(statusCounts.new ?? 0) > 0 && (
                  <span className="ml-1.5 text-[10px] bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 px-1.5 py-0.5 rounded-full">
                    {statusCounts.new}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
              <TabsTrigger value="outreach_sent">Outreach</TabsTrigger>
              <TabsTrigger value="converted">Converted</TabsTrigger>
              <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Source type filter */}
            <Select
              value={filterSource}
              onValueChange={(v) => setFilterSource(v as FilterSource)}
            >
              <SelectTrigger className="w-32 h-9">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
                <SelectItem value="news">News</SelectItem>
                <SelectItem value="forum">Forum</SelectItem>
                <SelectItem value="reddit">Reddit</SelectItem>
                <SelectItem value="social">Social</SelectItem>
              </SelectContent>
            </Select>

            {/* Unlinked Only toggle */}
            <Button
              variant={unlinkedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setUnlinkedOnly(!unlinkedOnly)}
              className={cn(
                "h-9",
                unlinkedOnly &&
                  "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border-rose-200 dark:border-rose-800"
              )}
            >
              {unlinkedOnly ? (
                <Eye className="w-3.5 h-3.5 mr-1.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 mr-1.5" />
              )}
              Unlinked Only
            </Button>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortBy)}
            >
              <SelectTrigger className="w-40 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opportunity">
                  Highest Opportunity
                </SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="authority">Authority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Citations List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <CitationRowSkeleton key={i} />
          ))}
        </div>
      ) : filteredCitations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="text-lg font-semibold mb-1">No citations found</h4>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              {citations.length === 0
                ? "Run a scan to find brand mentions across the web."
                : "No citations match the current filters."}
            </p>
            {citations.length === 0 && (
              <Button
                onClick={handleScan}
                disabled={isScanning}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                {isScanning ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Radar className="w-4 h-4 mr-2" />
                )}
                Scan for Mentions
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-22rem)]">
          <div className="space-y-3 pr-4">
            <AnimatePresence>
              {filteredCitations.map((citation, i) => {
                const sourceConfig =
                  SOURCE_TYPE_CONFIG[citation.sourceType] ??
                  SOURCE_TYPE_CONFIG.other;
                const SourceIcon = sourceConfig.icon;

                return (
                  <motion.div
                    key={citation.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          {/* Left: Source info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              {/* Source type icon */}
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                  sourceConfig.bg
                                )}
                              >
                                <SourceIcon
                                  className={cn(
                                    "w-4 h-4",
                                    sourceConfig.color
                                  )}
                                />
                              </div>
                              {/* Title + URL */}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium leading-snug">
                                  {citation.title || "Untitled"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                  {citation.hostName || citation.url}
                                </p>
                              </div>
                            </div>

                            {/* Snippet */}
                            {citation.snippet && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed ml-11">
                                {citation.snippet}
                              </p>
                            )}

                            {/* Scores row */}
                            <div className="flex items-center gap-1.5 mt-2 ml-11 flex-wrap">
                              <ScoreBadge
                                label="Auth"
                                value={citation.authorityScore}
                                variant="authority"
                              />
                              <ScoreBadge
                                label="Rel"
                                value={citation.relevanceScore}
                                variant="relevance"
                              />
                              <ScoreBadge
                                label="Opp"
                                value={citation.opportunityScore}
                                variant="opportunity"
                              />
                              <SentimentDot sentiment={citation.sentiment} />
                            </div>
                          </div>

                          {/* Right: Badges + Actions */}
                          <div className="flex items-center gap-2 lg:shrink-0 flex-wrap">
                            {/* Backlink status */}
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px]",
                                citation.hasBacklink
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                              )}
                            >
                              {citation.hasBacklink ? "Linked" : "Unlinked"}
                            </Badge>

                            {/* Status */}
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px]",
                                getStatusStyle(citation.status)
                              )}
                            >
                              {getStatusLabel(citation.status)}
                            </Badge>

                            <Separator
                              orientation="vertical"
                              className="h-6 mx-1 hidden sm:block"
                            />

                            {/* Action buttons */}
                            <div className="flex items-center gap-1">
                              {citation.status === "new" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                                  onClick={() =>
                                    handleMarkReviewed(citation.id)
                                  }
                                  disabled={actionLoading === citation.id}
                                  aria-label="Mark as reviewed"
                                >
                                  {actionLoading === citation.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                              {citation.status !== "dismissed" &&
                                citation.status !== "converted" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                                    onClick={() =>
                                      handleDismiss(citation.id)
                                    }
                                    disabled={actionLoading === citation.id}
                                    aria-label="Dismiss citation"
                                  >
                                    {actionLoading === citation.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <EyeOff className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
                                onClick={() =>
                                  window.open(citation.url, "_blank")
                                }
                                aria-label="Open citation URL"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
