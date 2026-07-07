import type { AnimeSeason, AnimeStatus, AnimeType, AnimeWork } from "./model";

export const animeTypeLabels: Record<AnimeType, string> = {
  TV: "TV",
  Movie: "电影",
  OVA: "OVA",
  ONA: "ONA",
  Special: "特别篇",
  Music: "音乐"
};

export const animeStatusLabels: Record<AnimeStatus, string> = {
  upcoming: "未播出",
  airing: "放送中",
  finished: "已完结"
};

export const animeSeasonLabels: Record<AnimeSeason, string> = {
  winter: "冬番",
  spring: "春番",
  summer: "夏番",
  fall: "秋番"
};

export function animeTitle(anime: AnimeWork): string {
  return (
    anime.titles.zh ??
    anime.titles.ja ??
    anime.titles.en ??
    anime.titles.romaji ??
    anime.titles.aliases[0] ??
    anime.id
  );
}

export function animeSubtitle(anime: AnimeWork): string {
  return [anime.titles.ja, anime.titles.en, anime.titles.romaji]
    .filter((title): title is string => Boolean(title && title !== animeTitle(anime)))
    .join(" / ");
}

export function animeSourceId(anime: AnimeWork): { source: string; sourceId: string } {
  const source = anime.sources[0];

  if (source) {
    return {
      source: source.source,
      sourceId: source.sourceId
    };
  }

  return {
    source: "sample",
    sourceId: anime.id
  };
}
