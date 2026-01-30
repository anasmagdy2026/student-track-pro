import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Attendance } from '@/types';

export type MarkAttendanceResult =
  | { status: 'inserted'; record: Attendance }
  | { status: 'updated'; record: Attendance }
  | { status: 'already_present' }
  | { status: 'already_exists' };

export function useAttendance() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) console.error('Error fetching attendance:', error);
    
    setAttendance(data as Attendance[] || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const markAttendance = async (studentId: string, date: string, present: boolean): Promise<MarkAttendanceResult> => {
    const existingRecord = attendance.find(
      a => a.student_id === studentId && a.date === date
    );

    if (existingRecord) {
      // If already present and user tries to mark present again, treat as duplicate scan.
      if (present && existingRecord.present) {
        return { status: 'already_present' };
      }

      const { error } = await supabase
        .from('attendance')
        .update({
          present,
          notified: false,
          checked_in_at: present ? new Date().toISOString() : existingRecord.checked_in_at ?? null,
        })
        .eq('id', existingRecord.id);
      
      if (error) throw error;

      const updated: Attendance = {
        ...existingRecord,
        present,
        notified: false,
        checked_in_at: present ? new Date().toISOString() : (existingRecord.checked_in_at ?? null),
      };
      
      setAttendance(prev =>
        prev.map(a =>
          a.id === existingRecord.id
            ? {
                ...a,
                present,
                notified: false,
                checked_in_at: present ? new Date().toISOString() : a.checked_in_at,
              }
            : a
        )
      );

      return { status: 'updated', record: updated };
    } else {
      const { data, error } = await supabase
        .from('attendance')
        .insert([{
          student_id: studentId,
          date,
          present,
          notified: false,
          checked_in_at: present ? new Date().toISOString() : null,
        }])
        .select()
        .single();

      if (error) {
        // Unique constraint: already exists (double scan)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const code = (error as any)?.code;
        if (code === '23505') {
          // Determine whether it's already present or just already has a record.
          const { data: existing } = await supabase
            .from('attendance')
            .select('present')
            .eq('student_id', studentId)
            .eq('date', date)
            .maybeSingle();

          if (present && existing?.present) {
            return { status: 'already_present' };
          }

          return { status: 'already_exists' };
        }
        throw error;
      }
      
      setAttendance(prev => [data as Attendance, ...prev]);

      return { status: 'inserted', record: data as Attendance };
    }
  };

  const markAsNotified = async (attendanceId: string) => {
    const { error } = await supabase
      .from('attendance')
      .update({ notified: true })
      .eq('id', attendanceId);
    
    if (error) throw error;
    
    setAttendance(prev =>
      prev.map(a =>
        a.id === attendanceId ? { ...a, notified: true } : a
      )
    );
  };

  const getAttendanceByDate = (date: string) => {
    return attendance.filter(a => a.date === date);
  };

  const getStudentAttendance = (studentId: string) => {
    return attendance.filter(a => a.student_id === studentId);
  };

  const getAbsentStudents = (date: string) => {
    return attendance.filter(a => a.date === date && !a.present);
  };

  const getAttendanceStats = (studentId: string) => {
    const records = attendance.filter(a => a.student_id === studentId);
    const present = records.filter(a => a.present).length;
    const absent = records.filter(a => !a.present).length;
    return { present, absent, total: records.length };
  };

  const getAttendanceByMonth = (studentId: string, month: string) => {
    return attendance.filter(
      a => a.student_id === studentId && a.date.startsWith(month)
    );
  };

  return {
    attendance,
    loading,
    markAttendance,
    markAsNotified,
    getAttendanceByDate,
    getStudentAttendance,
    getAbsentStudents,
    getAttendanceStats,
    getAttendanceByMonth,
    refetch: fetchData,
  };
}
