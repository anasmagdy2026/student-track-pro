import { useLocalStorage } from './useLocalStorage';
import { Lesson, LessonSheet, LessonRecitation } from '@/types';

export function useLessons() {
  const [lessons, setLessons] = useLocalStorage<Lesson[]>('lessons', []);
  const [sheets, setSheets] = useLocalStorage<LessonSheet[]>('lesson_sheets', []);
  const [recitations, setRecitations] = useLocalStorage<LessonRecitation[]>('lesson_recitations', []);

  // Lessons
  const addLesson = (lessonData: Omit<Lesson, 'id'>) => {
    const newLesson: Lesson = {
      ...lessonData,
      id: crypto.randomUUID(),
    };
    setLessons(prev => [...prev, newLesson]);
    return newLesson;
  };

  const updateLesson = (id: string, updates: Partial<Lesson>) => {
    setLessons(prev =>
      prev.map(lesson =>
        lesson.id === id ? { ...lesson, ...updates } : lesson
      )
    );
  };

  const deleteLesson = (id: string) => {
    setLessons(prev => prev.filter(lesson => lesson.id !== id));
    setSheets(prev => prev.filter(sheet => sheet.lessonId !== id));
    setRecitations(prev => prev.filter(rec => rec.lessonId !== id));
  };

  const getLessonById = (id: string) => {
    return lessons.find(lesson => lesson.id === id);
  };

  const getLessonsByGroup = (group: string) => {
    return lessons.filter(lesson => lesson.group === group);
  };

  const getLessonsByGrade = (grade: string) => {
    return lessons.filter(lesson => lesson.grade === grade);
  };

  // Sheets (شيتات)
  const addSheet = (lessonId: string, studentId: string, score: number, maxScore: number) => {
    const existingIndex = sheets.findIndex(
      s => s.lessonId === lessonId && s.studentId === studentId
    );

    if (existingIndex >= 0) {
      setSheets(prev =>
        prev.map((s, i) =>
          i === existingIndex ? { ...s, score, maxScore } : s
        )
      );
    } else {
      const newSheet: LessonSheet = {
        id: crypto.randomUUID(),
        lessonId,
        studentId,
        score,
        maxScore,
      };
      setSheets(prev => [...prev, newSheet]);
    }
  };

  const getLessonSheets = (lessonId: string) => {
    return sheets.filter(s => s.lessonId === lessonId);
  };

  const getStudentSheets = (studentId: string) => {
    return sheets.filter(s => s.studentId === studentId);
  };

  // Recitations (تسميع)
  const addRecitation = (lessonId: string, studentId: string, score: number, maxScore: number) => {
    const existingIndex = recitations.findIndex(
      r => r.lessonId === lessonId && r.studentId === studentId
    );

    if (existingIndex >= 0) {
      setRecitations(prev =>
        prev.map((r, i) =>
          i === existingIndex ? { ...r, score, maxScore } : r
        )
      );
    } else {
      const newRecitation: LessonRecitation = {
        id: crypto.randomUUID(),
        lessonId,
        studentId,
        score,
        maxScore,
      };
      setRecitations(prev => [...prev, newRecitation]);
    }
  };

  const getLessonRecitations = (lessonId: string) => {
    return recitations.filter(r => r.lessonId === lessonId);
  };

  const getStudentRecitations = (studentId: string) => {
    return recitations.filter(r => r.studentId === studentId);
  };

  return {
    lessons,
    sheets,
    recitations,
    addLesson,
    updateLesson,
    deleteLesson,
    getLessonById,
    getLessonsByGroup,
    getLessonsByGrade,
    addSheet,
    getLessonSheets,
    getStudentSheets,
    addRecitation,
    getLessonRecitations,
    getStudentRecitations,
  };
}
