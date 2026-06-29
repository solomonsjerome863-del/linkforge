"use client";

import { useAppStore } from "@/lib/store";
import { AuthView } from "@/components/saas/auth-view";
import { AppShell } from "@/components/saas/app-shell";
import { BlueprintPage } from "@/components/blueprint/blueprint-page";

export default function Page() {
  const user = useAppStore((s) => s.user);
  const activeView = useAppStore((s) => s.activeView);

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