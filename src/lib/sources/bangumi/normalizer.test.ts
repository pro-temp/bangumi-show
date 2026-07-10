import { describe, expect, it } from "vitest";
import { normalizeBangumiSubject, parseBangumiSubjectId } from "./normalizer";
import type { BangumiSubject } from "./types";

const subject: BangumiSubject = {
  id: 123,
  type: 2,
  name: "テストアニメ",
  name_cn: "测试动画",
  summary: "一个用于 normalizer 测试的条目。",
  date: "2026-07-05",
  eps: 12,
  platform: "TV",
  images: {
    common: "https://lain.bgm.tv/pic/cover/c/test.jpg"
  },
  rating: {
    total: 345,
    score: 7.6
  },
  tags: [
    { name: "原创", count: 20 },
    { name: "日常", count: 10 },
    { name: "2026", count: 1 }
  ],
  infobox: [
    {
      key: "别名",
      value: [{ v: "Test Anime" }, { v: "测试别名" }]
    }
  ],
  meta_tags: ["TV", "日本动画", "2026年7月", "漫画改"]
};

describe("normalizeBangumiSubject", () => {
  it("maps Bangumi subjects into AnimeWork", () => {
    const anime = normalizeBangumiSubject(subject, new Date("2026-07-10T00:00:00Z"));

    expect(anime).toMatchObject({
      id: "bangumi:123",
      titles: {
        ja: "テストアニメ",
        zh: "测试动画"
      },
      type: "TV",
      status: "airing",
      year: 2026,
      season: "summer",
      airDate: "2026-07-05",
      episodeCount: 12,
      score: 7.6,
      scoreCount: 345,
      imageUrl: "https://lain.bgm.tv/pic/cover/c/test.jpg"
    });
    expect(anime.titles.aliases).toContain("Test Anime");
    expect(anime.titles.aliases).not.toContain("TV");
    expect(anime.tags).toEqual(["原创", "日常", "漫画改"]);
    expect(anime.sources[0]).toEqual({
      source: "bangumi",
      sourceId: "123",
      url: "https://bgm.tv/subject/123"
    });
  });

  it("recognizes movie-like tags", () => {
    const anime = normalizeBangumiSubject(
      {
        ...subject,
        id: 456,
        platform: "剧场版",
        meta_tags: ["剧场版"]
      },
      new Date("2026-08-01T00:00:00Z")
    );

    expect(anime.type).toBe("Movie");
  });

  it("parses normalized and raw Bangumi ids", () => {
    expect(parseBangumiSubjectId("bangumi:123")).toBe("123");
    expect(parseBangumiSubjectId("123")).toBe("123");
  });
});
