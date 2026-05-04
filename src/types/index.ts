export type GrowStage = 'nursery' | 'veg' | 'stretch' | 'stack' | 'swell' | 'ripen' | 'dry' | 'cure';
export type GrowStatus = 'active' | 'completed' | 'archived';
export type EventType = 'feed' | 'water' | 'transplant' | 'issue' | 'note' | 'stage_change' | 'environment_change' | 'stage_suggestion';
export type NutrientType = 'dry' | 'liquid';
export type NutrientCategory = 'nutrient' | 'additive' | 'treatment';
export type FeedMode = 'fixed' | 'guided';
export type TaskTriggerType = 'on_enter' | 'after_days' | 'on_stage';
export type TaskStatus = 'open' | 'completed';
export type Priority = 'low' | 'medium' | 'high';
export type TaskRepeat = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface Nutrient {
  id: string;
  name: string;
  category: NutrientCategory;
  form: NutrientType;
  active: boolean;
  brand?: string;
  type?: NutrientType;
  unit?: string;
  updated_at?: string;
}

export interface FeedSchedule {
  id: string;
  name: string;
  notes: string;
  rows: FeedScheduleRow[];
  ec_targets: Partial<Record<GrowStage, { min: number; max: number }>>;
  created_at: string;
  updated_at?: string;
}

export interface FeedScheduleRow {
  id: string;
  nutrient_id: string;
  nutrient_name: string;
  nutrient_type: NutrientType;
  category: NutrientCategory;
  amounts: Record<GrowStage, number>;
  order_index: number;
}

export interface Parameter {
  id: string;
  name: string;
  unit: string;
  active: boolean;
  updated_at?: string;
}

export interface EnvironmentTaskTemplate {
  id: string;
  environment_id: string;
  name: string;
  trigger_type: TaskTriggerType;
  trigger_offset_days: number;
  trigger_stage: GrowStage | null;
}

export interface Environment {
  id: string;
  name: string;
  supported_stages: GrowStage[];
  site_count: number;
  system_description: string;
  parameter_ids: string[];
  task_templates: EnvironmentTaskTemplate[];
  updated_at?: string;
  reservoir_volume?: number;
}

export interface Strain {
  id: string;
  name: string;
  breeder: string;
  veg_weeks: number;
  flower_weeks: number;
  traits: string[];
  notes: string;
  active: boolean;
  updated_at: string;
  breeder_name?: string;
  veg_days_est?: number;
  flower_days_est?: number;
}

export interface GrowStrain {
  id: string;
  grow_cycle_id: string;
  strain_id: string | null;
  plant_count: number;
  strain_name: string;
  veg_weeks: number;
  flower_weeks: number;
}

export type PlantStatus = 'active' | 'removed';

export interface Plant {
  id: string;
  grow_cycle_id: string;
  strain_id: string | null;
  strain_name: string;
  plant_tag: string;
  status: PlantStatus;
  created_at: string;
  removed_at: string | null;
  slot_index: number;
}

export interface GrowCycle {
  id: string;
  name: string;
  start_date: string;
  status: GrowStatus;
  current_stage: GrowStage;
  stage_start_date: string;
  flower_weeks: number;
  feed_mode: FeedMode;
  environment_id: string | null;
  feed_schedule_id: string | null;
  strains: string[];
  created_at: string;
  custom_name?: string;
}

export interface StageHistory {
  id: string;
  grow_cycle_id: string;
  stage: GrowStage;
  started_at: string;
  ended_at: string | null;
}

export interface GrowEnvironmentTimeline {
  id: string;
  grow_cycle_id: string;
  environment_id: string;
  environment_name: string;
  start_date: string;
  end_date: string | null;
  snapshot: Pick<Environment, 'name' | 'supported_stages' | 'site_count' | 'system_description' | 'parameter_ids'>;
}

export interface GrowTask {
  id: string;
  grow_cycle_id: string | null;
  name: string;
  title: string;
  description: string;
  due_date: string | null;
  stage_trigger: GrowStage | null;
  status: TaskStatus;
  completed: boolean;
  generated_from_environment: boolean;
  priority?: 'low' | 'medium' | 'high';
  reminder_time?: string | null;
  repeat?: TaskRepeat;
  repeat_parent_id?: string | null;
}

export interface GrowEvent {
  id: string;
  grow_cycle_id: string;
  type: EventType;
  title: string;
  description: string;
  date: string;
  metadata?: Record<string, unknown>;
}

export interface ParameterLog {
  id: string;
  grow_cycle_id: string;
  environment_id?: string | null;
  parameter_id?: string;
  value?: number;
  values?: Record<string, number>;
  timestamp: string;
}

export interface AlertRule {
  id: string;
  environment_id: string;
  param: string;
  min: number | null;
  max: number | null;
}

export interface FeedLog {
  id: string;
  grow_cycle_id: string;
  feed_schedule_id?: string | null;
  stage: GrowStage;
  date: string;
  timestamp: string;
  water_volume: number;
  liters: number;
  nutrients: { nutrient_id: string; name: string; amount: number; unit: string }[];
  additives: { nutrient_id: string; name: string; amount: number; unit: string }[];
  treatments: { nutrient_id: string; name: string; amount: number; unit: string }[];
  ec_measured?: number | null;
}

export const CATEGORY_ORDER: NutrientCategory[] = ['nutrient', 'additive', 'treatment'];
export const CATEGORY_LABELS: Record<NutrientCategory, string> = {
  nutrient: 'Nutrients',
  additive: 'Additives',
  treatment: 'Treatments',
};
export const formUnit = (form: NutrientType) => (form === 'liquid' ? 'ml/L' : 'g/L');
export const formUnitShort = (form: NutrientType) => (form === 'liquid' ? 'ml' : 'g');

export const STAGES: GrowStage[] = ['nursery', 'veg', 'stretch', 'stack', 'swell', 'ripen', 'dry', 'cure'];
export const FEED_STAGES: GrowStage[] = ['veg', 'stretch', 'stack', 'swell', 'ripen'];
export const FLOWER_STAGES: GrowStage[] = ['stretch', 'stack', 'swell', 'ripen'];
export const STAGE_GROUPS: { label: string; stages: GrowStage[] }[] = [
  { label: 'Nursery', stages: ['nursery'] },
  { label: 'Veg', stages: ['veg'] },
  { label: 'Flower', stages: FLOWER_STAGES },
  { label: 'Dry', stages: ['dry'] },
  { label: 'Cure', stages: ['cure'] },
];

export const STAGE_COLORS: Record<GrowStage, string> = {
  nursery: 'bg-stage-nursery',
  veg: 'bg-stage-veg',
  stretch: 'bg-stage-stretch',
  stack: 'bg-stage-stack',
  swell: 'bg-stage-swell',
  ripen: 'bg-stage-ripen',
  dry: 'bg-stage-dry',
  cure: 'bg-stage-cure',
};

export const STAGE_TEXT_COLORS: Record<GrowStage, string> = {
  nursery: 'text-stage-nursery',
  veg: 'text-stage-veg',
  stretch: 'text-stage-stretch',
  stack: 'text-stage-stack',
  swell: 'text-stage-swell',
  ripen: 'text-stage-ripen',
  dry: 'text-stage-dry',
  cure: 'text-stage-cure',
};
