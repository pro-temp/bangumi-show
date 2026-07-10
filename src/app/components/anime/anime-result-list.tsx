"use client";

import { CalendarClock, ListFilter, Loader2, Star } from "lucide-react";
import { animeStatusLabels, animeSubtitle, animeTitle, animeTypeLabels } from "@/lib/anime/display";
import type { AnimeWork } from "@/lib/anime/model";
import { CollectionStatusSelect } from "@/lib/client/collection-status-select";
import { CopyTitleButton } from "@/lib/client/copy-title-button";
import type { CollectionItem, CollectionStatus } from "@/lib/platform/collection-repository";
import { AnimeCover } from "./anime-cover";

export function AnimeResultList({
  collectionByAnimeId,
  items,
  loading,
  onOpen,
  onRemoveCollection,
  onResetFilters,
  onSetCollection,
  refreshing,
  selectedId
}: {
  collectionByAnimeId: ReadonlyMap<string, CollectionItem>;
  items: AnimeWork[];
  loading: boolean;
  onOpen: (anime: AnimeWork) => void;
  onRemoveCollection: (animeId: string) => void;
  onResetFilters: () => void;
  onSetCollection: (anime: AnimeWork, status: CollectionStatus) => void;
  refreshing: boolean;
  selectedId: string | null;
}) {
  if (loading && items.length === 0) {
    return <ResultSkeletonList />;
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center border border-dashed border-[var(--line-strong)] bg-white px-8 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[var(--surface)] text-[var(--muted)]">
          <ListFilter aria-hidden className="h-5 w-5" />
        </span>
        <h3 className="mt-4 text-sm font-semibold">没有符合条件的番剧</h3>
        <p className="mt-1 text-xs text-[var(--muted)]">调整筛选条件后重新查看</p>
        <button
          className="mt-4 h-9 rounded-[6px] border border-[var(--line-strong)] bg-white px-3 text-sm font-medium hover:border-[var(--muted)]"
          onClick={onResetFilters}
          type="button"
        >
          清除筛选
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {refreshing ? (
        <div className="sticky top-0 z-10 mb-2 flex h-9 items-center gap-2 border border-[var(--line)] bg-white/95 px-3 text-xs text-[var(--muted)] shadow-sm backdrop-blur">
          <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
          正在更新番表
        </div>
      ) : null}
      <div className={`grid gap-2 transition-opacity ${refreshing ? "opacity-55" : "opacity-100"}`}>
        {items.map((anime) => (
          <AnimeResultCard
            anime={anime}
            collectionStatus={collectionByAnimeId.get(anime.id)?.status}
            key={anime.id}
            onOpen={() => onOpen(anime)}
            onRemoveCollection={() => onRemoveCollection(anime.id)}
            onSetCollection={(status) => onSetCollection(anime, status)}
            selected={selectedId === anime.id}
          />
        ))}
      </div>
    </div>
  );
}

function AnimeResultCard({
  anime,
  collectionStatus,
  onOpen,
  onRemoveCollection,
  onSetCollection,
  selected
}: {
  anime: AnimeWork;
  collectionStatus?: CollectionStatus;
  onOpen: () => void;
  onRemoveCollection: () => void;
  onSetCollection: (status: CollectionStatus) => void;
  selected: boolean;
}) {
  return (
    <article
      aria-current={selected ? "true" : undefined}
      className={`result-row group relative isolate grid min-h-[112px] grid-cols-[68px_minmax(0,1fr)_112px_124px] gap-3 rounded-[7px] border p-3 transition-[border-color,box-shadow,background-color] duration-150 ${
        selected
          ? "border-[#df7a73] bg-[var(--selected)] shadow-[0_0_0_2px_rgba(221,62,53,0.10),0_8px_24px_rgba(24,28,33,0.09)] before:pointer-events-none before:absolute before:inset-y-2.5 before:left-0 before:w-1 before:rounded-r-full before:bg-[var(--accent)] before:content-['']"
          : "border-[var(--line)] bg-white shadow-[0_1px_2px_rgba(24,28,33,0.025)] hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-soft)]"
      }`}
    >
      <button
        aria-label={`查看 ${animeTitle(anime)} 详情`}
        className="absolute inset-y-0 left-0 right-[136px] z-10 rounded-[5px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
        onClick={onOpen}
        type="button"
      />
      <AnimeCover anime={anime} className="w-[68px]" />

      <div className="min-w-0 py-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-[15px] font-semibold leading-5 transition-colors group-hover:text-[var(--accent-strong)]">
            {animeTitle(anime)}
          </h3>
          <CopyTitleButton title={animeTitle(anime)} />
          <span className="shrink-0 rounded-[4px] bg-[var(--teal-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--teal)]">
            {animeTypeLabels[anime.type]}
          </span>
        </div>
        {animeSubtitle(anime) ? (
          <p className="mt-1 truncate text-xs text-[var(--muted)]">{animeSubtitle(anime)}</p>
        ) : null}
        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[var(--body-muted)]">
          {anime.summary ?? "暂无简介"}
        </p>
        <div className="mt-2 flex min-w-0 gap-1.5 overflow-hidden">
          {anime.tags.slice(0, 3).map((tag) => (
            <span
              className="shrink-0 rounded-[4px] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-end justify-center gap-2 border-l border-[var(--line)] pl-3 text-xs">
        <span className="inline-flex items-center gap-1 text-[var(--body-muted)]">
          <CalendarClock aria-hidden className="h-3.5 w-3.5 text-[var(--muted)]" />
          {formatAirDate(anime.airDate)}
        </span>
        <span
          className={`rounded-[4px] px-1.5 py-0.5 ${
            anime.status === "airing"
              ? "bg-[var(--teal-soft)] text-[var(--teal)]"
              : anime.status === "upcoming"
                ? "bg-[var(--amber-soft)] text-[var(--amber)]"
                : "bg-[var(--surface)] text-[var(--muted)]"
          }`}
        >
          {animeStatusLabels[anime.status]}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-[var(--amber)]">
          <Star aria-hidden className="h-3.5 w-3.5" />
          {anime.score ? anime.score.toFixed(1) : "N/A"}
        </span>
      </div>

      <div className="relative z-20 flex items-center">
        <CollectionStatusSelect
          current={collectionStatus}
          onRemove={onRemoveCollection}
          onSetStatus={onSetCollection}
        />
      </div>
    </article>
  );
}

function ResultSkeletonList() {
  return (
    <div className="grid gap-2" aria-label="正在加载番表">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          className="grid min-h-[112px] grid-cols-[68px_minmax(0,1fr)_112px_124px] gap-3 rounded-[7px] border border-[var(--line)] bg-white p-3"
          key={index}
        >
          <div className="skeleton-block aspect-[3/4] rounded-[5px]" />
          <div className="grid content-start gap-2 py-1">
            <div className="skeleton-block h-4 w-2/5 rounded" />
            <div className="skeleton-block h-3 w-1/3 rounded" />
            <div className="skeleton-block mt-1 h-3 w-11/12 rounded" />
            <div className="skeleton-block h-3 w-3/4 rounded" />
          </div>
          <div className="grid content-center justify-items-end gap-2">
            <div className="skeleton-block h-4 w-20 rounded" />
            <div className="skeleton-block h-5 w-12 rounded" />
          </div>
          <div className="flex items-center">
            <div className="skeleton-block h-9 w-full rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatAirDate(value: string | undefined): string {
  if (!value) {
    return "日期待定";
  }

  const date = new Date(`${value}T00:00:00Z`);
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${value.slice(5).replace("-", ".")} ${weekdays[date.getUTCDay()]}`;
}
