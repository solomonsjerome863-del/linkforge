"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Search,
  ArrowDownUp,
  AlertTriangle,
  ArrowLeftRight,
  ArrowRightLeft,
  Inbox,
  Hash,
  Type,
  Link2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PageItem {
  id: string;
  url: string;
  title: string;
  wordCount: number;
  status: string;
  headings: string;
  incomingLinks: number;
  outgoingLinks: number;
  isOrphan: boolean;
}

type FilterType = "all" | "orphan" | "linked";
type SortBy = "title" | "wordCount" | "incomingLinks" | "outgoingLinks";

function formatWordCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toLocaleString();
}

function parseHeadings(headingsStr: string): string[] {
  if (!headingsStr) return [];
  try {
    const parsed = JSON.parse(headingsStr);
    if (Array.isArray(parsed)) return parsed.slice(0, 5);
    return [];
  } catch {
    return [];
  }
}

function truncateUrl(url: string, maxLength: number = 60): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + "...";
}

export function PagesView() {
  const user = useAppStore((s) => s.user);
  const sites = useAppStore((s) => s.sites);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortBy>("title");

  const currentSiteId =
    selectedSiteId ?? (sites.length > 0 ? sites[0].id : null);

  useEffect(() => {
    if (!currentSiteId) {
      setIsLoading(false);
      return;
    }
    fetchPages();
  }, [currentSiteId]);

  async function fetchPages() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ siteId: currentSiteId! });
      if (user?.id) params.set("userId", user.id);
      const res = await fetch(`/api/pages?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages);
      } else {
        toast.error("Failed to load pages");
      }
    } catch {
      toast.error("Failed to load pages");
    } finally {
      setIsLoading(false);
    }
  }

  const totalPages = pages.length;
  const orphanPages = pages.filter((p) => p.isOrphan).length;
  const orphanPercentage =
    totalPages > 0 ? Math.round((orphanPages / totalPages) * 100) : 0;
  const totalWords = pages.reduce((sum, p) => sum + p.wordCount, 0);

  const filteredPages = useMemo(() => {
    let list = [...pages];

    // Apply search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) || p.url.toLowerCase().includes(q)
      );
    }

    // Apply type filter
    if (filter === "orphan") {
      list = list.filter((p) => p.isOrphan);
    } else if (filter === "linked") {
      list = list.filter((p) => !p.isOrphan);
    }

    // Apply sort
    list.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "wordCount":
          return b.wordCount - a.wordCount;
        case "incomingLinks":
          return b.incomingLinks - a.incomingLinks;
        case "outgoingLinks":
          return b.outgoingLinks - a.outgoingLinks;
        default:
          return 0;
      }
    });

    return list;
  }, [pages, search, filter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pages</h2>
          <p className="text-muted-foreground mt-1">
            Explore all crawled pages, their content, and link relationships.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pages */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pages</p>
                <p className="text-2xl font-bold">{totalPages}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orphan Pages */}
        <Card
          className={cn(
            orphanPages > 0 &&
              "border-orange-300 dark:border-orange-700/50 bg-orange-50/50 dark:bg-orange-950/20"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  orphanPages > 0
                    ? "bg-rose-100 dark:bg-rose-900/30"
                    : "bg-teal-100 dark:bg-teal-900/30"
                )}
              >
                <AlertTriangle
                  className={cn(
                    "w-5 h-5",
                    orphanPages > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-teal-600 dark:text-teal-400"
                  )}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Orphan Pages</p>
                <div className="flex items-baseline gap-2">
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      orphanPages > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-teal-600 dark:text-teal-400"
                    )}
                  >
                    {orphanPages}
                  </p>
                  {totalPages > 0 && (
                    <span className="text-sm text-muted-foreground">
                      ({orphanPercentage}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Words */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                <Type className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Words</p>
                <p className="text-2xl font-bold">
                  {formatWordCount(totalWords)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as FilterType)}
          >
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pages</SelectItem>
              <SelectItem value="orphan">Orphan Only</SelectItem>
              <SelectItem value="linked">Linked Only</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortBy)}
          >
            <SelectTrigger className="w-44 h-9">
              <ArrowDownUp className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title A–Z</SelectItem>
              <SelectItem value="wordCount">Word Count ↓</SelectItem>
              <SelectItem value="incomingLinks">Incoming Links ↓</SelectItem>
              <SelectItem value="outgoingLinks">Outgoing Links ↓</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pages List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : filteredPages.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-orange-500" />
            </div>
            <h4 className="text-lg font-semibold mb-1">No pages found</h4>
            <p className="text-sm text-muted-foreground max-w-sm">
              {search || filter !== "all"
                ? "No pages match your current search or filter. Try adjusting your criteria."
                : "No pages have been crawled yet for this site. Start a crawl to populate this view."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-22rem)]">
          <div className="space-y-3 pr-4">
            <AnimatePresence>
              {filteredPages.map((page, i) => {
                const headings = parseHeadings(page.headings);
                return (
                  <motion.div
                    key={page.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3">
                          {/* Top row: Title + badges */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-semibold truncate">
                                  {page.title}
                                </h3>
                                {page.isOrphan && (
                                  <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge
                                          variant="secondary"
                                          className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] shrink-0 cursor-help"
                                        >
                                          <AlertTriangle className="w-3 h-3 mr-1" />
                                          Orphan
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        This page has no incoming link
                                        suggestions
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {truncateUrl(page.url)}
                              </p>
                            </div>

                            {/* Word count */}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                              <Type className="w-3.5 h-3.5" />
                              <span>{formatWordCount(page.wordCount)}</span>
                            </div>
                          </div>

                          {/* Headings preview */}
                          {headings.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {headings.map((heading, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="bg-muted/80 text-muted-foreground text-[10px] font-normal"
                                >
                                  <Hash className="w-2.5 h-2.5 mr-1" />
                                  {heading.length > 40
                                    ? heading.substring(0, 40) + "…"
                                    : heading}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Bottom row: link counts */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-xs">
                              <ArrowRightLeft className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              <span className="text-muted-foreground">
                                Incoming:
                              </span>
                              <span
                                className={cn(
                                  "font-medium",
                                  page.incomingLinks > 0
                                    ? "text-teal-600 dark:text-teal-400"
                                    : "text-muted-foreground"
                                )}
                              >
                                {page.incomingLinks}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <Link2 className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                              <span className="text-muted-foreground">
                                Outgoing:
                              </span>
                              <span
                                className={cn(
                                  "font-medium",
                                  page.outgoingLinks > 0
                                    ? "text-orange-600 dark:text-orange-400"
                                    : "text-muted-foreground"
                                )}
                              >
                                {page.outgoingLinks}
                              </span>
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