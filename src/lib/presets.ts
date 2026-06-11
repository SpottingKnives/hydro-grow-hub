// Preset (built-in) library entries. These ship with the app and cannot be deleted
// so the catalog, default feed schedules, and seeded data stay consistent.

export const PRESET_NUTRIENT_IDS = new Set<string>([
  "part-a",
  "part-b",
  "bloom",
  "front-row-si",
  "phoszyme",
  "cal-hypo",
]);

export const PRESET_FEED_SCHEDULE_IDS = new Set<string>([
  "dtr-standard-strength",
  "dtr-high-strength",
]);

export const PRESET_PARAMETER_IDS = new Set<string>([
  "air-temp",
  "humidity",
  "co2",
  "water-temp",
  "ec",
  "ph",
  "orp",
  "do",
]);

export const PRESET_STRAIN_IDS = new Set<string>([
  "green-poison",
  "gorilla-girl",
  "shiskaberry",
  "durie-green",
  "easy-root",
  "hard-root",
]);

export type PresetKind = "nutrient" | "feedSchedule" | "parameter" | "strain";

const REGISTRIES: Record<PresetKind, Set<string>> = {
  nutrient: PRESET_NUTRIENT_IDS,
  feedSchedule: PRESET_FEED_SCHEDULE_IDS,
  parameter: PRESET_PARAMETER_IDS,
  strain: PRESET_STRAIN_IDS,
};

export const isPreset = (kind: PresetKind, id: string | undefined | null): boolean =>
  !!id && REGISTRIES[kind].has(id);

export const PRESET_LABEL: Record<PresetKind, string> = {
  nutrient: "nutrient",
  feedSchedule: "feed schedule",
  parameter: "parameter",
  strain: "strain",
};