"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { LandingPage } from "@/components/saas/landing-page";
import { AuthView } from "@/components/saas/auth-view";
import { AppShell } from "@/components/saas/app-shell";
import { Loader2 } from "lucide-react";

export default function Page() {
  const user = useAppStore((s) => s.user);
  const hydrated = useAppStore((s) => s._hydrated);
  const showLanding = useAppStore((s) => s.showLanding);
  const hydrate = useAppStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) {
    return <AppShell />;
  }

  if (showLanding) {
    return <LandingPage />;
  }

  return <AuthView />;
}