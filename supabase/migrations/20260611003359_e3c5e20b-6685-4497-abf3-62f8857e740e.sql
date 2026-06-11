
-- Defense-in-depth: enforce user_id ownership at the row level regardless of RLS.

CREATE OR REPLACE FUNCTION public.enforce_user_id_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  -- service_role bypasses (e.g. admin backfills via edge functions)
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF uid IS NULL THEN
    RAISE EXCEPTION 'ownership enforcement: no authenticated user' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Force ownership to the caller
    NEW.user_id := uid;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.user_id IS DISTINCT FROM uid THEN
      RAISE EXCEPTION 'ownership enforcement: cannot modify another user''s row' USING ERRCODE = '42501';
    END IF;
    -- Prevent ownership transfer
    NEW.user_id := OLD.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.user_id IS DISTINCT FROM uid THEN
      RAISE EXCEPTION 'ownership enforcement: cannot delete another user''s row' USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach trigger to every owned table
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'environments','environment_tasks','feed_schedules','feed_schedule_items',
    'feed_logs','grow_cycles','grow_environment_timeline','grow_events',
    'grow_strains','grow_tasks','nutrients','parameters','parameter_logs','strains'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS enforce_user_id_ownership ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER enforce_user_id_ownership
       BEFORE INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.enforce_user_id_ownership()',
      t
    );
  END LOOP;
END $$;

-- Join table: scope via parent environment ownership
CREATE OR REPLACE FUNCTION public.enforce_environment_parameters_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  env_owner uuid;
  env_id uuid := COALESCE(NEW.environment_id, OLD.environment_id);
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  IF uid IS NULL THEN
    RAISE EXCEPTION 'ownership enforcement: no authenticated user' USING ERRCODE = '42501';
  END IF;
  SELECT user_id INTO env_owner FROM public.environments WHERE id = env_id;
  IF env_owner IS DISTINCT FROM uid THEN
    RAISE EXCEPTION 'ownership enforcement: environment not owned by caller' USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS enforce_environment_parameters_ownership ON public.environment_parameters;
CREATE TRIGGER enforce_environment_parameters_ownership
  BEFORE INSERT OR UPDATE OR DELETE ON public.environment_parameters
  FOR EACH ROW EXECUTE FUNCTION public.enforce_environment_parameters_ownership();
