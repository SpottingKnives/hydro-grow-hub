DO $$ BEGIN
  CREATE TYPE public.nutrient_category AS ENUM ('nutrient', 'additive', 'treatment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.nutrient_form AS ENUM ('dry', 'liquid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.grow_stage AS ENUM ('veg', 'stretch', 'stack', 'swell', 'ripen');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.feed_mode AS ENUM ('fixed', 'guided');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_trigger_type AS ENUM ('on_enter', 'after_days', 'on_stage');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('open', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE IF NOT EXISTS public.nutrients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category public.nutrient_category NOT NULL,
  form public.nutrient_form NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feed_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  ec_targets JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feed_schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.feed_schedules(id) ON DELETE CASCADE,
  nutrient_id UUID NOT NULL REFERENCES public.nutrients(id),
  stage_values JSONB NOT NULL DEFAULT '{"veg":0,"stretch":0,"stack":0,"swell":0,"ripen":0}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(schedule_id, nutrient_id)
);

CREATE TABLE IF NOT EXISTS public.parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  supported_stages public.grow_stage[] NOT NULL DEFAULT '{}',
  site_count INTEGER NOT NULL DEFAULT 1 CHECK (site_count > 0),
  system_description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.environment_parameters (
  environment_id UUID NOT NULL REFERENCES public.environments(id) ON DELETE CASCADE,
  parameter_id UUID NOT NULL REFERENCES public.parameters(id) ON DELETE CASCADE,
  PRIMARY KEY (environment_id, parameter_id)
);

CREATE TABLE IF NOT EXISTS public.environment_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment_id UUID NOT NULL REFERENCES public.environments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type public.task_trigger_type NOT NULL,
  trigger_offset_days INTEGER NOT NULL DEFAULT 0,
  trigger_stage public.grow_stage,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.strains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  breeder TEXT NOT NULL DEFAULT '',
  veg_weeks INTEGER NOT NULL DEFAULT 4 CHECK (veg_weeks > 0),
  flower_weeks INTEGER NOT NULL DEFAULT 8 CHECK (flower_weeks > 0),
  traits TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grow_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  veg_weeks INTEGER NOT NULL DEFAULT 4 CHECK (veg_weeks > 0),
  flower_weeks INTEGER NOT NULL DEFAULT 8 CHECK (flower_weeks > 0),
  current_stage public.grow_stage NOT NULL DEFAULT 'veg',
  feed_mode public.feed_mode NOT NULL DEFAULT 'fixed',
  feed_schedule_id UUID REFERENCES public.feed_schedules(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grow_strains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grow_cycle_id UUID NOT NULL REFERENCES public.grow_cycles(id) ON DELETE CASCADE,
  strain_id UUID REFERENCES public.strains(id) ON DELETE SET NULL,
  plant_count INTEGER NOT NULL DEFAULT 1 CHECK (plant_count > 0),
  strain_name TEXT NOT NULL,
  veg_weeks INTEGER NOT NULL,
  flower_weeks INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grow_environment_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grow_cycle_id UUID NOT NULL REFERENCES public.grow_cycles(id) ON DELETE CASCADE,
  environment_id UUID NOT NULL REFERENCES public.environments(id),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  environment_name TEXT NOT NULL DEFAULT '',
  supported_stages public.grow_stage[] NOT NULL DEFAULT '{}',
  site_count INTEGER NOT NULL DEFAULT 1,
  system_description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_environment_per_grow
ON public.grow_environment_timeline(grow_cycle_id)
WHERE end_date IS NULL;

CREATE TABLE IF NOT EXISTS public.grow_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grow_cycle_id UUID NOT NULL REFERENCES public.grow_cycles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  due_date DATE,
  status public.task_status NOT NULL DEFAULT 'open',
  generated_from_environment BOOLEAN NOT NULL DEFAULT false,
  source_environment_task_id UUID REFERENCES public.environment_tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grow_cycle_id UUID NOT NULL REFERENCES public.grow_cycles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parameter_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grow_cycle_id UUID NOT NULL REFERENCES public.grow_cycles(id) ON DELETE CASCADE,
  parameter_id UUID NOT NULL REFERENCES public.parameters(id),
  value NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feed_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grow_cycle_id UUID NOT NULL REFERENCES public.grow_cycles(id) ON DELETE CASCADE,
  feed_schedule_id UUID REFERENCES public.feed_schedules(id) ON DELETE SET NULL,
  stage public.grow_stage NOT NULL,
  liters NUMERIC NOT NULL CHECK (liters > 0),
  nutrients JSONB NOT NULL DEFAULT '[]'::jsonb,
  additives JSONB NOT NULL DEFAULT '[]'::jsonb,
  treatments JSONB NOT NULL DEFAULT '[]'::jsonb,
  ec_measured NUMERIC,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_schedules_created_at ON public.feed_schedules(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_schedule_items_schedule_order ON public.feed_schedule_items(schedule_id, order_index);
CREATE INDEX IF NOT EXISTS idx_grow_tasks_due_date ON public.grow_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_parameter_logs_grow_timestamp ON public.parameter_logs(grow_cycle_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_feed_logs_grow_timestamp ON public.feed_logs(grow_cycle_id, timestamp DESC);

ALTER TABLE public.nutrients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environment_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environment_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grow_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grow_strains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grow_environment_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parameter_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_logs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'nutrients','feed_schedules','feed_schedule_items','parameters','environments',
    'environment_parameters','environment_tasks','strains','grow_cycles','grow_strains',
    'grow_environment_timeline','grow_tasks','grow_events','parameter_logs','feed_logs'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "App can view %1$s" ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "App can create %1$s" ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "App can update %1$s" ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "App can delete %1$s" ON public.%1$I', tbl);
    EXECUTE format('CREATE POLICY "App can view %1$s" ON public.%1$I FOR SELECT TO anon, authenticated USING (true)', tbl);
    EXECUTE format('CREATE POLICY "App can create %1$s" ON public.%1$I FOR INSERT TO anon, authenticated WITH CHECK (true)', tbl);
    EXECUTE format('CREATE POLICY "App can update %1$s" ON public.%1$I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', tbl);
    EXECUTE format('CREATE POLICY "App can delete %1$s" ON public.%1$I FOR DELETE TO anon, authenticated USING (true)', tbl);
  END LOOP;
END $$;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'nutrients','feed_schedules','feed_schedule_items','parameters','environments',
    'environment_tasks','strains','grow_cycles','grow_tasks'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%1$s_updated_at ON public.%1$I', tbl);
    EXECUTE format('CREATE TRIGGER update_%1$s_updated_at BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', tbl);
  END LOOP;
END $$;

INSERT INTO public.nutrients (name, category, form, active)
VALUES
  ('Part A', 'nutrient', 'dry', true),
  ('Part B', 'nutrient', 'dry', true),
  ('Bloom', 'nutrient', 'dry', true),
  ('Front Row Si', 'additive', 'liquid', true),
  ('PhosZyme', 'additive', 'liquid', true),
  ('Calcium Hypochlorite', 'treatment', 'dry', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.parameters (name, unit)
VALUES
  ('pH', 'pH'),
  ('EC', 'mS/cm'),
  ('Temperature', '°C'),
  ('Humidity', '%')
ON CONFLICT (name) DO NOTHING;