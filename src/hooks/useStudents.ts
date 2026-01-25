import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types';

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching students:', error);
    } else {
      setStudents(data as Student[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // توليد كود رقمي فقط
  const generateCode = async (): Promise<string> => {
    const year = new Date().getFullYear().toString().slice(-2);
    let code: string;
    let exists = true;
    
    while (exists) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      code = `${year}${randomNum}`;
      
      // التحقق من عدم وجود الكود
      const { data } = await supabase
        .from('students')
        .select('code')
        .eq('code', code)
        .maybeSingle();
      
      exists = !!data;
    }
    
    return code!;
  };

  const addStudent = async (studentData: Omit<Student, 'id' | 'code' | 'created_at' | 'updated_at'>) => {
    const code = await generateCode();
    
    const { data, error } = await supabase
      .from('students')
      .insert([{ ...studentData, code }])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding student:', error);
      throw error;
    }
    
    setStudents(prev => [data as Student, ...prev]);
    return data as Student;
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    const { error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating student:', error);
      throw error;
    }
    
    setStudents(prev =>
      prev.map(student =>
        student.id === id ? { ...student, ...updates } : student
      )
    );
  };

  const deleteStudent = async (id: string) => {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
    
    setStudents(prev => prev.filter(student => student.id !== id));
  };

  const getStudentById = (id: string) => {
    return students.find(student => student.id === id);
  };

  const getStudentByCode = (code: string) => {
    return students.find(student => 
      student.code.toLowerCase() === code.toLowerCase()
    );
  };

  const getStudentsByGrade = (grade: string) => {
    return students.filter(student => student.grade === grade);
  };

  const getStudentsByGroup = (groupId: string) => {
    return students.filter(student => student.group_id === groupId);
  };

  return {
    students,
    loading,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudentById,
    getStudentByCode,
    getStudentsByGrade,
    getStudentsByGroup,
    refetch: fetchStudents,
  };
}
