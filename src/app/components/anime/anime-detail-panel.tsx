"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { ExternalLink, Loader2, Star, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  animeSeasonLabels,
  animeStatusLabels,
  animeSubtitle,
  animeTitle,
  animeTypeLabels
} from "@/lib/anime/display";
import type { AnimeWork } from "@/lib/anime/model";
import { CollectionStatusSelect } from "@/lib/client/collection-status-select";
import { CopyTitleButton } from "@/lib/client/copy-title-button";
import { Tooltip } from "@/lib/client/tooltip";
import type { CollectionStatus } from "@/lib/platform/collection-repository";
import { AnimeCover } from "./anime-cover";

export function AnimeDetailPanel({
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
    <aside className="thin-scrollbar sticky top-5 max-h-[calc(100vh-2.5rem)] overflow-y-auto border border-[var(--line)] bg-white shadow-[var(--shadow-soft)]">
      <div className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-[var(--line)] bg-white/95 px-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">详情面板</h2>
          {loading && anime ? (
            <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
          ) : null}
        </div>
        {anime ? (
          <Tooltip label="关闭详情">
            <button
              aria-label="关闭详情"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              onClick={onClose}
              type="button"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </Tooltip>
        ) : null}
      </div>

      {!anime ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center px-8 text-center">
          <span className="h-px w-12 bg-[var(--line-strong)]" />
          <p className="mt-4 text-sm font-medium">选择一部番剧查看详情</p>
          <p className="mt-1 text-xs text-[var(--muted)]">当前番表和筛选条件会保持不变</p>
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="p-4"
            exit={{ opacity: 0, x: -5 }}
            initial={{ opacity: 0, x: 5 }}
            key={anime.id}
            transition={{ duration: 0.14 }}
          >
            <div className="grid grid-cols-[116px_minmax(0,1fr)] gap-4">
              <AnimeCover anime={anime} className="w-[116px]" />
              <div className="min-w-0 py-0.5">
                <div className="flex items-start gap-1">
                  <h3 className="min-w-0 flex-1 text-lg font-semibold leading-7">
                    {animeTitle(anime)}
                  </h3>
                  <CopyTitleButton title={animeTitle(anime)} />
                </div>
                {animeSubtitle(anime) ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                    {animeSubtitle(anime)}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="rounded-[4px] bg-[var(--teal-soft)] px-2 py-1 font-medium text-[var(--teal)]">
                    {animeTypeLabels[anime.type]}
                  </span>
                  <span className="rounded-[4px] bg-[var(--surface)] px-2 py-1 text-[var(--body-muted)]">
                    {animeStatusLabels[anime.status]}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-[4px] bg-[var(--amber-soft)] px-2 py-1 font-medium text-[var(--amber)]">
                    <Star aria-hidden className="h-3.5 w-3.5" />
                    {anime.score ? anime.score.toFixed(1) : "N/A"}
                  </span>
                </div>
                <div className="mt-4">
                  <CollectionStatusSelect
                    current={collectionStatus}
                    label="收藏状态"
                    labelVisible
                    onRemove={onRemoveCollection}
                    onSetStatus={onSetCollection}
                  />
                </div>
              </div>
            </div>

            <Tabs.Root className="mt-5" defaultValue="overview">
              <Tabs.List className="grid h-9 grid-cols-3 border-b border-[var(--line)] text-xs">
                <TabTrigger value="overview">概览</TabTrigger>
                <TabTrigger value="tags">标签</TabTrigger>
                <TabTrigger value="sources">来源</TabTrigger>
              </Tabs.List>

              <Tabs.Content className="outline-none" value="overview">
                <dl className="grid grid-cols-2 border-b border-[var(--line)] py-4">
                  <InfoItem label="开播日期" value={anime.airDate ?? "待定"} />
                  <InfoItem
                    label="季度"
                    value={
                      anime.season && anime.year
                        ? `${anime.year} ${animeSeasonLabels[anime.season]}`
                        : "未知"
                    }
                  />
                  <InfoItem
                    label="集数"
                    value={anime.episodeCount ? `${anime.episodeCount} 集` : "未知"}
                  />
                  <InfoItem
                    label="评分人数"
                    value={anime.scoreCount ? formatCount(anime.scoreCount) : "暂无"}
                  />
                </dl>
                <section className="pt-4">
                  <h4 className="text-xs font-semibold text-[var(--foreground)]">作品简介</h4>
                  <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-[var(--body-muted)]">
                    {anime.summary ?? "暂无简介"}
                  </p>
                </section>
              </Tabs.Content>

              <Tabs.Content className="flex flex-wrap gap-2 py-4 outline-none" value="tags">
                {anime.tags.length > 0 ? (
                  anime.tags.map((tag) => (
                    <span
                      className="rounded-[4px] border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--body-muted)]"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[var(--muted)]">暂无标签</span>
                )}
              </Tabs.Content>

              <Tabs.Content className="grid gap-2 py-4 text-sm outline-none" value="sources">
                {anime.sources.map((source) =>
                  source.url ? (
                    <a
                      className="flex items-center justify-between border border-[var(--line)] px-3 py-2.5 transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface)]"
                      href={source.url}
                      key={`${source.source}:${source.sourceId}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span>
                        <span className="block text-xs font-medium">{source.source}</span>
                        <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                          {source.sourceId}
                        </span>
                      </span>
                      <ExternalLink aria-hidden className="h-4 w-4 text-[var(--accent)]" />
                    </a>
                  ) : (
                    <span
                      className="text-[var(--muted)]"
                      key={`${source.source}:${source.sourceId}`}
                    >
                      {source.source} / {source.sourceId}
                    </span>
                  )
                )}
              </Tabs.Content>
            </Tabs.Root>
          </motion.div>
        </AnimatePresence>
      )}
    </aside>
  );
}

function TabTrigger({ children, value }: { children: string; value: string }) {
  return (
    <Tabs.Trigger
      className="relative text-[var(--muted)] outline-none transition-colors after:absolute after:inset-x-4 after:bottom-[-1px] after:h-0.5 after:bg-transparent data-[state=active]:font-medium data-[state=active]:text-[var(--foreground)] data-[state=active]:after:bg-[var(--accent)]"
      value={value}
    >
      {children}
    </Tabs.Trigger>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2">
      <dt className="text-[11px] text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("zh-CN", {
    notation: value >= 10_000 ? "compact" : "standard"
  }).format(value);
}
