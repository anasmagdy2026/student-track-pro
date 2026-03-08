import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BehaviorNote {
  id: string;
  student_id: string;
  date: string;
  type: 'positive' | 'negative';
  category: string;
  note: string;
  created_at: string;
}

const CATEGORIES = [
  { value: 'commitment', label: 'التزام' },
  { value: 'interaction', label: 'تفاعل' },
  { value: 'behavior', label: 'سلوك' },
  { value: 'effort', label: 'اجتهاد' },
  { value: 'other', label: 'أخرى' },
];

export function useStudentBehavior() {
  const [notes, setNotes] = useState<BehaviorNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from('student_behavior')
      .select('*')
      .order('date', { ascending: false });
    if (!error && data) {
      setNotes(data as BehaviorNote[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const getStudentNotes = useCallback((studentId: string) => {
    return notes.filter(n => n.student_id === studentId);
  }, [notes]);

  const getStudentNotesByMonth = useCallback((studentId: string, month: string) => {
    return notes.filter(n => n.student_id === studentId && n.date.startsWith(month));
  }, [notes]);

  const addNote = useCallback(async (data: {
    student_id: string;
    date?: string;
    type: 'positive' | 'negative';
    category: string;
    note: string;
  }) => {
    const { error } = await supabase
      .from('student_behavior')
      .insert({
        student_id: data.student_id,
        date: data.date || new Date().toISOString().slice(0, 10),
        type: data.type,
        category: data.category,
        note: data.note,
      } as any);
    if (error) {
      toast.error('حدث خطأ أثناء إضافة الملاحظة');
      return false;
    }
    toast.success('تم إضافة الملاحظة بنجاح');
    await fetchNotes();
    return true;
  }, [fetchNotes]);

  const deleteNote = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('student_behavior')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error('حدث خطأ أثناء حذف الملاحظة');
      return false;
    }
    toast.success('تم حذف الملاحظة');
    await fetchNotes();
    return true;
  }, [fetchNotes]);

  return {
    notes,
    loading,
    getStudentNotes,
    getStudentNotesByMonth,
    addNote,
    deleteNote,
    categories: CATEGORIES,
    refetch: fetchNotes,
  };
}
