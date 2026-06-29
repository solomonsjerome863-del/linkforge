"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Link2Icon,
  FileText,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { AnalyticsSnapshot } from "@/lib/types";

// Simulated analytics data shape
interface AnalyticsData {
  totalLinks: number;
  linksTrend: number; // percentage
  pagesIndexed: number;
  orphanPages: number;
  avgLinksPerPage: number;
  dailyLinks: { date: string; count: number }[];
  funnel: { pending: number; approved: number; applied: number };
  topPages: { title: string; incoming: number; outgoing: number }[];
}

function generateMockData(): AnalyticsData {
  const today = new Date();
  const dailyLinks = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      count: Math.floor(Math.random() * 40) + 20,
    };
  });
  const totalLinks = dailyLinks.reduce((s, d) => s + d.count, 0);
  return {
    totalLinks,
    linksTrend: 12.5,
    pagesIndexed: Math.floor(Math.random() * 200) + 80,
    orphanPages: Math.floor(Math.random() * 15) + 3,
    avgLinksPerPage: +(Math.random() * 3 + 2).toFixed(1),
    dailyLinks,
    funnel: {
      pending: Math.floor(Math.random() * 30) + 10,
      approved: Math.floor(Math.random() * 50) + 20,
      applied: Math.floor(Math.random() * 80) + 40,
    },
    topPages: [
      { title: "Ultimate Guide to Internal Linking", incoming: 24, outgoing: 8 },
      { title: "SEO Best Practices 2024", incoming: 18, outgoing: 12 },
      { title: "Content Strategy for Blogs", incoming: 15, outgoing: 6 },
      { title: "Technical SEO Audit Checklist", incoming: 12, outgoing: 9 },
      { title: "How to Fix Orphan Pages", incoming: 9, outgoing: 11 },
    ],
  };
}

export function AnalyticsView() {
  const sites = useAppStore((s) => s.sites);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const setSelectedSiteId = useAppStore((s) => s.setSelectedSiteId);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const currentSiteId =
    selectedSiteId ?? (sites.length > 0 ? sites[0].id : null);

  const isLoading = !data;

  useEffect(() => {
    // Try to fetch real data, fall back to mock
    fetch(`/api/analytics?siteId=${currentSiteId}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((d) => {
        setData(d);
      })
      .catch(() => {
        // Use mock data when API isn't ready
        setData(generateMockData());
      })
      // loading state derived from data being null
  }, [currentSiteId]);

  const maxDailyCount = useMemo(
    () => Math.max(...(data?.dailyLinks.map((d) => d.count) ?? [1])),
    [data]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground mt-1">
            Track your internal linking SEO impact.
          </p>
        </div>
        {sites.length > 1 && (
          <Select value={currentSiteId ?? ""} onValueChange={setSelectedSiteId}>
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

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Internal Links</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-3xl font-bold">{data.totalLinks}</p>
                        <span className="flex items-center text-sm text-teal-600 dark:text-teal-400">
                          <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                          {data.linksTrend}%
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center ring-4 ring-orange-500/20">
                      <Link2Icon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pages Indexed</p>
                      <p className="text-3xl font-bold mt-1">{data.pagesIndexed}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center ring-4 ring-teal-500/20">
                      <FileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Orphan Pages</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-3xl font-bold">{data.orphanPages}</p>
                        <span className="flex items-center text-sm text-rose-600 dark:text-rose-400">
                          <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                          needs attention
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center ring-4 ring-amber-500/20">
                      <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Links/Page</p>
                      <p className="text-3xl font-bold mt-1">{data.avgLinksPerPage}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center ring-4 ring-rose-500/20">
                      <TrendingUp className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Chart + Funnel Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Bar Chart */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Link Health</CardTitle>
                  <CardDescription>Total internal links added over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 h-48">
                    {data.dailyLinks.map((day, i) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          {day.count}
                        </span>
                        <div className="w-full relative" style={{ height: "100%" }}>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{
                              height: `${(day.count / maxDailyCount) * 100}%`,
                            }}
                            transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
                            className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-orange-500 to-amber-400"
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">
                          {day.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Funnel */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base">Suggestions Funnel</CardTitle>
                  <CardDescription>From generated to applied</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col justify-center gap-4">
                  {[
                    { label: "Pending", count: data.funnel.pending, color: "bg-amber-500" },
                    { label: "Approved", count: data.funnel.approved, color: "bg-teal-500" },
                    { label: "Applied", count: data.funnel.applied, color: "bg-orange-500" },
                  ].map((step, i) => (
                    <div key={step.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium">{step.label}</span>
                        <span className="text-sm font-bold">{step.count}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${
                              (step.count / data.funnel.pending) * 100
                            }%`,
                          }}
                          transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                          className={cn("h-3 rounded-full", step.color)}
                        />
                      </div>
                      {i < 2 && (
                        <div className="flex justify-center mt-2 mb-1">
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Top Linked Pages */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Linked Pages</CardTitle>
                <CardDescription>Pages with the most internal links</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-center">Incoming</TableHead>
                      <TableHead className="text-center">Outgoing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topPages.map((page, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium max-w-xs truncate">
                          <span className="flex items-center gap-2">
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            {page.title}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                            {page.incoming}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            {page.outgoing}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : null}
    </div>
  );
}
