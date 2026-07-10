"use client";

import { AlertCircle, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { MotionConfig } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimeDetailPanel } from "@/app/components/anime/anime-detail-panel";
import { AnimeResultList } from "@/app/components/anime/anime-result-list";
import {
  type FilterStatus,
  type FilterType,
  type SortMode,
  WorkbenchFilters
} from "@/app/components/anime/workbench-filters";
import type { AnimeSeason, AnimeWork, ApiEnvelope } from "@/lib/anime/model";
import { queryAnimeList } from "@/lib/anime/query";
import { currentSeason, seasonLabel, shiftSeason } from "@/lib/anime/season";
import { fetchAnimeDetail, fetchSchedule, searchAnime } from "@/lib/client/anime-api";
import { HeadlessSelect } from "@/lib/client/headless-select";
import { Tooltip } from "@/lib/client/tooltip";
import { useCollection } from "@/lib/client/use-collection";
import type { CollectionStatus } from "@/lib/platform/collection-repository";
import { WebRecentSearchRepository } from "@/lib/platform/web-recent-search-repository";

type ScheduleSelection = {
  year: number;
  season: AnimeSeason;
};

const scheduleSeasonOptions: { label: string; value: AnimeSeason }[] = [
  { label: "冬番（1-3 月）", value: "winter" },
  { label: "春番（4-6 月）", value: "spring" },
  { label: "夏番（7-9 月）", value: "summer" },
  { label: "秋番（10-12 月）", value: "fall" }
];

export function AnimeDashboard() {
  const initialSchedule = useMemo(() => currentSeason(new Date()), []);
  const recentSearchRepository = useMemo(() => new WebRecentSearchRepository(), []);
  const collection = useCollection();
  const searchInputRef = useRef<HTMLInputElement>(null);
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("airDate");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AnimeWork | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [source, setSource] = useState<ApiEnvelope<unknown>["source"]>("sample");
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    recentSearchRepository.list()
  );

  const yearOptions = useMemo(() => buildYearOptions(initialSchedule.year), [initialSchedule.year]);
  const tagOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const anime of items) {
      for (const tag of anime.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort(
        (left, right) =>
          right.count - left.count || left.value.localeCompare(right.value, "zh-Hans-CN")
      );
  }, [items]);
  const visibleItems = useMemo(
    () =>
      queryAnimeList(items, {
        type: typeFilter,
        status: statusFilter,
        tags: selectedTags,
        sort: sortMode
      }),
    [items, selectedTags, sortMode, statusFilter, typeFilter]
  );
  const panelAnime = detail ?? items.find((anime) => anime.id === selectedId) ?? null;
  const listTitle = submittedQuery
    ? `搜索：${submittedQuery}`
    : scheduleHeading(activeSchedule, initialSchedule);
  const isRefreshing = loading && items.length > 0;

  const applyEnvelopeMeta = useCallback(<T,>(result: ApiEnvelope<T>) => {
    setWarnings(result.warnings);
    setSource(result.source);
    setCachedAt(result.cachedAt);
  }, []);

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
      const requestId = ++listRequestId.current;
      setLoading(true);
      setError(null);
      setSubmittedQuery("");

      try {
        const result = await fetchSchedule(nextSchedule);
        if (requestId !== listRequestId.current) {
          return;
        }

        setItems(result.data.items);
        setSelectedTags((current) =>
          current.filter((tag) => result.data.items.some((anime) => anime.tags.includes(tag)))
        );
        setActiveSchedule({ year: result.data.year, season: result.data.season });
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
    void Promise.resolve().then(() =>
      loadSchedule({ year: initialSchedule.year, season: initialSchedule.season })
    );
  }, [initialSchedule.season, initialSchedule.year, loadSchedule]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (event.key !== "/" || target?.matches("input, textarea, [contenteditable='true']")) {
        return;
      }

      event.preventDefault();
      searchInputRef.current?.focus();
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

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
    void fetchAnimeDetail(selectedId)
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (result.data) {
          detailCache.current.set(selectedId, result.data);
          setDetail(result.data);
        }
        setWarnings((current) => [...new Set([...current, ...result.warnings])]);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setWarnings((current) => [...new Set([...current, errorMessage(reason)])]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDetailLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  function openSchedule(next: ScheduleSelection) {
    setScheduleYear(String(next.year));
    setScheduleSeason(next.season);
    setQuery("");
    void loadSchedule(next);
  }

  function updateScheduleSelection(next: Partial<{ year: string; season: AnimeSeason }>) {
    openSchedule({
      year: Number(next.year ?? scheduleYear),
      season: next.season ?? scheduleSeason
    });
  }

  async function runSearch(nextQuery: string) {
    const normalizedQuery = nextQuery.trim();
    if (!normalizedQuery) {
      openSchedule({ year: Number(scheduleYear), season: scheduleSeason });
      return;
    }

    const requestId = ++listRequestId.current;
    setLoading(true);
    setError(null);
    setSubmittedQuery(normalizedQuery);

    try {
      const result = await searchAnime(normalizedQuery);
      if (requestId !== listRequestId.current) {
        return;
      }

      setItems(result.data);
      setSelectedTags((current) =>
        current.filter((tag) => result.data.some((anime) => anime.tags.includes(tag)))
      );
      applyEnvelopeMeta(result);
      selectAnime(result.data[0]);
      setRecentSearches(recentSearchRepository.add(normalizedQuery));
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

  function resetFilters() {
    setTypeFilter("all");
    setStatusFilter("all");
    setSelectedTags([]);
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen bg-[var(--background)]">
        <header className="border-b border-[var(--line)] bg-[var(--chrome)] px-6 py-5">
          <div className="mx-auto max-w-[1680px]">
            <div className="mb-4 flex items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-semibold">番剧发现</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {activeSchedule.year} 年 {seasonLabel(activeSchedule.season)} · {items.length} 部
                </p>
              </div>
              <span className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--teal)]" />
                日本动画
              </span>
            </div>

            <form
              className="grid grid-cols-[minmax(420px,1fr)_44px_116px_164px_44px_72px_92px] items-stretch gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void runSearch(query);
              }}
            >
              <label className="flex h-11 min-w-0 items-center gap-2 rounded-[6px] border border-[var(--line-strong)] bg-white px-3 shadow-sm transition-[border-color,box-shadow] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)]">
                <Search aria-hidden className="h-[18px] w-[18px] shrink-0 text-[var(--muted)]" />
                <span className="sr-only">搜索动画</span>
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-[#9aa0a7]"
                  name="q"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索中文名、日文名、罗马音或别名"
                  ref={searchInputRef}
                  type="search"
                  value={query}
                />
                {query ? (
                  <button
                    aria-label="清空搜索"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                    onClick={() => setQuery("")}
                    type="button"
                  >
                    <X aria-hidden className="h-4 w-4" />
                  </button>
                ) : null}
              </label>

              <Tooltip label="上一季度">
                <button
                  aria-label="上一季度"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[6px] border border-[var(--line-strong)] bg-white text-[var(--muted)] hover:border-[var(--muted)] hover:text-[var(--foreground)]"
                  onClick={() =>
                    openSchedule(
                      shiftSeason({ year: Number(scheduleYear), season: scheduleSeason }, -1)
                    )
                  }
                  type="button"
                >
                  <ChevronLeft aria-hidden className="h-4 w-4" />
                </button>
              </Tooltip>
              <HeadlessSelect
                label="年份"
                labelVisible={false}
                onChange={(value) => updateScheduleSelection({ year: value })}
                options={yearOptions.map((year) => ({ label: `${year} 年`, value: year }))}
                size="large"
                value={scheduleYear}
              />
              <HeadlessSelect
                label="季度"
                labelVisible={false}
                onChange={(value) => updateScheduleSelection({ season: value })}
                options={scheduleSeasonOptions}
                size="large"
                value={scheduleSeason}
              />
              <Tooltip label="下一季度">
                <button
                  aria-label="下一季度"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[6px] border border-[var(--line-strong)] bg-white text-[var(--muted)] hover:border-[var(--muted)] hover:text-[var(--foreground)]"
                  onClick={() =>
                    openSchedule(
                      shiftSeason({ year: Number(scheduleYear), season: scheduleSeason }, 1)
                    )
                  }
                  type="button"
                >
                  <ChevronRight aria-hidden className="h-4 w-4" />
                </button>
              </Tooltip>
              <button
                className="h-11 rounded-[6px] border border-[var(--line-strong)] bg-white px-3 text-sm font-medium hover:border-[var(--muted)]"
                onClick={() =>
                  openSchedule({ year: initialSchedule.year, season: initialSchedule.season })
                }
                type="button"
              >
                本季
              </button>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[6px] bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--accent-strong)]"
                type="submit"
              >
                <Search aria-hidden className="h-4 w-4" />
                搜索
              </button>
            </form>

            {recentSearches.length > 0 ? (
              <div className="mt-3 flex h-7 items-center gap-2 overflow-hidden text-xs">
                <span className="shrink-0 text-[var(--muted)]">最近搜索</span>
                {recentSearches.map((item) => (
                  <button
                    className="shrink-0 rounded-[4px] bg-[var(--surface)] px-2 py-1 text-[var(--body-muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
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
                <button
                  className="ml-1 shrink-0 text-[var(--muted)] hover:text-[var(--foreground)]"
                  onClick={() => {
                    recentSearchRepository.clear();
                    setRecentSearches([]);
                  }}
                  type="button"
                >
                  清除
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <WorkbenchFilters
          cachedAt={cachedAt}
          onReset={resetFilters}
          onSortChange={setSortMode}
          onStatusChange={setStatusFilter}
          onTagsChange={setSelectedTags}
          onTypeChange={setTypeFilter}
          resultCount={visibleItems.length}
          sortMode={sortMode}
          source={source}
          statusFilter={statusFilter}
          selectedTags={selectedTags}
          tagOptions={tagOptions}
          totalCount={items.length}
          typeFilter={typeFilter}
        />

        <section className="mx-auto grid max-w-[1680px] grid-cols-[minmax(620px,1fr)_420px] items-start gap-5 px-6 py-5">
          <div className="min-w-0">
            <div className="mb-3 flex h-10 items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">{listTitle}</h2>
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  {submittedQuery
                    ? `按相关度返回 ${items.length} 部作品`
                    : "按开播日期浏览本季度作品"}
                </p>
              </div>
            </div>

            {warnings.length > 0 ? (
              <div className="mb-3 flex items-start gap-2 border border-[#edd7a9] bg-[var(--amber-soft)] px-3 py-2 text-xs leading-5 text-[#765016]">
                <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{warnings[0]}</span>
              </div>
            ) : null}
            {error ? (
              <div className="mb-3 border border-[#efc6c2] bg-[var(--accent-soft)] px-3 py-2 text-xs text-[var(--danger)]">
                {error}
              </div>
            ) : null}

            <AnimeResultList
              collectionByAnimeId={collection.byAnimeId}
              items={visibleItems}
              loading={loading}
              onOpen={selectAnime}
              onRemoveCollection={(animeId) => void collection.remove(animeId)}
              onResetFilters={resetFilters}
              onSetCollection={(anime, status) => void collection.setStatus(anime, status)}
              refreshing={isRefreshing}
              selectedId={selectedId}
            />
          </div>

          <AnimeDetailPanel
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
              panelAnime
                ? (status: CollectionStatus) => void collection.setStatus(panelAnime, status)
                : undefined
            }
          />
        </section>
      </main>
    </MotionConfig>
  );
}

function buildYearOptions(currentYear: number): string[] {
  const firstYear = 1990;
  const lastYear = currentYear + 1;
  return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => String(lastYear - index));
}

function scheduleHeading(active: ScheduleSelection, current: ScheduleSelection): string {
  return active.year === current.year && active.season === current.season
    ? "当前季度番表"
    : `${active.year} 年 ${seasonLabel(active.season)}`;
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : "请求失败";
}
