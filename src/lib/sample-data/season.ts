import type { AnimeWork } from "@/lib/anime/model";

export const sampleSeasonAnime: AnimeWork[] = [
  {
    id: "sample-1",
    titles: {
      zh: "示例动画 Alpha",
      ja: "サンプルアニメ Alpha",
      aliases: ["Alpha"]
    },
    type: "TV",
    status: "airing",
    year: 2026,
    season: "summer",
    airDate: "2026-07-01",
    episodeCount: 12,
    summary: "用于 Phase 1 骨架验证的当前季度作品占位数据。",
    score: 7.8,
    scoreCount: 1200,
    tags: ["原创", "日常"],
    sources: [
      {
        source: "bangumi",
        sourceId: "sample-1"
      }
    ]
  },
  {
    id: "sample-2",
    titles: {
      zh: "示例动画 Beta",
      ja: "サンプルアニメ Beta",
      aliases: ["Beta"]
    },
    type: "TV",
    status: "airing",
    year: 2026,
    season: "summer",
    airDate: "2026-07-08",
    episodeCount: 13,
    summary: "后续会由 Bangumi adapter 与 normalizer 替换为真实数据。",
    score: 8.1,
    scoreCount: 980,
    tags: ["奇幻", "冒险"],
    sources: [
      {
        source: "bangumi",
        sourceId: "sample-2"
      }
    ]
  }
];
