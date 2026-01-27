import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Attendance } from '@/types';

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

  const markAttendance = async (studentId: string, date: string, present: boolean) => {
    const existingRecord = attendance.find(
      a => a.student_id === studentId && a.date === date
    );

    if (existingRecord) {
      const { error } = await supabase
        .from('attendance')
        .update({ present, notified: false })
        .eq('id', existingRecord.id);
      
      if (error) throw error;
      
      setAttendance(prev =>
        prev.map(a =>
          a.id === existingRecord.id ? { ...a, present, notified: false } : a
        )
      );
    } else {
      const { data, error } = await supabase
        .from('attendance')
        .insert([{
          student_id: studentId,
          date,
          present,
          notified: false,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setAttendance(prev => [data as Attendance, ...prev]);
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
