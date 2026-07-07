import type { ApiEnvelope, AnimeSeason, AnimeWork } from "@/lib/anime/model";
import { currentSeason, seasonDateRange } from "@/lib/anime/season";
import { apiEnvelope } from "@/lib/server/api-envelope";
import { serverCache } from "@/lib/server/cache";
import { sampleSeasonAnime } from "@/lib/sample-data/season";
import { bangumiClient, type BangumiSourceHealth } from "@/lib/sources/bangumi/client";
import {
  bangumiSubjectUrl,
  normalizeBangumiSubject,
  parseBangumiSubjectId
} from "@/lib/sources/bangumi/normalizer";
import type { BangumiSubject } from "@/lib/sources/bangumi/types";

const animeSubjectType = 2;
const schedulePageLimit = 50;
const scheduleMaxResults = 300;
const searchTtlMs = 5 * 60 * 1000;
const scheduleTtlMs = 30 * 60 * 1000;
const detailTtlMs = 24 * 60 * 60 * 1000;

type SearchInput = {
  query: string;
};

type ScheduleInput = {
  year?: number;
  season?: string;
};

type SourceStatus =
  | BangumiSourceHealth
  | {
      name: "anilist" | "jikan";
      status: "planned";
      message: string;
    };

export async function searchAnime(input: SearchInput): Promise<ApiEnvelope<AnimeWork[]>> {
  const query = input.query.trim();

  if (!query) {
    const schedule = await getSeasonSchedule({});
    return apiEnvelope({
      data: schedule.data.items,
      source: schedule.source,
      sourceLinks: schedule.sourceLinks,
      cachedAt: schedule.cachedAt,
      warnings: schedule.warnings
    });
  }

  try {
    const result = await serverCache.getOrSet(`bangumi:search:${query}`, searchTtlMs, async () => {
      const response = await bangumiClient.searchSubjects({
        keyword: query,
        sort: "match",
        filter: {
          type: [animeSubjectType]
        },
        limit: 20
      });

      return response.data
        .filter((subject) => isInScopeJapaneseAnimation(subject))
        .map((subject) => normalizeBangumiSubject(subject));
    });

    return apiEnvelope({
      data: result.value,
      source: "bangumi",
      sourceLinks: collectSourceLinks(result.value),
      cachedAt: result.cachedAt,
      warnings: result.hit ? ["Bangumi 搜索结果来自内存缓存。"] : []
    });
  } catch (error) {
    return sampleEnvelope(filterSampleAnime(query), [bangumiFallbackWarning(error)]);
  }
}

export async function getSeasonSchedule(
  input: ScheduleInput
): Promise<ApiEnvelope<{ year: number; season: string; items: AnimeWork[] }>> {
  const current = currentSeason(new Date());
  const season = parseSeason(input.season) ?? current.season;
  const year = input.year ?? current.year;
  const range = seasonDateRange(year, season);

  try {
    const result = await serverCache.getOrSet(
      `bangumi:schedule:v2:${year}:${season}`,
      scheduleTtlMs,
      async () => {
        const subjects = await fetchBangumiSeasonSubjects(range);

        return uniqueBangumiSubjects(subjects)
          .filter((subject) => isInScopeJapaneseAnimation(subject))
          .map((subject) => normalizeBangumiSubject(subject))
          .sort((left, right) =>
            (left.airDate ?? "9999-99-99").localeCompare(right.airDate ?? "9999-99-99")
          );
      }
    );

    return apiEnvelope({
      data: {
        year,
        season,
        items: result.value
      },
      source: "bangumi",
      sourceLinks: collectSourceLinks(result.value),
      cachedAt: result.cachedAt,
      warnings: result.hit ? ["Bangumi 番表来自内存缓存。"] : []
    });
  } catch (error) {
    return apiEnvelope({
      data: {
        year,
        season,
        items: sampleSeasonAnime
      },
      source: "sample",
      cachedAt: new Date().toISOString(),
      warnings: [bangumiFallbackWarning(error), "已降级为 Phase 1 固定样例番表。"]
    });
  }
}

export async function getAnimeDetail(id: string): Promise<ApiEnvelope<AnimeWork | null>> {
  if (id.startsWith("sample-")) {
    const item = sampleSeasonAnime.find((anime) => anime.id === id) ?? null;
    return sampleEnvelope(item, item ? [] : ["未在样例数据中找到该作品。"]);
  }

  const subjectId = parseBangumiSubjectId(id);

  try {
    const result = await serverCache.getOrSet(
      `bangumi:detail:${subjectId}`,
      detailTtlMs,
      async () => {
        const subject = await bangumiClient.getSubject(subjectId);
        return normalizeBangumiSubject(subject);
      }
    );

    return apiEnvelope({
      data: result.value,
      source: "bangumi",
      sourceLinks: [bangumiSubjectUrl(subjectId)],
      cachedAt: result.cachedAt,
      warnings: result.hit ? ["Bangumi 详情来自内存缓存。"] : []
    });
  } catch (error) {
    return apiEnvelope({
      data: null,
      source: "sample",
      cachedAt: new Date().toISOString(),
      warnings: [bangumiFallbackWarning(error), "未能获取 Bangumi 详情。"]
    });
  }
}

export async function getAnimeRelations(id: string): Promise<ApiEnvelope<AnimeWork[]>> {
  const subjectId = parseBangumiSubjectId(id);

  return apiEnvelope({
    data: [],
    source: id.startsWith("sample-") ? "sample" : "bangumi",
    sourceLinks: id.startsWith("sample-") ? [] : [bangumiSubjectUrl(subjectId)],
    warnings: ["P2 暂未接入 Bangumi 关联作品端点，后续阶段补充。"]
  });
}

export async function suggestAnime(input: SearchInput): Promise<ApiEnvelope<string[]>> {
  const result = await searchAnime(input);
  const suggestions = result.data
    .flatMap((anime) => [
      anime.titles.zh,
      anime.titles.ja,
      anime.titles.en,
      anime.titles.romaji,
      ...anime.titles.aliases
    ])
    .filter((title): title is string => Boolean(title))
    .slice(0, 8);

  return apiEnvelope({
    data: suggestions,
    source: result.source,
    sourceLinks: result.sourceLinks,
    cachedAt: result.cachedAt,
    warnings: result.warnings
  });
}

export async function getSourceStatus(): Promise<ApiEnvelope<SourceStatus[]>> {
  return apiEnvelope({
    data: [
      bangumiClient.getHealth(),
      {
        name: "anilist",
        status: "planned",
        message: "Bangumi 主数据源稳定后作为补充数据源。"
      },
      {
        name: "jikan",
        status: "planned",
        message: "仅作为 MAL 备选或补充来源。"
      }
    ],
    source: "bangumi"
  });
}

function sampleEnvelope<T>(data: T, warnings: string[] = []): ApiEnvelope<T> {
  return apiEnvelope({
    data,
    source: "sample",
    cachedAt: new Date().toISOString(),
    warnings
  });
}

function filterSampleAnime(query: string): AnimeWork[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return sampleSeasonAnime;
  }

  return sampleSeasonAnime.filter((anime) => {
    const searchable = [
      anime.titles.zh,
      anime.titles.ja,
      anime.titles.en,
      anime.titles.romaji,
      ...anime.titles.aliases
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();

    return searchable.includes(normalizedQuery);
  });
}

async function fetchBangumiSeasonSubjects(range: {
  start: string;
  end: string;
}): Promise<BangumiSubject[]> {
  const subjects: BangumiSubject[] = [];
  let offset = 0;
  let total: number | undefined;

  while (offset < scheduleMaxResults) {
    const response = await bangumiClient.searchSubjects({
      sort: "rank",
      filter: {
        type: [animeSubjectType],
        air_date: [`>=${range.start}`, `<${range.end}`]
      },
      limit: schedulePageLimit,
      offset
    });

    subjects.push(...response.data);
    total = response.total ?? total;

    const responseOffset = response.offset ?? offset;
    const pageSize = response.limit ?? response.data.length;
    const nextOffset = responseOffset + (pageSize > 0 ? pageSize : schedulePageLimit);

    if (response.data.length === 0) {
      break;
    }
    if (total !== undefined && nextOffset >= total) {
      break;
    }
    if (nextOffset <= offset) {
      break;
    }

    offset = nextOffset;
  }

  return subjects.slice(0, scheduleMaxResults);
}

function uniqueBangumiSubjects(subjects: BangumiSubject[]): BangumiSubject[] {
  const seen = new Set<number>();
  return subjects.filter((subject) => {
    if (seen.has(subject.id)) {
      return false;
    }
    seen.add(subject.id);
    return true;
  });
}

function isInScopeJapaneseAnimation(subject: BangumiSubject): boolean {
  const markers = [
    subject.platform,
    ...(subject.meta_tags ?? []),
    ...(subject.tags?.map((tag) => tag.name) ?? [])
  ]
    .filter(Boolean)
    .join(" ");

  if (/日本|日漫|日本动画|日本動畫/.test(markers)) {
    return true;
  }

  return !/中国|中國|国产|國產|大陆|大陸|欧美|歐美|美国|美國|韩国|韓國|英国|英國|法国|法國|加拿大|俄罗斯|俄羅斯/.test(
    markers
  );
}

function collectSourceLinks(items: AnimeWork[]): string[] {
  return [
    ...new Set(items.flatMap((item) => item.sources.map((source) => source.url)).filter(Boolean))
  ] as string[];
}

function parseSeason(value: string | undefined): AnimeSeason | undefined {
  if (value === "winter" || value === "spring" || value === "summer" || value === "fall") {
    return value;
  }

  return undefined;
}

function bangumiFallbackWarning(error: unknown): string {
  const message = error instanceof Error ? error.message : "未知错误";
  return `Bangumi API 暂不可用，已降级处理：${message}`;
}
