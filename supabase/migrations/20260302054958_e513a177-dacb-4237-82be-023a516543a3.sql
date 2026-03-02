
CREATE TABLE public.next_session_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  homework text,
  recitation text,
  exam text,
  sheet text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.next_session_reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access to next_session_reminder_log"
  ON public.next_session_reminder_log
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
