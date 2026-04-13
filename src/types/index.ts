export type GrowStage = 'nursery' | 'veg' | 'stretch' | 'stack' | 'swell' | 'ripen' | 'dry' | 'cure';
export type GrowStatus = 'active' | 'completed' | 'archived';
export type EventType = 'feed' | 'water' | 'transplant' | 'issue' | 'note' | 'stage_change';
export type NutrientType = 'dry' | 'liquid';
export type Priority = 'low' | 'medium' | 'high';

export interface Breeder {
  id: string;
  name: string;
}

export interface Strain {
  id: string;
  name: string;
  breeder_id: string;
  breeder_name?: string;
  veg_days_est: number;
  flower_days_est: number;
  stretch_percent: number;
  traits: string[];
  notes: string;
}

export interface GrowCycle {
  id: string;
  name: string;
  start_date: string;
  status: GrowStatus;
  current_stage: GrowStage;
  stage_start_date: string;
  environment_id: string | null;
  feed_schedule_id: string | null;
  strains: string[];
  created_at: string;
}

export interface StageHistory {
  id: string;
  grow_cycle_id: string;
  stage: GrowStage;
  started_at: string;
  ended_at: string | null;
}

export interface Environment {
  id: string;
  name: string;
  supported_stages: GrowStage[];
  site_count: number;
  monitored_params: string[];
}

export interface Nutrient {
  id: string;
  name: string;
  brand: string;
  type: NutrientType;
  unit: string;
}

export interface FeedSchedule {
  id: string;
  name: string;
  rows: FeedScheduleRow[];
}

export interface FeedScheduleRow {
  nutrient_id: string;
  nutrient_name: string;
  nutrient_type: NutrientType;
  amounts: Record<string, number>; // stage -> amount
}

export interface GrowTask {
  id: string;
  grow_cycle_id: string | null;
  title: string;
  description: string;
  due_date: string | null;
  stage_trigger: GrowStage | null;
  priority: Priority;
  completed: boolean;
  reminder_time: string | null;
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
  environment_id: string | null;
  timestamp: string;
  param: string;
  value: number;
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
  date: string;
  water_volume: number;
  nutrients: { nutrient_id: string; name: string; amount: number; unit: string }[];
}

export const STAGES: GrowStage[] = ['nursery', 'veg', 'stretch', 'stack', 'swell', 'ripen', 'dry', 'cure'];
export const FEED_STAGES: GrowStage[] = ['veg', 'stretch', 'stack', 'swell', 'ripen'];

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
