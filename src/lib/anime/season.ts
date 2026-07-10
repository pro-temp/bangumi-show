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

const seasonStartMonths: Record<AnimeSeason, number> = {
  winter: 1,
  spring: 4,
  summer: 7,
  fall: 10
};

export function seasonFromDate(date: Date): AnimeSeason {
  const month = date.getMonth() + 1;
  return month >= 10 ? "fall" : month >= 7 ? "summer" : month >= 4 ? "spring" : "winter";
}

export function currentSeason(date: Date): SeasonInfo {
  const year = date.getFullYear();
  const season = seasonFromDate(date);

  return {
    year,
    season,
    label: seasonLabels[season]
  };
}

export function seasonLabel(season: AnimeSeason): string {
  return seasonLabels[season];
}

export function shiftSeason(
  selection: Pick<SeasonInfo, "year" | "season">,
  offset: number
): Pick<SeasonInfo, "year" | "season"> {
  const seasons: AnimeSeason[] = ["winter", "spring", "summer", "fall"];
  const currentIndex = selection.year * seasons.length + seasons.indexOf(selection.season);
  const nextIndex = currentIndex + offset;
  const year = Math.floor(nextIndex / seasons.length);
  const seasonIndex = ((nextIndex % seasons.length) + seasons.length) % seasons.length;

  return { year, season: seasons[seasonIndex] };
}

export function seasonDateRange(year: number, season: AnimeSeason): { start: string; end: string } {
  const startMonth = seasonStartMonths[season];
  const endMonth = startMonth + 3;
  const endYear = endMonth > 12 ? year + 1 : year;
  const normalizedEndMonth = endMonth > 12 ? endMonth - 12 : endMonth;

  return {
    start: formatDate(year, startMonth, 1),
    end: formatDate(endYear, normalizedEndMonth, 1)
  };
}

function formatDate(year: number, month: number, day: number): string {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0")
  ].join("-");
}
