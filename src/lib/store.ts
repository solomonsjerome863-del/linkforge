import { create } from "zustand";
import type {
  AppView,
  User,
  Site,
  LinkSuggestion,
  DashboardStats,
} from "./types";
import { saveUser, loadUser, clearUser } from "./auth-storage";

interface AppState {
  // Landing page
  showLanding: boolean;
  setShowLanding: (show: boolean) => void;

  // Auth
  user: User | null;
  _hydrated: boolean;
  setUser: (user: User | null) => void;
  hydrate: () => void;

  // Navigation
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  selectedSiteId: string | null;
  setSelectedSiteId: (id: string | null) => void;

  // Data
  sites: Site[];
  setSites: (sites: Site[]) => void;
  suggestions: LinkSuggestion[];
  setSuggestions: (suggestions: LinkSuggestion[]) => void;
  dashboardStats: DashboardStats | null;
  setDashboardStats: (stats: DashboardStats | null) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Landing page
  showLanding: true,
  setShowLanding: (showLanding) => set({ showLanding }),

  // Auth
  user: null,
  _hydrated: false,
  hydrate: () => {
    if (get()._hydrated) return;
    set({ _hydrated: true });
    const stored = loadUser();
    if (stored) {
      const user = stored as User;
      set({ user, showLanding: false });

      // Always check admin status at runtime (server-side env var)
      // This ensures the Admin button appears even on first load
      if (user.id && user.email) {
        fetch("/api/auth/check-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, email: user.email }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.isAdmin) {
              const updated = { ...get().user, isAdmin: true } as User;
              set({ user: updated });
              saveUser(updated);
            }
          })
          .catch(() => {});
      }
    }
  },
  setUser: (user) => {
    set({ user, showLanding: !user });
    if (user) {
      saveUser(user);
    } else {
      clearUser();
    }
  },

  // Navigation
  activeView: "dashboard",
  setActiveView: (activeView) => set({ activeView }),
  selectedSiteId: null,
  setSelectedSiteId: (selectedSiteId) => set({ selectedSiteId }),

  // Data
  sites: [],
  setSites: (sites) => set({ sites }),
  suggestions: [],
  setSuggestions: (suggestions) => set({ suggestions }),
  dashboardStats: null,
  setDashboardStats: (dashboardStats) => set({ dashboardStats }),

  // UI state
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}));