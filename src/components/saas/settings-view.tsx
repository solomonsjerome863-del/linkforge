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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PLAN_LIMITS, type PlanType } from "@/lib/types";

const PLANS: {
  type: PlanType;
  name: string;
  price: string;
  period: string;
  icon: React.ElementType;
  features: string[];
  popular?: boolean;
  dark?: boolean;
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
  },
  {
    type: "business",
    name: "Business",
    price: "$149",
    period: "/mo",
    icon: Building2,
    features: PLAN_LIMITS.business.features,
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

  async function handleSaveName() {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setIsSavingName(true);
    try {
      await new Promise((r) => setTimeout(r, 400)); // Simulate save delay
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
      await new Promise((r) => setTimeout(r, 400)); // Simulate save delay
      toast.success("Preferences saved");
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setIsSavingPrefs(false);
    }
  }

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
                        ) : (
                          <Button
                            className={cn(
                              "w-full",
                              plan.popular
                                ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                                : plan.dark
                                  ? "bg-white text-neutral-900 hover:bg-neutral-200"
                                  : ""
                            )}
                            onClick={() => toast.info(`${plan.name} plan upgrade coming soon!`)}
                          >
                            Upgrade
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
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
