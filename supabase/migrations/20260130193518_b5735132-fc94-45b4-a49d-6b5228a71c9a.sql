-- Allow dynamic academic year codes by removing legacy numeric-only CHECK constraints
ALTER TABLE public.groups   DROP CONSTRAINT IF EXISTS groups_grade_check;
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_grade_check;
ALTER TABLE public.exams    DROP CONSTRAINT IF EXISTS exams_grade_check;
ALTER TABLE public.lessons  DROP CONSTRAINT IF EXISTS lessons_grade_check;

-- Enforce that grade codes must exist in grade_levels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'groups_grade_fkey_grade_levels'
  ) THEN
    ALTER TABLE public.groups
      ADD CONSTRAINT groups_grade_fkey_grade_levels
      FOREIGN KEY (grade) REFERENCES public.grade_levels(code)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'students_grade_fkey_grade_levels'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_grade_fkey_grade_levels
      FOREIGN KEY (grade) REFERENCES public.grade_levels(code)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'exams_grade_fkey_grade_levels'
  ) THEN
    ALTER TABLE public.exams
      ADD CONSTRAINT exams_grade_fkey_grade_levels
      FOREIGN KEY (grade) REFERENCES public.grade_levels(code)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lessons_grade_fkey_grade_levels'
  ) THEN
    ALTER TABLE public.lessons
      ADD CONSTRAINT lessons_grade_fkey_grade_levels
      FOREIGN KEY (grade) REFERENCES public.grade_levels(code)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

-- Helpful indexes for filtering
CREATE INDEX IF NOT EXISTS idx_groups_grade   ON public.groups(grade);
CREATE INDEX IF NOT EXISTS idx_students_grade ON public.students(grade);
CREATE INDEX IF NOT EXISTS idx_exams_grade    ON public.exams(grade);
CREATE INDEX IF NOT EXISTS idx_lessons_grade  ON public.lessons(grade);
