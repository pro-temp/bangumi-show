import { describe, expect, it } from "vitest";
import { currentSeason, seasonDateRange, seasonFromDate, shiftSeason } from "./season";

describe("anime season helpers", () => {
  it("uses anime quarter boundaries", () => {
    expect(currentSeason(new Date("2026-01-01")).season).toBe("winter");
    expect(currentSeason(new Date("2026-04-01")).season).toBe("spring");
    expect(currentSeason(new Date("2026-07-01")).season).toBe("summer");
    expect(currentSeason(new Date("2026-10-01")).season).toBe("fall");
  });

  it("derives seasons from dates", () => {
    expect(seasonFromDate(new Date("2026-03-31"))).toBe("winter");
    expect(seasonFromDate(new Date("2026-12-31"))).toBe("fall");
  });

  it("returns half-open season date ranges", () => {
    expect(seasonDateRange(2026, "winter")).toEqual({ start: "2026-01-01", end: "2026-04-01" });
    expect(seasonDateRange(2026, "fall")).toEqual({ start: "2026-10-01", end: "2027-01-01" });
  });

  it("moves across year boundaries", () => {
    expect(shiftSeason({ year: 2026, season: "winter" }, -1)).toEqual({
      year: 2025,
      season: "fall"
    });
    expect(shiftSeason({ year: 2026, season: "fall" }, 1)).toEqual({
      year: 2027,
      season: "winter"
    });
  });
});
