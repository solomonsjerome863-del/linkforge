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
  Search,
  UserCog,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { PlanType } from "@/lib/types";

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

interface ManagedUser {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  subscriptionStatus: string | null;
  subscriptionEndsAt: string | null;
  usageLinks: number;
  usageQueries: number;
  createdAt: string;
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
  const adminHeaders = { "x-admin-email": user?.email || "" };
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscriber management state
  const [userSearch, setUserSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<ManagedUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searched, setSearched] = useState(false);

  // Plan change dialog
  const [planDialogUser, setPlanDialogUser] = useState<ManagedUser | null>(null);
  const [newPlan, setNewPlan] = useState<string>("");
  const [planChangeReason, setPlanChangeReason] = useState("");
  const [changingPlan, setChangingPlan] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/stats", {
      headers: adminHeaders,
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

  // Search users
  async function handleSearchUsers() {
    if (!userSearch.trim()) return;
    setSearchingUsers(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch.trim())}&limit=50`, {
        headers: adminHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setUserSearchResults(data.users);
      }
    } catch {
      toast.error("Failed to search users");
    } finally {
      setSearchingUsers(false);
    }
  }

  // Open plan change dialog
  function openPlanDialog(u: ManagedUser) {
    setPlanDialogUser(u);
    setNewPlan(u.plan);
    setPlanChangeReason("");
  }

  // Apply plan change
  async function handleApplyPlanChange() {
    if (!planDialogUser || !newPlan) return;
    setChangingPlan(true);
    try {
      const res = await fetch("/api/admin/manage-plan", {
        method: "POST",
        headers: { ...adminHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: planDialogUser.id,
          plan: newPlan,
          reason: planChangeReason || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update plan");
      }
      const data = await res.json();
      toast.success(
        `Plan updated: ${data.previousPlan} → ${data.user.plan}`
      );
      setPlanDialogUser(null);

      // Refresh search results
      if (searched) {
        const refreshRes = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch.trim())}&limit=50`, {
          headers: adminHeaders,
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setUserSearchResults(refreshData.users);
        }
      }

      // Refresh stats
      const statsRes = await fetch("/api/admin/stats", { headers: adminHeaders });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update plan");
    } finally {
      setChangingPlan(false);
    }
  }

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
                    { plan: "Starter (Free)", count: stats?.planBreakdown.starter ?? 0, total: stats?.totalUsers ?? 1, icon: Zap, color: "bg-muted-foreground" },
                    { plan: "Pro ($49/mo)", count: stats?.planBreakdown.pro ?? 0, total: stats?.totalUsers ?? 1, icon: Crown, color: "bg-orange-500" },
                    { plan: "Business ($149/mo)", count: stats?.planBreakdown.business ?? 0, total: stats?.totalUsers ?? 1, icon: Building2, color: "bg-teal-500" },
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
                          <div className={cn("h-full rounded-full transition-all duration-500", item.color)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Subscription Status</CardTitle>
              <CardDescription>Current subscriber health</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-20 rounded-lg" />))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Active", count: stats?.statusBreakdown.active ?? 0, color: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50", textColor: "text-emerald-700 dark:text-emerald-400" },
                    { label: "On Trial", count: stats?.statusBreakdown.on_trial ?? 0, color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50", textColor: "text-blue-700 dark:text-blue-400" },
                    { label: "Cancelled", count: stats?.statusBreakdown.cancelled ?? 0, color: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50", textColor: "text-rose-700 dark:text-rose-400" },
                    { label: "Expired", count: stats?.statusBreakdown.expired ?? 0, color: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50", textColor: "text-amber-700 dark:text-amber-400" },
                  ].map((s) => (
                    <div key={s.label} className={cn("rounded-lg border p-3 text-center", s.color)}>
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
                    <div key={day.date} className="flex-1 group relative" title={`${day.date}: ${day.count} signups`}>
                      <div className="w-full bg-orange-500/80 hover:bg-orange-500 rounded-t transition-colors cursor-pointer min-h-[4px]" style={{ height: `${height}%` }} />
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

      {/* Subscriber Management */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCog className="w-4 h-4" />
                  Subscriber Management
                </CardTitle>
                <CardDescription className="mt-1">Search users and manually change plans for disputes or adjustments</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchUsers()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearchUsers} disabled={searchingUsers || !userSearch.trim()}>
                {searchingUsers ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span className="ml-2 hidden sm:inline">Search</span>
              </Button>
            </div>

            {/* Search results */}
            {searched && (
              <div className="border rounded-lg overflow-hidden">
                {searchingUsers ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : userSearchResults.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No users found matching &quot;{userSearch}&quot;</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-96 overflow-y-auto">
                    {userSearchResults.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{u.name || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <PlanBadge plan={u.plan} />
                          <div className="flex items-center gap-1">
                            <StatusIcon status={u.subscriptionStatus} />
                            <span className="text-xs capitalize hidden sm:inline">{u.subscriptionStatus || "Free"}</span>
                          </div>
                          <span className="text-xs text-muted-foreground hidden md:inline">
                            {u.usageLinks} links
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 text-xs"
                          onClick={() => openPlanDialog(u)}
                        >
                          <ChevronDown className="w-3 h-3 mr-1" />
                          Change
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {userSearchResults.length > 0 && (
                  <div className="px-3 py-2 bg-muted/30 border-t text-xs text-muted-foreground">
                    {userSearchResults.length} user{userSearchResults.length !== 1 ? "s" : ""} found
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Users Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
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
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">No users yet</td>
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
                        <td className="py-2.5 hidden sm:table-cell"><PlanBadge plan={u.plan} /></td>
                        <td className="py-2.5 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <StatusIcon status={u.subscriptionStatus} />
                            <span className="text-xs capitalize">{u.subscriptionStatus || "Free"}</span>
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

      {/* Plan Change Dialog */}
      <Dialog open={!!planDialogUser} onOpenChange={(open) => !open && setPlanDialogUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
            <DialogDescription>
              Update {planDialogUser?.name || planDialogUser?.email || "this user"}&apos;s subscription plan.
              Use this for dispute resolution, comped accounts, or manual adjustments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {planDialogUser && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{planDialogUser.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{planDialogUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">Current plan:</span>
                  <PlanBadge plan={planDialogUser.plan} />
                  <span className="text-xs text-muted-foreground capitalize">
                    ({planDialogUser.subscriptionStatus || "free"})
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">New Plan</label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5" /> Starter (Free)
                    </div>
                  </SelectItem>
                  <SelectItem value="pro">
                    <div className="flex items-center gap-2">
                      <Crown className="w-3.5 h-3.5" /> Pro ($49/mo)
                    </div>
                  </SelectItem>
                  <SelectItem value="business">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" /> Business ($149/mo)
                    </div>
                  </SelectItem>
                  <SelectItem value="enterprise">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5" /> Enterprise
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Input
                placeholder="e.g., Dispute resolution, comped account, manual upgrade..."
                value={planChangeReason}
                onChange={(e) => setPlanChangeReason(e.target.value)}
              />
            </div>

            {planDialogUser && newPlan === "starter" && planDialogUser.plan !== "starter" && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-lg">
                <p className="text-sm text-rose-700 dark:text-rose-400 font-medium">
                  ⚠️ Downgrading to Starter
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  This will remove all subscription data. The user will lose access to paid features immediately.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setPlanDialogUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleApplyPlanChange}
              disabled={changingPlan || newPlan === planDialogUser?.plan}
              className={cn(
                newPlan === "starter" && planDialogUser?.plan !== "starter"
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              )}
            >
              {changingPlan && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {newPlan === "starter" && planDialogUser?.plan !== "starter"
                ? "Remove Subscription"
                : newPlan !== planDialogUser?.plan
                  ? `Change to ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)}`
                  : "No Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
