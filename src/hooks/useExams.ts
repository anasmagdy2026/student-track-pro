import { useLocalStorage } from './useLocalStorage';
import { Exam, ExamResult } from '@/types';

export function useExams() {
  const [exams, setExams] = useLocalStorage<Exam[]>('exams', []);
  const [results, setResults] = useLocalStorage<ExamResult[]>('exam_results', []);

  const addExam = (examData: Omit<Exam, 'id'>) => {
    const newExam: Exam = {
      ...examData,
      id: crypto.randomUUID(),
    };
    setExams(prev => [...prev, newExam]);
    return newExam;
  };

  const updateExam = (id: string, updates: Partial<Exam>) => {
    setExams(prev =>
      prev.map(exam =>
        exam.id === id ? { ...exam, ...updates } : exam
      )
    );
  };

  const deleteExam = (id: string) => {
    setExams(prev => prev.filter(exam => exam.id !== id));
    setResults(prev => prev.filter(result => result.examId !== id));
  };

  const addResult = (examId: string, studentId: string, score: number) => {
    const existingIndex = results.findIndex(
      r => r.examId === examId && r.studentId === studentId
    );

    if (existingIndex >= 0) {
      setResults(prev =>
        prev.map((r, i) =>
          i === existingIndex ? { ...r, score, notified: false } : r
        )
      );
    } else {
      const newResult: ExamResult = {
        id: crypto.randomUUID(),
        examId,
        studentId,
        score,
        notified: false,
      };
      setResults(prev => [...prev, newResult]);
    }
  };

  const markResultAsNotified = (resultId: string) => {
    setResults(prev =>
      prev.map(r =>
        r.id === resultId ? { ...r, notified: true } : r
      )
    );
  };

  const getExamResults = (examId: string) => {
    return results.filter(r => r.examId === examId);
  };

  const getStudentResults = (studentId: string) => {
    return results.filter(r => r.studentId === studentId);
  };

  const getStudentResultsWithExams = (studentId: string) => {
    return results
      .filter(r => r.studentId === studentId)
      .map(r => ({
        ...r,
        exam: exams.find(e => e.id === r.examId),
      }))
      .filter(r => r.exam);
  };

  const getExamsByGrade = (grade: string) => {
    return exams.filter(e => e.grade === grade);
  };

  return {
    exams,
    results,
    addExam,
    updateExam,
    deleteExam,
    addResult,
    markResultAsNotified,
    getExamResults,
    getStudentResults,
    getStudentResultsWithExams,
    getExamsByGrade,
  };
}
