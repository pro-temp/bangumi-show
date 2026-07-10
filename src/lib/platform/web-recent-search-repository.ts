import type { RecentSearchRepository } from "./recent-search-repository";

const storageKey = "bangumi-show:recent-searches";
const maxItems = 6;

export class WebRecentSearchRepository implements RecentSearchRepository {
  list(): string[] {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string").slice(0, maxItems)
        : [];
    } catch {
      return [];
    }
  }

  add(query: string): string[] {
    const normalized = query.trim();
    if (!normalized || typeof window === "undefined") {
      return this.list();
    }

    const next = [normalized, ...this.list().filter((item) => item !== normalized)].slice(
      0,
      maxItems
    );
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    return next;
  }

  clear(): void {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
  }
}
