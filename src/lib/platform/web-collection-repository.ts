import type { CollectionItem, CollectionRepository } from "./collection-repository";

const storageKey = "bangumi-show:collection";

export class WebCollectionRepository implements CollectionRepository {
  async list(): Promise<CollectionItem[]> {
    if (typeof window === "undefined") {
      return [];
    }

    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as CollectionItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async set(item: CollectionItem): Promise<void> {
    const items = await this.list();
    const next = [...items.filter((current) => current.animeId !== item.animeId), item];
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  }

  async remove(animeId: string): Promise<void> {
    const items = await this.list();
    const next = items.filter((item) => item.animeId !== animeId);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  }

  async replace(items: CollectionItem[]): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }
}
