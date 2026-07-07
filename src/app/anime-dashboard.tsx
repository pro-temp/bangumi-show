"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  animeSeasonLabels,
  animeStatusLabels,
  animeSubtitle,
  animeTitle,
  animeTypeLabels
} from "@/lib/anime/display";
import type {
  AnimeSeason,
  AnimeStatus,
  AnimeType,
  AnimeWork,
  ApiEnvelope
} from "@/lib/anime/model";
import { currentSeason, seasonLabel } from "@/lib/anime/season";
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
type ScheduleSelection = {
  year: number;
  season: AnimeSeason;
};

const recentSearchKey = "bangumi-show:recent-searches";

const typeOptions: FilterType[] = ["all", "TV", "Movie", "OVA", "ONA", "Special", "Music"];
const statusOptions: FilterStatus[] = ["all", "upcoming", "airing", "finished"];
const scheduleSeasonOptions: { label: string; value: AnimeSeason }[] = [
  { label: "冬番（1-3 月）", value: "winter" },
  { label: "春番（4-6 月）", value: "spring" },
  { label: "夏番（7-9 月）", value: "summer" },
  { label: "秋番（10-12 月）", value: "fall" }
];

export function AnimeDashboard() {
  const initialSchedule = useMemo(() => currentSeason(new Date()), []);
  const collection = useCollection();
  const listRequestId = useRef(0);
  const detailCache = useRef(new Map<string, AnimeWork>());
  const [items, setItems] = useState<AnimeWork[]>([]);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [scheduleYear, setScheduleYear] = useState(String(initialSchedule.year));
  const [scheduleSeason, setScheduleSeason] = useState<AnimeSeason>(initialSchedule.season);
  const [activeSchedule, setActiveSchedule] = useState<ScheduleSelection>({
    year: initialSchedule.year,
    season: initialSchedule.season
  });
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
  const yearOptions = useMemo(() => buildYearOptions(initialSchedule.year), [initialSchedule.year]);

  const visibleItems = useMemo(() => {
    return items
      .filter((anime) => typeFilter === "all" || anime.type === typeFilter)
      .filter((anime) => statusFilter === "all" || anime.status === statusFilter)
      .filter((anime) => tagFilter === "all" || anime.tags.includes(tagFilter))
      .sort((left, right) => sortAnime(left, right, sortMode));
  }, [items, sortMode, statusFilter, tagFilter, typeFilter]);
  const panelAnime = detail ?? items.find((anime) => anime.id === selectedId) ?? null;
  const isRefreshing = loading && items.length > 0;
  const listTitle = submittedQuery
    ? `搜索：${submittedQuery}`
    : scheduleHeading(activeSchedule, initialSchedule);

  const selectAnime = useCallback((anime: AnimeWork | undefined) => {
    if (!anime) {
      setSelectedId(null);
      setDetail(null);
      setDetailLoading(false);
      return;
    }

    const cached = detailCache.current.get(anime.id);
    setSelectedId(anime.id);
    setDetail(cached ?? null);
    setDetailLoading(!cached);
  }, []);

  const loadSchedule = useCallback(
    async (nextSchedule: ScheduleSelection) => {
      const requestId = listRequestId.current + 1;
      listRequestId.current = requestId;
      setLoading(true);
      setError(null);
      setSubmittedQuery("");

      try {
        const result = await fetchSchedule(nextSchedule);
        if (requestId !== listRequestId.current) {
          return;
        }
        setItems(result.data.items);
        setActiveSchedule({
          year: result.data.year,
          season: result.data.season
        });
        applyEnvelopeMeta(result);
        selectAnime(result.data.items[0]);
      } catch (reason) {
        if (requestId === listRequestId.current) {
          setError(errorMessage(reason));
        }
      } finally {
        if (requestId === listRequestId.current) {
          setLoading(false);
        }
      }
    },
    [applyEnvelopeMeta, selectAnime]
  );

  useEffect(() => {
    void Promise.resolve().then(() => {
      setRecentSearches(readRecentSearches());
      return loadSchedule({
        year: initialSchedule.year,
        season: initialSchedule.season
      });
    });
  }, [initialSchedule.season, initialSchedule.year, loadSchedule]);

  function updateScheduleSelection(next: Partial<{ year: string; season: AnimeSeason }>) {
    const year = Number(next.year ?? scheduleYear);
    const season = next.season ?? scheduleSeason;

    if (next.year) {
      setScheduleYear(next.year);
    }
    if (next.season) {
      setScheduleSeason(next.season);
    }

    void loadSchedule({ year, season });
  }

  async function runSearch(nextQuery: string) {
    const requestId = listRequestId.current + 1;
    listRequestId.current = requestId;
    setLoading(true);
    setError(null);
    setSubmittedQuery(nextQuery.trim());

    try {
      const result = await searchAnime(nextQuery);
      if (requestId !== listRequestId.current) {
        return;
      }
      setItems(result.data);
      applyEnvelopeMeta(result);
      selectAnime(result.data[0]);

      if (nextQuery.trim()) {
        const nextRecent = [
          nextQuery.trim(),
          ...recentSearches.filter((item) => item !== nextQuery.trim())
        ].slice(0, 6);
        setRecentSearches(nextRecent);
        window.localStorage.setItem(recentSearchKey, JSON.stringify(nextRecent));
      }
    } catch (reason) {
      if (requestId === listRequestId.current) {
        setError(errorMessage(reason));
      }
    } finally {
      if (requestId === listRequestId.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    const cached = detailCache.current.get(selectedId);
    if (cached) {
      setDetail(cached);
      setDetailLoading(false);
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
          detailCache.current.set(selectedId, result.data);
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
    <MotionConfig reducedMotion="user" transition={{ duration: 0.18, ease: "easeOut" }}>
      <main className="min-h-screen min-w-[1280px] bg-[var(--background)]">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-[var(--line)] bg-[var(--chrome)]"
          initial={{ opacity: 0, y: -8 }}
        >
          <div className="mx-auto flex w-full max-w-[1580px] flex-col gap-4 px-8 py-4">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h1 className="text-[26px] font-semibold leading-none tracking-normal text-[var(--foreground)]">
                  Bangumi Show
                </h1>
                <p className="mt-2 text-sm text-[var(--muted)]">季度番表、查询与本地状态标记</p>
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
                <span className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
                  已加载 {activeSchedule.year} / {seasonLabel(activeSchedule.season)}
                </span>
                <Link
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 font-medium text-[var(--foreground)] shadow-sm transition-colors hover:border-[var(--accent)]"
                  href="/collection"
                >
                  <BookmarkCheck aria-hidden className="h-4 w-4" />
                  收藏
                </Link>
              </div>
            </div>

            <form
              className="grid grid-cols-[minmax(520px,1fr)_292px_96px_96px] items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void runSearch(query);
              }}
            >
              <label className="flex h-11 min-w-0 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 shadow-sm transition-colors focus-within:border-[var(--accent)]">
                <Search aria-hidden className="h-5 w-5 shrink-0 text-[var(--muted)]" />
                <span className="sr-only">搜索动画</span>
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none placeholder:text-slate-400"
                  name="q"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索中文名、日文名、罗马音或别名"
                  type="search"
                  value={query}
                />
              </label>
              <div className="grid grid-cols-[118px_166px] gap-2">
                <HeadlessSelect
                  label="年份"
                  onChange={(value) => updateScheduleSelection({ year: value })}
                  options={yearOptions.map((year) => ({
                    label: `${year} 年`,
                    value: year
                  }))}
                  size="compact"
                  value={scheduleYear}
                />
                <HeadlessSelect
                  label="季度"
                  onChange={(value) => updateScheduleSelection({ season: value })}
                  options={scheduleSeasonOptions}
                  size="compact"
                  value={scheduleSeason}
                />
              </div>
              <motion.button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--accent-strong)]"
                type="submit"
                whileTap={{ scale: 0.98 }}
              >
                <Search aria-hidden className="h-4 w-4" />
                搜索
              </motion.button>
              <motion.button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold shadow-sm transition-colors hover:border-[var(--accent)]"
                onClick={() => {
                  setQuery("");
                  void loadSchedule({ year: Number(scheduleYear), season: scheduleSeason });
                }}
                type="button"
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw aria-hidden className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                番表
              </motion.button>
            </form>

            {recentSearches.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                  最近
                </span>
                {recentSearches.map((item) => (
                  <button
                    className="rounded-md border border-transparent bg-[var(--surface)] px-3 py-1.5 text-[var(--muted)] transition-colors hover:border-[var(--line)] hover:text-[var(--foreground)]"
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
        </motion.section>

        <section className="mx-auto grid w-full max-w-[1580px] grid-cols-[248px_minmax(660px,1fr)_440px] gap-4 px-8 py-4">
          <aside className="sticky top-4 self-start rounded-md border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal aria-hidden className="h-4 w-4 text-[var(--accent)]" />
                筛选
              </div>
              <span className="text-xs text-[var(--muted)]">{visibleItems.length} 条</span>
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
            <div className="mb-3 flex h-10 items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold leading-6">{listTitle}</h2>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  {visibleItems.length} 条可见 / {items.length} 条结果
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--muted)]">
                <CalendarDays aria-hidden className="h-4 w-4" />
                {activeSchedule.year} {seasonLabel(activeSchedule.season)}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {warnings.length > 0 ? (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800"
                  exit={{ opacity: 0, y: -6 }}
                  initial={{ opacity: 0, y: -6 }}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle aria-hidden className="mt-1 h-4 w-4 shrink-0" />
                    <div>{warnings[0]}</div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {isRefreshing ? <RefreshBar /> : null}

            {loading && items.length === 0 ? (
              <ResultSkeletonList />
            ) : visibleItems.length === 0 ? (
              <div className="rounded-md border border-dashed border-[var(--line)] bg-white p-10 text-center text-sm text-[var(--muted)]">
                没有匹配的动画
              </div>
            ) : (
              <motion.div
                animate={{ opacity: isRefreshing ? 0.58 : 1 }}
                className="grid gap-2"
                transition={{ duration: 0.16 }}
              >
                <AnimatePresence initial={false}>
                  {visibleItems.map((anime) => (
                    <AnimeResultCard
                      anime={anime}
                      collectionStatus={collection.byAnimeId.get(anime.id)?.status}
                      key={anime.id}
                      onOpen={() => selectAnime(anime)}
                      onRemoveCollection={() => void collection.remove(anime.id)}
                      onSetCollection={(status) => void collection.setStatus(anime, status)}
                      selected={selectedId === anime.id}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </section>

          <DetailPanel
            anime={panelAnime}
            collectionStatus={
              panelAnime ? collection.byAnimeId.get(panelAnime.id)?.status : undefined
            }
            loading={detailLoading}
            onClose={() => selectAnime(undefined)}
            onRemoveCollection={
              panelAnime ? () => void collection.remove(panelAnime.id) : undefined
            }
            onSetCollection={
              panelAnime ? (status) => void collection.setStatus(panelAnime, status) : undefined
            }
          />
        </section>
      </main>
    </MotionConfig>
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
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className={`result-row group grid cursor-pointer grid-cols-[70px_minmax(0,1fr)_94px_118px] gap-3 rounded-md border-l-4 border-r border-t border-b bg-[var(--panel)] px-3 py-3 shadow-sm outline-none transition-colors ${
        selected
          ? "border-b-[var(--line)] border-l-[var(--accent)] border-r-[var(--line)] border-t-[var(--line)] bg-[var(--selected)]"
          : "border-b-[var(--line)] border-l-transparent border-r-[var(--line)] border-t-[var(--line)] hover:border-l-[var(--accent)]"
      }`}
      exit={{ opacity: 0, y: 8 }}
      initial={{ opacity: 0, y: 8 }}
      layout
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      tabIndex={0}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.995 }}
    >
      <Cover anime={anime} />
      <div className="min-w-0">
        <button
          className="block max-w-full text-left outline-none"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          type="button"
        >
          <h3 className="truncate text-[15px] font-semibold leading-5 text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
            {animeTitle(anime)}
          </h3>
          {animeSubtitle(anime) ? (
            <p className="mt-0.5 truncate text-[13px] text-[var(--muted)]">
              {animeSubtitle(anime)}
            </p>
          ) : null}
        </button>
        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[var(--body-muted)]">
          {anime.summary}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
          {anime.tags.slice(0, 3).map((tag) => (
            <span className="rounded bg-[var(--surface)] px-2 py-1 text-[var(--muted)]" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 text-sm">
        <span className="rounded bg-[var(--accent-soft)] px-2 py-1 text-xs font-medium text-[var(--accent)]">
          {animeTypeLabels[anime.type]}
        </span>
        <span className="rounded bg-[var(--surface)] px-2 py-1 text-xs text-[var(--muted)]">
          {anime.airDate ?? animeStatusLabels[anime.status]}
        </span>
        <span className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
          <Star aria-hidden className="h-4 w-4" />
          {anime.score ? anime.score.toFixed(1) : "N/A"}
        </span>
      </div>
      <div className="flex items-center justify-end">
        <CollectionControl
          current={collectionStatus}
          labelVisible={false}
          onRemove={onRemoveCollection}
          onSetStatus={onSetCollection}
        />
      </div>
    </motion.article>
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
    <aside className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto rounded-md border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">详情面板</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            {loading && anime ? "更新详情中" : "保留当前列表上下文"}
          </p>
        </div>
        {anime ? (
          <button
            aria-label="关闭详情"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--line)] bg-white transition-colors hover:border-[var(--accent)]"
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
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="grid gap-4"
          initial={{ opacity: 0, x: 8 }}
          key={anime.id}
        >
          <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
            <Cover anime={anime} />
            <div className="min-w-0">
              <h3 className="text-lg font-semibold leading-7">{animeTitle(anime)}</h3>
              {animeSubtitle(anime) ? (
                <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{animeSubtitle(anime)}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-[var(--accent-soft)] px-2 py-1 font-medium text-[var(--accent)]">
                  {animeTypeLabels[anime.type]}
                </span>
                <span className="rounded bg-[var(--surface)] px-2 py-1 text-[var(--muted)]">
                  {animeStatusLabels[anime.status]}
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 font-medium text-amber-700">
                  <Star aria-hidden className="h-3.5 w-3.5" />
                  {anime.score ? anime.score.toFixed(1) : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {loading ? <InlineLoading label="更新详情" /> : null}

          <CollectionControl
            current={collectionStatus}
            onRemove={onRemoveCollection}
            onSetStatus={onSetCollection}
          />

          <Tabs.Root className="grid gap-4" defaultValue="overview">
            <Tabs.List className="grid grid-cols-3 gap-1 rounded-md bg-[var(--surface)] p-1 text-sm">
              <Tabs.Trigger
                className="rounded px-3 py-2 text-[var(--muted)] transition-colors data-[state=active]:bg-white data-[state=active]:text-[var(--foreground)] data-[state=active]:shadow-sm"
                value="overview"
              >
                概览
              </Tabs.Trigger>
              <Tabs.Trigger
                className="rounded px-3 py-2 text-[var(--muted)] transition-colors data-[state=active]:bg-white data-[state=active]:text-[var(--foreground)] data-[state=active]:shadow-sm"
                value="tags"
              >
                标签
              </Tabs.Trigger>
              <Tabs.Trigger
                className="rounded px-3 py-2 text-[var(--muted)] transition-colors data-[state=active]:bg-white data-[state=active]:text-[var(--foreground)] data-[state=active]:shadow-sm"
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
              <p className="text-sm leading-6 text-[var(--body-muted)]">
                {anime.summary ?? "暂无简介"}
              </p>
            </Tabs.Content>

            <Tabs.Content className="flex flex-wrap gap-1.5 text-xs" value="tags">
              {anime.tags.map((tag) => (
                <span
                  className="rounded bg-[var(--surface)] px-2 py-1 text-[var(--muted)]"
                  key={tag}
                >
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
        </motion.div>
      )}
    </aside>
  );
}

function CollectionControl({
  current,
  labelVisible = true,
  onRemove,
  onSetStatus
}: {
  current?: CollectionStatus;
  labelVisible?: boolean;
  onRemove?: () => void;
  onSetStatus?: (status: CollectionStatus) => void;
}) {
  return (
    <div className="flex min-w-28 items-center gap-2" onClick={(event) => event.stopPropagation()}>
      <HeadlessSelect
        label="收藏状态"
        labelVisible={labelVisible}
        onChange={(value) => {
          if (value === "none") {
            onRemove?.();
            return;
          }
          onSetStatus?.(value as CollectionStatus);
        }}
        options={[
          { label: "未收藏", value: "none" },
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
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--line)] bg-white transition-colors hover:border-red-300"
          onClick={onRemove}
          type="button"
        >
          <Heart aria-hidden className="h-4 w-4 fill-red-500 text-red-500" />
        </button>
      ) : null}
    </div>
  );
}

function RefreshBar() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 overflow-hidden rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--muted)] shadow-sm"
      initial={{ opacity: 0, y: -6 }}
    >
      <div className="flex items-center gap-2">
        <Loader2 aria-hidden className="h-4 w-4 animate-spin text-[var(--accent)]" />
        正在更新列表
      </div>
      <motion.div
        animate={{ x: ["-35%", "135%"] }}
        className="mt-2 h-0.5 w-1/3 rounded-full bg-[var(--accent)]"
        transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity }}
      />
    </motion.div>
  );
}

function ResultSkeletonList() {
  return (
    <div className="grid gap-2">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          className="grid grid-cols-[70px_minmax(0,1fr)_94px_118px] gap-3 rounded-md border border-[var(--line)] bg-white px-3 py-3 shadow-sm"
          key={index}
        >
          <div className="skeleton-block aspect-[3/4] rounded" />
          <div className="grid content-start gap-2 py-1">
            <div className="skeleton-block h-4 w-2/5 rounded" />
            <div className="skeleton-block h-3 w-1/3 rounded" />
            <div className="skeleton-block mt-1 h-3 w-11/12 rounded" />
            <div className="skeleton-block h-3 w-3/4 rounded" />
            <div className="flex gap-2 pt-1">
              <div className="skeleton-block h-6 w-12 rounded" />
              <div className="skeleton-block h-6 w-16 rounded" />
              <div className="skeleton-block h-6 w-12 rounded" />
            </div>
          </div>
          <div className="grid content-start justify-items-end gap-2 py-1">
            <div className="skeleton-block h-6 w-12 rounded" />
            <div className="skeleton-block h-6 w-20 rounded" />
          </div>
          <div className="flex items-center justify-end">
            <div className="skeleton-block h-9 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function InlineLoading({ label }: { label: string }) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="inline-flex items-center gap-2 rounded-md bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)]"
      initial={{ opacity: 0 }}
    >
      <Loader2 aria-hidden className="h-4 w-4 animate-spin text-[var(--accent)]" />
      {label}
    </motion.div>
  );
}

function Cover({ anime }: { anime: AnimeWork }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return anime.imageUrl && !failed ? (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded bg-[var(--surface)]">
      {!loaded ? <CoverPlaceholder anime={anime} /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={animeTitle(anime)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        decoding="async"
        loading="lazy"
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        src={anime.imageUrl}
      />
    </div>
  ) : (
    <CoverPlaceholder anime={anime} />
  );
}

function CoverPlaceholder({ anime }: { anime: AnimeWork }) {
  return (
    <div className="flex h-full min-h-full w-full flex-col items-center justify-center rounded bg-[var(--surface)] text-center text-xs text-[var(--muted)]">
      <span className="font-semibold text-[var(--accent)]">{anime.type}</span>
      <span className="mt-1 px-1 leading-4">NO IMAGE</span>
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

function buildYearOptions(currentYear: number): string[] {
  const firstYear = 1990;
  const lastYear = currentYear + 1;

  return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => String(lastYear - index));
}

function scheduleHeading(active: ScheduleSelection, current: ScheduleSelection): string {
  if (active.year === current.year && active.season === current.season) {
    return "当前季度番表";
  }

  return `${active.year} 年 ${seasonLabel(active.season)}`;
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : "请求失败";
}
