import type { AnimeWork } from "@/lib/anime/model";

export const sampleSeasonAnime: AnimeWork[] = [
  {
    id: "sample-1",
    titles: {
      zh: "星港观测者",
      ja: "星港オブザーバー",
      en: "Star Harbor Observer",
      romaji: "Hoshiminato Observer",
      aliases: ["星港", "Star Harbor"]
    },
    type: "TV",
    status: "airing",
    year: 2026,
    season: "summer",
    airDate: "2026-07-01",
    episodeCount: 12,
    summary: "近未来港湾都市里的天文社成员，调查每周深夜出现的异常星图。",
    score: 7.8,
    scoreCount: 1200,
    tags: ["原创", "科幻", "青春"],
    sources: [
      {
        source: "bangumi",
        sourceId: "sample-1",
        url: "https://bgm.tv/subject/sample-1"
      }
    ]
  },
  {
    id: "sample-2",
    titles: {
      zh: "午后茶会的魔法使",
      ja: "午後のお茶会の魔法使い",
      en: "Tea Table Magicians",
      aliases: ["茶会魔法使", "Tea Table"]
    },
    type: "TV",
    status: "airing",
    year: 2026,
    season: "summer",
    airDate: "2026-07-08",
    episodeCount: 13,
    summary: "四位见习魔法使经营街角茶室，一边接待客人，一边修复失控的小魔法。",
    score: 8.1,
    scoreCount: 980,
    tags: ["奇幻", "日常", "治愈"],
    sources: [
      {
        source: "bangumi",
        sourceId: "sample-2",
        url: "https://bgm.tv/subject/sample-2"
      }
    ]
  },
  {
    id: "sample-3",
    titles: {
      zh: "月面快递",
      ja: "月面エクスプレス",
      romaji: "Getsumen Express",
      aliases: ["月递", "Lunar Express"]
    },
    type: "ONA",
    status: "finished",
    year: 2026,
    season: "summer",
    airDate: "2026-07-15",
    episodeCount: 8,
    summary: "月面基地的新人快递员必须在有限氧气和复杂轨道窗口中完成特殊配送。",
    score: 7.2,
    scoreCount: 430,
    tags: ["科幻", "职场", "冒险"],
    sources: [
      {
        source: "bangumi",
        sourceId: "sample-3",
        url: "https://bgm.tv/subject/sample-3"
      },
      {
        source: "anilist",
        sourceId: "sample-anilist-3",
        url: "https://anilist.co/anime/sample-anilist-3"
      }
    ]
  },
  {
    id: "sample-4",
    titles: {
      zh: "雨声剧场版",
      ja: "雨音 劇場版",
      aliases: ["雨音电影"]
    },
    type: "Movie",
    status: "upcoming",
    year: 2026,
    season: "summer",
    airDate: "2026-09-20",
    episodeCount: 1,
    summary: "人气音乐动画的剧场版，讲述主角团在夏末音乐节前的一次短途旅行。",
    tags: ["音乐", "剧场版", "青春"],
    sources: [
      {
        source: "bangumi",
        sourceId: "sample-4",
        url: "https://bgm.tv/subject/sample-4"
      }
    ]
  },
  {
    id: "sample-5",
    titles: {
      ja: "未翻訳の庭",
      en: "Garden Without Translation",
      aliases: ["No CN Title Sample"]
    },
    type: "Special",
    status: "airing",
    year: 2026,
    season: "summer",
    airDate: "2026-08-02",
    episodeCount: 3,
    summary: "用于验证中文名缺失、多语言标题回退和数据缺失提示的固定样例。",
    score: 6.9,
    scoreCount: 82,
    tags: ["短篇", "实验"],
    sources: [
      {
        source: "bangumi",
        sourceId: "sample-5",
        url: "https://bgm.tv/subject/sample-5"
      }
    ]
  }
];
