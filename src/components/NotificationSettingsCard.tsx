import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, BellOff, BellRing, UserX, CreditCard, Clock, UserCheck } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAppSettings } from '@/hooks/useAppSettings';
import { toast } from 'sonner';

export function NotificationSettingsCard() {
  const {
    permissionStatus,
    loading,
    enableNotifications,
    sendNotification,
    isSupported,
    isEnabled,
  } = usePushNotifications();

  const { getSetting, updateSetting, loading: settingsLoading } = useAppSettings();

  const notifyAbsence = getSetting('notify_absence_enabled') === 'true';
  const notifyPayment = getSetting('notify_payment_enabled') === 'true';
  const notifyLate = getSetting('notify_late_enabled') === 'true';
  const notifyAttendance = getSetting('notify_attendance_enabled') === 'true';

  const handleToggle = async (key: string, value: boolean) => {
    try {
      await updateSetting(key, value ? 'true' : 'false');
      toast.success('تم تحديث الإعداد');
    } catch {
      toast.error('حدث خطأ أثناء تحديث الإعداد');
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendNotification(
        'إشعار تجريبي 🔔',
        'تم تفعيل الإشعارات بنجاح! ستتلقى تنبيهات الغياب والمدفوعات.',
        'test'
      );
    } catch {
      // Error handled in hook
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            الإشعارات
          </CardTitle>
          <CardDescription>المتصفح لا يدعم الإشعارات</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          إشعارات الهاتف
        </CardTitle>
        <CardDescription>
          تفعيل الإشعارات لتلقي تنبيهات الغياب والمدفوعات
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">حالة الإشعارات:</span>
            {isEnabled ? (
              <Badge className="gap-1">
                <BellRing className="h-3 w-3" />
                مفعّلة
              </Badge>
            ) : permissionStatus === 'denied' ? (
              <Badge variant="destructive" className="gap-1">
                <BellOff className="h-3 w-3" />
                مرفوضة
              </Badge>
            ) : (
              <Badge variant="secondary">غير مفعّلة</Badge>
            )}
          </div>
        </div>

        {!isEnabled && permissionStatus !== 'denied' && (
          <Button onClick={enableNotifications} disabled={loading} className="gap-2">
            <Bell className="h-4 w-4" />
            {loading ? 'جاري التفعيل...' : 'تفعيل الإشعارات'}
          </Button>
        )}

        {permissionStatus === 'denied' && (
          <p className="text-sm text-muted-foreground">
            تم رفض الإشعارات. لتفعيلها، اذهب إلى إعدادات المتصفح واسمح بالإشعارات لهذا الموقع.
          </p>
        )}

        {isEnabled && (
          <Button variant="outline" onClick={handleTestNotification} className="gap-2">
            <BellRing className="h-4 w-4" />
            إرسال إشعار تجريبي
          </Button>
        )}

        {/* Notification Type Toggles */}
        <Separator />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">التحكم في أنواع الإشعارات</h4>
          <p className="text-xs text-muted-foreground">فعّل أو أوقف كل نوع حسب احتياجك</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-destructive" />
              <Label htmlFor="notify-absence">إشعارات الغياب</Label>
            </div>
            <Switch
              id="notify-absence"
              checked={notifyAbsence}
              onCheckedChange={(v) => handleToggle('notify_absence_enabled', v)}
              disabled={settingsLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-warning" />
              <Label htmlFor="notify-payment">إشعارات تأخير المدفوعات</Label>
            </div>
            <Switch
              id="notify-payment"
              checked={notifyPayment}
              onCheckedChange={(v) => handleToggle('notify_payment_enabled', v)}
              disabled={settingsLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <Label htmlFor="notify-late">إشعارات تأخير الحضور</Label>
            </div>
            <Switch
              id="notify-late"
              checked={notifyLate}
              onCheckedChange={(v) => handleToggle('notify_late_enabled', v)}
              disabled={settingsLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <Label htmlFor="notify-attendance">إشعارات الحضور</Label>
            </div>
            <Switch
              id="notify-attendance"
              checked={notifyAttendance}
              onCheckedChange={(v) => handleToggle('notify_attendance_enabled', v)}
              disabled={settingsLoading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
