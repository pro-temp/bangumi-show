import type { AnimeSeason } from "./model";

export type SeasonInfo = {
  year: number;
  season: AnimeSeason;
  label: string;
};

const seasonLabels: Record<AnimeSeason, string> = {
  winter: "冬番",
  spring: "春番",
  summer: "夏番",
  fall: "秋番"
};

export function currentSeason(date: Date): SeasonInfo {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const season: AnimeSeason =
    month >= 10 ? "fall" : month >= 7 ? "summer" : month >= 4 ? "spring" : "winter";

  return {
    year,
    season,
    label: seasonLabels[season]
  };
}
