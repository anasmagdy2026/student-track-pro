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

export const createAbsenceMessage = (studentName: string, date: string) => {
  return `السلام عليكم ورحمة الله وبركاته 🌹

نحيط علم سيادتكم أن الطالب/ة: ${studentName}
غاب/ت عن حصة يوم: ${date}

برجاء الاهتمام بالحضور المنتظم.

مع تحيات مستر/ محمد مجدي 📚`;
};

export const createPaymentReminderMessage = (studentName: string, month: string, amount: number) => {
  return `السلام عليكم ورحمة الله وبركاته 🌹

تذكير بسداد مصاريف شهر: ${month}
للطالب/ة: ${studentName}
المبلغ المطلوب: ${amount} جنيه

برجاء السداد في أقرب وقت.

مع تحيات مستر/ محمد مجدي 📚`;
};

export const createExamResultMessage = (studentName: string, examName: string, score: number, maxScore: number) => {
  const percentage = Math.round((score / maxScore) * 100);
  let emoji = '📝';
  if (percentage >= 90) emoji = '🏆';
  else if (percentage >= 75) emoji = '⭐';
  else if (percentage >= 60) emoji = '👍';
  else if (percentage < 50) emoji = '📚';

  return `السلام عليكم ورحمة الله وبركاته 🌹

نتيجة امتحان: ${examName}
الطالب/ة: ${studentName}
الدرجة: ${score} من ${maxScore} ${emoji}
النسبة المئوية: ${percentage}%

مع تحيات مستر/ محمد مجدي 📚`;
};
