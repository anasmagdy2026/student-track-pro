import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lesson, LessonSheet, LessonRecitation } from '@/types';

export function useLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sheets, setSheets] = useState<LessonSheet[]>([]);
  const [recitations, setRecitations] = useState<LessonRecitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    const [lessonsRes, sheetsRes, recitationsRes] = await Promise.all([
      supabase.from('lessons').select('*').order('date', { ascending: false }),
      supabase.from('lesson_sheets').select('*'),
      supabase.from('lesson_recitations').select('*'),
    ]);
    
    if (lessonsRes.error) console.error('Error fetching lessons:', lessonsRes.error);
    if (sheetsRes.error) console.error('Error fetching sheets:', sheetsRes.error);
    if (recitationsRes.error) console.error('Error fetching recitations:', recitationsRes.error);
    
    setLessons(lessonsRes.data as Lesson[] || []);
    setSheets(sheetsRes.data as LessonSheet[] || []);
    setRecitations(recitationsRes.data as LessonRecitation[] || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lessons
  const addLesson = async (lessonData: Omit<Lesson, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('lessons')
      .insert([lessonData])
      .select()
      .single();
    
    if (error) throw error;
    
    setLessons(prev => [data as Lesson, ...prev]);
    return data as Lesson;
  };

  const updateLesson = async (id: string, updates: Partial<Lesson>) => {
    const { error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
    
    setLessons(prev =>
      prev.map(lesson =>
        lesson.id === id ? { ...lesson, ...updates } : lesson
      )
    );
  };

  const deleteLesson = async (id: string) => {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setLessons(prev => prev.filter(lesson => lesson.id !== id));
    setSheets(prev => prev.filter(sheet => sheet.lesson_id !== id));
    setRecitations(prev => prev.filter(rec => rec.lesson_id !== id));
  };

  const getLessonById = (id: string) => {
    return lessons.find(lesson => lesson.id === id);
  };

  const getLessonsByGroup = (groupId: string) => {
    return lessons.filter(lesson => lesson.group_id === groupId);
  };

  const getLessonsByGrade = (grade: string) => {
    return lessons.filter(lesson => lesson.grade === grade);
  };

  // Sheets (شيتات)
  const addSheet = async (lessonId: string, studentId: string, score: number) => {
    const existingSheet = sheets.find(
      s => s.lesson_id === lessonId && s.student_id === studentId
    );

    if (existingSheet) {
      const { error } = await supabase
        .from('lesson_sheets')
        .update({ score })
        .eq('id', existingSheet.id);
      
      if (error) throw error;
      
      setSheets(prev =>
        prev.map(s =>
          s.id === existingSheet.id ? { ...s, score } : s
        )
      );
      return existingSheet;
    } else {
      const { data, error } = await supabase
        .from('lesson_sheets')
        .insert([{
          lesson_id: lessonId,
          student_id: studentId,
          score,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setSheets(prev => [...prev, data as LessonSheet]);
      return data as LessonSheet;
    }
  };

  const getLessonSheets = (lessonId: string) => {
    return sheets.filter(s => s.lesson_id === lessonId);
  };

  const getStudentSheets = (studentId: string) => {
    return sheets.filter(s => s.student_id === studentId);
  };

  // Recitations (تسميع)
  const addRecitation = async (lessonId: string, studentId: string, score: number) => {
    const existingRecitation = recitations.find(
      r => r.lesson_id === lessonId && r.student_id === studentId
    );

    if (existingRecitation) {
      const { error } = await supabase
        .from('lesson_recitations')
        .update({ score })
        .eq('id', existingRecitation.id);
      
      if (error) throw error;
      
      setRecitations(prev =>
        prev.map(r =>
          r.id === existingRecitation.id ? { ...r, score } : r
        )
      );
      return existingRecitation;
    } else {
      const { data, error } = await supabase
        .from('lesson_recitations')
        .insert([{
          lesson_id: lessonId,
          student_id: studentId,
          score,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setRecitations(prev => [...prev, data as LessonRecitation]);
      return data as LessonRecitation;
    }
  };

  const getLessonRecitations = (lessonId: string) => {
    return recitations.filter(r => r.lesson_id === lessonId);
  };

  const getStudentRecitations = (studentId: string) => {
    return recitations.filter(r => r.student_id === studentId);
  };

  // Get lessons for a specific month
  const getLessonsByMonth = (month: string) => {
    return lessons.filter(lesson => lesson.date.startsWith(month));
  };

  return {
    lessons,
    sheets,
    recitations,
    loading,
    addLesson,
    updateLesson,
    deleteLesson,
    getLessonById,
    getLessonsByGroup,
    getLessonsByGrade,
    getLessonsByMonth,
    addSheet,
    getLessonSheets,
    getStudentSheets,
    addRecitation,
    getLessonRecitations,
    getStudentRecitations,
    refetch: fetchData,
  };
}
