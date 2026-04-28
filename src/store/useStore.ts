import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AlertRule, Environment, EnvironmentTaskTemplate, FeedLog, FeedMode, FeedSchedule, FeedScheduleRow,
  GrowCycle, GrowEnvironmentTimeline, GrowEvent, GrowStage, GrowStrain, GrowTask, Nutrient, Plant,
  NutrientCategory, Parameter, ParameterLog, StageHistory, Strain, TaskTriggerType
} from '@/types';
import { FEED_STAGES } from '@/types';

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const amounts = () => Object.fromEntries(FEED_STAGES.map((s) => [s, 0])) as Record<GrowStage, number>;
const unit = (form: 'dry' | 'liquid') => (form === 'liquid' ? 'ml/L' : 'g/L');
const shortUnit = (form: 'dry' | 'liquid') => (form === 'liquid' ? 'ml' : 'g');
const addDays = (date: string, days: number) => new Date(new Date(date).getTime() + days * 86400000).toISOString().slice(0, 10);

const DEFAULT_NUTRIENTS: Nutrient[] = [
  { id: 'part-a', name: 'Part A', category: 'nutrient', form: 'dry', active: true, unit: 'g/L' },
  { id: 'part-b', name: 'Part B', category: 'nutrient', form: 'dry', active: true, unit: 'g/L' },
  { id: 'bloom', name: 'Bloom', category: 'nutrient', form: 'dry', active: true, unit: 'g/L' },
  { id: 'front-row-si', name: 'Front Row Si', category: 'additive', form: 'liquid', active: true, unit: 'ml/L' },
  { id: 'phoszyme', name: 'PhosZyme', category: 'additive', form: 'liquid', active: true, unit: 'ml/L' },
  { id: 'cal-hypo', name: 'Calcium Hypochlorite', category: 'treatment', form: 'dry', active: true, unit: 'g/L' },
];

const row = (nutrient: Nutrient, vals: number[], order_index: number): FeedScheduleRow => ({
  id: id(), nutrient_id: nutrient.id, nutrient_name: nutrient.name, nutrient_type: nutrient.form,
  category: nutrient.category, order_index, amounts: Object.fromEntries(FEED_STAGES.map((s, i) => [s, vals[i] ?? 0])) as Record<GrowStage, number>,
});

const DEFAULT_FEED_SCHEDULES: FeedSchedule[] = [{
  id: 'dtr-standard', name: 'DTR Standard', notes: 'Default reference schedule', created_at: '2024-01-01T00:00:00.000Z',
  ec_targets: { veg: { min: 1.6, max: 1.8 }, stretch: { min: 2.0, max: 2.2 }, stack: { min: 1.6, max: 1.8 }, swell: { min: 1.4, max: 1.6 }, ripen: { min: 1.2, max: 1.4 } },
  rows: DEFAULT_NUTRIENTS.map((n, i) => row(n, i === 0 ? [1.4, 1.5, 1.1, 0.9, 0.9] : i === 1 ? [1.7, 1.9, 1.3, 1.1, 1.0] : i === 2 ? [0.9, 1.1, 0.7, 0.6, 0.5] : i === 5 ? [0.0035, 0.0035, 0.0035, 0.0035, 0.0035] : [0.1, 0.1, 0.1, 0.1, 0.1], i)),
}];

interface AppState {
  growCycles: GrowCycle[]; stageHistory: StageHistory[]; environments: Environment[]; feedSchedules: FeedSchedule[];
  nutrients: Nutrient[]; tasks: GrowTask[]; events: GrowEvent[]; parameterLogs: ParameterLog[]; alertRules: AlertRule[];
  feedLogs: FeedLog[]; strains: Strain[]; growStrains: GrowStrain[]; plants: Plant[]; environmentTimeline: GrowEnvironmentTimeline[]; parameters: Parameter[];
  addGrowCycle: (cycle: GrowCycle, plants?: Plant[]) => void; updateGrowCycle: (id: string, updates: Partial<GrowCycle>) => void; deleteGrowCycle: (id: string) => void; changeStage: (cycleId: string, newStage: GrowStage) => void; moveGrowEnvironment: (cycleId: string, environmentId: string, startDate?: string) => void;
  addPlants: (cycleId: string, strain: Strain, count: number, growName: string) => void; removePlant: (plantId: string) => void;
  addEnvironment: (env: Environment) => void; updateEnvironment: (id: string, updates: Partial<Environment>) => void; deleteEnvironment: (id: string) => void;
  addParameter: (parameter: Parameter) => void; updateParameter: (id: string, updates: Partial<Parameter>) => void; deleteParameter: (id: string) => void;
  addFeedSchedule: (schedule: FeedSchedule) => void; updateFeedSchedule: (id: string, updates: Partial<FeedSchedule>) => void; deleteFeedSchedule: (id: string) => void; reorderFeedScheduleRow: (scheduleId: string, rowId: string, direction: 'up' | 'down') => void; addScheduleRow: (scheduleId: string, nutrient: Nutrient) => void;
  addNutrient: (nutrient: Nutrient) => void; updateNutrient: (id: string, updates: Partial<Nutrient>) => void; deleteNutrient: (id: string) => void;
  addTask: (task: GrowTask) => void; updateTask: (id: string, updates: Partial<GrowTask>) => void; deleteTask: (id: string) => void; toggleTask: (id: string) => void;
  addEvent: (event: GrowEvent) => void; deleteEvent: (id: string) => void; addParameterLog: (log: ParameterLog) => void; addFeedLog: (log: FeedLog) => void;
  addStrain: (strain: Strain) => void; updateStrain: (id: string, updates: Partial<Strain>) => void; deleteStrain: (id: string) => void;
}

export const useStore = create<AppState>()(persist((set, get) => ({
  growCycles: [], stageHistory: [], environments: [], feedSchedules: DEFAULT_FEED_SCHEDULES, nutrients: DEFAULT_NUTRIENTS,
  tasks: [], events: [], parameterLogs: [], alertRules: [], feedLogs: [], strains: [], growStrains: [], plants: [], environmentTimeline: [],
  parameters: [{ id: 'ph', name: 'pH', unit: 'pH', active: true }, { id: 'ec', name: 'EC', unit: 'mS/cm', active: true }, { id: 'temp', name: 'Temperature', unit: '°C', active: true }, { id: 'humidity', name: 'Humidity', unit: '%', active: true }],

  addGrowCycle: (cycle, plants = []) => set((s) => ({ growCycles: [...s.growCycles, cycle], plants: [...s.plants, ...plants], stageHistory: [...s.stageHistory, { id: id(), grow_cycle_id: cycle.id, stage: cycle.current_stage, started_at: cycle.start_date, ended_at: null }] })),
  updateGrowCycle: (gid, updates) => set((s) => ({ growCycles: s.growCycles.map((c) => c.id === gid ? { ...c, ...updates } : c) })),
  deleteGrowCycle: (gid) => set((s) => ({ growCycles: s.growCycles.filter((c) => c.id !== gid), growStrains: s.growStrains.filter((g) => g.grow_cycle_id !== gid), plants: s.plants.filter((p) => p.grow_cycle_id !== gid), stageHistory: s.stageHistory.filter((h) => h.grow_cycle_id !== gid), events: s.events.filter((e) => e.grow_cycle_id !== gid), tasks: s.tasks.filter((t) => t.grow_cycle_id !== gid), environmentTimeline: s.environmentTimeline.filter((t) => t.grow_cycle_id !== gid) })),
  changeStage: (cycleId, newStage) => set((s) => { const current = s.growCycles.find((c) => c.id === cycleId); return { growCycles: s.growCycles.map((c) => c.id === cycleId ? { ...c, current_stage: newStage, stage_start_date: now() } : c), stageHistory: [...s.stageHistory.map((h) => h.grow_cycle_id === cycleId && !h.ended_at ? { ...h, ended_at: now() } : h), { id: id(), grow_cycle_id: cycleId, stage: newStage, started_at: now(), ended_at: null }], events: [...s.events, { id: id(), grow_cycle_id: cycleId, type: 'stage_change', title: `Transitioned to ${newStage}`, description: `Changed from ${current?.current_stage} to ${newStage}`, date: now() }] }; }),
  moveGrowEnvironment: (cycleId, environmentId, startDate = now().slice(0, 10)) => set((s) => { const env = s.environments.find((e) => e.id === environmentId); if (!env) return s; const templates = env.task_templates || []; const generated = templates.map((t): GrowTask => ({ id: id(), grow_cycle_id: cycleId, name: t.name, title: t.name, description: '', due_date: t.trigger_type === 'after_days' ? addDays(startDate, t.trigger_offset_days) : startDate, stage_trigger: t.trigger_stage, status: 'open', completed: false, generated_from_environment: true })); return { growCycles: s.growCycles.map((c) => c.id === cycleId ? { ...c, environment_id: environmentId } : c), environmentTimeline: [...s.environmentTimeline.map((t) => t.grow_cycle_id === cycleId && !t.end_date ? { ...t, end_date: startDate } : t), { id: id(), grow_cycle_id: cycleId, environment_id: env.id, environment_name: env.name, start_date: startDate, end_date: null, snapshot: { name: env.name, supported_stages: env.supported_stages, site_count: env.site_count, system_description: env.system_description, parameter_ids: env.parameter_ids } }], tasks: [...s.tasks, ...generated], events: [...s.events, { id: id(), grow_cycle_id: cycleId, type: 'environment_change', title: `Moved to ${env.name}`, description: '', date: startDate }] }; }),

  addPlants: (cycleId, strain, count, growName) => set((s) => {
    const existing = s.plants.filter((p) => p.grow_cycle_id === cycleId && p.strain_id === strain.id).length;
    const tagBase = `${strain.name.replace(/\s+/g, '')}-${growName.replace(/\s+/g, '')}`;
    const created: Plant[] = Array.from({ length: count }, (_, i) => ({
      id: id(), grow_cycle_id: cycleId, strain_id: strain.id, strain_name: strain.name,
      plant_tag: `${tagBase}-${String(existing + i + 1).padStart(2, '0')}`,
      status: 'active', created_at: now(), removed_at: null,
    }));
    return { plants: [...s.plants, ...created] };
  }),
  removePlant: (plantId) => set((s) => ({ plants: s.plants.map((p) => p.id === plantId ? { ...p, status: 'removed', removed_at: now() } : p) })),

  addEnvironment: (env) => set((s) => ({ environments: [...s.environments, { ...env, updated_at: env.updated_at ?? now() }] })),
  updateEnvironment: (eid, updates) => set((s) => ({ environments: s.environments.map((e) => e.id === eid ? { ...e, ...updates, updated_at: now() } : e) })),
  deleteEnvironment: (eid) => set((s) => ({ environments: s.environments.filter((e) => e.id !== eid) })),
  addParameter: (parameter) => set((s) => ({ parameters: [...s.parameters, { ...parameter, active: parameter.active ?? true, updated_at: parameter.updated_at ?? now() }] })),
  updateParameter: (pid, updates) => set((s) => ({ parameters: s.parameters.map((p) => p.id === pid ? { ...p, ...updates, updated_at: now() } : p) })),
  deleteParameter: (pid) => set((s) => ({ parameters: s.parameters.filter((p) => p.id !== pid), environments: s.environments.map((e) => ({ ...e, parameter_ids: e.parameter_ids.filter((id) => id !== pid) })) })),

  addFeedSchedule: (schedule) => set((s) => ({ feedSchedules: [{ ...schedule, created_at: schedule.created_at || now(), updated_at: schedule.updated_at ?? now() }, ...s.feedSchedules] })),
  updateFeedSchedule: (fid, updates) => set((s) => ({ feedSchedules: s.feedSchedules.map((f) => f.id === fid ? { ...f, ...updates, updated_at: now() } : f) })),
  deleteFeedSchedule: (fid) => set((s) => ({ feedSchedules: s.feedSchedules.filter((f) => f.id !== fid) })),
  reorderFeedScheduleRow: (scheduleId, rowId, direction) => set((s) => ({ feedSchedules: s.feedSchedules.map((f) => { if (f.id !== scheduleId) return f; const rows = [...f.rows].sort((a, b) => a.order_index - b.order_index); const idx = rows.findIndex((r) => r.id === rowId || r.nutrient_id === rowId); const target = direction === 'up' ? idx - 1 : idx + 1; if (idx < 0 || target < 0 || target >= rows.length || rows[idx].category !== rows[target].category) return f; [rows[idx], rows[target]] = [rows[target], rows[idx]]; return { ...f, rows: rows.map((r, i) => ({ ...r, order_index: i })) }; }) })),
  addScheduleRow: (scheduleId, nutrient) => set((s) => ({ feedSchedules: s.feedSchedules.map((f) => f.id === scheduleId && !f.rows.some((r) => r.nutrient_id === nutrient.id) ? { ...f, rows: [...f.rows, { id: id(), nutrient_id: nutrient.id, nutrient_name: nutrient.name, nutrient_type: nutrient.form, category: nutrient.category, amounts: amounts(), order_index: f.rows.length }] } : f) })),

  addNutrient: (nutrient) => set((s) => ({ nutrients: [...s.nutrients, { ...nutrient, active: nutrient.active ?? true, unit: unit(nutrient.form), type: nutrient.form, updated_at: nutrient.updated_at ?? now() }] })),
  updateNutrient: (nid, updates) => set((s) => { const nutrients = s.nutrients.map((n) => n.id === nid ? { ...n, ...updates, unit: updates.form ? unit(updates.form) : n.unit, type: updates.form ?? n.type, updated_at: now() } : n); const updated = nutrients.find((n) => n.id === nid); return { nutrients, feedSchedules: updated ? s.feedSchedules.map((f) => ({ ...f, rows: f.rows.map((r) => r.nutrient_id === nid ? { ...r, nutrient_name: updated.name, nutrient_type: updated.form, category: updated.category } : r) })) : s.feedSchedules }; }),
  deleteNutrient: (nid) => set((s) => ({ nutrients: s.nutrients.filter((n) => n.id !== nid), feedSchedules: s.feedSchedules.map((f) => ({ ...f, rows: f.rows.filter((r) => r.nutrient_id !== nid).map((r, i) => ({ ...r, order_index: i })) })) })),

  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  updateTask: (tid, updates) => set((s) => ({ tasks: s.tasks.map((t) => t.id === tid ? { ...t, ...updates, completed: updates.status ? updates.status === 'completed' : updates.completed ?? t.completed } : t) })),
  deleteTask: (tid) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== tid) })),
  toggleTask: (tid) => set((s) => ({ tasks: s.tasks.map((t) => t.id === tid ? { ...t, completed: !t.completed, status: !t.completed ? 'completed' : 'open' } : t) })),
  addEvent: (event) => set((s) => ({ events: [...s.events, event] })), deleteEvent: (eid) => set((s) => ({ events: s.events.filter((e) => e.id !== eid) })),
  addParameterLog: (log) => set((s) => ({ parameterLogs: [...s.parameterLogs, log] })), addFeedLog: (log) => set((s) => ({ feedLogs: [...s.feedLogs, log] })),
  addStrain: (strain) => set((s) => ({ strains: [...s.strains, { ...strain, active: strain.active ?? true, updated_at: now() }] })),
  updateStrain: (sid, updates) => set((s) => ({ strains: s.strains.map((st) => st.id === sid ? { ...st, ...updates, updated_at: now() } : st) })),
  deleteStrain: (sid) => set((s) => ({ strains: s.strains.filter((st) => st.id !== sid) })),
}), { name: 'hydro-grow-os', version: 9, migrate: (state: any) => ({ ...state, nutrients: (state?.nutrients?.length ? state.nutrients : DEFAULT_NUTRIENTS).map((n: any) => ({ ...n, active: n.active ?? true, form: n.form ?? n.type ?? 'dry', unit: n.unit ?? shortUnit(n.form ?? n.type ?? 'dry'), updated_at: n.updated_at ?? now() })), feedSchedules: state?.feedSchedules?.length ? state.feedSchedules.map((f: any) => ({ ...f, notes: f.notes ?? '', created_at: f.created_at ?? '2024-01-01T00:00:00.000Z', updated_at: f.updated_at ?? f.created_at ?? now(), ec_targets: f.ec_targets ?? {}, rows: (f.rows ?? []).map((r: any, i: number) => ({ ...r, id: r.id ?? r.nutrient_id, order_index: r.order_index ?? i })) })) : DEFAULT_FEED_SCHEDULES, environments: (state?.environments ?? []).map((e: any) => ({ ...e, system_description: e.system_description ?? '', parameter_ids: e.parameter_ids ?? [], task_templates: e.task_templates ?? [], updated_at: e.updated_at ?? now() })), strains: (state?.strains ?? []).map((st: any) => ({ id: st.id, name: st.name, breeder: st.breeder ?? st.breeder_name ?? '', veg_weeks: st.veg_weeks ?? Math.ceil((st.veg_days_est ?? 28) / 7), flower_weeks: st.flower_weeks ?? Math.ceil((st.flower_days_est ?? 56) / 7), traits: st.traits ?? [], notes: st.notes ?? '', active: st.active ?? true, updated_at: st.updated_at ?? now() })), parameters: (state?.parameters ?? [{ id: 'ph', name: 'pH', unit: 'pH' }, { id: 'ec', name: 'EC', unit: 'mS/cm' }]).map((p: any) => ({ ...p, active: p.active ?? true, updated_at: p.updated_at ?? now() })), growStrains: state?.growStrains ?? [], plants: state?.plants ?? [], growCycles: (state?.growCycles ?? []).map((c: any) => { const { veg_weeks, ...rest } = c; return rest; }), environmentTimeline: state?.environmentTimeline ?? [] }) }));
