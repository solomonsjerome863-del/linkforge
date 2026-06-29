"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Globe,
  ExternalLink,
  Link2Icon,
  FileText,
  Loader2,
  Trash2,
  RefreshCw,
  Eye,
  MoreVertical,
  Webhook,
  ShoppingBag,
  Paintbrush,
  Ghost,
  Code2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Site, Platform, SiteStatus } from "@/lib/types";

const PLATFORM_CONFIG: Record<
  Platform,
  { label: string; icon: React.ElementType; color: string }
> = {
  wordpress: {
    label: "WordPress",
    icon: Webhook,
    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  },
  shopify: {
    label: "Shopify",
    icon: ShoppingBag,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  webflow: {
    label: "Webflow",
    icon: Paintbrush,
    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
  ghost: {
    label: "Ghost",
    icon: Ghost,
    color: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
  },
  custom: {
    label: "Custom",
    icon: Code2,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
};

function getStatusBadge(status: SiteStatus) {
  const styles: Record<SiteStatus, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    crawling:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
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

export function SitesView() {
  const user = useAppStore((s) => s.user);
  const sites = useAppStore((s) => s.sites);
  const setSites = useAppStore((s) => s.setSites);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const setSelectedSiteId = useAppStore((s) => s.setSelectedSiteId);
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [crawlingId, setCrawlingId] = useState<string | null>(null);

  // Add site form
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newPlatform, setNewPlatform] = useState<Platform>("wordpress");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSites();
  }, []);

  async function fetchSites() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sites?userId=${user!.id}`);
      if (res.ok) {
        const data = await res.json();
        setSites(data.sites);
      }
    } catch {
      // empty
    } finally {
      setIsLoading(false);
    }
  }

  function validateUrl(url: string): boolean {
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  }

  function resetForm() {
    setNewName("");
    setNewUrl("");
    setNewPlatform("wordpress");
  }

  async function handleAddSite() {
    if (!newName.trim() || !newUrl.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!validateUrl(newUrl.trim())) {
      toast.error("Please enter a valid URL");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user!.id,
          name: newName.trim(),
          url: newUrl.trim(),
          platform: newPlatform,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSites([...sites, data.site]);
      setAddDialogOpen(false);
      resetForm();
      toast.success(`"${data.site.name}" added successfully`);
    } catch {
      toast.error("Failed to add site");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCrawl(site: Site) {
    setCrawlingId(site.id);
    try {
      const res = await fetch(`/api/sites/${site.id}/crawl`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      toast.success(`Crawling "${site.name}"...`);
      // Optimistic update
      setSites(
        sites.map((s) =>
          s.id === site.id ? { ...s, status: "crawling" as SiteStatus } : s
        )
      );
      // Poll for completion
      const interval = setInterval(async () => {
        try {
          const pollRes = await fetch("/api/sites");
          if (pollRes.ok) {
            const data = await pollRes.json();
            const updated = data.find((s: Site) => s.id === site.id);
            if (updated && updated.status !== "crawling") {
              setSites(data);
              clearInterval(interval);
              setCrawlingId(null);
              if (updated.status === "ready") {
                toast.success(`"${site.name}" crawl complete!`);
              } else if (updated.status === "error") {
                toast.error(`Crawl failed for "${site.name}"`);
              }
            }
          }
        } catch {
          clearInterval(interval);
          setCrawlingId(null);
        }
      }, 3000);
    } catch {
      toast.error("Failed to start crawl");
      setCrawlingId(null);
    }
  }

  async function handleDelete(site: Site) {
    try {
      const res = await fetch(`/api/sites/${site.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setSites(sites.filter((s) => s.id !== site.id));
      toast.success(`"${site.name}" deleted`);
    } catch {
      toast.error("Failed to delete site");
    }
  }

  function handleViewSuggestions(site: Site) {
    setSelectedSiteId(site.id);
    setActiveView("suggestions");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sites</h2>
          <p className="text-muted-foreground mt-1">
            Manage your websites and trigger crawls.
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Site
        </Button>
      </div>

      {/* Sites Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : sites.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-orange-500" />
            </div>
            <h4 className="text-lg font-semibold mb-1">No sites yet</h4>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Add your first website to start analyzing internal links.
            </p>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Site
            </Button>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sites.map((site, i) => {
              const platformCfg = PLATFORM_CONFIG[site.platform];
              const PlatformIcon = platformCfg.icon;
              return (
                <motion.div
                  key={site.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="hover:shadow-md transition-all h-full flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base truncate">
                            {site.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            {site.url}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewSuggestions(site)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Suggestions
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCrawl(site)}
                              disabled={crawlingId === site.id}
                            >
                              <RefreshCw
                                className={cn(
                                  "w-4 h-4 mr-2",
                                  crawlingId === site.id && "animate-spin"
                                )}
                              />
                              {crawlingId === site.id ? "Crawling..." : "Trigger Crawl"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-rose-600 focus:text-rose-600"
                              onClick={() => handleDelete(site)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={cn("text-[10px]", platformCfg.color)}
                          >
                            <PlatformIcon className="w-3 h-3 mr-1" />
                            {platformCfg.label}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={cn("text-[10px]", getStatusBadge(site.status))}
                          >
                            {site.status === "crawling" && (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            )}
                            {site.status.charAt(0).toUpperCase() +
                              site.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {site.pagesCount}/{site.pageLimit}
                          </span>
                          <span className="flex items-center gap-1">
                            <Link2Icon className="w-3.5 h-3.5" />
                            {site.linksCount} links
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <span className="text-xs text-muted-foreground">
                          {site.lastCrawled
                            ? `Crawled ${formatRelativeDate(site.lastCrawled)}`
                            : "Not yet crawled"}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCrawl(site)}
                          disabled={crawlingId === site.id}
                          className="h-7 text-xs"
                        >
                          {crawlingId === site.id ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Crawling
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Crawl Now
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Add Site Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Site</DialogTitle>
            <DialogDescription>
              Enter your website details to start generating link suggestions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="site-name">Site Name</Label>
              <Input
                id="site-name"
                placeholder="My Blog"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-url">URL</Label>
              <Input
                id="site-url"
                placeholder="https://example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                disabled={isSubmitting}
              />
              {newUrl && !validateUrl(newUrl) && (
                <p className="text-xs text-rose-500">Please enter a valid URL</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={newPlatform}
                onValueChange={(v) => setNewPlatform(v as Platform)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(PLATFORM_CONFIG) as [Platform, (typeof PLATFORM_CONFIG)[Platform]][]
                  ).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <cfg.icon className="w-4 h-4" />
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setAddDialogOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSite}
              disabled={
                isSubmitting ||
                !newName.trim() ||
                !newUrl.trim() ||
                !validateUrl(newUrl)
              }
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
