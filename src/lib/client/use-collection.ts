"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { animeSourceId, animeTitle } from "@/lib/anime/display";
import type { AnimeWork } from "@/lib/anime/model";
import type { CollectionItem, CollectionStatus } from "@/lib/platform/collection-repository";
import { WebCollectionRepository } from "@/lib/platform/web-collection-repository";

export const collectionStatusLabels: Record<CollectionStatus, string> = {
  planned: "想看",
  watching: "在看",
  completed: "看过",
  paused: "暂停",
  dropped: "抛弃"
};

export const collectionStatusOptions: CollectionStatus[] = [
  "planned",
  "watching",
  "completed",
  "paused",
  "dropped"
];

export function useCollection() {
  const repository = useMemo(() => new WebCollectionRepository(), []);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    setItems(await repository.list());
    setReady(true);
  }, [repository]);

  useEffect(() => {
    void Promise.resolve().then(reload);
    return repository.subscribe(() => void reload());
  }, [reload, repository]);

  const setStatus = useCallback(
    async (anime: AnimeWork, status: CollectionStatus) => {
      const now = new Date().toISOString();
      const existing = (await repository.list()).find((item) => item.animeId === anime.id);
      const source = animeSourceId(anime);

      await repository.set({
        animeId: anime.id,
        source: source.source,
        sourceId: source.sourceId,
        status,
        titleSnapshot: animeTitle(anime),
        imageUrl: anime.imageUrl,
        year: anime.year,
        season: anime.season,
        type: anime.type,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      });
      await reload();
    },
    [reload, repository]
  );

  const updateStatus = useCallback(
    async (animeId: string, status: CollectionStatus) => {
      const existing = (await repository.list()).find((item) => item.animeId === animeId);
      if (!existing) {
        return;
      }

      await repository.set({
        ...existing,
        status,
        updatedAt: new Date().toISOString()
      });
      await reload();
    },
    [reload, repository]
  );

  const remove = useCallback(
    async (animeId: string) => {
      await repository.remove(animeId);
      await reload();
    },
    [reload, repository]
  );

  const replace = useCallback(
    async (nextItems: CollectionItem[]) => {
      await repository.replace(nextItems);
      await reload();
    },
    [reload, repository]
  );

  const byAnimeId = useMemo(() => {
    return new Map(items.map((item) => [item.animeId, item]));
  }, [items]);

  return {
    items,
    byAnimeId,
    ready,
    reload,
    setStatus,
    updateStatus,
    remove,
    replace
  };
}
