"use client";

import * as Tabs from "@radix-ui/react-tabs";
import Link from "next/link";
import {
  AlertCircle,
  BookmarkCheck,
  CalendarDays,
  ExternalLink,
  Heart,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  animeSeasonLabels,
  animeStatusLabels,
  animeSubtitle,
  animeTitle,
  animeTypeLabels
} from "@/lib/anime/display";
import type { ApiEnvelope, AnimeStatus, AnimeType, AnimeWork } from "@/lib/anime/model";
import { currentSeason } from "@/lib/anime/season";
import { fetchAnimeDetail, fetchSchedule, searchAnime } from "@/lib/client/anime-api";
import {
  collectionStatusLabels,
  collectionStatusOptions,
  useCollection
} from "@/lib/client/use-collection";
import { HeadlessSelect } from "@/lib/client/headless-select";
import type { CollectionStatus } from "@/lib/platform/collection-repository";

type SortMode = "airDate" | "score" | "title";
type FilterType = "all" | AnimeType;
type FilterStatus = "all" | AnimeStatus;

const recentSearchKey = "bangumi-show:recent-searches";

const typeOptions: FilterType[] = ["all", "TV", "Movie", "OVA", "ONA", "Special", "Music"];
const statusOptions: FilterStatus[] = ["all", "upcoming", "airing", "finished"];

export function AnimeDashboard() {
  const season = currentSeason(new Date());
  const collection = useCollection();
  const [items, setItems] = useState<AnimeWork[]>([]);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("airDate");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AnimeWork | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [source, setSource] = useState<ApiEnvelope<unknown>["source"]>("sample");
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const applyEnvelopeMeta = useCallback(<T,>(result: ApiEnvelope<T>) => {
    setWarnings(result.warnings);
    setSource(result.source);
    setCachedAt(result.cachedAt);
  }, []);

  const tags = useMemo(() => {
    return [...new Set(items.flatMap((anime) => anime.tags))].sort((left, right) =>
      left.localeCompare(right, "zh-Hans-CN")
    );
  }, [items]);

  const visibleItems = useMemo(() => {
    return items
      .filter((anime) => typeFilter === "all" || anime.type === typeFilter)
      .filter((anime) => statusFilter === "all" || anime.status === statusFilter)
      .filter((anime) => tagFilter === "all" || anime.tags.includes(tagFilter))
      .sort((left, right) => sortAnime(left, right, sortMode));
  }, [items, sortMode, statusFilter, tagFilter, typeFilter]);
  const panelAnime = detail ?? items.find((anime) => anime.id === selectedId) ?? null;

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSubmittedQuery("");
    setDetail(null);

    try {
      const result = await fetchSchedule();
      setItems(result.data.items);
      applyEnvelopeMeta(result);
      setSelectedId((current) => current ?? result.data.items[0]?.id ?? null);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [applyEnvelopeMeta]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setRecentSearches(readRecentSearches());
      return loadSchedule();
    });
  }, [loadSchedule]);

  async function runSearch(nextQuery: string) {
    setLoading(true);
    setError(null);
    setSubmittedQuery(nextQuery.trim());

    try {
      const result = await searchAnime(nextQuery);
      setItems(result.data);
      applyEnvelopeMeta(result);
      setSelectedId(result.data[0]?.id ?? null);
      setDetail(null);

      if (nextQuery.trim()) {
        const nextRecent = [
          nextQuery.trim(),
          ...recentSearches.filter((item) => item !== nextQuery.trim())
        ].slice(0, 6);
        setRecentSearches(nextRecent);
        window.localStorage.setItem(recentSearchKey, JSON.stringify(nextRecent));
      }
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    let cancelled = false;

    void Promise.resolve().then(async () => {
      setDetailLoading(true);

      try {
        const result = await fetchAnimeDetail(selectedId);
        if (cancelled) {
          return;
        }
        if (result.data) {
          setDetail(result.data);
        }
        setWarnings((current) => [...new Set([...current, ...result.warnings])]);
      } catch (reason) {
        if (!cancelled) {
          setWarnings((current) => [...current, errorMessage(reason)]);
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  return (
    <main className="min-h-screen min-w-[1180px]">
      <section className="border-b border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-8 py-5">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal text-[var(--foreground)]">
                Bangumi Show
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">当前季度番表与动画查询</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <span>
                {season.year} 年 {season.label}
              </span>
              <Link
                className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-[var(--foreground)]"
                href="/collection"
              >
                <BookmarkCheck aria-hidden className="h-4 w-4" />
                收藏
              </Link>
            </div>
          </div>

          <form
            className="flex gap-3 rounded-md border border-[var(--line)] bg-white p-3 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              void runSearch(query);
            }}
          >
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 py-2">
              <Search aria-hidden className="h-5 w-5 shrink-0 text-[var(--muted)]" />
              <span className="sr-only">搜索动画</span>
              <input
                className="min-w-0 flex-1 border-0 bg-transparent text-base outline-none placeholder:text-slate-400"
                name="q"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索中文名、日文名、罗马音或别名"
                type="search"
                value={query}
              />
            </label>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-white"
              type="submit"
            >
              <Search aria-hidden className="h-4 w-4" />
              搜索
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-medium"
              onClick={() => {
                setQuery("");
                void loadSchedule();
              }}
              type="button"
            >
              <RefreshCw aria-hidden className="h-4 w-4" />
              番表
            </button>
          </form>

          {recentSearches.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-[var(--muted)]">最近搜索</span>
              {recentSearches.map((item) => (
                <button
                  className="rounded-md border border-[var(--line)] bg-white px-3 py-1.5"
                  key={item}
                  onClick={() => {
                    setQuery(item);
                    void runSearch(item);
                  }}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1440px] grid-cols-[280px_minmax(620px,1fr)_420px] gap-4 px-8 py-5">
        <aside className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal aria-hidden className="h-4 w-4" />
            筛选
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            <HeadlessSelect
              label="类型"
              onChange={setTypeFilter}
              options={typeOptions.map((item) => ({
                label: item === "all" ? "全部" : animeTypeLabels[item],
                value: item
              }))}
              value={typeFilter}
            />
            <HeadlessSelect
              label="状态"
              onChange={setStatusFilter}
              options={statusOptions.map((item) => ({
                label: item === "all" ? "全部" : animeStatusLabels[item],
                value: item
              }))}
              value={statusFilter}
            />
            <HeadlessSelect
              label="标签"
              onChange={setTagFilter}
              options={[
                { label: "全部", value: "all" },
                ...tags.map((tag) => ({ label: tag, value: tag }))
              ]}
              value={tagFilter}
            />
            <HeadlessSelect
              label="排序"
              onChange={setSortMode}
              options={[
                { label: "开播时间", value: "airDate" },
                { label: "评分", value: "score" },
                { label: "标题", value: "title" }
              ]}
              value={sortMode}
            />
          </div>

          <div className="mt-5 border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--muted)]">
            <div>来源：{source}</div>
            {cachedAt ? <div>更新：{formatDateTime(cachedAt)}</div> : null}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">
              {submittedQuery ? `搜索：${submittedQuery}` : "当前季度番表"}
            </h2>
            <div className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
              <CalendarDays aria-hidden className="h-4 w-4" />
              {visibleItems.length} / {items.length}
            </div>
          </div>

          {warnings.length > 0 ? (
            <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle aria-hidden className="mt-1 h-4 w-4 shrink-0" />
                <div>{warnings[0]}</div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-md border border-[var(--line)] bg-white">
              <Loader2 aria-hidden className="h-6 w-6 animate-spin text-[var(--accent)]" />
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="rounded-md border border-[var(--line)] bg-white p-8 text-center text-sm text-[var(--muted)]">
              没有匹配的动画
            </div>
          ) : (
            <div className="grid gap-3">
              {visibleItems.map((anime) => (
                <AnimeResultCard
                  anime={anime}
                  collectionStatus={collection.byAnimeId.get(anime.id)?.status}
                  key={anime.id}
                  onOpen={() => {
                    setDetail(null);
                    setSelectedId(anime.id);
                  }}
                  onRemoveCollection={() => void collection.remove(anime.id)}
                  onSetCollection={(status) => void collection.setStatus(anime, status)}
                  selected={selectedId === anime.id}
                />
              ))}
            </div>
          )}
        </section>

        <DetailPanel
          anime={panelAnime}
          collectionStatus={
            panelAnime ? collection.byAnimeId.get(panelAnime.id)?.status : undefined
          }
          loading={detailLoading}
          onClose={() => {
            setSelectedId(null);
            setDetail(null);
          }}
          onRemoveCollection={panelAnime ? () => void collection.remove(panelAnime.id) : undefined}
          onSetCollection={
            panelAnime ? (status) => void collection.setStatus(panelAnime, status) : undefined
          }
        />
      </section>
    </main>
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
      className={`grid grid-cols-[76px_minmax(0,1fr)_168px] gap-3 rounded-md border bg-[var(--panel)] p-3 shadow-sm transition-colors ${
        selected ? "border-[var(--accent)]" : "border-[var(--line)]"
      }`}
    >
      <Cover anime={anime} />
      <div className="min-w-0">
        <button className="block max-w-full text-left" onClick={onOpen} type="button">
          <h3 className="truncate text-base font-semibold">{animeTitle(anime)}</h3>
          {animeSubtitle(anime) ? (
            <p className="mt-1 truncate text-sm text-[var(--muted)]">{animeSubtitle(anime)}</p>
          ) : null}
        </button>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700">{anime.summary}</p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {anime.tags.slice(0, 4).map((tag) => (
            <span className="rounded bg-slate-100 px-2 py-1 text-slate-700" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 text-sm">
        <span className="rounded bg-[var(--accent-soft)] px-2 py-1 text-[var(--accent)]">
          {animeTypeLabels[anime.type]}
        </span>
        <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
          {animeStatusLabels[anime.status]}
        </span>
        <span className="inline-flex items-center gap-1 text-amber-600">
          <Star aria-hidden className="h-4 w-4" />
          {anime.score ? anime.score.toFixed(1) : "N/A"}
        </span>
        <CollectionControl
          current={collectionStatus}
          onRemove={onRemoveCollection}
          onSetStatus={onSetCollection}
        />
      </div>
    </article>
  );
}

function DetailPanel({
  anime,
  collectionStatus,
  loading,
  onClose,
  onRemoveCollection,
  onSetCollection
}: {
  anime: AnimeWork | null;
  collectionStatus?: CollectionStatus;
  loading: boolean;
  onClose: () => void;
  onRemoveCollection?: () => void;
  onSetCollection?: (status: CollectionStatus) => void;
}) {
  return (
    <aside className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto rounded-md border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">详情面板</h2>
        {anime ? (
          <button
            aria-label="关闭详情"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--line)]"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {!anime ? (
        <div className="rounded-md border border-dashed border-[var(--line)] p-6 text-center text-sm text-[var(--muted)]">
          选择一部动画
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
            <Cover anime={anime} />
            <div className="min-w-0">
              <h3 className="text-lg font-semibold leading-7">{animeTitle(anime)}</h3>
              {animeSubtitle(anime) ? (
                <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{animeSubtitle(anime)}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-[var(--accent-soft)] px-2 py-1 text-[var(--accent)]">
                  {animeTypeLabels[anime.type]}
                </span>
                <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                  {animeStatusLabels[anime.status]}
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              更新详情
            </div>
          ) : null}

          <CollectionControl
            current={collectionStatus}
            onRemove={onRemoveCollection}
            onSetStatus={onSetCollection}
          />

          <Tabs.Root className="grid gap-4" defaultValue="overview">
            <Tabs.List className="grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1 text-sm">
              <Tabs.Trigger
                className="rounded px-3 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                value="overview"
              >
                概览
              </Tabs.Trigger>
              <Tabs.Trigger
                className="rounded px-3 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                value="tags"
              >
                标签
              </Tabs.Trigger>
              <Tabs.Trigger
                className="rounded px-3 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                value="sources"
              >
                来源
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content className="grid gap-4" value="overview">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <InfoItem label="开播" value={anime.airDate ?? "未知"} />
                <InfoItem
                  label="季度"
                  value={anime.season ? animeSeasonLabels[anime.season] : "未知"}
                />
                <InfoItem
                  label="集数"
                  value={anime.episodeCount ? `${anime.episodeCount}` : "未知"}
                />
                <InfoItem label="评分" value={anime.score ? `${anime.score.toFixed(1)}` : "N/A"} />
              </dl>
              <p className="text-sm leading-6 text-slate-700">{anime.summary ?? "暂无简介"}</p>
            </Tabs.Content>

            <Tabs.Content className="flex flex-wrap gap-1.5 text-xs" value="tags">
              {anime.tags.map((tag) => (
                <span className="rounded bg-slate-100 px-2 py-1 text-slate-700" key={tag}>
                  {tag}
                </span>
              ))}
            </Tabs.Content>

            <Tabs.Content className="grid gap-2 text-sm" value="sources">
              {anime.sources.map((source) =>
                source.url ? (
                  <a
                    className="inline-flex items-center gap-2 text-[var(--accent)]"
                    href={source.url}
                    key={`${source.source}:${source.sourceId}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink aria-hidden className="h-4 w-4" />
                    {source.source} / {source.sourceId}
                  </a>
                ) : (
                  <span className="text-[var(--muted)]" key={`${source.source}:${source.sourceId}`}>
                    {source.source} / {source.sourceId}
                  </span>
                )
              )}
            </Tabs.Content>
          </Tabs.Root>
        </div>
      )}
    </aside>
  );
}

function CollectionControl({
  current,
  onRemove,
  onSetStatus
}: {
  current?: CollectionStatus;
  onRemove?: () => void;
  onSetStatus?: (status: CollectionStatus) => void;
}) {
  return (
    <div className="flex min-w-32 items-center gap-2">
      <HeadlessSelect
        label="收藏状态"
        onChange={(value) => {
          if (value === "none") {
            onRemove?.();
            return;
          }
          onSetStatus?.(value as CollectionStatus);
        }}
        options={[
          { label: "收藏", value: "none" },
          ...collectionStatusOptions.map((status) => ({
            label: collectionStatusLabels[status],
            value: status
          }))
        ]}
        size="compact"
        value={current ?? "none"}
      />
      {current ? (
        <button
          aria-label="移除收藏"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--line)]"
          onClick={onRemove}
          type="button"
        >
          <Heart aria-hidden className="h-4 w-4 fill-red-500 text-red-500" />
        </button>
      ) : null}
    </div>
  );
}

function Cover({ anime }: { anime: AnimeWork }) {
  return anime.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={animeTitle(anime)}
      className="aspect-[3/4] w-full rounded object-cover"
      src={anime.imageUrl}
    />
  ) : (
    <div className="flex aspect-[3/4] items-center justify-center rounded bg-[var(--accent-soft)] text-xs text-[var(--accent)]">
      {anime.type}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function sortAnime(left: AnimeWork, right: AnimeWork, sortMode: SortMode): number {
  if (sortMode === "score") {
    return (right.score ?? -1) - (left.score ?? -1);
  }

  if (sortMode === "title") {
    return animeTitle(left).localeCompare(animeTitle(right), "zh-Hans-CN");
  }

  return (left.airDate ?? "9999-99-99").localeCompare(right.airDate ?? "9999-99-99");
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function readRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(recentSearchKey);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string").slice(0, 6)
      : [];
  } catch {
    return [];
  }
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : "请求失败";
}
