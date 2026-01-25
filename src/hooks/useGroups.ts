import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Group, DAYS_AR } from '@/types';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching groups:', error);
    } else {
      setGroups(data as Group[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const addGroup = async (groupData: Omit<Group, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('groups')
      .insert([groupData])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding group:', error);
      throw error;
    }
    
    setGroups(prev => [data as Group, ...prev]);
    return data as Group;
  };

  const updateGroup = async (id: string, updates: Partial<Group>) => {
    const { error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating group:', error);
      throw error;
    }
    
    setGroups(prev =>
      prev.map(group =>
        group.id === id ? { ...group, ...updates } : group
      )
    );
  };

  const deleteGroup = async (id: string) => {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
    
    setGroups(prev => prev.filter(group => group.id !== id));
  };

  const getGroupById = (id: string) => {
    return groups.find(group => group.id === id);
  };

  const getGroupByName = (name: string) => {
    return groups.find(group => group.name === name);
  };

  const getGroupsByDay = (day: string) => {
    return groups.filter(group => group.days.includes(day));
  };

  const getGroupsByGrade = (grade: string) => {
    return groups.filter(group => group.grade === grade);
  };

  const getTodayGroups = () => {
    const today = new Date().getDay();
    const todayName = DAYS_AR[today];
    return groups.filter(group => group.days.includes(todayName));
  };

  return {
    groups,
    loading,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroupById,
    getGroupByName,
    getGroupsByDay,
    getGroupsByGrade,
    getTodayGroups,
    refetch: fetchGroups,
  };
}
