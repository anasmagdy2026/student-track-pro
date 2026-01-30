-- Alerts rules (admin-configurable)
CREATE TABLE IF NOT EXISTS public.alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  severity text NOT NULL DEFAULT 'warning', -- info | warning | critical
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated full access to alert_rules"
  ON public.alert_rules
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Alert events (generated during attendance / exams / payments checks)
CREATE TABLE IF NOT EXISTS public.alert_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  rule_code text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'warning', -- info | warning | critical
  status text NOT NULL DEFAULT 'open', -- open | resolved
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_alert_events_student_created_at ON public.alert_events (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_events_status_created_at ON public.alert_events (status, created_at DESC);

ALTER TABLE public.alert_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated full access to alert_events"
  ON public.alert_events
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Student block (full freeze) after expulsion/decision
CREATE TABLE IF NOT EXISTS public.student_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  block_type text NOT NULL DEFAULT 'freeze', -- freeze
  reason text,
  triggered_by_rule_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_blocks_active ON public.student_blocks (is_active);

ALTER TABLE public.student_blocks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated full access to student_blocks"
  ON public.student_blocks
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Homework status per lesson/student
CREATE TABLE IF NOT EXISTS public.lesson_homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL,
  student_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'not_done', -- done | not_done
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_homework_student ON public.lesson_homework (student_id, lesson_id);

ALTER TABLE public.lesson_homework ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated full access to lesson_homework"
  ON public.lesson_homework
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- updated_at triggers
DO $$ BEGIN
  CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_student_blocks_updated_at
  BEFORE UPDATE ON public.student_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_lesson_homework_updated_at
  BEFORE UPDATE ON public.lesson_homework
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed default rules (idempotent)
INSERT INTO public.alert_rules (code, title, description, severity, config)
VALUES
  ('absent_2_consecutive', 'غياب حصتين متتاليتين', 'تنبيه عند التحضير إذا آخر حصتين للطالب غياب', 'critical', jsonb_build_object('count', 2)),
  ('absent_3_month', 'غياب 3 حصص خلال الشهر', 'تنبيه عند التحضير إذا غاب 3 حصص خلال نفس الشهر', 'critical', jsonb_build_object('count', 3)),
  ('payment_1_5', 'الدفع مقدماً (1-5)', 'تنبيه خلال الأيام 1-5 إذا لم يدفع للشهر الحالي', 'warning', jsonb_build_object('startDay', 1, 'endDay', 5)),
  ('exam_absence', 'غياب الامتحان', 'تنبيه إذا تم تسجيل غياب في يوم يوجد فيه امتحان للصف', 'critical', '{}'::jsonb),
  ('homework_required', 'منع دخول بدون حل الواجب', 'تنبيه عند التحضير إذا الواجب غير محلول للحصة الحالية', 'warning', '{}'::jsonb),
  ('performance_below_50', 'مستوى أقل من 50%', 'تنبيه إذا متوسط الشيتات+التسميع+الامتحانات للشهر أقل من 50%', 'critical', jsonb_build_object('threshold', 0.5)),
  ('no_refund_on_expel', 'لا استرداد عند الطرد', 'سياسة: عند تجميد/طرد الطالب لا يتم استرداد فلوس الشهر', 'info', '{}'::jsonb)
ON CONFLICT (code) DO NOTHING;