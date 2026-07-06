import { describe, expect, it } from "vitest";
import { currentSeason } from "./season";

describe("currentSeason", () => {
  it("uses anime quarter boundaries", () => {
    expect(currentSeason(new Date("2026-01-01")).season).toBe("winter");
    expect(currentSeason(new Date("2026-04-01")).season).toBe("spring");
    expect(currentSeason(new Date("2026-07-01")).season).toBe("summer");
    expect(currentSeason(new Date("2026-10-01")).season).toBe("fall");
  });
});
