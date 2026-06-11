
-- Add user_id ownership column to all public tables
ALTER TABLE public.environments ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.environment_tasks ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.feed_schedules ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.feed_schedule_items ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.feed_logs ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.grow_cycles ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.grow_environment_timeline ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.grow_events ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.grow_strains ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.grow_tasks ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.nutrients ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.parameters ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.parameter_logs ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.strains ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

-- Drop all existing policies and replace with owner-scoped ones
DO $$
DECLARE
  t text;
  p record;
  tables text[] := ARRAY[
    'environments','environment_tasks','feed_schedules','feed_schedule_items',
    'feed_logs','grow_cycles','grow_environment_timeline','grow_events',
    'grow_strains','grow_tasks','nutrients','parameters','parameter_logs','strains'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;
    EXECUTE format('CREATE POLICY "Owners can select own %1$s" ON public.%1$I FOR SELECT TO authenticated USING (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Owners can insert own %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Owners can update own %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Owners can delete own %1$s" ON public.%1$I FOR DELETE TO authenticated USING (auth.uid() = user_id)', t);
  END LOOP;
END $$;

-- environment_parameters: join table, scope via parent environment ownership
DROP POLICY IF EXISTS "App can view environment_parameters" ON public.environment_parameters;
DROP POLICY IF EXISTS "Signed in users can create environment_parameters" ON public.environment_parameters;
DROP POLICY IF EXISTS "Signed in users can update environment_parameters" ON public.environment_parameters;
DROP POLICY IF EXISTS "Signed in users can delete environment_parameters" ON public.environment_parameters;

CREATE POLICY "Owners can select own environment_parameters"
  ON public.environment_parameters FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.environments e WHERE e.id = environment_id AND e.user_id = auth.uid()));
CREATE POLICY "Owners can insert own environment_parameters"
  ON public.environment_parameters FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.environments e WHERE e.id = environment_id AND e.user_id = auth.uid()));
CREATE POLICY "Owners can delete own environment_parameters"
  ON public.environment_parameters FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.environments e WHERE e.id = environment_id AND e.user_id = auth.uid()));

-- Revoke anon access on all public tables (was implicit via roles list)
REVOKE ALL ON public.environments, public.environment_tasks, public.environment_parameters,
  public.feed_schedules, public.feed_schedule_items, public.feed_logs,
  public.grow_cycles, public.grow_environment_timeline, public.grow_events,
  public.grow_strains, public.grow_tasks, public.nutrients, public.parameters,
  public.parameter_logs, public.strains FROM anon;
