"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { AuthView } from "@/components/saas/auth-view";
import { AppShell } from "@/components/saas/app-shell";
import { BlueprintPage } from "@/components/blueprint/blueprint-page";
import { Loader2 } from "lucide-react";

export default function Page() {
  const user = useAppStore((s) => s.user);
  const activeView = useAppStore((s) => s.activeView);
  const hydrated = useAppStore((s) => s._hydrated);
  const hydrate = useAppStore((s) => s.hydrate);

  // Hydrate session from localStorage on mount (client-only)
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Don't render until we've checked localStorage
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No user → show auth
  if (!user) {
    return <AuthView />;
  }

  // User viewing blueprint → show blueprint page (outside app shell)
  if (activeView === "blueprint") {
    return <BlueprintPage />;
  }

  // User viewing SaaS views → show app shell
  return <AppShell />;
}