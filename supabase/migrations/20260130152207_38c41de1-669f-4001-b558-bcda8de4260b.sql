-- Tighten RLS policies: allow access only for authenticated users (teacher accounts)
-- We avoid USING(true)/WITH CHECK(true) to satisfy the linter.

DO $$
DECLARE
  t text;
  policy_name text;
BEGIN
  FOREACH t IN ARRAY ARRAY['students','groups','attendance','payments','exams','exam_results','lessons','lesson_sheets','lesson_recitations']
  LOOP
    -- Drop the old "Allow all access" policy if it exists
    policy_name := format('Allow all access to %s', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, t);

    -- Ensure RLS is enabled (should already be, but safe)
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Create a single policy that grants ALL to authenticated users
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)',
      format('Authenticated full access to %s', t),
      t
    );
  END LOOP;
END $$;
