import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type AlertEvent = {
  id: string;
  student_id: string;
  rule_code: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  context: unknown;
  created_at: string;
  resolved_at: string | null;
};

export function useAlertEvents() {
  const [events, setEvents] = useState<AlertEvent[]>([]);

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('alert_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error fetching alert events:', error);
      setEvents([]);
      return;
    }
    setEvents((data as AlertEvent[]) || []);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (payload: {
    studentId: string;
    ruleCode: string;
    title: string;
    message: string;
    severity?: 'info' | 'warning' | 'critical';
    context?: Record<string, unknown>;
  }) => {
    const { data, error } = await supabase
      .from('alert_events')
      .insert([
        {
          student_id: payload.studentId,
          rule_code: payload.ruleCode,
          title: payload.title,
          message: payload.message,
          severity: payload.severity ?? 'warning',
          status: 'open',
          context: (payload.context ?? {}) as unknown as Json,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    setEvents((prev) => [data as AlertEvent, ...prev]);
    return data as AlertEvent;
  };

  const resolveEvent = async (eventId: string) => {
    const { error } = await supabase
      .from('alert_events')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', eventId);
    if (error) throw error;
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status: 'resolved', resolved_at: new Date().toISOString() } : e)));
  };

  return {
    events,
    refetch: fetchEvents,
    createEvent,
    resolveEvent,
  };
}
