import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Settings, Save, Loader2, Phone, User, Building, MessageSquare, Key } from 'lucide-react';
import { toast } from 'sonner';

export function AppSettingsCard() {
  const { settings, loading, getSetting, updateMultipleSettings } = useAppSettings();
  
  const [teacherName, setTeacherName] = useState('');
  const [systemName, setSystemName] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsProvider, setSmsProvider] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && settings.length > 0) {
      setTeacherName(getSetting('teacher_name'));
      setSystemName(getSetting('system_name'));
      setTeacherPhone(getSetting('teacher_phone'));
      setSmsEnabled(getSetting('sms_enabled') === 'true');
      setSmsProvider(getSetting('sms_provider'));
    }
  }, [loading, settings, getSetting]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMultipleSettings([
        { key: 'teacher_name', value: teacherName },
        { key: 'system_name', value: systemName },
        { key: 'teacher_phone', value: teacherPhone },
        { key: 'sms_enabled', value: String(smsEnabled) },
        { key: 'sms_provider', value: smsProvider },
      ]);
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (err) {
      toast.error('تعذّر حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Teacher/System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            إعدادات النظام
          </CardTitle>
          <CardDescription>
            تخصيص اسم المعلم والنظام ومعلومات الاتصال
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                اسم المعلم
              </Label>
              <Input
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="مستر محمد مجدي"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                اسم النظام
              </Label>
              <Input
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                placeholder="نظام متابعة الطلاب"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              رقم هاتف المعلم
            </Label>
            <Input
              value={teacherPhone}
              onChange={(e) => setTeacherPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              dir="ltr"
            />
          </div>
        </CardContent>
      </Card>

      {/* SMS Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            إعدادات الرسائل النصية SMS
          </CardTitle>
          <CardDescription>
            تفعيل خدمة الرسائل النصية لمن ليس لديهم واتساب
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <Label className="text-base">تفعيل خدمة SMS</Label>
              <p className="text-sm text-muted-foreground">
                إرسال رسائل نصية بديلة عند عدم توفر واتساب
              </p>
            </div>
            <Switch
              checked={smsEnabled}
              onCheckedChange={setSmsEnabled}
            />
          </div>

          {smsEnabled && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  مزود خدمة SMS
                </Label>
                <Input
                  value={smsProvider}
                  onChange={(e) => setSmsProvider(e.target.value)}
                  placeholder="مثال: Twilio, Vonage, etc."
                />
              </div>
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="text-sm text-warning-foreground">
                  <strong>ملاحظة:</strong> لتفعيل خدمة SMS، ستحتاج إلى إضافة API Key الخاص بمزود الخدمة. 
                  تواصل مع الدعم الفني لإضافة المفتاح.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}
