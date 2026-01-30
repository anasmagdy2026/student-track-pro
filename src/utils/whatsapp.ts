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

export const createAbsenceMessage = (studentName: string, date: string) => {
  const dateWithDay = formatArabicDateWithDay(date);
  return `السلام عليكم ورحمة الله وبركاته

نحيط علم سيادتكم أن الطالب/ة: ${studentName}
غاب/ت عن حصة يوم: ${dateWithDay}

برجاء الاهتمام بالحضور المنتظم.

مع تحيات مستر/ محمد مجدي`;
};

export const createPaymentReminderMessage = (studentName: string, month: string, amount: number) => {
  return `السلام عليكم ورحمة الله وبركاته

تذكير بسداد مصاريف شهر: ${month}
للطالب/ة: ${studentName}
المبلغ المطلوب: ${amount} جنيه

برجاء السداد في أقرب وقت.

مع تحيات مستر/ محمد مجدي`;
};

export const createExamResultMessage = (studentName: string, examName: string, score: number, maxScore: number) => {
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

مع تحيات مستر/ محمد مجدي`;
};

export const createLateMessageForParent = (
  studentName: string,
  date: string,
  groupName: string,
  groupTime: string,
  lateMinutes: number,
) => {
  const dateWithDay = formatArabicDateWithDay(date);
  return `السلام عليكم ورحمة الله وبركاته

نحيط علم سيادتكم أن الطالب/ة: ${studentName}
تأخر/ت عن حصة ${groupName}
يوم: ${dateWithDay}
ميعاد المجموعة: ${groupTime}
مدة التأخير: ${lateMinutes} دقيقة

برجاء الالتزام بمواعيد الحضور.

مع تحيات مستر/ محمد مجدي`;
};

export const createLateMessageForStudent = (
  studentName: string,
  date: string,
  groupName: string,
  groupTime: string,
  lateMinutes: number,
) => {
  const dateWithDay = formatArabicDateWithDay(date);
  return `السلام عليكم

يا ${studentName}، تم تسجيل حضورك متأخرًا.
حصة: ${groupName}
يوم: ${dateWithDay}
ميعاد المجموعة: ${groupTime}
مدة التأخير: ${lateMinutes} دقيقة

حاول الالتزام بالميعاد من فضلك.

مستر/ محمد مجدي`;
};
