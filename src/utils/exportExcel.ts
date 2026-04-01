import * as XLSX from 'xlsx';
import { Student, Payment, Attendance, Exam, ExamResult } from '@/types';
import { Group } from '@/types';

const MONTHS_LABELS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

interface ExportData {
  students: Student[];
  payments: Payment[];
  attendance: Attendance[];
  exams: Exam[];
  examResults: ExamResult[];
  groups: { id: string; name: string }[];
  getGradeLabel: (code: string) => string;
  year?: number;
}

export function exportStudentsExcel({
  students,
  payments,
  attendance,
  exams,
  examResults,
  groups,
  getGradeLabel,
  year,
}: ExportData) {
  const currentYear = year || new Date().getFullYear();
  const wb = XLSX.utils.book_new();

  // === Sheet 1: Student Data ===
  const studentRows = students.map((s, i) => {
    const group = groups.find(g => g.id === s.group_id);
    return {
      '#': i + 1,
      'الكود': s.code,
      'اسم الطالب': s.name,
      'السنة الدراسية': getGradeLabel(s.grade),
      'المجموعة': group?.name || '-',
      'رقم ولي الأمر': s.parent_phone,
      'رقم الطالب': s.student_phone || '-',
      'الرسوم الشهرية': s.monthly_fee,
      'تاريخ التسجيل': s.registered_at || s.created_at?.slice(0, 10) || '-',
    };
  });
  const ws1 = XLSX.utils.json_to_sheet(studentRows);
  setColWidths(ws1, [5, 12, 25, 15, 20, 15, 15, 12, 12]);
  setRTL(ws1);
  XLSX.utils.book_append_sheet(wb, ws1, 'بيانات الطلاب');

  // === Sheet 2: Monthly Payments ===
  const paymentHeaders = ['#', 'الكود', 'اسم الطالب', 'المجموعة', 'الرسوم'];
  for (let m = 1; m <= 12; m++) {
    paymentHeaders.push(MONTHS_LABELS[m - 1]);
  }

  const paymentData: any[][] = [paymentHeaders];
  students.forEach((s, i) => {
    const group = groups.find(g => g.id === s.group_id);
    const row: any[] = [i + 1, s.code, s.name, group?.name || '-', s.monthly_fee];
    for (let m = 1; m <= 12; m++) {
      const monthStr = `${currentYear}-${String(m).padStart(2, '0')}`;
      const payment = payments.find(p => p.student_id === s.id && p.month === monthStr);
      if (payment?.paid) {
        row.push(`✅ ${payment.amount} ج`);
      } else if (payment && !payment.paid) {
        row.push('❌ لم يدفع');
      } else {
        row.push('-');
      }
    }
    paymentData.push(row);
  });
  const ws2 = XLSX.utils.aoa_to_sheet(paymentData);
  setColWidths(ws2, [5, 12, 25, 20, 10, ...Array(12).fill(14)]);
  setRTL(ws2);
  XLSX.utils.book_append_sheet(wb, ws2, 'المدفوعات الشهرية');

  // === Sheet 3: Attendance Summary ===
  const attHeaders = ['#', 'الكود', 'اسم الطالب', 'المجموعة'];
  for (let m = 1; m <= 12; m++) {
    attHeaders.push(`حضور ${MONTHS_LABELS[m - 1]}`);
    attHeaders.push(`غياب ${MONTHS_LABELS[m - 1]}`);
  }

  const attData: any[][] = [attHeaders];
  students.forEach((s, i) => {
    const group = groups.find(g => g.id === s.group_id);
    const row: any[] = [i + 1, s.code, s.name, group?.name || '-'];
    for (let m = 1; m <= 12; m++) {
      const monthStr = `${currentYear}-${String(m).padStart(2, '0')}`;
      const monthAtt = attendance.filter(
        a => a.student_id === s.id && a.date.startsWith(monthStr)
      );
      const present = monthAtt.filter(a => a.present).length;
      const absent = monthAtt.filter(a => !a.present).length;
      row.push(present || '-');
      row.push(absent || '-');
    }
    attData.push(row);
  });
  const ws3 = XLSX.utils.aoa_to_sheet(attData);
  setColWidths(ws3, [5, 12, 25, 20, ...Array(24).fill(10)]);
  setRTL(ws3);
  XLSX.utils.book_append_sheet(wb, ws3, 'الحضور والغياب');

  // === Sheet 4: Exam Results ===
  const gradeExams = exams.sort((a, b) => a.date.localeCompare(b.date));
  const examHeaders = ['#', 'الكود', 'اسم الطالب', 'المجموعة'];
  gradeExams.forEach(e => {
    examHeaders.push(`${e.name} (${e.max_score})`);
  });

  const examData: any[][] = [examHeaders];
  students.forEach((s, i) => {
    const group = groups.find(g => g.id === s.group_id);
    const row: any[] = [i + 1, s.code, s.name, group?.name || '-'];
    gradeExams.forEach(exam => {
      const result = examResults.find(
        r => r.exam_id === exam.id && r.student_id === s.id
      );
      row.push(result ? result.score : '-');
    });
    examData.push(row);
  });
  const ws4 = XLSX.utils.aoa_to_sheet(examData);
  setColWidths(ws4, [5, 12, 25, 20, ...Array(gradeExams.length).fill(14)]);
  XLSX.utils.book_append_sheet(wb, ws4, 'درجات الامتحانات');

  // Set RTL for all sheets
  wb.Workbook = wb.Workbook || {};
  wb.Workbook.Views = [{ RTL: true }];

  // Download
  const fileName = `بيانات_الطلاب_${currentYear}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

function setRTL(ws: XLSX.WorkSheet) {
  if (!ws['!sheetViews']) ws['!sheetViews'] = [{}];
  (ws['!sheetViews'] as any[])[0].rightToLeft = true;
}
