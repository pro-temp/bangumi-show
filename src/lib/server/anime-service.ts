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

const animeSubjectType = 2;
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

      return response.data.map((subject) => normalizeBangumiSubject(subject));
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
      `bangumi:schedule:${year}:${season}`,
      scheduleTtlMs,
      async () => {
        const response = await bangumiClient.searchSubjects({
          sort: "rank",
          filter: {
            type: [animeSubjectType],
            air_date: [`>=${range.start}`, `<${range.end}`]
          },
          limit: 50
        });

        return response.data
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
