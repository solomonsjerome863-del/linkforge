"use client";

import { useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import type { PlanType } from "@/lib/types";
import { toast } from "sonner";

export function useLemonSqueezyCheckout() {
  const user = useAppStore((s) => s.user);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const openCheckout = useCallback(
    async (plan: PlanType) => {
      if (!user) {
        toast.error("Please sign in to upgrade your plan");
        return;
      }

      if (plan === "starter" || plan === "enterprise") {
        if (plan === "enterprise") {
          toast.info("Enterprise inquiries: hello@linkforge.digital");
        }
        return;
      }

      setIsCheckingOut(true);
      try {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            plan,
            email: user.email,
            name: user.name || "",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to start checkout");
          return;
        }

        if (data.demo) {
          // Demo mode: simulate successful checkout
          toast.success(`Demo: ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated!`);
          // Update local state
          useAppStore.getState().setUser({
            ...user,
            plan,
          });
          return;
        }

        // Real checkout: redirect to LemonSqueezy
        if (data.url) {
          window.location.href = data.url;
        }
      } catch {
        toast.error("Failed to start checkout");
      } finally {
        setIsCheckingOut(false);
      }
    },
    [user]
  );

  return { openCheckout, isCheckingOut };
}