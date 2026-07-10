"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { ArrowUpRight, Download, LibraryBig, Search, Trash2, Upload, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { CoverImage } from "@/app/components/anime/anime-cover";
import { animeSeasonLabels, animeTypeLabels } from "@/lib/anime/display";
import { CollectionStatusSelect } from "@/lib/client/collection-status-select";
import { CopyTitleButton } from "@/lib/client/copy-title-button";
import { HeadlessSelect } from "@/lib/client/headless-select";
import { Tooltip } from "@/lib/client/tooltip";
import {
  collectionStatusLabels,
  collectionStatusOptions,
  useCollection
} from "@/lib/client/use-collection";
import type { CollectionItem, CollectionStatus } from "@/lib/platform/collection-repository";

type StatusFilter = "all" | CollectionStatus;
type CollectionSort = "updatedAt" | "title" | "year";

const statusTabs: { label: string; value: StatusFilter }[] = [
  { label: "全部", value: "all" },
  ...collectionStatusOptions.map((status) => ({
    label: collectionStatusLabels[status],
    value: status
  }))
];

export function CollectionClient() {
  const { items, ready, remove, replace, updateStatus } = useCollection();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<CollectionSort>("updatedAt");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<CollectionItem[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const counts = useMemo(
    () =>
      new Map<StatusFilter, number>([
        ["all", items.length],
        ...collectionStatusOptions.map(
          (status) =>
            [status, items.filter((item) => item.status === status).length] as [
              StatusFilter,
              number
            ]
        )
      ]),
    [items]
  );
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return items
      .filter((item) => statusFilter === "all" || item.status === statusFilter)
      .filter(
        (item) =>
          !normalizedQuery || item.titleSnapshot.toLocaleLowerCase().includes(normalizedQuery)
      )
      .sort((left, right) => sortCollection(left, right, sortMode));
  }, [items, query, sortMode, statusFilter]);

  function exportCollection() {
    const blob = new Blob([JSON.stringify(items, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bangumi-show-collection-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`已导出 ${items.length} 个条目`);
  }

  async function prepareImport(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error("收藏文件必须是 JSON 数组");
      }

      const validItems = parsed.filter(isCollectionItem);
      if (parsed.length > 0 && validItems.length === 0) {
        throw new Error("文件中没有有效的收藏条目");
      }

      const uniqueItems = [...new Map(validItems.map((item) => [item.animeId, item])).values()];
      setPendingImport(uniqueItems);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导入失败");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function confirmImport() {
    if (!pendingImport) {
      return;
    }

    await replace(pendingImport);
    setMessage(`已导入 ${pendingImport.length} 个条目`);
    setPendingImport(null);
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--line)] bg-[var(--chrome)] px-6 py-5">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold">我的收藏</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {ready ? `${items.length} 部番剧` : "正在读取本地资料库"}
            </p>
          </div>
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-[6px] bg-[var(--accent)] px-4 text-sm font-semibold !text-white shadow-sm transition-colors hover:bg-[var(--accent-strong)]"
            href="/"
          >
            <Search aria-hidden className="h-4 w-4" />
            继续发现
          </Link>
        </div>
      </header>

      <section className="border-b border-[var(--line)] bg-white px-6" aria-label="收藏状态概览">
        <div className="mx-auto grid max-w-[1680px] grid-cols-6 divide-x divide-[var(--line)] border-x border-[var(--line)]">
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button
                aria-pressed={active}
                className={`relative flex h-[72px] items-center justify-between px-5 text-left transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 ${
                  active
                    ? "bg-[var(--selected)] after:bg-[var(--accent)]"
                    : "after:bg-transparent hover:bg-[var(--surface)]"
                }`}
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                type="button"
              >
                <span
                  className={`text-xs ${active ? "font-semibold text-[var(--accent-strong)]" : "text-[var(--muted)]"}`}
                >
                  {tab.label}
                </span>
                <strong className="text-xl font-semibold tabular-nums">
                  {counts.get(tab.value) ?? 0}
                </strong>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-6 py-5">
        <div className="mb-4 flex items-center gap-3">
          <label className="flex h-10 min-w-[360px] max-w-[560px] flex-1 items-center gap-2 rounded-[6px] border border-[var(--line-strong)] bg-white px-3 transition-[border-color,box-shadow] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)]">
            <Search aria-hidden className="h-4 w-4 text-[var(--muted)]" />
            <span className="sr-only">搜索收藏</span>
            <input
              className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-[#9aa0a7]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索收藏标题"
              type="search"
              value={query}
            />
            {query ? (
              <button
                aria-label="清空收藏搜索"
                className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-[var(--muted)] hover:bg-[var(--surface)]"
                onClick={() => setQuery("")}
                type="button"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            ) : null}
          </label>

          <div className="w-40">
            <HeadlessSelect
              label="收藏排序"
              labelVisible={false}
              onChange={setSortMode}
              options={[
                { label: "最近更新", value: "updatedAt" },
                { label: "标题顺序", value: "title" },
                { label: "年份倒序", value: "year" }
              ]}
              value={sortMode}
            />
          </div>

          <span className="ml-auto text-xs text-[var(--muted)]">{visibleItems.length} 个条目</span>
          <Tooltip label="导出收藏">
            <button
              aria-label="导出收藏"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[6px] border border-[var(--line-strong)] bg-white text-[var(--muted)] transition-colors hover:border-[var(--muted)] hover:text-[var(--foreground)]"
              onClick={exportCollection}
              type="button"
            >
              <Download aria-hidden className="h-4 w-4" />
            </button>
          </Tooltip>
          <Tooltip label="导入收藏">
            <button
              aria-label="导入收藏"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[6px] border border-[var(--line-strong)] bg-white text-[var(--muted)] transition-colors hover:border-[var(--muted)] hover:text-[var(--foreground)]"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Upload aria-hidden className="h-4 w-4" />
            </button>
          </Tooltip>
          <input
            accept="application/json"
            className="hidden"
            onChange={(event) => void prepareImport(event.target.files?.[0])}
            ref={fileInputRef}
            type="file"
          />
        </div>

        {message ? (
          <div
            aria-live="polite"
            className="mb-4 border border-[var(--line)] bg-white px-3 py-2 text-xs text-[var(--body-muted)]"
          >
            {message}
          </div>
        ) : null}

        {!ready ? (
          <CollectionSkeleton />
        ) : visibleItems.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center border border-dashed border-[var(--line-strong)] bg-white px-8 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-[6px] bg-[var(--surface)] text-[var(--muted)]">
              <LibraryBig aria-hidden className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-sm font-semibold">
              {items.length === 0 ? "收藏资料库还是空的" : "没有匹配的收藏"}
            </h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {items.length === 0 ? "从季度番表中标记想看、在看或看过" : "调整状态或搜索条件"}
            </p>
            {items.length === 0 ? (
              <Link
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-[6px] border border-[var(--line-strong)] bg-white px-3 text-sm font-medium hover:border-[var(--muted)]"
                href="/"
              >
                浏览番表
                <ArrowUpRight aria-hidden className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="border border-[var(--line)] bg-white">
            <div className="grid grid-cols-[76px_minmax(300px,1fr)_150px_150px_48px] gap-4 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-[11px] font-medium text-[var(--muted)]">
              <span>封面</span>
              <span>作品</span>
              <span>收藏状态</span>
              <span>最近更新</span>
              <span className="sr-only">操作</span>
            </div>
            {visibleItems.map((item) => (
              <article
                className="grid min-h-[112px] grid-cols-[76px_minmax(300px,1fr)_150px_150px_48px] items-center gap-4 border-b border-[var(--line)] px-4 py-3 last:border-b-0 hover:bg-[#fcfcfc]"
                key={item.animeId}
              >
                <CoverImage
                  badge={item.type}
                  className="w-14"
                  src={item.imageUrl}
                  title={item.titleSnapshot}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{item.titleSnapshot}</h3>
                    <CopyTitleButton title={item.titleSnapshot} />
                    {sourceUrl(item) ? (
                      <Tooltip label="打开 Bangumi 来源页">
                        <a
                          aria-label={`打开 ${item.titleSnapshot} 的 Bangumi 来源页`}
                          className="shrink-0 text-[var(--muted)] hover:text-[var(--accent)]"
                          href={sourceUrl(item)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                        </a>
                      </Tooltip>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-[var(--muted)]">
                    {item.type ? (
                      <span className="rounded-[4px] bg-[var(--teal-soft)] px-1.5 py-0.5 text-[var(--teal)]">
                        {animeTypeLabels[item.type]}
                      </span>
                    ) : null}
                    {item.year ? (
                      <span className="rounded-[4px] bg-[var(--surface)] px-1.5 py-0.5">
                        {item.year}
                        {item.season ? ` · ${animeSeasonLabels[item.season]}` : ""}
                      </span>
                    ) : null}
                    <span className="rounded-[4px] bg-[var(--surface)] px-1.5 py-0.5">
                      {item.source} / {item.sourceId}
                    </span>
                  </div>
                </div>
                <CollectionStatusSelect
                  current={item.status}
                  label={`收藏状态：${item.titleSnapshot}`}
                  onRemove={() => void remove(item.animeId)}
                  onSetStatus={(status) => void updateStatus(item.animeId, status)}
                />
                <time
                  className="text-xs tabular-nums text-[var(--muted)]"
                  dateTime={item.updatedAt}
                >
                  {formatDateTime(item.updatedAt)}
                </time>
                <Tooltip label="移除收藏">
                  <button
                    aria-label={`移除 ${item.titleSnapshot}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[5px] text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--danger)]"
                    onClick={() => void remove(item.animeId)}
                    type="button"
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                  </button>
                </Tooltip>
              </article>
            ))}
          </div>
        )}
      </section>

      <AlertDialog.Root
        onOpenChange={(open) => {
          if (!open) {
            setPendingImport(null);
          }
        }}
        open={pendingImport !== null}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[80] bg-black/35" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[90] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[6px] border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-float)]">
            <AlertDialog.Title className="text-base font-semibold">
              替换当前收藏？
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-[var(--body-muted)]">
              将用导入文件中的 {pendingImport?.length ?? 0} 个条目替换当前 {items.length} 个条目。
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <button
                  className="h-9 rounded-[6px] border border-[var(--line-strong)] bg-white px-3 text-sm font-medium hover:border-[var(--muted)]"
                  type="button"
                >
                  取消
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  className="h-9 rounded-[6px] bg-[var(--accent)] px-3 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
                  onClick={() => void confirmImport()}
                  type="button"
                >
                  确认替换
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </main>
  );
}

function CollectionSkeleton() {
  return (
    <div className="grid gap-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          className="grid min-h-[112px] grid-cols-[76px_minmax(300px,1fr)_150px_150px_48px] items-center gap-4 border border-[var(--line)] bg-white px-4 py-3"
          key={index}
        >
          <div className="skeleton-block aspect-[3/4] w-14 rounded-[5px]" />
          <div className="grid gap-2">
            <div className="skeleton-block h-4 w-56 rounded" />
            <div className="skeleton-block h-3 w-36 rounded" />
          </div>
          <div className="skeleton-block h-9 w-28 rounded" />
          <div className="skeleton-block h-3 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}

function isCollectionItem(item: unknown): item is CollectionItem {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as Partial<CollectionItem>;
  return (
    typeof candidate.animeId === "string" &&
    typeof candidate.source === "string" &&
    typeof candidate.sourceId === "string" &&
    typeof candidate.titleSnapshot === "string" &&
    Boolean(candidate.status && collectionStatusOptions.includes(candidate.status)) &&
    typeof candidate.createdAt === "string" &&
    !Number.isNaN(Date.parse(candidate.createdAt)) &&
    typeof candidate.updatedAt === "string" &&
    !Number.isNaN(Date.parse(candidate.updatedAt))
  );
}

function sortCollection(left: CollectionItem, right: CollectionItem, mode: CollectionSort): number {
  if (mode === "title") {
    return left.titleSnapshot.localeCompare(right.titleSnapshot, "zh-Hans-CN");
  }
  if (mode === "year") {
    return (right.year ?? -1) - (left.year ?? -1) || right.updatedAt.localeCompare(left.updatedAt);
  }
  return right.updatedAt.localeCompare(left.updatedAt);
}

function sourceUrl(item: CollectionItem): string | undefined {
  return item.source === "bangumi" && /^\d+$/.test(item.sourceId)
    ? `https://bgm.tv/subject/${item.sourceId}`
    : undefined;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
