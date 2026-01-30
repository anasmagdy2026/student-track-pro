import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type StudentBlock = {
  id: string;
  student_id: string;
  is_active: boolean;
  block_type: string;
  reason: string | null;
  triggered_by_rule_code: string | null;
  created_at: string;
  updated_at: string;
};

export function useStudentBlocks() {
  const [blocks, setBlocks] = useState<StudentBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('student_blocks')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching student blocks:', error);
      setBlocks([]);
      setLoading(false);
      return;
    }

    setBlocks((data as StudentBlock[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const activeBlockByStudentId = useMemo(() => {
    const map = new Map<string, StudentBlock>();
    for (const b of blocks) {
      if (b.is_active) map.set(b.student_id, b);
    }
    return map;
  }, [blocks]);

  const getActiveBlock = (studentId: string) => {
    return activeBlockByStudentId.get(studentId) ?? null;
  };

  const isBlocked = (studentId: string) => {
    return !!activeBlockByStudentId.get(studentId);
  };

  const freezeStudent = async (params: {
    studentId: string;
    reason: string;
    triggeredByRuleCode?: string;
  }) => {
    const existing = activeBlockByStudentId.get(params.studentId);
    const payload = {
      student_id: params.studentId,
      is_active: true,
      block_type: 'freeze',
      reason: params.reason,
      triggered_by_rule_code: params.triggeredByRuleCode ?? null,
    };

    if (existing) {
      const { error } = await supabase
        .from('student_blocks')
        .update(payload)
        .eq('id', existing.id);
      if (error) throw error;
      await fetchBlocks();
      return;
    }

    const { error } = await supabase.from('student_blocks').insert([payload]);
    if (error) throw error;
    await fetchBlocks();
  };

  const unfreezeStudent = async (studentId: string) => {
    const existing = activeBlockByStudentId.get(studentId);
    if (!existing) return;
    const { error } = await supabase
      .from('student_blocks')
      .update({ is_active: false })
      .eq('id', existing.id);
    if (error) throw error;
    await fetchBlocks();
  };

  return {
    blocks,
    loading,
    getActiveBlock,
    isBlocked,
    freezeStudent,
    unfreezeStudent,
    refetch: fetchBlocks,
  };
}
