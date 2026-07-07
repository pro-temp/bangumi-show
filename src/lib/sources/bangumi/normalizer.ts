import type { AnimeStatus, AnimeType, AnimeWork } from "@/lib/anime/model";
import { seasonFromDate } from "@/lib/anime/season";
import type { BangumiInfoValue, BangumiSubject } from "./types";

const subjectUrlBase = "https://bgm.tv/subject";

export function normalizeBangumiSubject(subject: BangumiSubject, now = new Date()): AnimeWork {
  const airDate = normalizeDate(subject.date);
  const year = airDate ? Number(airDate.slice(0, 4)) : undefined;
  const season = airDate ? seasonFromDate(new Date(`${airDate}T00:00:00Z`)) : undefined;
  const aliases = uniqueStrings([
    ...extractInfoValues(subject.infobox, ["别名", "英文名", "日文名", "中文名", "原名"]),
    ...(subject.meta_tags ?? [])
  ]).filter((title) => title !== subject.name && title !== subject.name_cn);

  return {
    id: `bangumi:${subject.id}`,
    titles: {
      ja: subject.name || undefined,
      zh: subject.name_cn || undefined,
      aliases
    },
    type: normalizeAnimeType(subject),
    status: normalizeAnimeStatus(airDate, now),
    year,
    season,
    airDate,
    episodeCount: subject.eps ?? subject.total_episodes,
    summary: subject.summary || undefined,
    imageUrl: selectImage(subject),
    score: subject.rating?.score,
    scoreCount: subject.rating?.total,
    tags: normalizeTags(subject),
    sources: [
      {
        source: "bangumi",
        sourceId: String(subject.id),
        url: `${subjectUrlBase}/${subject.id}`
      }
    ]
  };
}

export function bangumiSubjectUrl(subjectId: string | number): string {
  return `${subjectUrlBase}/${subjectId}`;
}

export function parseBangumiSubjectId(id: string): string {
  return id.startsWith("bangumi:") ? id.slice("bangumi:".length) : id;
}

function normalizeAnimeType(subject: BangumiSubject): AnimeType {
  const markers = [subject.platform, ...(subject.meta_tags ?? [])].filter(Boolean).join(" ");

  if (/剧场版|劇場版|Movie/i.test(markers)) {
    return "Movie";
  }

  if (/OVA|OAD/i.test(markers)) {
    return "OVA";
  }

  if (/ONA|WEB|Web|网络|網絡/i.test(markers)) {
    return "ONA";
  }

  if (/Special|SP|特番|特别篇|特別篇/i.test(markers)) {
    return "Special";
  }

  if (/Music|音乐|音樂|MV/i.test(markers)) {
    return "Music";
  }

  return "TV";
}

function normalizeAnimeStatus(airDate: string | undefined, now: Date): AnimeStatus {
  if (!airDate) {
    return "finished";
  }

  const start = new Date(`${airDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) {
    return "finished";
  }

  if (start.getTime() > now.getTime()) {
    return "upcoming";
  }

  const airingWindowMs = 180 * 24 * 60 * 60 * 1000;
  return now.getTime() - start.getTime() <= airingWindowMs ? "airing" : "finished";
}

function normalizeDate(value: string | undefined): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  return value;
}

function selectImage(subject: BangumiSubject): string | undefined {
  return (
    subject.images?.large ??
    subject.images?.common ??
    subject.images?.medium ??
    subject.images?.small ??
    subject.images?.grid
  );
}

function normalizeTags(subject: BangumiSubject): string[] {
  return uniqueStrings([
    ...(subject.tags?.map((tag) => tag.name) ?? []),
    ...(subject.meta_tags ?? [])
  ]).slice(0, 12);
}

function extractInfoValues(
  infobox: BangumiSubject["infobox"] | undefined,
  keys: string[]
): string[] {
  if (!infobox) {
    return [];
  }

  const keySet = new Set(keys);
  return infobox
    .filter((item) => keySet.has(item.key))
    .flatMap((item) => flattenInfoValue(item.value));
}

function flattenInfoValue(value: BangumiInfoValue): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenInfoValue(item));
  }

  if (typeof value === "string") {
    return [value];
  }

  return value.v ? [value.v] : [];
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return [
    ...new Set(
      values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))
    )
  ];
}
