"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { LandingPage } from "@/components/saas/landing-page";
import { AuthView } from "@/components/saas/auth-view";
import { AppShell } from "@/components/saas/app-shell";
import { Loader2, ShieldCheck, Download, X, FileText, FileVideo, ImageIcon, Palette } from "lucide-react";

const LOGO_FILES = [
  { key: "logo-svg", name: "Logo — SVG Wordmark", desc: "Scalable vector, any size", wide: true },
  { key: "logo-png", name: "Logo — 1024×1024 PNG", desc: "Square icon for profiles", wide: false },
  { key: "og-image", name: "OG Image — 1200×630", desc: "Social sharing card", wide: true },
];

const FAVICON_FILES = [
  { key: "favicon-svg", name: "Favicon — SVG", desc: "Vector, infinitely sharp" },
  { key: "icon-512", name: "Icon — 512×512 PNG", desc: "PWA large icon" },
  { key: "icon-192", name: "Icon — 192×192 PNG", desc: "PWA small icon" },
  { key: "apple-touch-icon", name: "Apple Touch Icon", desc: "180×180 for iOS" },
];

const DOC_FILES = [
  { key: "demo-pptx", name: "LinkForge_Demo.pptx", desc: "9-slide presentation with notes", icon: "pptx" },
  { key: "demo-script", name: "Demo_Script.md", desc: "5-min recording script", icon: "md" },
];

export default function Page() {
  const user = useAppStore((s) => s.user);
  const hydrated = useAppStore((s) => s._hydrated);
  const showLanding = useAppStore((s) => s.showLanding);
  const hydrate = useAppStore((s) => s.hydrate);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const [dlOpen, setDlOpen] = useState(false);
  const [tab, setTab] = useState<"logos" | "favicons" | "files">("logos");

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

        {/* Floating Download Button (admin only) */}
        {user.isAdmin && (
          <button
            onClick={() => setDlOpen(true)}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full
                       bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm
                       shadow-lg shadow-orange-500/30 transition-all hover:scale-105"
            aria-label="Download brand assets"
          >
            <Palette className="w-5 h-5" />
            Assets
          </button>
        )}

        {/* Download / Assets Panel */}
        {dlOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
               onClick={() => setDlOpen(false)}>
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl border max-h-[90vh] flex flex-col"
                 onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
                <h3 className="text-lg font-bold">Brand Assets & Downloads</h3>
                <button onClick={() => setDlOpen(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b px-5 flex-shrink-0">
                {(["logos", "favicons", "files"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                      tab === t ? "border-orange-500 text-orange-600" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-5 overflow-y-auto flex-1">
                {tab === "logos" && (
                  <div className="grid grid-cols-2 gap-4">
                    {LOGO_FILES.map((f) => (
                      <a key={f.key} href={`/api/download?file=${f.key}`} download
                         className="group border rounded-xl overflow-hidden hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/10 transition-all">
                        <div className={`bg-white flex items-center justify-center ${f.wide ? "h-32" : "h-36"}`}>
                          <img src={`/api/preview-image?file=${f.key}`} alt={f.name}
                               className={`object-contain p-4 ${f.wide ? "w-full h-full" : "w-28 h-28"}`} />
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{f.name}</p>
                            <p className="text-xs text-muted-foreground">{f.desc}</p>
                          </div>
                          <Download className="w-4 h-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {tab === "favicons" && (
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    {FAVICON_FILES.map((f) => (
                      <a key={f.key} href={`/api/download?file=${f.key}`} download
                         className="group border rounded-xl overflow-hidden hover:border-orange-400 hover:shadow-lg transition-all">
                        <div className="bg-white h-40 flex items-center justify-center">
                          <img src={`/api/preview-image?file=${f.key}`} alt={f.name} className="w-24 h-24 object-contain p-2" />
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{f.name}</p>
                            <p className="text-xs text-muted-foreground">{f.desc}</p>
                          </div>
                          <Download className="w-4 h-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {tab === "files" && (
                  <div className="space-y-3">
                    {DOC_FILES.map((f) => (
                      <a key={f.key} href={`/api/download?file=${f.key}`} download
                         className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 hover:border-orange-300 transition-all group">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          f.icon === "pptx" ? "bg-orange-100" : f.icon === "md" ? "bg-teal-100" : "bg-amber-100"
                        }`}>
                          {f.icon === "pptx" && <FileVideo className="w-5 h-5 text-orange-600" />}
                          {f.icon === "md" && <FileText className="w-5 h-5 text-teal-600" />}
                          {f.icon === "img" && <ImageIcon className="w-5 h-5 text-amber-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{f.name}</p>
                          <p className="text-xs text-muted-foreground">{f.desc}</p>
                        </div>
                        <Download className="w-5 h-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center py-3 border-t flex-shrink-0">
                Click any card to download
              </p>
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