import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Exam, ExamResult } from '@/types';

export function useExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    const [examsRes, resultsRes] = await Promise.all([
      supabase.from('exams').select('*').order('date', { ascending: false }),
      supabase.from('exam_results').select('*'),
    ]);
    
    if (examsRes.error) console.error('Error fetching exams:', examsRes.error);
    if (resultsRes.error) console.error('Error fetching results:', resultsRes.error);
    
    setExams(examsRes.data as Exam[] || []);
    setResults(resultsRes.data as ExamResult[] || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addExam = async (examData: Omit<Exam, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('exams')
      .insert([examData])
      .select()
      .single();
    
    if (error) throw error;
    
    setExams(prev => [data as Exam, ...prev]);
    return data as Exam;
  };

  const updateExam = async (id: string, updates: Partial<Exam>) => {
    const { error } = await supabase
      .from('exams')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
    
    setExams(prev =>
      prev.map(exam =>
        exam.id === id ? { ...exam, ...updates } : exam
      )
    );
  };

  const deleteExam = async (id: string) => {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setExams(prev => prev.filter(exam => exam.id !== id));
    setResults(prev => prev.filter(result => result.exam_id !== id));
  };

  const addResult = async (examId: string, studentId: string, score: number) => {
    const existingResult = results.find(
      r => r.exam_id === examId && r.student_id === studentId
    );

    if (existingResult) {
      const { error } = await supabase
        .from('exam_results')
        .update({ score, notified: false })
        .eq('id', existingResult.id);
      
      if (error) throw error;
      
      setResults(prev =>
        prev.map(r =>
          r.id === existingResult.id ? { ...r, score, notified: false } : r
        )
      );
      return existingResult;
    } else {
      const { data, error } = await supabase
        .from('exam_results')
        .insert([{
          exam_id: examId,
          student_id: studentId,
          score,
          notified: false,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setResults(prev => [...prev, data as ExamResult]);
      return data as ExamResult;
    }
  };

  const saveAllResults = async (examId: string, scoresMap: Record<string, number>) => {
    const validEntries = Object.entries(scoresMap).filter(
      ([, score]) => score !== undefined && !isNaN(score)
    );
    
    for (const [studentId, score] of validEntries) {
      await addResult(examId, studentId, score);
    }
  };

  const markResultAsNotified = async (resultId: string) => {
    const { error } = await supabase
      .from('exam_results')
      .update({ notified: true })
      .eq('id', resultId);
    
    if (error) throw error;
    
    setResults(prev =>
      prev.map(r =>
        r.id === resultId ? { ...r, notified: true } : r
      )
    );
  };

  const getExamResults = (examId: string) => {
    return results.filter(r => r.exam_id === examId);
  };

  const getStudentResults = (studentId: string) => {
    return results.filter(r => r.student_id === studentId);
  };

  const getStudentResultsWithExams = (studentId: string) => {
    return results
      .filter(r => r.student_id === studentId)
      .map(r => ({
        ...r,
        exam: exams.find(e => e.id === r.exam_id),
      }))
      .filter(r => r.exam);
  };

  const getExamsByGrade = (grade: string) => {
    return exams.filter(e => e.grade === grade);
  };

  return {
    exams,
    results,
    loading,
    addExam,
    updateExam,
    deleteExam,
    addResult,
    saveAllResults,
    markResultAsNotified,
    getExamResults,
    getStudentResults,
    getStudentResultsWithExams,
    getExamsByGrade,
    refetch: fetchData,
  };
}
