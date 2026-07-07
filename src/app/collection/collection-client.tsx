"use client";

import Link from "next/link";
import { Download, Search, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { animeSeasonLabels, animeTypeLabels } from "@/lib/anime/display";
import {
  collectionStatusLabels,
  collectionStatusOptions,
  useCollection
} from "@/lib/client/use-collection";
import { HeadlessSelect } from "@/lib/client/headless-select";
import type { CollectionItem, CollectionStatus } from "@/lib/platform/collection-repository";

type StatusFilter = "all" | CollectionStatus;

export function CollectionClient() {
  const { items, remove, replace } = useCollection();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const visibleItems = useMemo(() => {
    return items
      .filter((item) => statusFilter === "all" || item.status === statusFilter)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }, [items, statusFilter]);

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
  }

  async function importCollection(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const parsed = JSON.parse(await file.text()) as CollectionItem[];
      if (!Array.isArray(parsed)) {
        throw new Error("收藏文件格式不正确");
      }

      await replace(parsed.filter(isCollectionItem));
      setMessage("导入完成");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导入失败");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <main className="min-h-screen min-w-[1180px]">
      <section className="border-b border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-8 py-5">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold">本地收藏</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">{items.length} 个条目</p>
            </div>
            <div className="flex gap-2">
              <Link
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm"
                href="/"
              >
                <Search aria-hidden className="h-4 w-4" />
                查询
              </Link>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm"
                onClick={exportCollection}
                type="button"
              >
                <Download aria-hidden className="h-4 w-4" />
                导出
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <Upload aria-hidden className="h-4 w-4" />
                导入
              </button>
              <input
                accept="application/json"
                className="hidden"
                onChange={(event) => void importCollection(event.target.files?.[0])}
                ref={fileInputRef}
                type="file"
              />
            </div>
          </div>
          {message ? <div className="text-sm text-[var(--muted)]">{message}</div> : null}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1440px] grid-cols-[280px_minmax(720px,1fr)] gap-4 px-8 py-5">
        <aside className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4">
          <HeadlessSelect
            label="状态"
            onChange={setStatusFilter}
            options={[
              { label: "全部", value: "all" },
              ...collectionStatusOptions.map((status) => ({
                label: collectionStatusLabels[status],
                value: status
              }))
            ]}
            value={statusFilter}
          />
        </aside>

        <section className="min-w-0">
          {visibleItems.length === 0 ? (
            <div className="rounded-md border border-[var(--line)] bg-white p-8 text-center text-sm text-[var(--muted)]">
              暂无收藏
            </div>
          ) : (
            <div className="grid gap-3">
              {visibleItems.map((item) => (
                <article
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm"
                  key={item.animeId}
                >
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">{item.titleSnapshot}</h2>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-700">
                      <span className="rounded bg-[var(--accent-soft)] px-2 py-1 text-[var(--accent)]">
                        {collectionStatusLabels[item.status]}
                      </span>
                      {item.type ? (
                        <span className="rounded bg-slate-100 px-2 py-1">
                          {animeTypeLabels[item.type]}
                        </span>
                      ) : null}
                      {item.year ? (
                        <span className="rounded bg-slate-100 px-2 py-1">
                          {item.year}
                          {item.season ? ` ${animeSeasonLabels[item.season]}` : ""}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {item.source} / {item.sourceId} / {formatDateTime(item.updatedAt)}
                    </p>
                  </div>
                  <button
                    aria-label="移除收藏"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm"
                    onClick={() => void remove(item.animeId)}
                    type="button"
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                    移除
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
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
    typeof candidate.updatedAt === "string"
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
