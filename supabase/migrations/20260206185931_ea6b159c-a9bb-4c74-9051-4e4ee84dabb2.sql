-- Create app_settings table for system configuration
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can read settings"
  ON public.app_settings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage settings"
  ON public.app_settings
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.app_settings (key, value, description) VALUES
  ('teacher_name', 'مستر محمد مجدي', 'اسم المعلم'),
  ('system_name', 'نظام متابعة الطلاب', 'اسم النظام'),
  ('teacher_phone', '', 'رقم هاتف المعلم'),
  ('sms_enabled', 'false', 'تفعيل خدمة الرسائل النصية'),
  ('sms_provider', '', 'مزود خدمة الرسائل النصية');