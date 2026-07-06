import type { CollectionItem, CollectionRepository } from "./collection-repository";

const storageKey = "bangumi-show:collection";

export class WebCollectionRepository implements CollectionRepository {
  async list(): Promise<CollectionItem[]> {
    if (typeof window === "undefined") {
      return [];
    }

    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as CollectionItem[]) : [];
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
}
