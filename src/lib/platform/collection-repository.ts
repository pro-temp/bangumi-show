import type { AnimeSeason, AnimeType } from "@/lib/anime/model";

export type CollectionStatus = "planned" | "watching" | "completed" | "paused" | "dropped";

export type CollectionItem = {
  animeId: string;
  source: string;
  sourceId: string;
  status: CollectionStatus;
  titleSnapshot: string;
  imageUrl?: string;
  year?: number;
  season?: AnimeSeason;
  type?: AnimeType;
  createdAt: string;
  updatedAt: string;
};

export type CollectionRepository = {
  list(): Promise<CollectionItem[]>;
  set(item: CollectionItem): Promise<void>;
  remove(animeId: string): Promise<void>;
  replace(items: CollectionItem[]): Promise<void>;
};
