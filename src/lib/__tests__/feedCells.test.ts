import { describe, it, expect } from "vitest";
import { isEmptyCell } from "@/lib/feedCells";
import { FEED_STAGES, type GrowStage } from "@/types";

describe("feed schedule cells — empty-cell rule", () => {
  it("treats 0 as a valid value (not empty)", () => {
    expect(isEmptyCell(0)).toBe(false);
    expect(isEmptyCell(0.0026)).toBe(false);
    expect(isEmptyCell(1.4)).toBe(false);
  });

  it("treats null, undefined, and NaN as empty", () => {
    expect(isEmptyCell(null)).toBe(true);
    expect(isEmptyCell(undefined)).toBe(true);
    expect(isEmptyCell(Number.NaN)).toBe(true);
  });

  it("flags a row as incomplete only when at least one cell is null/NaN", () => {
    const allZero = Object.fromEntries(FEED_STAGES.map((s) => [s, 0])) as Record<GrowStage, number>;
    const oneNaN = { ...allZero, veg: Number.NaN } as Record<GrowStage, number>;
    const realistic = { ...allZero, veg: 1.4, stretch: 1.1, stack: 0.9, swell: 0, ripen: 0.5 } as Record<GrowStage, number>;

    expect(FEED_STAGES.some((st) => isEmptyCell(allZero[st]))).toBe(false);
    expect(FEED_STAGES.some((st) => isEmptyCell(realistic[st]))).toBe(false);
    expect(FEED_STAGES.some((st) => isEmptyCell(oneNaN[st]))).toBe(true);
  });

  it("converts empty input string to NaN (simulating editor wipe)", () => {
    // mirrors the FeedSchedulesPage onChange: raw === "" ? NaN : parseFloat(raw)
    const fromInput = (raw: string) => (raw === "" ? Number.NaN : parseFloat(raw));
    expect(isEmptyCell(fromInput(""))).toBe(true);
    expect(isEmptyCell(fromInput("0"))).toBe(false);
    expect(isEmptyCell(fromInput("0.0026"))).toBe(false);
  });
});