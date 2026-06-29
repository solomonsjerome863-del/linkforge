import { create } from "zustand";
import type {
  AppView,
  User,
  Site,
  LinkSuggestion,
  DashboardStats,
} from "./types";

interface AppState {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

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

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user }),

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