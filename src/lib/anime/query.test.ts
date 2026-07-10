import { describe, expect, it } from "vitest";
import { sampleSeasonAnime } from "@/lib/sample-data/season";
import { defaultAnimeListQuery, hasActiveAnimeFilters, queryAnimeList } from "./query";

describe("anime list query", () => {
  it("filters by multiple facets", () => {
    const items = queryAnimeList(sampleSeasonAnime, {
      type: "TV",
      status: "airing",
      tags: ["科幻", "奇幻"],
      sort: "airDate"
    });

    expect(items.map((item) => item.id)).toEqual(["sample-1", "sample-2"]);
  });

  it("sorts missing scores last", () => {
    const items = queryAnimeList(sampleSeasonAnime, {
      ...defaultAnimeListQuery,
      sort: "score"
    });

    expect(items[0]?.id).toBe("sample-2");
    expect(items.at(-1)?.score).toBeUndefined();
  });

  it("only reports filtering facets as active", () => {
    expect(hasActiveAnimeFilters({ ...defaultAnimeListQuery, sort: "score" })).toBe(false);
    expect(hasActiveAnimeFilters({ ...defaultAnimeListQuery, status: "airing" })).toBe(true);
    expect(hasActiveAnimeFilters({ ...defaultAnimeListQuery, tags: ["科幻"] })).toBe(true);
  });
});
