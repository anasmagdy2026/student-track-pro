-- Prevent duplicate exam entries for same name/date/grade
CREATE UNIQUE INDEX IF NOT EXISTS idx_exams_unique_name_date_grade
ON public.exams(name, date, grade);

-- Prevent duplicate lesson entries for same name/date/group
CREATE UNIQUE INDEX IF NOT EXISTS idx_lessons_unique_name_date_group
ON public.lessons(name, date, COALESCE(group_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Prevent duplicate group names for same grade
CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_unique_name_grade
ON public.groups(name, grade);

-- Prevent duplicate student codes globally
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_unique_code
ON public.students(code);
