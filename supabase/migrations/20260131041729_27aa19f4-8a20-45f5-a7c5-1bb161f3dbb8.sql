-- Allow multiple block records per student to support a full freeze/unfreeze history
DO $$
BEGIN
  -- Drop the unique constraint if it exists (name observed: student_blocks_student_id_key)
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'student_blocks_student_id_key'
      AND conrelid = 'public.student_blocks'::regclass
  ) THEN
    ALTER TABLE public.student_blocks DROP CONSTRAINT student_blocks_student_id_key;
  END IF;
END $$;

-- Helpful indexes for history queries
CREATE INDEX IF NOT EXISTS idx_student_blocks_student_id ON public.student_blocks (student_id);
CREATE INDEX IF NOT EXISTS idx_student_blocks_student_id_updated_at ON public.student_blocks (student_id, updated_at DESC);
