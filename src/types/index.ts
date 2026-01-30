export interface Student {
  id: string;
  code: string;
  name: string;
  grade: string; // dynamic grade code (e.g. sec1, prep3)
  group_id: string | null;
  parent_phone: string;
  student_phone?: string | null;
  monthly_fee: number;
  registered_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Group {
  id: string;
  name: string;
  grade: string;
  days: string[]; // مجموعة الأيام مثل ['السبت', 'الإثنين', 'الأربعاء']
  time: string; // وقت المجموعة
  created_at?: string;
  updated_at?: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  date: string;
  present: boolean;
  notified: boolean;
  checked_in_at?: string | null;
  created_at?: string;
}

export interface Payment {
  id: string;
  student_id: string;
  month: string; // YYYY-MM format
  amount: number;
  paid: boolean;
  paid_at?: string;
  notified: boolean;
  created_at?: string;
}

export interface Exam {
  id: string;
  name: string;
  date: string;
  max_score: number;
  grade: string;
  created_at?: string;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  notified: boolean;
  created_at?: string;
}

export interface Lesson {
  id: string;
  name: string;
  date: string;
  grade: string;
  group_id: string | null;
  sheet_max_score: number;
  recitation_max_score: number;
  created_at?: string;
}

export interface LessonSheet {
  id: string;
  lesson_id: string;
  student_id: string;
  score: number;
  created_at?: string;
}

export interface LessonRecitation {
  id: string;
  lesson_id: string;
  student_id: string;
  score: number;
  created_at?: string;
}


export const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export const DAYS_AR = [
  'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
];

// أنماط أيام المجموعات
export const GROUP_DAY_PATTERNS = [
  { label: 'السبت - الإثنين - الأربعاء', days: ['السبت', 'الإثنين', 'الأربعاء'] },
  { label: 'الأحد - الثلاثاء - الخميس', days: ['الأحد', 'الثلاثاء', 'الخميس'] },
];
