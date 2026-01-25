-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- جدول المجموعات
CREATE TABLE public.groups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    grade TEXT NOT NULL CHECK (grade IN ('1', '2', '3')),
    days TEXT[] NOT NULL DEFAULT '{}', -- مجموعة الأيام مثل ['السبت', 'الإثنين', 'الأربعاء']
    time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الطلاب
CREATE TABLE public.students (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    grade TEXT NOT NULL CHECK (grade IN ('1', '2', '3')),
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    parent_phone TEXT NOT NULL,
    monthly_fee NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الحضور
CREATE TABLE public.attendance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    present BOOLEAN NOT NULL DEFAULT false,
    notified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(student_id, date)
);

-- جدول المدفوعات
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- YYYY-MM format
    amount NUMERIC NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,
    notified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(student_id, month)
);

-- جدول الامتحانات
CREATE TABLE public.exams (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    max_score NUMERIC NOT NULL DEFAULT 100,
    grade TEXT NOT NULL CHECK (grade IN ('1', '2', '3')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول نتائج الامتحانات
CREATE TABLE public.exam_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    score NUMERIC NOT NULL,
    notified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(exam_id, student_id)
);

-- جدول الحصص/الدروس
CREATE TABLE public.lessons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    grade TEXT NOT NULL CHECK (grade IN ('1', '2', '3')),
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    sheet_max_score NUMERIC NOT NULL DEFAULT 10,
    recitation_max_score NUMERIC NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول درجات الشيتات
CREATE TABLE public.lesson_sheets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    score NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(lesson_id, student_id)
);

-- جدول درجات التسميع
CREATE TABLE public.lesson_recitations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    score NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(lesson_id, student_id)
);

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers لتحديث updated_at
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- تعطيل RLS لأن النظام لا يحتاج تسجيل دخول حالياً (نظام محلي للمدرس فقط)
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_recitations ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول العام (النظام للمدرس فقط - لا يحتاج تسجيل دخول)
CREATE POLICY "Allow all access to groups" ON public.groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to exam_results" ON public.exam_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to lessons" ON public.lessons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to lesson_sheets" ON public.lesson_sheets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to lesson_recitations" ON public.lesson_recitations FOR ALL USING (true) WITH CHECK (true);

-- فهارس لتحسين الأداء
CREATE INDEX idx_students_group_id ON public.students(group_id);
CREATE INDEX idx_students_grade ON public.students(grade);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_payments_student_id ON public.payments(student_id);
CREATE INDEX idx_payments_month ON public.payments(month);
CREATE INDEX idx_exam_results_exam_id ON public.exam_results(exam_id);
CREATE INDEX idx_lesson_sheets_lesson_id ON public.lesson_sheets(lesson_id);
CREATE INDEX idx_lesson_recitations_lesson_id ON public.lesson_recitations(lesson_id);