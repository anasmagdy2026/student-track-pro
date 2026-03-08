
CREATE TABLE public.sibling_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  sibling_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, sibling_id),
  CHECK (student_id <> sibling_id)
);

ALTER TABLE public.sibling_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access to sibling_links"
  ON public.sibling_links
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
