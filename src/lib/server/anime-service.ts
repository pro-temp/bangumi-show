import type { ApiEnvelope, AnimeWork } from "@/lib/anime/model";
import { currentSeason } from "@/lib/anime/season";
import { sampleSeasonAnime } from "@/lib/sample-data/season";

type SearchInput = {
  query: string;
};

type ScheduleInput = {
  year?: number;
  season?: string;
};

function envelope<T>(data: T, warnings: string[] = []): ApiEnvelope<T> {
  return {
    data,
    source: "sample",
    sourceLinks: [],
    cachedAt: new Date().toISOString(),
    warnings
  };
}

export async function searchAnime(input: SearchInput): Promise<ApiEnvelope<AnimeWork[]>> {
  const query = input.query.trim().toLocaleLowerCase();

  if (!query) {
    return envelope(sampleSeasonAnime, ["Phase 1 使用样例数据；Phase 2 接入 Bangumi adapter。"]);
  }

  const data = sampleSeasonAnime.filter((anime) => {
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

    return searchable.includes(query);
  });

  return envelope(data, ["Phase 1 搜索仅覆盖样例数据。"]);
}

export async function getSeasonSchedule(
  input: ScheduleInput
): Promise<ApiEnvelope<{ year: number; season: string; items: AnimeWork[] }>> {
  const current = currentSeason(new Date());

  return envelope(
    {
      year: input.year ?? current.year,
      season: input.season ?? current.season,
      items: sampleSeasonAnime
    },
    ["Phase 1 番表使用样例数据；Phase 2 接入真实数据源。"]
  );
}

export async function getAnimeDetail(id: string): Promise<ApiEnvelope<AnimeWork | null>> {
  const item = sampleSeasonAnime.find((anime) => anime.id === id) ?? null;

  return envelope(item, item ? ["Phase 1 详情使用样例数据。"] : ["未在样例数据中找到该作品。"]);
}

export async function getAnimeRelations(id: string): Promise<ApiEnvelope<AnimeWork[]>> {
  const data = sampleSeasonAnime.filter((anime) => anime.id !== id);

  return envelope(data, ["Phase 1 关联作品使用样例数据。"]);
}

export async function suggestAnime(input: SearchInput): Promise<ApiEnvelope<string[]>> {
  const query = input.query.trim().toLocaleLowerCase();
  const suggestions = sampleSeasonAnime
    .flatMap((anime) => [anime.titles.zh, anime.titles.ja, ...anime.titles.aliases])
    .filter((title): title is string => Boolean(title))
    .filter((title) => !query || title.toLocaleLowerCase().includes(query))
    .slice(0, 8);

  return envelope(suggestions, ["Phase 1 联想使用样例数据。"]);
}

export async function getSourceStatus(): Promise<
  ApiEnvelope<
    {
      name: string;
      status: "ready" | "planned";
      message: string;
    }[]
  >
> {
  return envelope([
    {
      name: "bangumi",
      status: "planned",
      message: "Phase 2 接入主数据源。"
    },
    {
      name: "anilist",
      status: "planned",
      message: "Phase 2 之后作为补充数据源。"
    }
  ]);
}
