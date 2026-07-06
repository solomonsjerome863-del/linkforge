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
      set({ user: stored as User, showLanding: false });
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