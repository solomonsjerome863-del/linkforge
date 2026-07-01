/**
 * Session persistence via localStorage.
 * All access is wrapped in try-catch for SSR / private-browsing safety.
 */

const STORAGE_KEY = "linkforge_user";

export interface StoredUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: string;
  usageLinks: number;
  usageQueries: number;
  createdAt: string;
}

export function saveUser(user: StoredUser): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // localStorage unavailable (SSR, private browsing, quota) — ignore
  }
}

export function loadUser(): StoredUser | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function clearUser(): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}