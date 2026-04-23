DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'nutrients','feed_schedules','feed_schedule_items','parameters','environments',
    'environment_parameters','environment_tasks','strains','grow_cycles','grow_strains',
    'grow_environment_timeline','grow_tasks','grow_events','parameter_logs','feed_logs'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "App can create %1$s" ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "App can update %1$s" ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "App can delete %1$s" ON public.%1$I', tbl);
    EXECUTE format('CREATE POLICY "Signed in users can create %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)', tbl);
    EXECUTE format('CREATE POLICY "Signed in users can update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', tbl);
    EXECUTE format('CREATE POLICY "Signed in users can delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL)', tbl);
  END LOOP;
END $$;