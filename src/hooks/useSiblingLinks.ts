import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SiblingLink {
  id: string;
  student_id: string;
  sibling_id: string;
  created_at: string;
}

export function useSiblingLinks() {
  const [links, setLinks] = useState<SiblingLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = useCallback(async () => {
    const { data, error } = await supabase
      .from('sibling_links')
      .select('*');
    if (!error && data) {
      setLinks(data as SiblingLink[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const getSiblingIds = useCallback((studentId: string): string[] => {
    const ids = new Set<string>();
    links.forEach(l => {
      if (l.student_id === studentId) ids.add(l.sibling_id);
      if (l.sibling_id === studentId) ids.add(l.student_id);
    });
    return Array.from(ids);
  }, [links]);

  const addLink = useCallback(async (studentId: string, siblingId: string) => {
    // Add both directions to make lookup easier
    const { error } = await supabase
      .from('sibling_links')
      .insert({ student_id: studentId, sibling_id: siblingId } as any);
    if (error) {
      if (error.code === '23505') {
        toast.error('هذا الربط موجود بالفعل');
      } else {
        toast.error('حدث خطأ أثناء ربط الإخوة');
      }
      return false;
    }
    toast.success('تم ربط الأخ بنجاح');
    await fetchLinks();
    return true;
  }, [fetchLinks]);

  const removeLink = useCallback(async (studentId: string, siblingId: string) => {
    const { error } = await supabase
      .from('sibling_links')
      .delete()
      .or(`and(student_id.eq.${studentId},sibling_id.eq.${siblingId}),and(student_id.eq.${siblingId},sibling_id.eq.${studentId})`);
    if (error) {
      toast.error('حدث خطأ أثناء إزالة الربط');
      return false;
    }
    toast.success('تم إزالة ربط الأخ');
    await fetchLinks();
    return true;
  }, [fetchLinks]);

  return { links, loading, getSiblingIds, addLink, removeLink, refetch: fetchLinks };
}
