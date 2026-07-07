export type BangumiSubjectType = 1 | 2 | 3 | 4 | 6;

export type BangumiImageSet = {
  large?: string;
  common?: string;
  medium?: string;
  small?: string;
  grid?: string;
};

export type BangumiRating = {
  total?: number;
  score?: number;
};

export type BangumiTag = {
  name: string;
  count?: number;
  total_cont?: number;
};

export type BangumiInfoValue = string | { v?: string } | Array<string | { v?: string }>;

export type BangumiInfoBoxItem = {
  key: string;
  value: BangumiInfoValue;
};

export type BangumiSubject = {
  id: number;
  type: BangumiSubjectType;
  name: string;
  name_cn?: string;
  summary?: string;
  date?: string;
  eps?: number;
  total_episodes?: number;
  platform?: string;
  images?: BangumiImageSet;
  rating?: BangumiRating;
  tags?: BangumiTag[];
  infobox?: BangumiInfoBoxItem[];
  meta_tags?: string[];
};

export type BangumiSearchResponse = {
  data: BangumiSubject[];
  total?: number;
  limit?: number;
  offset?: number;
};

export type BangumiSearchSort = "match" | "heat" | "rank" | "score";

export type BangumiSearchFilter = {
  type?: BangumiSubjectType[];
  tag?: string[];
  meta_tags?: string[];
  air_date?: string[];
  rating?: string[];
  rank?: string[];
  nsfw?: boolean;
};

export type BangumiSearchRequest = {
  keyword?: string;
  sort?: BangumiSearchSort;
  filter?: BangumiSearchFilter;
};
