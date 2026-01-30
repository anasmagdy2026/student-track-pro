import type { Attendance, Student } from '@/types';
import type { Exam } from '@/types';

export type TriggeredAlert = {
  ruleCode:
    | 'absent_2_consecutive'
    | 'absent_3_month'
    | 'payment_1_5'
    | 'exam_absence'
    | 'homework_required'
    | 'performance_below_50'
    | 'no_refund_on_expel';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  context?: Record<string, unknown>;
};

const isoMonth = (dateIso: string) => dateIso.slice(0, 7);

export function getConsecutiveAbsenceCount(attendanceForStudent: Attendance[], upToDateIso: string) {
  const sorted = [...attendanceForStudent]
    .filter((a) => a.date < upToDateIso)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let count = 0;
  for (const rec of sorted) {
    if (rec.present) break;
    count += 1;
  }
  return count;
}

export function getMonthlyAbsenceCount(attendanceForStudent: Attendance[], month: string) {
  return attendanceForStudent.filter((a) => a.date.startsWith(month) && !a.present).length;
}

export function shouldWarnPayment1to5(now: Date, isMonthPaid: boolean) {
  const day = now.getDate();
  return day >= 1 && day <= 5 && !isMonthPaid;
}

export function hasExamOnDate(exams: Exam[], student: Student, dateIso: string) {
  return exams.some((e) => e.date === dateIso && e.grade === student.grade);
}

export function buildAttendanceAlerts(params: {
  student: Student;
  selectedDate: string;
  now: Date;
  studentAttendance: Attendance[];
  isMonthPaid: boolean;
  exams: Exam[];
  homeworkStatus?: 'done' | 'not_done' | null;
  performanceBelow50?: boolean;
}) {
  const alerts: TriggeredAlert[] = [];

  const consecutiveAbsences = getConsecutiveAbsenceCount(params.studentAttendance, params.selectedDate);
  if (consecutiveAbsences >= 2) {
    alerts.push({
      ruleCode: 'absent_2_consecutive',
      title: 'غياب حصتين متتاليتين',
      message: `تنبيه: الطالب غائب ${consecutiveAbsences} حصص متتالية. اتخاذ الإجراء (السماح بالدخول أو التجميد).`,
      severity: 'critical',
      context: { consecutiveAbsences },
    });
  }

  const month = isoMonth(params.selectedDate);
  const monthAbsences = getMonthlyAbsenceCount(params.studentAttendance, month);
  if (monthAbsences >= 3) {
    alerts.push({
      ruleCode: 'absent_3_month',
      title: 'غياب 3 حصص خلال الشهر',
      message: `تنبيه: الطالب غائب ${monthAbsences} حصص خلال شهر ${month}. اتخاذ الإجراء (السماح بالدخول أو التجميد).`,
      severity: 'critical',
      context: { monthAbsences, month },
    });
  }

  if (shouldWarnPayment1to5(params.now, params.isMonthPaid)) {
    alerts.push({
      ruleCode: 'payment_1_5',
      title: 'الدفع مقدماً (1–5)',
      message: 'تنبيه: لم يتم تسجيل دفع الشهر الحالي (خلال الفترة 1–5). اتخاذ الإجراء (السماح أو التجميد).',
      severity: 'warning',
      context: { month: isoMonth(params.now.toISOString()) },
    });
  }

  if (params.homeworkStatus === 'not_done') {
    alerts.push({
      ruleCode: 'homework_required',
      title: 'الواجب غير محلول',
      message: 'تنبيه: غير مسموح بدخول الحصة بدون حل الواجب. اتخاذ الإجراء (السماح أو التجميد).',
      severity: 'warning',
    });
  }

  if (params.performanceBelow50) {
    alerts.push({
      ruleCode: 'performance_below_50',
      title: 'مستوى أقل من 50%',
      message: 'تنبيه: متوسط مستوى الطالب أقل من 50% خلال الشهر. اتخاذ الإجراء (السماح أو التجميد).',
      severity: 'critical',
    });
  }

  // Exam absence rule is enforced when recording ABSENT on a date where there's an exam.
  if (hasExamOnDate(params.exams, params.student, params.selectedDate)) {
    alerts.push({
      ruleCode: 'exam_absence',
      title: 'يوجد امتحان اليوم',
      message: 'تنبيه: اليوم يوجد امتحان لهذه السنة. في حالة الغياب عن الامتحان قد يلزم اتخاذ إجراء.',
      severity: 'warning',
    });
  }

  return alerts;
}
