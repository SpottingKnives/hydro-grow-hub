import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GrowCycle, StageHistory, Environment, FeedSchedule, GrowTask,
  GrowEvent, ParameterLog, AlertRule, FeedLog, Nutrient, Strain, Breeder, FeedScheduleRow
} from '@/types';
import { FEED_STAGES } from '@/types';

const DTR_STAGES = ['veg', 'stretch', 'stack', 'swell', 'ripen'] as const;
const buildAmounts = (vals: number[]) =>
  Object.fromEntries(DTR_STAGES.map((s, i) => [s, vals[i]])) as Record<string, number>;

const buildDTRSchedule = (
  id: string,
  name: string,
  data: Array<{ nutrient_id: string; nutrient_name: string; nutrient_type: 'dry' | 'liquid'; category: 'nutrient' | 'additive' | 'treatment'; vals: number[] }>,
  ec_targets?: FeedSchedule['ec_targets']
): FeedSchedule => ({
  id,
  name,
  rows: data.map((d) => ({
    nutrient_id: d.nutrient_id,
    nutrient_name: d.nutrient_name,
    nutrient_type: d.nutrient_type,
    category: d.category,
    amounts: buildAmounts(d.vals),
  })),
  ec_targets,
});

const DTR_ROWS_STD = [
  { nutrient_id: 'part-a', nutrient_name: 'Part A', nutrient_type: 'dry' as const, category: 'nutrient' as const, vals: [1.4, 1.5, 1.1, 0.9, 0.9] },
  { nutrient_id: 'part-b', nutrient_name: 'Part B', nutrient_type: 'dry' as const, category: 'nutrient' as const, vals: [1.7, 1.9, 1.3, 1.1, 1.0] },
  { nutrient_id: 'bloom', nutrient_name: 'Bloom', nutrient_type: 'dry' as const, category: 'nutrient' as const, vals: [0.9, 1.1, 0.7, 0.6, 0.5] },
  { nutrient_id: 'front-row-si', nutrient_name: 'Front Row Si', nutrient_type: 'liquid' as const, category: 'additive' as const, vals: [0.1, 0.1, 0.1, 0.1, 0.1] },
  { nutrient_id: 'phoszyme', nutrient_name: 'PhosZyme', nutrient_type: 'liquid' as const, category: 'additive' as const, vals: [0.1, 0.1, 0.1, 0.1, 0.1] },
  { nutrient_id: 'cal-hypo', nutrient_name: 'Calcium Hypochlorite', nutrient_type: 'dry' as const, category: 'treatment' as const, vals: [0.0035, 0.0035, 0.0035, 0.0035, 0.0035] },
];
const DTR_ROWS_HIGH = [
  { nutrient_id: 'part-a', nutrient_name: 'Part A', nutrient_type: 'dry' as const, category: 'nutrient' as const, vals: [1.4, 1.4, 1.1, 0.9, 0.5] },
  { nutrient_id: 'part-b', nutrient_name: 'Part B', nutrient_type: 'dry' as const, category: 'nutrient' as const, vals: [1.7, 1.7, 1.4, 1.1, 0.6] },
  { nutrient_id: 'bloom', nutrient_name: 'Bloom', nutrient_type: 'dry' as const, category: 'nutrient' as const, vals: [0.9, 0.9, 0.8, 0.6, 0.6] },
  { nutrient_id: 'front-row-si', nutrient_name: 'Front Row Si', nutrient_type: 'liquid' as const, category: 'additive' as const, vals: [0.1, 0.1, 0.1, 0.1, 0.1] },
  { nutrient_id: 'phoszyme', nutrient_name: 'PhosZyme', nutrient_type: 'liquid' as const, category: 'additive' as const, vals: [0.1, 0.1, 0.1, 0.1, 0.1] },
  { nutrient_id: 'cal-hypo', nutrient_name: 'Calcium Hypochlorite', nutrient_type: 'dry' as const, category: 'treatment' as const, vals: [0.0035, 0.0035, 0.0035, 0.0035, 0.0035] },
];

const DTR_EC_STD: FeedSchedule['ec_targets'] = {
  veg: { min: 1.6, max: 1.8 },
  stretch: { min: 2.0, max: 2.2 },
  stack: { min: 1.6, max: 1.8 },
  swell: { min: 1.4, max: 1.6 },
  ripen: { min: 1.2, max: 1.4 },
};
const DTR_EC_HIGH: FeedSchedule['ec_targets'] = {
  veg: { min: 1.6, max: 1.8 },
  stretch: { min: 2.2, max: 2.4 },
  stack: { min: 1.8, max: 2.0 },
  swell: { min: 1.6, max: 1.8 },
  ripen: { min: 1.2, max: 1.4 },
};

const DEFAULT_FEED_SCHEDULES: FeedSchedule[] = [
  buildDTRSchedule('dtr-standard', 'DTR Standard', DTR_ROWS_STD, DTR_EC_STD),
  buildDTRSchedule('dtr-high-strength', 'DTR High Strength', DTR_ROWS_HIGH, DTR_EC_HIGH),
];

interface AppState {
  growCycles: GrowCycle[];
  stageHistory: StageHistory[];
  environments: Environment[];
  feedSchedules: FeedSchedule[];
  nutrients: Nutrient[];
  tasks: GrowTask[];
  events: GrowEvent[];
  parameterLogs: ParameterLog[];
  alertRules: AlertRule[];
  feedLogs: FeedLog[];
  strains: Strain[];
  breeders: Breeder[];

  // Grow Cycles
  addGrowCycle: (cycle: GrowCycle) => void;
  updateGrowCycle: (id: string, updates: Partial<GrowCycle>) => void;
  deleteGrowCycle: (id: string) => void;
  changeStage: (cycleId: string, newStage: GrowCycle['current_stage']) => void;

  // Environments
  addEnvironment: (env: Environment) => void;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  deleteEnvironment: (id: string) => void;

  // Feed Schedules
  addFeedSchedule: (schedule: FeedSchedule) => void;
  updateFeedSchedule: (id: string, updates: Partial<FeedSchedule>) => void;
  deleteFeedSchedule: (id: string) => void;
  reorderFeedScheduleRow: (scheduleId: string, nutrientId: string, direction: 'up' | 'down') => void;

  // Nutrients
  addNutrient: (nutrient: Nutrient) => void;
  deleteNutrient: (id: string) => void;

  // Tasks
  addTask: (task: GrowTask) => void;
  updateTask: (id: string, updates: Partial<GrowTask>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;

  // Events
  addEvent: (event: GrowEvent) => void;
  deleteEvent: (id: string) => void;

  // Parameter Logs
  addParameterLog: (log: ParameterLog) => void;

  // Feed Logs
  addFeedLog: (log: FeedLog) => void;

  // Strains & Breeders
  addStrain: (strain: Strain) => void;
  deleteStrain: (id: string) => void;
  addBreeder: (breeder: Breeder) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      growCycles: [],
      stageHistory: [],
      environments: [],
      feedSchedules: DEFAULT_FEED_SCHEDULES,
      nutrients: [
        { id: 'part-a', name: 'Part A', brand: 'DTR', type: 'dry', form: 'dry', category: 'nutrient', unit: 'g/L' },
        { id: 'part-b', name: 'Part B', brand: 'DTR', type: 'dry', form: 'dry', category: 'nutrient', unit: 'g/L' },
        { id: 'bloom', name: 'Bloom', brand: 'DTR', type: 'dry', form: 'dry', category: 'nutrient', unit: 'g/L' },
        { id: 'front-row-si', name: 'Front Row Si', brand: 'Front Row', type: 'liquid', form: 'liquid', category: 'additive', unit: 'ml/L' },
        { id: 'phoszyme', name: 'PhosZyme', brand: 'General', type: 'liquid', form: 'liquid', category: 'additive', unit: 'ml/L' },
        { id: 'cal-hypo', name: 'Calcium Hypochlorite', brand: 'General', type: 'dry', form: 'dry', category: 'treatment', unit: 'g/L' },
      ],
      tasks: [],
      events: [],
      parameterLogs: [],
      alertRules: [],
      feedLogs: [],
      strains: [],
      breeders: [],

      addGrowCycle: (cycle) => {
        const history: StageHistory = {
          id: crypto.randomUUID(),
          grow_cycle_id: cycle.id,
          stage: cycle.current_stage,
          started_at: cycle.start_date,
          ended_at: null,
        };
        set((s) => ({
          growCycles: [...s.growCycles, cycle],
          stageHistory: [...s.stageHistory, history],
        }));
      },
      updateGrowCycle: (id, updates) =>
        set((s) => ({
          growCycles: s.growCycles.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteGrowCycle: (id) =>
        set((s) => ({
          growCycles: s.growCycles.filter((c) => c.id !== id),
          stageHistory: s.stageHistory.filter((h) => h.grow_cycle_id !== id),
          events: s.events.filter((e) => e.grow_cycle_id !== id),
          tasks: s.tasks.filter((t) => t.grow_cycle_id !== id),
        })),
      changeStage: (cycleId, newStage) => {
        const now = new Date().toISOString();
        set((s) => {
          const updatedHistory = s.stageHistory.map((h) =>
            h.grow_cycle_id === cycleId && !h.ended_at ? { ...h, ended_at: now } : h
          );
          const newHistory: StageHistory = {
            id: crypto.randomUUID(),
            grow_cycle_id: cycleId,
            stage: newStage,
            started_at: now,
            ended_at: null,
          };
          const cycle = s.growCycles.find((c) => c.id === cycleId);
          const stageEvent: GrowEvent = {
            id: crypto.randomUUID(),
            grow_cycle_id: cycleId,
            type: 'stage_change',
            title: `Stage → ${newStage}`,
            description: `Changed from ${cycle?.current_stage} to ${newStage}`,
            date: now,
          };
          return {
            growCycles: s.growCycles.map((c) =>
              c.id === cycleId ? { ...c, current_stage: newStage, stage_start_date: now } : c
            ),
            stageHistory: [...updatedHistory, newHistory],
            events: [...s.events, stageEvent],
          };
        });
      },

      addEnvironment: (env) => set((s) => ({ environments: [...s.environments, env] })),
      updateEnvironment: (id, updates) =>
        set((s) => ({
          environments: s.environments.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      deleteEnvironment: (id) =>
        set((s) => ({ environments: s.environments.filter((e) => e.id !== id) })),

      addFeedSchedule: (schedule) => set((s) => ({ feedSchedules: [...s.feedSchedules, schedule] })),
      updateFeedSchedule: (id, updates) =>
        set((s) => ({
          feedSchedules: s.feedSchedules.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        })),
      deleteFeedSchedule: (id) =>
        set((s) => ({ feedSchedules: s.feedSchedules.filter((f) => f.id !== id) })),
      reorderFeedScheduleRow: (scheduleId, nutrientId, direction) =>
        set((s) => ({
          feedSchedules: s.feedSchedules.map((f) => {
            if (f.id !== scheduleId) return f;
            const idx = f.rows.findIndex((r) => r.nutrient_id === nutrientId);
            if (idx < 0) return f;
            const target = direction === 'up' ? idx - 1 : idx + 1;
            if (target < 0 || target >= f.rows.length) return f;
            // Only reorder within same category
            if (f.rows[target].category !== f.rows[idx].category) return f;
            const rows = [...f.rows];
            [rows[idx], rows[target]] = [rows[target], rows[idx]];
            return { ...f, rows };
          }),
        })),

      addNutrient: (nutrient) => set((s) => ({ nutrients: [...s.nutrients, nutrient] })),
      deleteNutrient: (id) => set((s) => ({ nutrients: s.nutrients.filter((n) => n.id !== id) })),

      addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
      updateTask: (id, updates) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
        })),

      addEvent: (event) => set((s) => ({ events: [...s.events, event] })),
      deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      addParameterLog: (log) => set((s) => ({ parameterLogs: [...s.parameterLogs, log] })),

      addFeedLog: (log) => set((s) => ({ feedLogs: [...s.feedLogs, log] })),

      addStrain: (strain) => set((s) => ({ strains: [...s.strains, strain] })),
      deleteStrain: (id) => set((s) => ({ strains: s.strains.filter((s2) => s2.id !== id) })),
      addBreeder: (breeder) => set((s) => ({ breeders: [...s.breeders, breeder] })),
    }),
    {
      name: 'hydro-grow-os',
      version: 2,
      migrate: (persistedState: any, version) => {
        if (!persistedState) return persistedState;
        if (version < 2) {
          // Replace legacy nutrients with new catalog
          persistedState.nutrients = [
            { id: 'part-a', name: 'Part A', brand: 'DTR', type: 'dry', form: 'dry', category: 'nutrient', unit: 'g/L' },
            { id: 'part-b', name: 'Part B', brand: 'DTR', type: 'dry', form: 'dry', category: 'nutrient', unit: 'g/L' },
            { id: 'bloom', name: 'Bloom', brand: 'DTR', type: 'dry', form: 'dry', category: 'nutrient', unit: 'g/L' },
            { id: 'front-row-si', name: 'Front Row Si', brand: 'Front Row', type: 'liquid', form: 'liquid', category: 'additive', unit: 'ml/L' },
            { id: 'phoszyme', name: 'PhosZyme', brand: 'General', type: 'liquid', form: 'liquid', category: 'additive', unit: 'ml/L' },
            { id: 'cal-hypo', name: 'Calcium Hypochlorite', brand: 'General', type: 'dry', form: 'dry', category: 'treatment', unit: 'g/L' },
          ];
          // Add DTR schedules if not already there
          const existing = new Set((persistedState.feedSchedules || []).map((f: any) => f.id));
          persistedState.feedSchedules = [
            ...DEFAULT_FEED_SCHEDULES.filter((f) => !existing.has(f.id)),
            ...(persistedState.feedSchedules || []),
          ];
        }
        return persistedState;
      },
    }
  )
);
