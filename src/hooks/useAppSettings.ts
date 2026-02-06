import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      setSettings(data || []);
    } catch (err) {
      console.error('Error fetching app settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSetting = useCallback(
    (key: string): string => {
      const setting = settings.find((s) => s.key === key);
      return setting?.value || '';
    },
    [settings]
  );

  const updateSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value })
        .eq('key', key);

      if (error) throw error;

      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value } : s))
      );
      return true;
    } catch (err) {
      console.error('Error updating setting:', err);
      throw err;
    }
  };

  const updateMultipleSettings = async (updates: { key: string; value: string }[]) => {
    try {
      for (const { key, value } of updates) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value })
          .eq('key', key);

        if (error) throw error;
      }

      setSettings((prev) =>
        prev.map((s) => {
          const update = updates.find((u) => u.key === s.key);
          return update ? { ...s, value: update.value } : s;
        })
      );
      return true;
    } catch (err) {
      console.error('Error updating settings:', err);
      throw err;
    }
  };

  return {
    settings,
    loading,
    getSetting,
    updateSetting,
    updateMultipleSettings,
    refetch: fetchSettings,
    teacherName: getSetting('teacher_name'),
    systemName: getSetting('system_name'),
    teacherPhone: getSetting('teacher_phone'),
    smsEnabled: getSetting('sms_enabled') === 'true',
    smsProvider: getSetting('sms_provider'),
  };
}
