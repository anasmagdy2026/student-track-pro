import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Listen for foreground messages
  useEffect(() => {
    onForegroundMessage((payload: any) => {
      const { title, body } = payload.notification || {};
      if (title) {
        toast.info(title, { description: body });
      }
    });
  }, []);

  const registerToken = useCallback(async (token: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('fcm_tokens').upsert(
        {
          user_id: user.id,
          token,
          device_info: navigator.userAgent.slice(0, 200),
        },
        { onConflict: 'user_id,token' }
      );
      if (error) throw error;
    } catch (err) {
      console.error('Error saving FCM token:', err);
    }
  }, [user]);

  const enableNotifications = useCallback(async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return false;
    }

    setLoading(true);
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        setPermissionStatus('granted');
        await registerToken(token);
        toast.success('تم تفعيل الإشعارات بنجاح');
        return true;
      } else {
        setPermissionStatus(Notification.permission);
        if (Notification.permission === 'denied') {
          toast.error('تم رفض الإشعارات. يرجى تفعيلها من إعدادات المتصفح');
        }
        return false;
      }
    } catch (err) {
      console.error('Error enabling notifications:', err);
      toast.error('حدث خطأ أثناء تفعيل الإشعارات');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, registerToken]);

  const sendNotification = useCallback(async (
    title: string,
    body: string,
    type: string = 'general',
    tokens?: string[]
  ) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ title, body, type, tokens }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || 'Failed to send notification');
      }

      return await res.json();
    } catch (err) {
      console.error('Error sending notification:', err);
      throw err;
    }
  }, []);

  return {
    permissionStatus,
    fcmToken,
    loading,
    enableNotifications,
    sendNotification,
    isSupported: typeof Notification !== 'undefined',
    isEnabled: permissionStatus === 'granted',
  };
}
