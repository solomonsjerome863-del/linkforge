export type PlanType = "starter" | "pro" | "business" | "enterprise";
export type SiteStatus = "pending" | "crawling" | "ready" | "error";
export type Platform = "wordpress" | "shopify" | "webflow" | "ghost" | "custom";
export type SuggestionStatus = "pending" | "approved" | "rejected" | "applied";
export type CrawlJobStatus = "pending" | "running" | "completed" | "failed";
export type AppView = "dashboard" | "sites" | "pages" | "suggestions" | "analytics" | "settings" | "blueprint";

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: PlanType;
  usageLinks: number;
  usageQueries: number;
  createdAt: string;
}

export interface Site {
  id: string;
  name: string;
  url: string;
  platform: Platform;
  status: SiteStatus;
  pageLimit: number;
  pagesCount: number;
  linksCount: number;
  lastCrawled: string | null;
  error: string | null;
  createdAt: string;
}

export interface PageEntry {
  id: string;
  url: string;
  title: string;
  content: string;
  textContent: string;
  headings: string;
  wordCount: number;
  status: string;
}

export interface LinkSuggestion {
  id: string;
  siteId: string;
  sourcePageId: string;
  targetPageId: string;
  anchorText: string;
  surroundingText: string | null;
  score: number;
  status: SuggestionStatus;
  appliedAt: string | null;
  createdAt: string;
  sourcePage?: { id: string; title: string; url: string };
  targetPage?: { id: string; title: string; url: string };
}

export interface CrawlJob {
  id: string;
  siteId: string;
  status: CrawlJobStatus;
  pagesFound: number;
  pagesSaved: number;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface AnalyticsSnapshot {
  id: string;
  siteId: string;
  date: string;
  totalLinks: number;
  orphanPages: number;
  avgLinksPerPage: number;
  topKeywords: string;
}

export interface DashboardStats {
  totalSites: number;
  totalPages: number;
  totalSuggestions: number;
  pendingSuggestions: number;
  appliedLinks: number;
  orphanPages: number;
}

export interface PlanLimits {
  maxSites: number;
  maxPagesPerSite: number;
  monthlySuggestions: number;
  features: string[];
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  starter: { maxSites: 1, maxPagesPerSite: 50, monthlySuggestions: 100, features: ["Basic suggestions", "Manual apply", "1 site"] },
  pro: { maxSites: 5, maxPagesPerSite: 500, monthlySuggestions: 2000, features: ["AI-powered suggestions", "Auto-apply", "5 sites", "Priority support"] },
  business: { maxSites: 25, maxPagesPerSite: 5000, monthlySuggestions: 10000, features: ["Everything in Pro", "Bulk actions", "Analytics", "API access", "25 sites"] },
  enterprise: { maxSites: -1, maxPagesPerSite: -1, monthlySuggestions: -1, features: ["Everything in Business", "Unlimited sites", "Dedicated support", "Custom integrations", "SLA"] },
};