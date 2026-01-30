-- Create dynamic grade/level catalog
CREATE TABLE IF NOT EXISTS public.grade_levels (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_levels ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user full access (matches current app pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'grade_levels'
      AND policyname = 'Authenticated full access to grade_levels'
  ) THEN
    CREATE POLICY "Authenticated full access to grade_levels"
    ON public.grade_levels
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Trigger to maintain updated_at
DROP TRIGGER IF EXISTS update_grade_levels_updated_at ON public.grade_levels;
CREATE TRIGGER update_grade_levels_updated_at
BEFORE UPDATE ON public.grade_levels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default levels if not present
INSERT INTO public.grade_levels (code, label, sort_order)
VALUES
  ('1', 'أولى ثانوي', 1),
  ('2', 'تانية ثانوي', 2),
  ('3', 'تالتة ثانوي', 3)
ON CONFLICT (code) DO NOTHING;

-- Helpful index for ordering
CREATE INDEX IF NOT EXISTS idx_grade_levels_sort_order
ON public.grade_levels (sort_order, code);