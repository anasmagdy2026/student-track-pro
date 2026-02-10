import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationSettingsCard() {
  const {
    permissionStatus,
    loading,
    enableNotifications,
    sendNotification,
    isSupported,
    isEnabled,
  } = usePushNotifications();

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
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
