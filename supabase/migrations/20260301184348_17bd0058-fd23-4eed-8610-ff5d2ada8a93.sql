
CREATE TABLE public.group_lesson_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  topic text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.group_lesson_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access to group_lesson_log"
  ON public.group_lesson_log
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
