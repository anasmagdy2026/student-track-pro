import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NextSessionReminder {
  id: string;
  group_id: string;
  homework: string | null;
  recitation: string | null;
  exam: string | null;
  sheet: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export function useNextSessionReminders() {
  const [reminders, setReminders] = useState<NextSessionReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('group_next_session_reminders')
      .select('*');
    
    if (error) {
      console.error('Error fetching reminders:', error);
    } else {
      setReminders(data as NextSessionReminder[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const getReminderByGroupId = (groupId: string) => {
    return reminders.find(r => r.group_id === groupId);
  };

  const upsertReminder = async (groupId: string, data: {
    homework?: string | null;
    recitation?: string | null;
    exam?: string | null;
    sheet?: string | null;
    note?: string | null;
  }) => {
    const existing = reminders.find(r => r.group_id === groupId);
    
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('group_next_session_reminders')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      
      if (error) throw error;
      
      setReminders(prev => 
        prev.map(r => r.id === existing.id ? { ...r, ...data, updated_at: new Date().toISOString() } : r)
      );
    } else {
      // Insert new
      const { data: newReminder, error } = await supabase
        .from('group_next_session_reminders')
        .insert([{
          group_id: groupId,
          ...data,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setReminders(prev => [...prev, newReminder as NextSessionReminder]);
    }
  };

  const clearReminder = async (groupId: string) => {
    const existing = reminders.find(r => r.group_id === groupId);
    if (!existing) return;

    const { error } = await supabase
      .from('group_next_session_reminders')
      .update({
        homework: null,
        recitation: null,
        exam: null,
        sheet: null,
        note: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    
    if (error) throw error;
    
    setReminders(prev => 
      prev.map(r => r.id === existing.id ? { 
        ...r, 
        homework: null, 
        recitation: null, 
        exam: null, 
        sheet: null, 
        note: null,
        updated_at: new Date().toISOString() 
      } : r)
    );
  };

  const hasReminder = (groupId: string) => {
    const reminder = getReminderByGroupId(groupId);
    if (!reminder) return false;
    return !!(reminder.homework || reminder.recitation || reminder.exam || reminder.sheet || reminder.note);
  };

  return {
    reminders,
    loading,
    getReminderByGroupId,
    upsertReminder,
    clearReminder,
    hasReminder,
    refetch: fetchReminders,
  };
}
