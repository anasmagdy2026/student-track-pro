import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type GradeLevel = {
  code: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function useGradeLevels() {
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGradeLevels = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('grade_levels')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching grade levels:', error);
      setGradeLevels([]);
      setLoading(false);
      return;
    }

    setGradeLevels((data as GradeLevel[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGradeLevels();
  }, [fetchGradeLevels]);

  const activeGradeLevels = useMemo(() => gradeLevels.filter((g) => g.is_active), [gradeLevels]);

  const labelByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of gradeLevels) map.set(g.code, g.label);
    return map;
  }, [gradeLevels]);

  const getGradeLabel = (code: string) => labelByCode.get(code) ?? code;

  const addGradeLevel = async (payload: {
    code: string;
    label: string;
    sort_order: number;
    is_active: boolean;
  }) => {
    const { error } = await supabase.from('grade_levels').insert([
      {
        code: payload.code,
        label: payload.label,
        sort_order: payload.sort_order,
        is_active: payload.is_active,
      },
    ]);
    if (error) throw error;
    await fetchGradeLevels();
  };

  const updateGradeLevel = async (
    code: string,
    updates: Partial<Pick<GradeLevel, 'label' | 'sort_order' | 'is_active'>>
  ) => {
    const { error } = await supabase.from('grade_levels').update(updates).eq('code', code);
    if (error) throw error;
    await fetchGradeLevels();
  };

  return {
    gradeLevels,
    activeGradeLevels,
    loading,
    getGradeLabel,
    addGradeLevel,
    updateGradeLevel,
    refetch: fetchGradeLevels,
  };
}
