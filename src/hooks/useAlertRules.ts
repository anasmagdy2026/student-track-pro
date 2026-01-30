import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AlertRule = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  severity: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function useAlertRules() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('alert_rules')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching alert rules:', error);
      setRules([]);
      setLoading(false);
      return;
    }

    setRules((data as AlertRule[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const setRuleActive = async (ruleId: string, isActive: boolean) => {
    // optimistic update
    setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, is_active: isActive } : r)));

    const { error } = await supabase
      .from('alert_rules')
      .update({ is_active: isActive })
      .eq('id', ruleId);

    if (error) {
      // rollback
      setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, is_active: !isActive } : r)));
      throw error;
    }
  };

  return {
    rules,
    loading,
    setRuleActive,
    refetch: fetchRules,
  };
}
