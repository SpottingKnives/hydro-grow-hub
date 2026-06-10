import { describe, it, expect } from "vitest";
import { migrateState } from "@/store/useStore";
import { FEED_STAGES } from "@/types";

const CAL_AMOUNT = 0.0026;

describe("store migration — calcium hypochlorite backfill", () => {
  it("adds cal-hypo to existing DTR schedules at 0.0026 g/L across every stage", () => {
    const legacy = {
      feedSchedules: [
        {
          id: "dtr-standard-strength",
          name: "DTR Standard Strength",
          notes: "",
          created_at: "2024-01-01T00:00:00.000Z",
          ec_targets: {},
          rows: [
            { id: "r1", nutrient_id: "part-a", nutrient_name: "Part A", nutrient_type: "dry", category: "nutrient", order_index: 0, amounts: { veg: 1.4, stretch: 1.1, stack: 0.9, swell: 0.7, ripen: 0.5 } },
          ],
        },
        {
          id: "dtr-high-strength",
          name: "DTR High Strength",
          notes: "",
          created_at: "2024-01-01T00:00:01.000Z",
          ec_targets: {},
          rows: [],
        },
      ],
    };
    const migrated = migrateState(legacy);
    for (const fid of ["dtr-standard-strength", "dtr-high-strength"]) {
      const sched = migrated.feedSchedules.find((f: any) => f.id === fid);
      const cal = sched.rows.filter((r: any) => r.nutrient_id === "cal-hypo");
      expect(cal).toHaveLength(1);
      for (const st of FEED_STAGES) expect(cal[0].amounts[st]).toBeCloseTo(CAL_AMOUNT, 6);
    }
  });

  it("does not duplicate cal-hypo when it already exists", () => {
    const seeded = {
      feedSchedules: [
        {
          id: "dtr-standard-strength", name: "DTR Standard Strength", notes: "",
          created_at: "2024-01-01T00:00:00.000Z", ec_targets: {},
          rows: [
            { id: "cal-row", nutrient_id: "cal-hypo", nutrient_name: "Calcium Hypochlorite", nutrient_type: "dry", category: "treatment", order_index: 0, amounts: Object.fromEntries(FEED_STAGES.map((s) => [s, CAL_AMOUNT])) },
          ],
        },
      ],
    };
    const once = migrateState(seeded);
    const twice = migrateState(once);
    const sched = twice.feedSchedules.find((f: any) => f.id === "dtr-standard-strength");
    expect(sched.rows.filter((r: any) => r.nutrient_id === "cal-hypo")).toHaveLength(1);
  });
});

describe("store migration — preset parameter & strain seeding", () => {
  it("seeds the eight preset parameters when none exist", () => {
    const migrated = migrateState({});
    const names = migrated.parameters.map((p: any) => p.name);
    expect(names).toEqual(expect.arrayContaining([
      "Air Temperature", "Humidity", "CO₂", "Water Temperature",
      "Electrical Conductivity", "pH", "ORP", "Dissolved Oxygen",
    ]));
    // No duplicates by id
    const ids = migrated.parameters.map((p: any) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("seeds the six preset strains and preserves user-created strains", () => {
    const userStrain = { id: "custom-1", name: "House Cross", breeder: "Me", veg_weeks: 3, flower_weeks: 9, traits: [], notes: "", active: true, updated_at: "2024-01-01T00:00:00.000Z" };
    const migrated = migrateState({ strains: [userStrain] });
    const names = migrated.strains.map((s: any) => s.name);
    expect(names).toEqual(expect.arrayContaining([
      "Green Poison", "Gorilla Girl", "Shiskaberry", "Durie Green", "Easy Root", "Hard Root", "House Cross",
    ]));
  });

  it("is idempotent: re-running migration does not duplicate seeded parameters or strains", () => {
    const once = migrateState({});
    const twice = migrateState(once);
    const paramIds = twice.parameters.map((p: any) => p.id);
    const strainIds = twice.strains.map((s: any) => s.id);
    expect(new Set(paramIds).size).toBe(paramIds.length);
    expect(new Set(strainIds).size).toBe(strainIds.length);
    expect(twice.parameters).toHaveLength(once.parameters.length);
    expect(twice.strains).toHaveLength(once.strains.length);
  });

  it("does not overwrite an existing parameter with the same id", () => {
    const customAirTemp = { id: "air-temp", name: "Air Temp (Custom)", unit: "°F", active: true, updated_at: "2024-01-01T00:00:00.000Z" };
    const migrated = migrateState({ parameters: [customAirTemp] });
    const airTemps = migrated.parameters.filter((p: any) => p.id === "air-temp");
    expect(airTemps).toHaveLength(1);
    expect(airTemps[0].name).toBe("Air Temp (Custom)");
    expect(airTemps[0].unit).toBe("°F");
  });
});