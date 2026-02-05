-- Create table for WhatsApp message templates
CREATE TABLE public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  target TEXT NOT NULL DEFAULT 'parent' CHECK (target IN ('parent', 'student', 'both')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read templates
CREATE POLICY "Authenticated users can read templates"
ON public.whatsapp_templates
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow admins to manage templates
CREATE POLICY "Admins can manage templates"
ON public.whatsapp_templates
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_whatsapp_templates_updated_at
BEFORE UPDATE ON public.whatsapp_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.whatsapp_templates (code, name, description, template, target) VALUES
('absence', 'رسالة الغياب', 'إشعار ولي الأمر بغياب الطالب', 'السلام عليكم ورحمة الله وبركاته

نحيط علم سيادتكم أن الطالب/ة: {studentName}
غاب/ت عن حصة يوم: {date}

برجاء الاهتمام بالحضور المنتظم.

مع تحيات مستر/ محمد مجدي', 'parent'),

('payment_reminder', 'تذكير بالدفع', 'تذكير بسداد المصاريف الشهرية', 'السلام عليكم ورحمة الله وبركاته

تذكير بسداد مصاريف شهر: {month}
للطالب/ة: {studentName}
المبلغ المطلوب: {amount} جنيه

برجاء السداد في أقرب وقت.

مع تحيات مستر/ محمد مجدي', 'parent'),

('exam_result', 'نتيجة الامتحان', 'إرسال نتيجة امتحان للطالب/ولي الأمر', 'السلام عليكم ورحمة الله وبركاته

نتيجة امتحان: {examName}
الطالب/ة: {studentName}
الدرجة: {score} من {maxScore} ({label})
النسبة المئوية: {percentage}%

مع تحيات مستر/ محمد مجدي', 'parent'),

('late_parent', 'تأخير (لولي الأمر)', 'إشعار ولي الأمر بتأخر الطالب', 'السلام عليكم ورحمة الله وبركاته

نحيط علم سيادتكم أن الطالب/ة: {studentName}
تأخر/ت عن حصة {groupName}
يوم: {date}
ميعاد المجموعة: {groupTime}
مدة التأخير: {lateMinutes} دقيقة

برجاء الالتزام بمواعيد الحضور.

مع تحيات مستر/ محمد مجدي', 'parent'),

('late_student', 'تأخير (للطالب)', 'إشعار الطالب بالتأخير', 'السلام عليكم

يا {studentName}، تم تسجيل حضورك متأخرًا.
حصة: {groupName}
يوم: {date}
ميعاد المجموعة: {groupTime}
مدة التأخير: {lateMinutes} دقيقة

حاول الالتزام بالميعاد من فضلك.

مستر/ محمد مجدي', 'student'),

('monthly_report', 'التقرير الشهري', 'ملخص أداء الطالب الشهري', 'السلام عليكم ورحمة الله وبركاته

تقرير شهري: {monthLabel}
الطالب/ة: {studentName}
{groupLine}
الحضور: {presentCount}/{totalCount} ({attendancePercentage}%)
الغياب: {absentCount}

المدفوعات: {paidStatus} (المبلغ: {amount} جنيه)

الامتحانات: متوسط {examAverage}%
الحصص (شيت/تسميع): متوسط {lessonAverage}%

التقييم العام: {overallPercentage}%

مع تحيات مستر/ محمد مجدي', 'parent'),

('next_session', 'المطلوب الحصة الجاية', 'تذكير بالمطلوب للحصة القادمة', 'السلام عليكم ورحمة الله وبركاته

يا {studentName}، تذكير بالمطلوب للحصة الجاية
مجموعة: {groupName}

{content}
برجاء الاستعداد جيداً.

مع تحيات مستر/ محمد مجدي', 'student');