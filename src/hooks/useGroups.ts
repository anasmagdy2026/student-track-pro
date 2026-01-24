import { useLocalStorage } from './useLocalStorage';
import { Group } from '@/types';

export function useGroups() {
  const [groups, setGroups] = useLocalStorage<Group[]>('groups', []);

  const addGroup = (groupData: Omit<Group, 'id'>) => {
    const newGroup: Group = {
      ...groupData,
      id: crypto.randomUUID(),
    };
    setGroups(prev => [...prev, newGroup]);
    return newGroup;
  };

  const updateGroup = (id: string, updates: Partial<Group>) => {
    setGroups(prev =>
      prev.map(group =>
        group.id === id ? { ...group, ...updates } : group
      )
    );
  };

  const deleteGroup = (id: string) => {
    setGroups(prev => prev.filter(group => group.id !== id));
  };

  const getGroupById = (id: string) => {
    return groups.find(group => group.id === id);
  };

  const getGroupByName = (name: string) => {
    return groups.find(group => group.name === name);
  };

  const getGroupsByDay = (day: string) => {
    return groups.filter(group => group.day === day);
  };

  const getGroupsByGrade = (grade: string) => {
    return groups.filter(group => group.grade === grade);
  };

  const getTodayGroups = () => {
    const today = new Date().getDay();
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const todayName = days[today];
    return groups.filter(group => group.day === todayName);
  };

  return {
    groups,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroupById,
    getGroupByName,
    getGroupsByDay,
    getGroupsByGrade,
    getTodayGroups,
  };
}
