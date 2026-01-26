import { useLocalStorage } from './useLocalStorage';
import { Attendance } from '@/types';

export function useAttendance() {
  const [attendance, setAttendance] = useLocalStorage<Attendance[]>('attendance', []);

  const markAttendance = (studentId: string, date: string, present: boolean) => {
    const existingIndex = attendance.findIndex(
      a => a.student_id === studentId && a.date === date
    );

    if (existingIndex >= 0) {
      setAttendance(prev =>
        prev.map((a, i) =>
          i === existingIndex ? { ...a, present, notified: false } : a
        )
      );
    } else {
      const newAttendance: Attendance = {
        id: crypto.randomUUID(),
        student_id: studentId,
        date,
        present,
        notified: false,
      };
      setAttendance(prev => [...prev, newAttendance]);
    }
  };

  const markAsNotified = (attendanceId: string) => {
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

  return {
    attendance,
    markAttendance,
    markAsNotified,
    getAttendanceByDate,
    getStudentAttendance,
    getAbsentStudents,
    getAttendanceStats,
  };
}
