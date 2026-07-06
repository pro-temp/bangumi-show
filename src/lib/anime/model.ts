export type AnimeType = "TV" | "Movie" | "OVA" | "ONA" | "Special" | "Music";

export type AnimeStatus = "upcoming" | "airing" | "finished";

export type AnimeSeason = "winter" | "spring" | "summer" | "fall";

export type AnimeSourceName = "bangumi" | "anilist" | "jikan";

export type AnimeSourceRecord = {
  source: AnimeSourceName;
  sourceId: string;
  url?: string;
};

export type AnimeWork = {
  id: string;
  titles: {
    ja?: string;
    zh?: string;
    en?: string;
    romaji?: string;
    aliases: string[];
  };
  type: AnimeType;
  status: AnimeStatus;
  year?: number;
  season?: AnimeSeason;
  airDate?: string;
  episodeCount?: number;
  summary?: string;
  imageUrl?: string;
  score?: number;
  scoreCount?: number;
  tags: string[];
  sources: AnimeSourceRecord[];
};

export type ApiEnvelope<T> = {
  data: T;
  source: AnimeSourceName | "sample";
  sourceLinks: string[];
  cachedAt: string;
  warnings: string[];
};
