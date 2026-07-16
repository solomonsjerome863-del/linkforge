"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { LandingPage } from "@/components/saas/landing-page";
import { AuthView } from "@/components/saas/auth-view";
import { AppShell } from "@/components/saas/app-shell";
import { Loader2, ShieldCheck, Download, X, FileText, FileVideo } from "lucide-react";

export default function Page() {
  const user = useAppStore((s) => s.user);
  const hydrated = useAppStore((s) => s._hydrated);
  const showLanding = useAppStore((s) => s.showLanding);
  const hydrate = useAppStore((s) => s.hydrate);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const [dlOpen, setDlOpen] = useState(false);

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
    return (
      <>
        <AppShell />
        {/* Floating Admin button — quick access for admin users */}
        {user.isAdmin && (
          <button
            onClick={() => setActiveView("admin")}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full
                       bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm
                       shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
            aria-label="Open Admin Dashboard"
          >
            <ShieldCheck className="w-5 h-5" />
            Admin
          </button>
        )}

        {/* Floating Download button */}
        <button
          onClick={() => setDlOpen(true)}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full
                     bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm
                     shadow-lg shadow-orange-500/30 transition-all hover:scale-105"
          aria-label="Download demo materials"
        >
          <Download className="w-5 h-5" />
          Demo Files
        </button>

        {/* Download Panel */}
        {dlOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
               onClick={() => setDlOpen(false)}>
            <div className="bg-background rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 border"
                 onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">Download Demo Materials</h3>
                <button onClick={() => setDlOpen(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <a
                  href="/LinkForge_Demo.pptx"
                  download
                  className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <FileVideo className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">LinkForge_Demo.pptx</p>
                    <p className="text-xs text-muted-foreground">9-slide presentation with speaker notes</p>
                  </div>
                  <Download className="w-5 h-5 text-muted-foreground group-hover:text-orange-600 transition-colors" />
                </a>
                <a
                  href="/LinkForge_Demo_Script.md"
                  download
                  className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">LinkForge_Demo_Script.md</p>
                    <p className="text-xs text-muted-foreground">Word-for-word 5-min recording script</p>
                  </div>
                  <Download className="w-5 h-5 text-muted-foreground group-hover:text-teal-600 transition-colors" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">Click any file to download it to your computer</p>
            </div>
          </div>
        )}
      </>
    );
  }

  if (showLanding) {
    return <LandingPage />;
  }

  return <AuthView />;
}