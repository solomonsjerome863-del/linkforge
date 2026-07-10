"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  CreditCard,
  Globe,
  Link2,
  DollarSign,
  TrendingUp,
  Crown,
  Building2,
  Zap,
  Loader2,
  Mail,
  CalendarDays,
  BadgeCheck,
  Clock,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface AdminStats {
  totalUsers: number;
  activeSubscribers: number;
  totalSites: number;
  totalSuggestions: number;
  mrr: number;
  planBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    plan: string;
    subscriptionStatus: string | null;
    createdAt: string;
  }>;
  dailySignups: Array<{ date: string; count: number }>;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-3xl font-bold tracking-tight">{value}</p>
            )}
            {subtitle && !loading && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {loading && <Skeleton className="h-3 w-32 mt-1" />}
          </div>
          <div className={cn("p-2.5 rounded-lg", color)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    starter: "bg-muted text-muted-foreground",
    pro: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    business: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return (
    <Badge variant="secondary" className={cn("text-xs", styles[plan] || styles.starter)}>
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </Badge>
  );
}

function StatusIcon({ status }: { status: string | null }) {
  if (!status) return <Zap className="w-3.5 h-3.5 text-muted-foreground" />;
  switch (status) {
    case "active":
    case "on_trial":
      return <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    case "cancelled":
      return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
    case "expired":
    case "unpaid":
      return <Clock className="w-3.5 h-3.5 text-amber-500" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AdminView() {
  const user = useAppStore((s) => s.user);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/stats", {
      headers: { "x-admin-email": user?.email || "" },
    })
      .then((r) => {
        if (r.status === 403) {
          if (!cancelled) {
            setError("forbidden");
            setLoading(false);
          }
          return null;
        }
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data) => {
        if (data && !cancelled) {
          setStats(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  if (error === "forbidden") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-1">Back office analytics and subscriber management.</p>
        </div>
        <Card className="border-destructive/50">
          <CardContent className="p-8 text-center space-y-3">
            <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-lg font-medium">Access Denied</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              This area is restricted to administrators only.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-1">Back office analytics and subscriber management.</p>
        </div>
        <Card className="border-destructive/50">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-medium">Failed to load admin stats</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPaid = (stats?.planBreakdown.pro || 0) + (stats?.planBreakdown.business || 0);
  const conversionRate = stats?.totalUsers
    ? ((totalPaid / stats.totalUsers) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Subscriber metrics, revenue, and user analytics.
          </p>
        </div>
        <Badge variant="outline" className="hidden sm:flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          Live
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <StatCard
            title="Total Users"
            value={loading ? "—" : String(stats?.totalUsers ?? 0)}
            subtitle={`${totalPaid} paying subscribers`}
            icon={Users}
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            loading={loading}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatCard
            title="Monthly Revenue"
            value={loading ? "—" : `$${stats?.mrr ?? 0}`}
            subtitle="MRR (estimated)"
            icon={DollarSign}
            color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            loading={loading}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard
            title="Active Sites"
            value={loading ? "—" : String(stats?.totalSites ?? 0)}
            subtitle={`${stats?.totalSuggestions ?? 0} link suggestions`}
            icon={Globe}
            color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
            loading={loading}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard
            title="Conversion"
            value={loading ? "—" : `${conversionRate}%`}
            subtitle="Free → Paid"
            icon={TrendingUp}
            color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            loading={loading}
          />
        </motion.div>
      </div>

      {/* Plan Distribution + Subscription Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Plan Distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Plan Distribution</CardTitle>
              <CardDescription>Users by subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  {[
                    {
                      plan: "Starter (Free)",
                      count: stats?.planBreakdown.starter ?? 0,
                      total: stats?.totalUsers ?? 1,
                      icon: Zap,
                      color: "bg-muted-foreground",
                    },
                    {
                      plan: "Pro ($49/mo)",
                      count: stats?.planBreakdown.pro ?? 0,
                      total: stats?.totalUsers ?? 1,
                      icon: Crown,
                      color: "bg-orange-500",
                    },
                    {
                      plan: "Business ($149/mo)",
                      count: stats?.planBreakdown.business ?? 0,
                      total: stats?.totalUsers ?? 1,
                      icon: Building2,
                      color: "bg-teal-500",
                    },
                  ].map((item) => {
                    const pct = ((item.count / item.total) * 100).toFixed(0);
                    return (
                      <div key={item.plan} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <item.icon className="w-4 h-4 text-muted-foreground" />
                            <span>{item.plan}</span>
                          </div>
                          <span className="font-medium">{item.count} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", item.color)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Subscription Status</CardTitle>
              <CardDescription>Current subscriber health</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Active",
                      count: stats?.statusBreakdown.active ?? 0,
                      color: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50",
                      textColor: "text-emerald-700 dark:text-emerald-400",
                    },
                    {
                      label: "On Trial",
                      count: stats?.statusBreakdown.on_trial ?? 0,
                      color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50",
                      textColor: "text-blue-700 dark:text-blue-400",
                    },
                    {
                      label: "Cancelled",
                      count: stats?.statusBreakdown.cancelled ?? 0,
                      color: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50",
                      textColor: "text-rose-700 dark:text-rose-400",
                    },
                    {
                      label: "Expired",
                      count: stats?.statusBreakdown.expired ?? 0,
                      color: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50",
                      textColor: "text-amber-700 dark:text-amber-400",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={cn(
                        "rounded-lg border p-3 text-center",
                        s.color
                      )}
                    >
                      <p className={cn("text-2xl font-bold", s.textColor)}>{s.count}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Signup Trend */}
      {stats?.dailySignups && stats.dailySignups.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Signups (Last 30 Days)</CardTitle>
              <CardDescription>Daily new user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-32">
                {stats.dailySignups.map((day) => {
                  const maxCount = Math.max(...stats.dailySignups.map((d) => d.count), 1);
                  const height = Math.max(4, (day.count / maxCount) * 100);
                  return (
                    <div
                      key={day.date}
                      className="flex-1 group relative"
                      title={`${day.date}: ${day.count} signups`}
                    >
                      <div
                        className="w-full bg-orange-500/80 hover:bg-orange-500 rounded-t transition-colors cursor-pointer min-h-[4px]"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{stats.dailySignups[0]?.date.slice(5)}</span>
                <span>{stats.dailySignups[stats.dailySignups.length - 1]?.date.slice(5)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Users Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Signups</CardTitle>
            <CardDescription>Latest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">User</th>
                    <th className="pb-2 font-medium hidden sm:table-cell">Plan</th>
                    <th className="pb-2 font-medium hidden md:table-cell">Status</th>
                    <th className="pb-2 font-medium text-right">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2.5"><Skeleton className="h-4 w-40" /></td>
                        <td className="py-2.5 hidden sm:table-cell"><Skeleton className="h-5 w-16" /></td>
                        <td className="py-2.5 hidden md:table-cell"><Skeleton className="h-4 w-16" /></td>
                        <td className="py-2.5 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      </tr>
                    ))
                  ) : stats?.recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        No users yet
                      </td>
                    </tr>
                  ) : (
                    stats?.recentUsers.map((u) => (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{u.name || "—"}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 hidden sm:table-cell">
                          <PlanBadge plan={u.plan} />
                        </td>
                        <td className="py-2.5 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <StatusIcon status={u.subscriptionStatus} />
                            <span className="text-xs capitalize">
                              {u.subscriptionStatus || "Free"}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1 justify-end">
                            <CalendarDays className="w-3 h-3" />
                            <span className="hidden lg:inline">{formatDate(u.createdAt)}</span>
                            <span className="lg:hidden">{relativeTime(u.createdAt)}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}