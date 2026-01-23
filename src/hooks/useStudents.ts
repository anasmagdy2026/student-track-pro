import { useLocalStorage } from './useLocalStorage';
import { Student } from '@/types';

export function useStudents() {
  const [students, setStudents] = useLocalStorage<Student[]>('students', []);

  const generateCode = (): string => {
    const year = new Date().getFullYear().toString().slice(-2);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `ST${year}${randomNum}`;
  };

  const addStudent = (studentData: Omit<Student, 'id' | 'code' | 'createdAt'>) => {
    const newStudent: Student = {
      ...studentData,
      id: crypto.randomUUID(),
      code: generateCode(),
      createdAt: new Date().toISOString(),
    };
    setStudents(prev => [...prev, newStudent]);
    return newStudent;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === id ? { ...student, ...updates } : student
      )
    );
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(student => student.id !== id));
  };

  const getStudentById = (id: string) => {
    return students.find(student => student.id === id);
  };

  const getStudentsByGrade = (grade: string) => {
    return students.filter(student => student.grade === grade);
  };

  const getStudentsByGroup = (group: string) => {
    return students.filter(student => student.group === group);
  };

  const getAllGroups = () => {
    return [...new Set(students.map(s => s.group))];
  };

  return {
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudentById,
    getStudentsByGrade,
    getStudentsByGroup,
    getAllGroups,
  };
}
