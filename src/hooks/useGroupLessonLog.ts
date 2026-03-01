import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GroupLessonLogEntry {
  id: string;
  group_id: string;
  date: string;
  topic: string;
  note: string | null;
  created_at: string;
}

export function useGroupLessonLog(groupId?: string) {
  const [entries, setEntries] = useState<GroupLessonLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!groupId) { setEntries([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('group_lesson_log')
      .select('*')
      .eq('group_id', groupId)
      .order('date', { ascending: false });
    
    if (error) console.error('Error fetching lesson log:', error);
    else setEntries((data as GroupLessonLogEntry[]) || []);
    setLoading(false);
  }, [groupId]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const addEntry = async (data: { group_id: string; date: string; topic: string; note?: string }) => {
    const { data: row, error } = await supabase
      .from('group_lesson_log')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    setEntries(prev => [row as GroupLessonLogEntry, ...prev]);
    return row as GroupLessonLogEntry;
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('group_lesson_log').delete().eq('id', id);
    if (error) throw error;
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const getLatestEntry = () => entries.length > 0 ? entries[0] : null;

  return { entries, loading, addEntry, deleteEntry, getLatestEntry, refetch: fetchEntries };
}
