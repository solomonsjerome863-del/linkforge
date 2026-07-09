"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Crown,
  Zap,
  Building2,
  Rocket,
  Check,
  Loader2,
  Save,
  CreditCard,
  CalendarDays,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { useLemonSqueezyCheckout } from "@/lib/use-lemonsqueezy";
import { PLAN_LIMITS, type PlanType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PLANS: {
  type: PlanType;
  name: string;
  price: string;
  period: string;
  icon: React.ElementType;
  features: string[];
  popular?: boolean;
  dark?: boolean;
  checkoutable?: boolean;
}[] = [
  {
    type: "starter",
    name: "Starter",
    price: "Free",
    period: "",
    icon: Zap,
    features: PLAN_LIMITS.starter.features,
  },
  {
    type: "pro",
    name: "Pro",
    price: "$49",
    period: "/mo",
    icon: Crown,
    features: PLAN_LIMITS.pro.features,
    popular: true,
    checkoutable: true,
  },
  {
    type: "business",
    name: "Business",
    price: "$149",
    period: "/mo",
    icon: Building2,
    features: PLAN_LIMITS.business.features,
    checkoutable: true,
  },
  {
    type: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    icon: Rocket,
    features: PLAN_LIMITS.enterprise.features,
    dark: true,
  },
];

function getPlanBadgeColor(plan: PlanType) {
  const map: Record<PlanType, string> = {
    starter: "bg-muted text-muted-foreground",
    pro: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    business: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return map[plan];
}

export function SettingsView() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  // Billing
  const { openCheckout, isCheckingOut } = useLemonSqueezyCheckout();
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    subscriptionStatus: string | null;
    subscriptionEndsAt: string | null;
    isActive: boolean;
  } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Account tab
  const [name, setName] = useState(user?.name ?? "");
  const [isSavingName, setIsSavingName] = useState(false);

  // Preferences tab
  const [maxLinksPerPage, setMaxLinksPerPage] = useState(5);
  const [autoApproveThreshold, setAutoApproveThreshold] = useState(70);
  const [excludePatterns, setExcludePatterns] = useState("");
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  // Fetch subscription info on mount
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/billing/portal?userId=${user.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.plan && data.plan !== user.plan) {
            setUser({ ...user, plan: data.plan });
          }
          setSubscriptionInfo({
            subscriptionStatus: data.subscriptionStatus,
            subscriptionEndsAt: data.subscriptionEndsAt,
            isActive: data.isActive,
          });
        })
        .catch(() => {
          // Subscription endpoint may not be available yet
        });
    }
  }, [user?.id]);

  async function handleSaveName() {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setIsSavingName(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      if (user) setUser({ ...user, name: name.trim() });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleSavePrefs() {
    setIsSavingPrefs(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      toast.success("Preferences saved");
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setIsSavingPrefs(false);
    }
  }

  async function handleCancelSubscription() {
    if (!user?.id) return;
    setIsCancelling(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Subscription cancelled. You'll keep access until the end of your billing period.");
        setSubscriptionInfo((prev) =>
          prev ? { ...prev, isActive: false, subscriptionStatus: "cancelled" } : prev
        );
      } else {
        toast.error(data.error || "Failed to cancel subscription");
      }
    } catch {
      toast.error("Failed to cancel subscription");
    } finally {
      setIsCancelling(false);
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const currentPlanData = PLANS.find((p) => p.type === user?.plan);
  const hasActiveSubscription = subscriptionInfo?.isActive ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">
          Manage your account, plan, and preferences.
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account">
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile Information</CardTitle>
                <CardDescription>Update your account details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-name">Name</Label>
                  <div className="relative max-w-sm">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="settings-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9"
                      disabled={isSavingName}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative max-w-sm">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={user?.email ?? ""}
                      className="pl-9"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Label>Current Plan</Label>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", getPlanBadgeColor(user?.plan ?? "starter"))}
                  >
                    {(user?.plan ?? "starter").charAt(0).toUpperCase() +
                      (user?.plan ?? "starter").slice(1)}
                  </Badge>
                </div>
                <Button
                  onClick={handleSaveName}
                  disabled={isSavingName || name === (user?.name ?? "")}
                >
                  {isSavingName ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Plan Tab */}
        <TabsContent value="plan">
          <div className="space-y-6">
            {/* Active Subscription Card */}
            {hasActiveSubscription && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <CardTitle className="text-base">Active Subscription</CardTitle>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                        {subscriptionInfo?.subscriptionStatus === "on_trial" ? "Trial" : "Active"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Plan</p>
                        <p className="font-medium capitalize">
                          {currentPlanData?.name ?? user?.plan}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">
                          {subscriptionInfo?.subscriptionStatus}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Renews / Ends</p>
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                          <p className="font-medium">
                            {formatDate(subscriptionInfo?.subscriptionEndsAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800/50 dark:hover:bg-red-900/20"
                        onClick={handleCancelSubscription}
                        disabled={isCancelling}
                      >
                        {isCancelling ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Cancel Subscription
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        You&apos;ll keep access until the end of your billing period.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Cancelled Subscription Notice */}
            {subscriptionInfo?.subscriptionStatus === "cancelled" && !hasActiveSubscription && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10">
                  <CardContent className="p-4 flex items-center gap-3">
                    <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        Subscription Cancelled
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Your plan access continues until{" "}
                        {formatDate(subscriptionInfo?.subscriptionEndsAt)}.
                        You can subscribe again below.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Plan Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANS.map((plan, i) => {
                const isCurrent = user?.plan === plan.type;
                const Icon = plan.icon;
                return (
                  <motion.div
                    key={plan.type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className={cn(
                        "relative flex flex-col h-full",
                        plan.popular && "border-2 border-orange-500/50 shadow-lg shadow-orange-500/10",
                        plan.dark && "bg-neutral-950 text-white border-neutral-800 dark:bg-neutral-950"
                      )}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 text-xs">
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Icon
                            className={cn(
                              "w-5 h-5",
                              plan.dark
                                ? "text-amber-400"
                                : "text-orange-500"
                            )}
                          />
                          <CardTitle className={cn("text-base", plan.dark && "text-white")}>{plan.name}</CardTitle>
                        </div>
                        <div className="pt-1">
                          <span className={cn("text-3xl font-bold", plan.dark && "text-white")}>
                            {plan.price}
                          </span>
                          {plan.period && (
                            <span className={cn("text-sm text-muted-foreground", plan.dark && "text-neutral-400")}>
                              {plan.period}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        <ul className="space-y-2 text-sm flex-1">
                          {plan.features.map((feature, fi) => (
                            <li key={fi} className="flex items-start gap-2">
                              <Check className={cn("w-4 h-4 mt-0.5 shrink-0", plan.dark ? "text-teal-400" : "text-teal-600")} />
                              <span className={plan.dark ? "text-neutral-300" : ""}>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4">
                          {isCurrent ? (
                            <Button
                              variant="outline"
                              className="w-full"
                              disabled
                            >
                              Current Plan
                            </Button>
                          ) : plan.checkoutable ? (
                            <Button
                              className={cn(
                                "w-full",
                                plan.popular
                                  ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                                  : plan.dark
                                    ? "bg-white text-neutral-900 hover:bg-neutral-200"
                                    : ""
                              )}
                              onClick={() => openCheckout(plan.type)}
                              disabled={isCheckingOut}
                            >
                              {isCheckingOut ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : null}
                              {plan.period ? "Upgrade" : "Contact Sales"}
                              <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-60" />
                            </Button>
                          ) : plan.type === "enterprise" ? (
                            <Button
                              className={cn(
                                "w-full",
                                plan.dark
                                  ? "bg-white text-neutral-900 hover:bg-neutral-200"
                                  : ""
                              )}
                              variant="outline"
                              onClick={() =>
                                toast.info(
                                  "Enterprise inquiries: hello@linkforge.digital"
                                )
                              }
                            >
                              Contact Sales
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="w-full"
                              disabled
                            >
                              Free
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Link Generation Preferences</CardTitle>
                <CardDescription>
                  Configure how LinkForge generates and manages suggestions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 max-w-md">
                  <div className="flex items-center justify-between">
                    <Label>Max links per page</Label>
                    <span className="text-sm font-mono font-medium text-orange-600 dark:text-orange-400">
                      {maxLinksPerPage}
                    </span>
                  </div>
                  <Slider
                    value={[maxLinksPerPage]}
                    onValueChange={([v]) => setMaxLinksPerPage(v)}
                    min={1}
                    max={20}
                    step={1}
                    className="[&_[role=slider]]:bg-orange-500"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum internal links the AI will suggest adding to a single page.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3 max-w-md">
                  <div className="flex items-center justify-between">
                    <Label>Auto-approve threshold</Label>
                    <span className="text-sm font-mono font-medium text-orange-600 dark:text-orange-400">
                      {autoApproveThreshold}
                    </span>
                  </div>
                  <Slider
                    value={[autoApproveThreshold]}
                    onValueChange={([v]) => setAutoApproveThreshold(v)}
                    min={0}
                    max={100}
                    step={5}
                    className="[&_[role=slider]]:bg-orange-500"
                  />
                  <p className="text-xs text-muted-foreground">
                    Suggestions scoring above this value will be automatically approved.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3 max-w-md">
                  <Label htmlFor="exclude-patterns">Exclude URL Patterns</Label>
                  <Textarea
                    id="exclude-patterns"
                    placeholder={"/tag/\n/category/uncategorized\n/page/"}
                    value={excludePatterns}
                    onChange={(e) => setExcludePatterns(e.target.value)}
                    rows={5}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    One pattern per line. Pages matching these patterns will be excluded from linking.
                  </p>
                </div>

                <Button
                  onClick={handleSavePrefs}
                  disabled={isSavingPrefs}
                >
                  {isSavingPrefs ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}