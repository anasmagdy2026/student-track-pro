export const sendWhatsAppMessage = (phone: string, message: string) => {
  // تنظيف رقم الهاتف
  let cleanPhone = phone.replace(/\D/g, '');
  
  // إضافة كود مصر إذا لم يكن موجود
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '2' + cleanPhone;
  }
  if (!cleanPhone.startsWith('20')) {
    cleanPhone = '20' + cleanPhone;
  }

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};

const formatArabicDateWithDay = (input: string) => {
  // input may be ISO date (YYYY-MM-DD) or already formatted.
  const isIso = /^\d{4}-\d{2}-\d{2}$/.test(input);
  if (!isIso) return input;

  const d = new Date(`${input}T00:00:00`);
  const dayName = d.toLocaleDateString('ar-EG', { weekday: 'long' });
  const dateStr = d.toLocaleDateString('ar-EG');
  return `${dayName} - ${dateStr}`;
};

export const createAbsenceMessage = (studentName: string, date: string, teacherName = 'مستر/ محمد مجدي') => {
  const dateWithDay = formatArabicDateWithDay(date);
  return `السلام عليكم ورحمة الله وبركاته

نحيط علم سيادتكم أن الطالب/ة: ${studentName}
غاب/ت عن حصة يوم: ${dateWithDay}

برجاء الاهتمام بالحضور المنتظم.

مع تحيات ${teacherName}`;
};

export const createPaymentReminderMessage = (studentName: string, month: string, amount: number, teacherName = 'مستر/ محمد مجدي') => {
  return `السلام عليكم ورحمة الله وبركاته

تذكير بسداد مصاريف شهر: ${month}
للطالب/ة: ${studentName}
المبلغ المطلوب: ${amount} جنيه

برجاء السداد في أقرب وقت.

مع تحيات ${teacherName}`;
};

export const createExamResultMessage = (studentName: string, examName: string, score: number, maxScore: number, teacherName = 'مستر/ محمد مجدي') => {
  const percentage = Math.round((score / maxScore) * 100);
  let label = '';
  if (percentage >= 90) label = 'ممتاز';
  else if (percentage >= 75) label = 'جيد جداً';
  else if (percentage >= 60) label = 'جيد';
  else if (percentage < 50) label = 'يحتاج متابعة';

  return `السلام عليكم ورحمة الله وبركاته

نتيجة امتحان: ${examName}
الطالب/ة: ${studentName}
الدرجة: ${score} من ${maxScore}${label ? ` (${label})` : ''}
النسبة المئوية: ${percentage}%

مع تحيات ${teacherName}`;
};

export const createLateMessageForParent = (
  studentName: string,
  date: string,
  groupName: string,
  groupTime: string,
  lateMinutes: number,
  teacherName = 'مستر/ محمد مجدي',
) => {
  const dateWithDay = formatArabicDateWithDay(date);
  return `السلام عليكم ورحمة الله وبركاته

نحيط علم سيادتكم أن الطالب/ة: ${studentName}
تأخر/ت عن حصة ${groupName}
يوم: ${dateWithDay}
ميعاد المجموعة: ${groupTime}
مدة التأخير: ${lateMinutes} دقيقة

برجاء الالتزام بمواعيد الحضور.

مع تحيات ${teacherName}`;
};

export const createLateMessageForStudent = (
  studentName: string,
  date: string,
  groupName: string,
  groupTime: string,
  lateMinutes: number,
  teacherName = 'مستر/ محمد مجدي',
) => {
  const dateWithDay = formatArabicDateWithDay(date);
  return `السلام عليكم

يا ${studentName}، تم تسجيل حضورك متأخرًا.
حصة: ${groupName}
يوم: ${dateWithDay}
ميعاد المجموعة: ${groupTime}
مدة التأخير: ${lateMinutes} دقيقة

حاول الالتزام بالميعاد من فضلك.

${teacherName}`;
};

export const createMonthlyReportMessageForParent = (params: {
  studentName: string;
  monthLabel: string;
  groupName?: string;
  attendance: { total: number; present: number; absent: number; percentage: number };
  payment: { paid: boolean; amount: number };
  exams: { total: number; absent: number; averagePercentage: number };
  lessons: { counted: number; averagePercentage: number };
  overallPercentage: number;
  teacherName?: string;
}) => {
  const groupLine = params.groupName ? `المجموعة: ${params.groupName}\n` : '';
  const paidText = params.payment.paid ? 'مدفوع' : 'غير مدفوع';
  const teacher = params.teacherName || 'مستر/ محمد مجدي';

  return `السلام عليكم ورحمة الله وبركاته

تقرير شهري: ${params.monthLabel}
الطالب/ة: ${params.studentName}
${groupLine}
الحضور: ${params.attendance.present}/${params.attendance.total} (${params.attendance.percentage}%)
الغياب: ${params.attendance.absent}

المدفوعات: ${paidText} (المبلغ: ${params.payment.amount} جنيه)

الامتحانات: متوسط ${params.exams.averagePercentage}% (غياب امتحان: ${params.exams.absent}/${params.exams.total})
الحصص (شيت/تسميع): متوسط ${params.lessons.averagePercentage}% (عدد المسجل: ${params.lessons.counted})

التقييم العام: ${params.overallPercentage}%

مع تحيات ${teacher}`;
};

// رسالة المطلوب للحصة الجاية
export const createNextSessionReminderMessage = (
  studentName: string,
  groupName: string,
  reminder: {
    homework?: string | null;
    recitation?: string | null;
    exam?: string | null;
    sheet?: string | null;
    note?: string | null;
  },
  teacherName = 'مستر/ محمد مجدي',
) => {
  let content = '';
  
  if (reminder.homework) {
    content += `الواجب: ${reminder.homework}\n`;
  }
  if (reminder.recitation) {
    content += `التسميع: ${reminder.recitation}\n`;
  }
  if (reminder.exam) {
    content += `الامتحان: ${reminder.exam}\n`;
  }
  if (reminder.sheet) {
    content += `الشيت: ${reminder.sheet}\n`;
  }
  if (reminder.note) {
    content += `ملاحظة: ${reminder.note}\n`;
  }

  return `السلام عليكم ورحمة الله وبركاته

يا ${studentName}، تذكير بالمطلوب للحصة الجاية
مجموعة: ${groupName}

${content}
برجاء الاستعداد جيداً.

مع تحيات ${teacherName}`;
};
