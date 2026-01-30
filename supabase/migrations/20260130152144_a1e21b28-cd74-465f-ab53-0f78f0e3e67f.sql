-- الطلاب: رقم هاتف الطالب + تاريخ التسجيل
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS student_phone text,
ADD COLUMN IF NOT EXISTS registered_at date NOT NULL DEFAULT current_date;

-- الحضور: وقت تسجيل التحضير (للتاخير)
ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS checked_in_at timestamp with time zone;

-- منع تكرار التحضير لنفس الطالب في نفس اليوم
CREATE UNIQUE INDEX IF NOT EXISTS attendance_unique_student_date
ON public.attendance (student_id, date);

-- منع تكرار دفع نفس الشهر لنفس الطالب
CREATE UNIQUE INDEX IF NOT EXISTS payments_unique_student_month
ON public.payments (student_id, month);

-- منع تكرار نتيجة نفس الامتحان لنفس الطالب
CREATE UNIQUE INDEX IF NOT EXISTS exam_results_unique_exam_student
ON public.exam_results (exam_id, student_id);
