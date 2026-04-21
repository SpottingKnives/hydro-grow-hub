import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GrowCycle, StageHistory, Environment, FeedSchedule, GrowTask,
  GrowEvent, ParameterLog, AlertRule, FeedLog, Nutrient, Strain, Breeder, FeedScheduleRow
} from '@/types';
import { FEED_STAGES } from '@/types';

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
      feedSchedules: [],
      nutrients: [
        { id: 'n1', name: 'Grow A', brand: 'General', type: 'liquid', unit: 'ml/L' },
        { id: 'n2', name: 'Grow B', brand: 'General', type: 'liquid', unit: 'ml/L' },
        { id: 'n3', name: 'Bloom A', brand: 'General', type: 'liquid', unit: 'ml/L' },
        { id: 'n4', name: 'Bloom B', brand: 'General', type: 'liquid', unit: 'ml/L' },
        { id: 'n5', name: 'Cal-Mag', brand: 'General', type: 'liquid', unit: 'ml/L' },
        { id: 'n6', name: 'PK 13/14', brand: 'General', type: 'liquid', unit: 'ml/L' },
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
    { name: 'hydro-grow-os' }
  )
);
