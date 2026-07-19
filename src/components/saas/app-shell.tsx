"use client";

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Globe,
  FileText,
  Link2Icon,
  BarChart3,
  Settings,
  BookOpen,
  LogOut,
  Menu,
  ChevronRight,
  Sun,
  Moon,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import type { AppView } from "@/lib/types";
import { DashboardView } from "./dashboard-view";
import { SitesView } from "./sites-view";
import { SuggestionsView } from "./suggestions-view";
import { PagesView } from "./pages-view";
import { AnalyticsView } from "./analytics-view";
import { SettingsView } from "./settings-view";
import { OnboardingWizard } from "./onboarding-wizard";
import { BlueprintView } from "./blueprint-view";
import { AdminView } from "./admin-view";
import { PLAN_LIMITS, type PlanType } from "@/lib/types";
import { toast } from "sonner";

interface NavItem {
  view: AppView;
  label: string;
  icon: React.ElementType;
  isAdmin?: boolean;
}

const BASE_NAV_ITEMS: NavItem[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "sites", label: "Sites", icon: Globe },
  { view: "pages", label: "Pages", icon: FileText },
  { view: "suggestions", label: "Suggestions", icon: Link2Icon },
  { view: "analytics", label: "Analytics", icon: BarChart3 },
  { view: "settings", label: "Settings", icon: Settings },
];

const EXTRA_NAV_ITEMS: NavItem[] = [
  { view: "blueprint", label: "Technical Blueprint", icon: BookOpen },
  { view: "admin", label: "Admin", icon: ShieldCheck, isAdmin: true },
];

const VIEW_TITLES: Record<AppView, string> = {
  dashboard: "Dashboard",
  sites: "Sites",
  pages: "Pages",
  suggestions: "Link Suggestions",
  analytics: "Analytics",
  settings: "Settings",
  blueprint: "Technical Blueprint",
  admin: "Admin Dashboard",
};

function getInitials(name: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getPlanColor(plan: string) {
  switch (plan) {
    case "pro":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    case "business":
      return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400";
    case "enterprise":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const user = useAppStore((s) => s.user);
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const setUser = useAppStore((s) => s.setUser);

  // Build the full nav items list dynamically — Admin only for admin users
  const navItems = useMemo(() => {
    const items: NavItem[] = [...BASE_NAV_ITEMS];
    // Always add Blueprint
    items.push(EXTRA_NAV_ITEMS[0]);
    // Add Admin if user is admin
    if (user?.isAdmin) {
      items.push(EXTRA_NAV_ITEMS[1]);
    }
    return items;
  }, [user?.isAdmin]);

  function handleNav(view: AppView) {
    setActiveView(view);
    onNavigate?.();
  }

  function handleSignOut() {
    setUser(null);
    onNavigate?.();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <img src="/logo-32.png" alt="LinkForge" className="w-8 h-8 rounded-lg shrink-0" />
        <span className="text-lg font-bold tracking-tight">
          Link<span className="text-orange-500">Forge</span>
        </span>
      </div>

      {/* User info */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.image ?? undefined} />
            <AvatarFallback className="bg-orange-100 text-orange-600 text-xs font-semibold">
              {getInitials(user?.name ?? null)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user?.name ?? "User"}</p>
            <Badge
              variant="secondary"
              className={cn("text-[10px] px-1.5 py-0", getPlanColor(user?.plan ?? "starter"))}
            >
              {user?.plan ? (user.plan.charAt(0).toUpperCase() + user.plan.slice(1)) : "Starter"}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation — ALL items rendered by the same .map() loop */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-1">
          {navItems.map((item, index) => {
            const isActive = activeView === item.view;
            const Icon = item.icon;
            // Add separator before Blueprint (index 6) when Admin follows
            const showSeparatorBefore = item.view === "blueprint";
            return (
              <div key={item.view}>
                {showSeparatorBefore && <Separator className="my-3" />}
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleNav(item.view)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          item.isAdmin && !isActive && "text-emerald-600 dark:text-emerald-400 font-semibold",
                          isActive
                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                            : !item.isAdmin && "text-muted-foreground hover:bg-muted hover:text-foreground",
                          item.isAdmin && !isActive && "hover:bg-emerald-500/10"
                        )}
                      >
                        <Icon className={cn("w-4 h-4", isActive && "text-orange-500", item.isAdmin && !isActive && "text-emerald-500 dark:text-emerald-400")} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {isActive && (
                          <ChevronRight className="w-3 h-3 text-orange-500" />
                        )}
                        {item.isAdmin && !isActive && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700">
                            Admin
                          </Badge>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="lg:hidden">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Usage footer */}
      <div className="px-4 py-3 border-t">
        <div className="text-xs text-muted-foreground mb-1">
          Usage: {user?.usageLinks ?? 0} / {user?.plan ? PLAN_LIMITS[user.plan].monthlySuggestions : 100} links
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-orange-500 to-amber-500 h-1.5 rounded-full transition-all"
            style={{
              width: `${Math.min(100, ((user?.usageLinks ?? 0) / (user?.plan ? PLAN_LIMITS[user.plan].monthlySuggestions : 100)) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Sign out */}
      <div className="px-3 pb-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </Button>
      </div>

    </div>
  );
}

export function AppShell() {
  const user = useAppStore((s) => s.user);
  const activeView = useAppStore((s) => s.activeView);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const { theme, setTheme } = useTheme();

  // Close sidebar on mobile when view changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [activeView, setSidebarOpen]);

  // Handle checkout success redirect from LemonSqueezy
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const checkoutSuccess = params.get("checkout");
    const plan = params.get("plan");
    if (checkoutSuccess === "success" && plan) {
      const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
      toast.success(`🎉 ${planLabel} plan activated! Welcome aboard.`);
      // Update local state
      if (user) {
        useAppStore.getState().setUser({ ...user, plan: plan as PlanType });
      }
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      url.searchParams.delete("plan");
      window.history.replaceState({}, "", url.toString());
    }
  }, [user]);

  function renderView() {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "sites":
        return <SitesView />;
      case "pages":
        return <PagesView />;
      case "suggestions":
        return <SuggestionsView />;
      case "analytics":
        return <AnalyticsView />;
      case "settings":
        return <SettingsView />;
      case "blueprint":
        return <BlueprintView />;
      case "admin":
        return <AdminView />;
      default:
        return <DashboardView />;
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r bg-card/50 backdrop-blur-sm">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-center h-14 px-4 gap-4">
            {/* Mobile menu */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <SidebarContent onNavigate={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Title */}
            <h1 className="text-lg font-semibold">{VIEW_TITLES[activeView]}</h1>

            <div className="flex-1" />

            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme" className="relative">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.image ?? undefined} />
                    <AvatarFallback className="bg-orange-100 text-orange-600 text-xs font-semibold">
                      {getInitials(user?.name ?? null)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name ?? "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email ?? ""}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => useAppStore.getState().setActiveView("settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-rose-600 focus:text-rose-600"
                  onClick={() => useAppStore.getState().setUser(null)}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          <OnboardingWizard />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}