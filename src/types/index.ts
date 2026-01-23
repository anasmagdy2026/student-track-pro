export interface Student {
  id: string;
  code: string;
  name: string;
  grade: '1' | '2' | '3'; // أولى، تانية، تالتة ثانوي
  group: string;
  parentPhone: string;
  monthlyFee: number;
  createdAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: string;
  present: boolean;
  notified: boolean;
}

export interface Payment {
  id: string;
  studentId: string;
  month: string; // YYYY-MM format
  amount: number;
  paid: boolean;
  paidAt?: string;
  notified: boolean;
}

export interface Exam {
  id: string;
  name: string;
  date: string;
  maxScore: number;
  grade: '1' | '2' | '3';
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  notified: boolean;
}

export type GradeLabel = {
  [key in '1' | '2' | '3']: string;
};

export const GRADE_LABELS: GradeLabel = {
  '1': 'أولى ثانوي',
  '2': 'تانية ثانوي',
  '3': 'تالتة ثانوي',
};

export const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];
