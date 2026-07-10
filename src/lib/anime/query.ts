import { animeTitle } from "./display";
import type { AnimeStatus, AnimeType, AnimeWork } from "./model";

export type AnimeSortMode = "airDate" | "score" | "title";
export type AnimeTypeFilter = "all" | AnimeType;
export type AnimeStatusFilter = "all" | AnimeStatus;

export type AnimeListQuery = {
  type: AnimeTypeFilter;
  status: AnimeStatusFilter;
  tags: string[];
  sort: AnimeSortMode;
};

export const defaultAnimeListQuery: AnimeListQuery = {
  type: "all",
  status: "all",
  tags: [],
  sort: "airDate"
};

export function queryAnimeList(items: AnimeWork[], query: AnimeListQuery): AnimeWork[] {
  return items
    .filter((anime) => query.type === "all" || anime.type === query.type)
    .filter((anime) => query.status === "all" || anime.status === query.status)
    .filter(
      (anime) => query.tags.length === 0 || query.tags.some((tag) => anime.tags.includes(tag))
    )
    .sort((left, right) => sortAnime(left, right, query.sort));
}

export function hasActiveAnimeFilters(query: AnimeListQuery): boolean {
  return query.type !== "all" || query.status !== "all" || query.tags.length > 0;
}

function sortAnime(left: AnimeWork, right: AnimeWork, sort: AnimeSortMode): number {
  if (sort === "score") {
    return (right.score ?? -1) - (left.score ?? -1);
  }

  if (sort === "title") {
    return animeTitle(left).localeCompare(animeTitle(right), "zh-Hans-CN");
  }

  return (left.airDate ?? "9999-99-99").localeCompare(right.airDate ?? "9999-99-99");
}
