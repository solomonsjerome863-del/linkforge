"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallState = "hidden" | "installable" | "installed" | "ios";

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const getInitialState = (): InstallState => {
    if (typeof window === "undefined") return "hidden";
    if (window.matchMedia("(display-mode: standalone)").matches) return "installed";
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) return "ios";
    return "hidden";
  };

  const [state, setState] = useState<InstallState>(getInitialState);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {
          // Service worker registration failed silently
        });
    }

    if (state !== "hidden") return;

    // Capture the beforeinstallprompt event (Chrome, Edge, Samsung)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState("installable");
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setState("installed");
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [state]);

  const install = useCallback(async () => {
    // For iOS: show instructions via alert
    if (state === "ios") {
      const instructions =
        "To install LinkForge on your device:\n\n" +
        "1. Tap the Share button (the square with an arrow pointing up) at the bottom of Safari\n" +
        '2. Scroll down and tap "Add to Home Screen"\n' +
        '3. Tap "Add" in the top-right corner';
      alert(instructions);
      return;
    }

    // For Chrome/Edge/Samsung with deferredPrompt
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setState("installed");
      }
      setDeferredPrompt(null);
      return;
    }

    // Fallback: just navigate to home and let browser handle
    // On some browsers, if no prompt is available, open a helpful message
    const instructions =
      "To install LinkForge as an app:\n\n" +
      '• Android: Tap the three-dot menu in your browser → "Install app" or "Add to Home Screen"\n' +
      '• Desktop: Click the install icon in the address bar\n' +
      '• iOS: Use the Share button → "Add to Home Screen"';
    alert(instructions);
  }, [deferredPrompt, state]);

  return {
    state,
    install,
    isInstallable: state === "installable" || state === "ios",
    isInstalled: state === "installed",
  };
}
