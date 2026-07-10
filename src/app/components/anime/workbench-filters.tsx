"use client";

import { Database, RotateCcw, SlidersHorizontal } from "lucide-react";
import { animeStatusLabels, animeTypeLabels } from "@/lib/anime/display";
import type { ApiEnvelope } from "@/lib/anime/model";
import type { AnimeSortMode, AnimeStatusFilter, AnimeTypeFilter } from "@/lib/anime/query";
import { HeadlessSelect } from "@/lib/client/headless-select";
import { TagMultiSelect, type TagFilterOption } from "@/lib/client/tag-multi-select";
import { Tooltip } from "@/lib/client/tooltip";

export type SortMode = AnimeSortMode;
export type FilterType = AnimeTypeFilter;
export type FilterStatus = AnimeStatusFilter;

const typeOptions: FilterType[] = ["all", "TV", "Movie", "OVA", "ONA", "Special", "Music"];
const statusOptions: FilterStatus[] = ["all", "upcoming", "airing", "finished"];

export function WorkbenchFilters({
  cachedAt,
  onReset,
  onSortChange,
  onStatusChange,
  onTagsChange,
  onTypeChange,
  resultCount,
  sortMode,
  source,
  statusFilter,
  selectedTags,
  tagOptions,
  totalCount,
  typeFilter
}: {
  cachedAt: string | null;
  onReset: () => void;
  onSortChange: (sort: SortMode) => void;
  onStatusChange: (status: FilterStatus) => void;
  onTagsChange: (tags: string[]) => void;
  onTypeChange: (type: FilterType) => void;
  resultCount: number;
  sortMode: SortMode;
  source: ApiEnvelope<unknown>["source"];
  statusFilter: FilterStatus;
  selectedTags: string[];
  tagOptions: TagFilterOption[];
  totalCount: number;
  typeFilter: FilterType;
}) {
  const hasChanges =
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    selectedTags.length > 0 ||
    sortMode !== "airDate";

  return (
    <section aria-label="结果筛选" className="border-b border-[var(--line)] bg-white">
      <div className="mx-auto flex min-h-16 max-w-[1680px] items-center justify-between gap-5 px-6 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="mr-1 inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-[var(--body-muted)]">
            <SlidersHorizontal aria-hidden className="h-4 w-4 text-[var(--accent)]" />
            筛选
          </span>
          <div className="w-[122px]">
            <HeadlessSelect
              label="类型"
              labelVisible={false}
              onChange={onTypeChange}
              options={typeOptions.map((type) => ({
                label: type === "all" ? "全部类型" : animeTypeLabels[type],
                value: type
              }))}
              size="compact"
              value={typeFilter}
            />
          </div>
          <div className="w-[122px]">
            <HeadlessSelect
              label="状态"
              labelVisible={false}
              onChange={onStatusChange}
              options={statusOptions.map((status) => ({
                label: status === "all" ? "全部状态" : animeStatusLabels[status],
                value: status
              }))}
              size="compact"
              value={statusFilter}
            />
          </div>
          <div className="w-[176px]">
            <TagMultiSelect onChange={onTagsChange} options={tagOptions} value={selectedTags} />
          </div>
          <div className="w-[132px]">
            <HeadlessSelect
              label="排序"
              labelVisible={false}
              onChange={onSortChange}
              options={[
                { label: "开播时间", value: "airDate" },
                { label: "评分优先", value: "score" },
                { label: "标题顺序", value: "title" }
              ]}
              size="compact"
              value={sortMode}
            />
          </div>
          <Tooltip label="重置筛选">
            <button
              aria-label="重置筛选"
              className="grid h-9 w-9 place-items-center rounded-[6px] text-[var(--muted)] outline-none transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)] disabled:opacity-35"
              disabled={!hasChanges}
              onClick={onReset}
              type="button"
            >
              <RotateCcw aria-hidden className="h-4 w-4" />
            </button>
          </Tooltip>
          <span className="ml-1 shrink-0 text-xs tabular-nums text-[var(--muted)]">
            <strong className="font-semibold text-[var(--foreground)]">{resultCount}</strong> /{" "}
            {totalCount} 部
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3 text-[11px] text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5">
            <Database
              aria-hidden
              className={`h-3.5 w-3.5 ${source === "bangumi" ? "text-[var(--teal)]" : "text-[var(--amber)]"}`}
            />
            {source === "bangumi" ? "Bangumi" : "离线样例"}
          </span>
          {cachedAt ? <span>更新于 {formatTime(cachedAt)}</span> : null}
        </div>
      </div>
    </section>
  );
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
