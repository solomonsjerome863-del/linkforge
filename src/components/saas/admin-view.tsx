"use client";

import { useState, useEffect, useCallback } from "react";
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
  Trash2,
  UserPlus,
  Filter,
  AlertTriangle,
  RotateCcw,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ─── Types ─── */

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
  dailySignups?: Array<{ date: string; count: number }>;
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

type PlanFilter = "all" | "starter" | "pro" | "business" | "enterprise";

const PLAN_LABELS: Record<string, { label: string; price: string; icon: typeof Crown; color: string }> = {
  starter: { label: "Starter", price: "Free", icon: Zap, color: "bg-muted-foreground" },
  pro: { label: "Pro", price: "R825/mo", icon: Crown, color: "bg-orange-500" },
  business: { label: "Business", price: "R2,455/mo", icon: Building2, color: "bg-teal-500" },
  enterprise: { label: "Enterprise", price: "Custom", icon: ShieldCheck, color: "bg-amber-500" },
};

/* ─── Shared Components ─── */

function StatCard({ title, value, subtitle, icon: Icon, color, loading }: {
  title: string; value: string; subtitle?: string;
  icon: React.ElementType; color: string; loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? <Skeleton className="h-8 w-24" /> : <p className="text-3xl font-bold tracking-tight">{value}</p>}
            {subtitle && !loading && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {loading && <Skeleton className="h-3 w-32 mt-1" />}
          </div>
          <div className={cn("p-2.5 rounded-lg", color)}><Icon className="w-5 h-5" /></div>
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
    case "active": case "on_trial": return <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    case "cancelled": return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
    case "expired": case "unpaid": return <Clock className="w-3.5 h-3.5 text-amber-500" />;
    default: return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" });
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

/* ─── Quick Actions Dropdown ─── */
function UserActionsMenu({
  user,
  adminHeaders,
  isLoading,
  onChangePlan,
  onResetUsage,
  onUpdateStatus,
  onOpenPlanDialog,
  onOpenDeleteDialog,
}: {
  user: ManagedUser;
  adminHeaders: Record<string, string>;
  isLoading: boolean;
  onChangePlan: (userId: string, plan: string) => void;
  onResetUsage: (userId: string) => void;
  onUpdateStatus: (userId: string, status: string) => void;
  onOpenPlanDialog: (user: ManagedUser) => void;
  onOpenDeleteDialog: (user: ManagedUser) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onOpenPlanDialog(user)}>
          <UserCog className="w-4 h-4 mr-2" />
          Change Plan...
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChangePlan(user.id, "pro")} disabled={user.plan === "pro"}>
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Pro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChangePlan(user.id, "business")} disabled={user.plan === "business"}>
          <Building2 className="w-4 h-4 mr-2" />
          Upgrade to Business
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChangePlan(user.id, "starter")} disabled={user.plan === "starter"}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Downgrade to Starter
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onResetUsage(user.id)}>
          <Zap className="w-4 h-4 mr-2" />
          Reset Usage
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.subscriptionStatus !== "active" && user.plan !== "starter" && (
          <DropdownMenuItem onClick={() => onUpdateStatus(user.id, "active")}>
            <BadgeCheck className="w-4 h-4 mr-2" />
            Set Active
          </DropdownMenuItem>
        )}
        {user.subscriptionStatus !== "paused" && user.plan !== "starter" && (
          <DropdownMenuItem onClick={() => onUpdateStatus(user.id, "paused")}>
            <Clock className="w-4 h-4 mr-2" />
            Pause
          </DropdownMenuItem>
        )}
        {user.subscriptionStatus !== "cancelled" && user.plan !== "starter" && (
          <DropdownMenuItem onClick={() => onUpdateStatus(user.id, "cancelled")}>
            <XCircle className="w-4 h-4 mr-2" />
            Cancel
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onOpenDeleteDialog(user)}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete User...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Main Admin View ─── */

export function AdminView() {
  const user = useAppStore((s) => s.user);
  const adminHeaders = { "x-admin-email": user?.email || "" };
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User management state
  const [userSearch, setUserSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<ManagedUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searched, setSearched] = useState(false);
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [loadingAll, setLoadingAll] = useState(false);

  // Batch selection
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [batchPlan, setBatchPlan] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);

  // Plan change dialog
  const [planDialogUser, setPlanDialogUser] = useState<ManagedUser | null>(null);
  const [newPlan, setNewPlan] = useState<string>("");
  const [planChangeReason, setPlanChangeReason] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [changingPlan, setChangingPlan] = useState(false);

  // Delete dialog
  const [deleteDialogUser, setDeleteDialogUser] = useState<ManagedUser | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");

  // Quick action loading
  const [quickActionLoading, setQuickActionLoading] = useState<Record<string, boolean>>({});

  /* ─── Fetch stats ─── */
  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats", { headers: adminHeaders });
    if (res.status === 403) { setError("forbidden"); return null; }
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  }, [adminHeaders]);

  useEffect(() => {
    let cancelled = false;
    fetchStats()
      .then((data) => { if (data && !cancelled) { setStats(data); setError(null); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [fetchStats]);

  /* ─── Refresh everything ─── */
  const refreshAll = useCallback(async () => {
    const statsData = await fetchStats();
    if (statsData) setStats(statsData);
    if (searched) {
      const params = new URLSearchParams();
      params.set("search", userSearch.trim());
      params.set("limit", "50");
      if (planFilter !== "all") params.set("plan", planFilter);
      const res = await fetch(`/api/admin/users?${params}`, { headers: adminHeaders });
      if (res.ok) { const d = await res.json(); setUserSearchResults(d.users); }
    }
  }, [fetchStats, searched, userSearch, planFilter, adminHeaders]);

  /* ─── Search / Load users ─── */
  async function handleSearchUsers() {
    if (!userSearch.trim() && !searched) return;
    setSearchingUsers(true);
    setSearched(true);
    setSelectedUserIds(new Set());
    try {
      const params = new URLSearchParams();
      if (userSearch.trim()) params.set("search", userSearch.trim());
      if (planFilter !== "all") params.set("plan", planFilter);
      params.set("limit", "100");
      const res = await fetch(`/api/admin/users?${params}`, { headers: adminHeaders });
      if (res.ok) { const data = await res.json(); setUserSearchResults(data.users); }
    } catch { toast.error("Failed to search users"); }
    finally { setSearchingUsers(false); }
  }

  async function handleLoadAll() {
    setLoadingAll(true);
    setSearched(true);
    setUserSearch("");
    setSelectedUserIds(new Set());
    try {
      const params = new URLSearchParams();
      if (planFilter !== "all") params.set("plan", planFilter);
      params.set("limit", "100");
      const res = await fetch(`/api/admin/users?${params}`, { headers: adminHeaders });
      if (res.ok) { const data = await res.json(); setUserSearchResults(data.users); }
    } catch { toast.error("Failed to load users"); }
    finally { setLoadingAll(false); }
  }

  /* ─── Quick actions ─── */
  async function handleQuickChangePlan(userId: string, plan: string) {
    setQuickActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch("/api/admin/manage-plan", {
        method: "POST",
        headers: { ...adminHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Failed"); }
      const data = await res.json();
      toast.success(`${data.previousPlan} → ${data.user.plan} for ${data.user.email}`);
      await refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change plan");
    } finally {
      setQuickActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  }

  async function handleResetUsage(userId: string) {
    setQuickActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch("/api/admin/reset-usage", {
        method: "POST",
        headers: { ...adminHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to reset");
      toast.success("Usage counters reset to 0");
      await refreshAll();
    } catch {
      toast.error("Failed to reset usage");
    } finally {
      setQuickActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  }

  async function handleUpdateStatus(userId: string, status: string) {
    setQuickActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch("/api/admin/update-subscription-status", {
        method: "POST",
        headers: { ...adminHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(`Subscription set to ${status}`);
      await refreshAll();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setQuickActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  }

  /* ─── Batch plan change ─── */
  async function handleBatchPlanChange() {
    if (selectedUserIds.size === 0 || !batchPlan) return;
    setBatchLoading(true);
    try {
      const res = await fetch("/api/admin/bulk-manage-plan", {
        method: "POST",
        headers: { ...adminHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: Array.from(selectedUserIds),
          plan: batchPlan,
          reason: "Admin batch change",
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Batch change failed"); }
      const data = await res.json();
      toast.success(`Updated ${data.updatedCount} users to ${PLAN_LABELS[data.plan]?.label || data.plan} plan`);
      setSelectedUserIds(new Set());
      setBatchPlan("");
      await refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Batch change failed");
    } finally {
      setBatchLoading(false);
    }
  }

  /* ─── Checkbox helpers ─── */
  function toggleUserSelect(userId: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedUserIds.size === filteredResults.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredResults.map((u) => u.id)));
    }
  }

  /* ─── Plan change dialog ─── */
  function openPlanDialog(u: ManagedUser) {
    setPlanDialogUser(u);
    setNewPlan(u.plan);
    setPlanChangeReason("");
    setCustomEndDate("");
  }

  async function handleApplyPlanChange() {
    if (!planDialogUser || !newPlan) return;
    setChangingPlan(true);
    try {
      const body: Record<string, unknown> = {
        userId: planDialogUser.id,
        plan: newPlan,
        reason: planChangeReason || undefined,
      };
      if (customEndDate && newPlan !== "starter") body.subscriptionEndsAt = new Date(customEndDate).toISOString();
      const res = await fetch("/api/admin/manage-plan", {
        method: "POST",
        headers: { ...adminHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed to update plan"); }
      const data = await res.json();
      toast.success(`Plan updated: ${data.previousPlan} → ${data.user.plan}`);
      setPlanDialogUser(null);
      await refreshAll();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update plan"); }
    finally { setChangingPlan(false); }
  }

  /* ─── Delete user ─── */
  function openDeleteDialog(u: ManagedUser) {
    setDeleteDialogUser(u);
    setDeleteConfirmEmail("");
  }

  async function handleDeleteUser() {
    if (!deleteDialogUser) return;
    if (deleteConfirmEmail !== deleteDialogUser.email) {
      toast.error("Email doesn't match — type it exactly to confirm");
      return;
    }
    setDeletingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteDialogUser.id}`, {
        method: "DELETE",
        headers: adminHeaders,
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed to delete"); }
      toast.success(`User ${deleteDialogUser.email} deleted`);
      setDeleteDialogUser(null);
      await refreshAll();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete"); }
    finally { setDeletingUser(false); }
  }

  /* ─── Filter users locally by plan ─── */
  const filteredResults = planFilter === "all"
    ? userSearchResults
    : userSearchResults.filter((u) => u.plan === planFilter);

  const isAllSelected = filteredResults.length > 0 && selectedUserIds.size === filteredResults.length;
  const isSomeSelected = selectedUserIds.size > 0 && !isAllSelected;

  /* ─── Error states ─── */
  if (error === "forbidden") {
    return (
      <div className="space-y-6">
        <div><h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2><p className="text-muted-foreground mt-1">Back office analytics and subscriber management.</p></div>
        <Card className="border-destructive/50"><CardContent className="p-8 text-center space-y-3"><ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto" /><p className="text-lg font-medium">Access Denied</p><p className="text-sm text-muted-foreground max-w-sm mx-auto">This area is restricted to administrators only.</p></CardContent></Card>
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-6">
        <div><h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2><p className="text-muted-foreground mt-1">Back office analytics and subscriber management.</p></div>
        <Card className="border-destructive/50"><CardContent className="p-6 text-center"><p className="text-destructive font-medium">Failed to load admin stats</p><p className="text-sm text-muted-foreground mt-1">{error}</p></CardContent></Card>
      </div>
    );
  }

  const totalPaid = (stats?.planBreakdown.pro || 0) + (stats?.planBreakdown.business || 0) + (stats?.planBreakdown.enterprise || 0);
  const conversionRate = stats?.totalUsers ? ((totalPaid / stats.totalUsers) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2><p className="text-muted-foreground mt-1">Subscriber metrics, revenue, and user management.</p></div>
        <Badge variant="outline" className="hidden sm:flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" />Live</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <StatCard title="Total Users" value={loading ? "—" : String(stats?.totalUsers ?? 0)} subtitle={`${totalPaid} paying`} icon={Users} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" loading={loading} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatCard title="Monthly Revenue" value={loading ? "—" : `R${stats?.mrr ?? 0}`} subtitle="MRR (estimated)" icon={DollarSign} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" loading={loading} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard title="Active Sites" value={loading ? "—" : String(stats?.totalSites ?? 0)} subtitle={`${stats?.totalSuggestions ?? 0} suggestions`} icon={Globe} color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" loading={loading} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard title="Conversion" value={loading ? "—" : `${conversionRate}%`} subtitle="Free → Paid" icon={TrendingUp} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" loading={loading} />
        </motion.div>
      </div>

      {/* Plan Distribution + Subscription Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card><CardHeader className="pb-3"><CardTitle className="text-base">Plan Distribution</CardTitle><CardDescription>Users by subscription plan</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {loading ? <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div> : (
              <>
                {Object.entries(PLAN_LABELS).map(([key, cfg]) => {
                  const count = stats?.planBreakdown[key] ?? 0;
                  const pct = ((count / (stats?.totalUsers ?? 1)) * 100).toFixed(0);
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2"><cfg.icon className="w-4 h-4 text-muted-foreground" /><span>{cfg.label} ({cfg.price})</span></div>
                        <span className="font-medium">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={cn("h-full rounded-full transition-all duration-500", cfg.color)} style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </>
            )}
          </CardContent></Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card><CardHeader className="pb-3"><CardTitle className="text-base">Subscription Status</CardTitle><CardDescription>Current subscriber health</CardDescription></CardHeader>
          <CardContent>
            {loading ? <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div> : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Active", count: stats?.statusBreakdown.active ?? 0, color: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50", textColor: "text-emerald-700 dark:text-emerald-400" },
                  { label: "On Trial", count: stats?.statusBreakdown.on_trial ?? 0, color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50", textColor: "text-blue-700 dark:text-blue-400" },
                  { label: "Cancelled", count: stats?.statusBreakdown.cancelled ?? 0, color: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50", textColor: "text-rose-700 dark:text-rose-400" },
                  { label: "Expired", count: stats?.statusBreakdown.expired ?? 0, color: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50", textColor: "text-amber-700 dark:text-amber-400" },
                ].map((s) => (
                  <div key={s.label} className={cn("rounded-lg border p-3 text-center", s.color)}><p className={cn("text-2xl font-bold", s.textColor)}>{s.count}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
                ))}
              </div>
            )}
          </CardContent></Card>
        </motion.div>
      </div>

      {/* Signup Trend */}
      {stats?.dailySignups && stats.dailySignups.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card><CardHeader className="pb-3"><CardTitle className="text-base">Signups (Last 30 Days)</CardTitle><CardDescription>Daily new user registrations</CardDescription></CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {stats.dailySignups.map((day) => {
                const maxCount = Math.max(...stats.dailySignups.map((d) => d.count), 1);
                const height = Math.max(4, (day.count / maxCount) * 100);
                return <div key={day.date} className="flex-1 group relative" title={`${day.date}: ${day.count} signups`}><div className="w-full bg-orange-500/80 hover:bg-orange-500 rounded-t transition-colors cursor-pointer min-h-[4px]" style={{ height: `${height}%` }} /></div>;
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground"><span>{stats.dailySignups[0]?.date.slice(5)}</span><span>{stats.dailySignups[stats.dailySignups.length - 1]?.date.slice(5)}</span></div>
          </CardContent></Card>
        </motion.div>
      )}

      {/* ═══════════ SUBSCRIBER MANAGEMENT ═══════════ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><UserCog className="w-4 h-4" />User Management</CardTitle>
                <CardDescription className="mt-1">Search, filter, change plans, or remove users</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleLoadAll} disabled={loadingAll}>
                {loadingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                View All Users
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search + Filter Row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by name or email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearchUsers()} className="pl-9" />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as PlanFilter)}>
                  <SelectTrigger className="w-full sm:w-[160px] pl-9"><SelectValue placeholder="Filter by plan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all"><span className="flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5" />All Plans</span></SelectItem>
                    {Object.entries(PLAN_LABELS).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}><span className="flex items-center gap-2"><cfg.icon className="w-3.5 h-3.5" />{cfg.label} ({cfg.price})</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSearchUsers} disabled={searchingUsers || (!userSearch.trim() && !searched)}>
                {searchingUsers ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span className="ml-2 hidden sm:inline">Search</span>
              </Button>
            </div>

            {/* Results */}
            {searched && (
              <div className="border rounded-lg overflow-hidden">
                {/* Batch Action Bar */}
                {selectedUserIds.size > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 border-b border-l-4 border-l-teal-500">
                    <span className="text-sm font-medium whitespace-nowrap">{selectedUserIds.size} user{selectedUserIds.size !== 1 ? "s" : ""} selected</span>
                    <Select value={batchPlan} onValueChange={setBatchPlan}>
                      <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Set plan..." /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PLAN_LABELS).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white" disabled={batchLoading || !batchPlan} onClick={handleBatchPlanChange}>
                      {batchLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <UserPlus className="w-3.5 h-3.5 mr-1" />}
                      Apply Plan
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs ml-auto" onClick={() => setSelectedUserIds(new Set())}>Deselect All</Button>
                  </div>
                )}

                {/* Table Header with Select All */}
                {(searchingUsers || loadingAll) ? (
                  <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : filteredResults.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground"><Users className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">{planFilter !== "all" ? `No ${planFilter} users found` : `No users found matching "${userSearch}"`}</p></div>
                ) : (
                  <div className="divide-y max-h-[480px] overflow-y-auto">
                    {/* Header row */}
                    <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 text-xs text-muted-foreground font-medium sticky top-0 z-10">
                      <Checkbox checked={isAllSelected} ref={(el) => { if (el) el.indeterminate = isSomeSelected; }} onCheckedChange={toggleSelectAll} className="shrink-0" />
                      <span className="flex-1">User</span>
                      <span className="w-20 text-center">Plan</span>
                      <span className="w-16 text-center hidden sm:block">Status</span>
                      <span className="w-20 text-center hidden md:block">Usage</span>
                      <span className="w-8" />
                    </div>
                    {filteredResults.map((u) => (
                      <div key={u.id} className={cn("flex items-center gap-3 px-3 py-3 hover:bg-muted/50 transition-colors", selectedUserIds.has(u.id) && "bg-muted/40")}>
                        <Checkbox checked={selectedUserIds.has(u.id)} onCheckedChange={() => toggleUserSelect(u.id)} className="shrink-0" />
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{u.name || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="w-20 flex justify-center"><PlanBadge plan={u.plan} /></div>
                        <div className="w-16 flex items-center justify-center gap-1 hidden sm:flex">
                          <StatusIcon status={u.subscriptionStatus} />
                          <span className="text-xs capitalize">{u.subscriptionStatus || "Free"}</span>
                        </div>
                        <div className="w-20 text-center text-xs text-muted-foreground hidden md:block">{u.usageLinks}L / {u.usageQueries}Q</div>
                        <div className="w-8 shrink-0">
                          <UserActionsMenu
                            user={u}
                            adminHeaders={adminHeaders}
                            isLoading={!!quickActionLoading[u.id]}
                            onChangePlan={handleQuickChangePlan}
                            onResetUsage={handleResetUsage}
                            onUpdateStatus={handleUpdateStatus}
                            onOpenPlanDialog={openPlanDialog}
                            onOpenDeleteDialog={openDeleteDialog}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {filteredResults.length > 0 && (
                  <div className="px-3 py-2 bg-muted/30 border-t text-xs text-muted-foreground flex items-center justify-between">
                    <span>{filteredResults.length} user{filteredResults.length !== 1 ? "s" : ""}{planFilter !== "all" ? ` on ${PLAN_LABELS[planFilter]?.label} plan` : ""}</span>
                    {searched && <button onClick={handleSearchUsers} className="text-foreground hover:underline">Refresh</button>}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════ RECENT SIGNUPS ═══════════ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Recent Signups</CardTitle><CardDescription>Latest registrations with quick actions</CardDescription></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium hidden sm:table-cell">Plan</th>
                  <th className="pb-2 font-medium hidden md:table-cell">Status</th>
                  <th className="pb-2 font-medium hidden lg:table-cell">Usage</th>
                  <th className="pb-2 font-medium text-right">Joined</th>
                  <th className="pb-2 font-medium text-right w-10"></th>
                </tr></thead>
                <tbody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b last:border-0"><td className="py-2.5"><Skeleton className="h-4 w-40" /></td><td className="py-2.5 hidden sm:table-cell"><Skeleton className="h-5 w-16" /></td><td className="py-2.5 hidden md:table-cell"><Skeleton className="h-4 w-16" /></td><td className="py-2.5 hidden lg:table-cell"><Skeleton className="h-4 w-16" /></td><td className="py-2.5 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td><td className="py-2.5 text-right"><Skeleton className="h-6 w-8 ml-auto" /></td></tr>
                  )) : stats?.recentUsers.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No users yet</td></tr>
                  ) : stats?.recentUsers.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-2.5"><div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><div className="min-w-0"><p className="font-medium truncate">{u.name || "—"}</p><p className="text-xs text-muted-foreground truncate">{u.email}</p></div></div></td>
                      <td className="py-2.5 hidden sm:table-cell"><PlanBadge plan={u.plan} /></td>
                      <td className="py-2.5 hidden md:table-cell"><div className="flex items-center gap-1.5"><StatusIcon status={u.subscriptionStatus} /><span className="text-xs capitalize">{u.subscriptionStatus || "Free"}</span></div></td>
                      <td className="py-2.5 hidden lg:table-cell text-xs text-muted-foreground">—</td>
                      <td className="py-2.5 text-right text-muted-foreground whitespace-nowrap"><div className="flex items-center gap-1 justify-end"><CalendarDays className="w-3 h-3" /><span className="hidden xl:inline">{formatDate(u.createdAt)}</span><span className="xl:hidden">{relativeTime(u.createdAt)}</span></div></td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <UserActionsMenu
                          user={u as ManagedUser}
                          adminHeaders={adminHeaders}
                          isLoading={!!quickActionLoading[u.id]}
                          onChangePlan={handleQuickChangePlan}
                          onResetUsage={handleResetUsage}
                          onUpdateStatus={handleUpdateStatus}
                          onOpenPlanDialog={(fullU) => openPlanDialog(fullU)}
                          onOpenDeleteDialog={openDeleteDialog}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════ PLAN CHANGE DIALOG ═══════════ */}
      <Dialog open={!!planDialogUser} onOpenChange={(open) => !open && setPlanDialogUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
            <DialogDescription>Update {planDialogUser?.name || planDialogUser?.email || "this user"}&apos;s subscription plan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {planDialogUser && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-muted-foreground" /><div><p className="text-sm font-medium">{planDialogUser.name || "—"}</p><p className="text-xs text-muted-foreground">{planDialogUser.email}</p></div></div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">Current:</span><PlanBadge plan={planDialogUser.plan} />
                  <span className="text-xs text-muted-foreground capitalize">({planDialogUser.subscriptionStatus || "free"})</span>
                  {planDialogUser.subscriptionEndsAt && <span className="text-xs text-muted-foreground">until {formatDate(planDialogUser.subscriptionEndsAt)}</span>}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">New Plan</label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PLAN_LABELS).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}><span className="flex items-center gap-2"><cfg.icon className="w-3.5 h-3.5" />{cfg.label} ({cfg.price})</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newPlan !== "starter" && newPlan !== planDialogUser?.plan && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Subscription End Date (optional)</label>
                <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                <p className="text-xs text-muted-foreground">Leave blank for default (1 month from now)</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Input placeholder="e.g., Dispute resolution, comped account..." value={planChangeReason} onChange={(e) => setPlanChangeReason(e.target.value)} />
            </div>
            {planDialogUser && newPlan === "starter" && planDialogUser.plan !== "starter" && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-lg">
                <p className="text-sm text-rose-700 dark:text-rose-400 font-medium">⚠️ Downgrading to Starter</p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">This will remove all subscription data and Paystack billing. The user loses paid features immediately.</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setPlanDialogUser(null)}>Cancel</Button>
            <Button onClick={handleApplyPlanChange} disabled={changingPlan || newPlan === planDialogUser?.plan} className={cn(newPlan === "starter" && planDialogUser?.plan !== "starter" ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white")}>
              {changingPlan && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {newPlan === "starter" && planDialogUser?.plan !== "starter" ? "Remove Subscription" : newPlan !== planDialogUser?.plan ? `Change to ${PLAN_LABELS[newPlan]?.label || newPlan}` : "No Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ DELETE USER DIALOG ═══════════ */}
      <Dialog open={!!deleteDialogUser} onOpenChange={(open) => !open && setDeleteDialogUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600"><AlertTriangle className="w-5 h-5" />Delete User</DialogTitle>
            <DialogDescription>This action is permanent and cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {deleteDialogUser && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">{deleteDialogUser.name || "—"}</p>
                <p className="text-xs text-muted-foreground">{deleteDialogUser.email}</p>
                <div className="flex items-center gap-2 mt-1"><PlanBadge plan={deleteDialogUser.plan} /><span className="text-xs text-muted-foreground capitalize">{deleteDialogUser.subscriptionStatus || "free"}</span></div>
                <p className="text-xs text-rose-700 dark:text-rose-400 mt-2 font-medium">All sites, link suggestions, citations, and data will be permanently deleted.</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-rose-600">{deleteDialogUser?.email}</span> to confirm</label>
              <Input placeholder={deleteDialogUser?.email} value={deleteConfirmEmail} onChange={(e) => setDeleteConfirmEmail(e.target.value)} className={cn(deleteConfirmEmail && deleteConfirmEmail !== deleteDialogUser?.email && "border-rose-500 focus-visible:ring-rose-500")} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialogUser(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={deletingUser || deleteConfirmEmail !== deleteDialogUser?.email}>
              {deletingUser && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-2" />Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
