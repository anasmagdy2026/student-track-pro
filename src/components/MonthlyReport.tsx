import { useMemo, useRef } from 'react';
import { parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Student, Group, GRADE_LABELS, MONTHS_AR } from '@/types';
import { sendWhatsAppMessage, createMonthlyReportMessageForParent } from '@/utils/whatsapp';
import { toast } from 'sonner';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  XCircle,
  BookOpen,
  CreditCard,
  Share2
} from 'lucide-react';

interface MonthlyReportProps {
  student: Student;
  group?: Group | null;
  month: string;
  attendanceRecords: { date: string; present: boolean }[];
  paymentStatus: { paid: boolean; amount: number };
  lessonScores: { lessonName: string; sheetScore: number | null; recitationScore: number | null; sheetMax: number; recitationMax: number }[];
  examResults: { examName: string; score: number | null; maxScore: number; absent: boolean }[];
}

export function MonthlyReport({
  student,
  group,
  month,
  attendanceRecords,
  paymentStatus,
  lessonScores,
  examResults,
}: MonthlyReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const monthIndex = parseInt(month.split('-')[1]) - 1;
  const year = month.split('-')[0];
  const monthName = MONTHS_AR[monthIndex];

  const presentCount = attendanceRecords.filter(a => a.present).length;
  const absentCount = attendanceRecords.filter(a => !a.present).length;
  const attendancePercentage = attendanceRecords.length > 0 
    ? Math.round((presentCount / attendanceRecords.length) * 100) 
    : 0;

  const lessonsAverage = useMemo(() => {
    const parts: number[] = [];
    for (const l of lessonScores) {
      if (l.sheetScore !== null && l.sheetMax > 0) parts.push((l.sheetScore / l.sheetMax) * 100);
      if (l.recitationScore !== null && l.recitationMax > 0) parts.push((l.recitationScore / l.recitationMax) * 100);
    }
    return parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
  }, [lessonScores]);

  const examsStats = useMemo(() => {
    const total = examResults.length;
    const absent = examResults.filter(e => e.absent).length;
    const scored = examResults
      .filter(e => !e.absent && e.score !== null)
      .map(e => Math.round(((e.score || 0) / e.maxScore) * 100));
    const averagePercentage = scored.length
      ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
      : 0;
    return { total, absent, averagePercentage };
  }, [examResults]);

  const overallPercentage = useMemo(() => {
    const buckets = [attendancePercentage, lessonsAverage, examsStats.averagePercentage].filter(v => typeof v === 'number');
    return buckets.length ? Math.round(buckets.reduce((a, b) => a + b, 0) / buckets.length) : 0;
  }, [attendancePercentage, lessonsAverage, examsStats.averagePercentage]);

  const handleDownloadPDF = () => {
    if (!reportRef.current) return;

    // Use iframe+srcdoc and wait for load to avoid blank printed pages
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('aria-hidden', 'true');

      const title = `تقرير-${student.name}-${monthName}-${year}`;
      const html = reportRef.current.outerHTML;

      const srcdoc = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
    <style>
      @page { size: A4; margin: 12mm; }
      html, body { direction: rtl; }
      body { font-family: 'Cairo', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #fff; margin: 0; }
      .bg-white { background: #fff !important; }
      .p-6 { padding: 16px !important; }
      .space-y-6 > * + * { margin-top: 16px !important; }
      .space-y-2 > * + * { margin-top: 8px !important; }
      .rounded-lg { border-radius: 10px !important; }
      .border { border: 1px solid #e5e7eb !important; }
      .text-center { text-align: center !important; }
      .grid { display: grid !important; }
      .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
      .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      .gap-4 { gap: 12px !important; }
      .text-2xl { font-size: 22px !important; }
      .text-lg { font-size: 18px !important; }
      .font-bold { font-weight: 700 !important; }
      .text-sm { font-size: 13px !important; }
      .text-xs { font-size: 12px !important; }
      .text-muted-foreground { color: #6b7280 !important; }
      button { display: none !important; }
    </style>
  </head>
  <body>
    ${html}
  </body>
</html>`;

      iframe.onload = () => {
        const w = iframe.contentWindow;
        if (!w) return;
        setTimeout(() => {
          w.focus();
          w.print();
          setTimeout(() => iframe.remove(), 1500);
        }, 200);
      };

      iframe.srcdoc = srcdoc;
      document.body.appendChild(iframe);
    } catch (e) {
      console.error('Print report failed:', e);
      toast.error('تعذر بدء الطباعة. جرّب مرة أخرى.');
    }
  };

  const handleShare = async () => {
    // Open WhatsApp with summary text
    const monthLabel = `${monthName} ${year}`;
    const text = createMonthlyReportMessageForParent({
      studentName: student.name,
      monthLabel,
      groupName: group?.name,
      attendance: {
        total: attendanceRecords.length,
        present: presentCount,
        absent: absentCount,
        percentage: attendancePercentage,
      },
      payment: paymentStatus,
      exams: examsStats,
      lessons: { counted: lessonScores.length, averagePercentage: lessonsAverage },
      overallPercentage,
    });
    sendWhatsAppMessage(student.parent_phone, text);
  };

  const absentDetails = useMemo(() => {
    const absentDates = attendanceRecords
      .filter((a) => !a.present)
      .map((a) => {
        const d = parseISO(a.date);
        // Use ISO date parsing to avoid timezone shift
        return d.toLocaleDateString('ar-EG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      });
    return absentDates;
  }, [attendanceRecords]);

  return (
    <div className="space-y-4">
      <div ref={reportRef} className="bg-white p-6 space-y-6" dir="rtl">
        {/* Evaluation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              التقييم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">{attendancePercentage}%</p>
                <p className="text-sm text-muted-foreground">الحضور</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg">
                <p className="text-2xl font-bold text-secondary">{lessonsAverage}%</p>
                <p className="text-sm text-muted-foreground">الحصص</p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <p className="text-2xl font-bold text-success">{overallPercentage}%</p>
                <p className="text-sm text-muted-foreground">التقييم العام</p>
              </div>
            </div>
            {examsStats.total > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                الامتحانات: متوسط {examsStats.averagePercentage}% — غياب {examsStats.absent}/{examsStats.total}
              </p>
            )}
          </CardContent>
        </Card>
        {/* Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl font-bold text-primary">التقرير الشهري</h1>
          <p className="text-lg">{monthName} {year}</p>
        </div>

        {/* Student Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              بيانات الطالب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">الاسم:</span> {student.name}</div>
              <div><span className="font-medium">الكود:</span> {student.code}</div>
              <div><span className="font-medium">السنة:</span> {GRADE_LABELS[student.grade]}</div>
              <div><span className="font-medium">المجموعة:</span> {group?.name || '-'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              الحضور والغياب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-success/10 rounded-lg">
                <p className="text-2xl font-bold text-success">{presentCount}</p>
                <p className="text-sm text-muted-foreground">حضور</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg">
                <p className="text-2xl font-bold text-destructive">{absentCount}</p>
                <p className="text-sm text-muted-foreground">غياب</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">{attendancePercentage}%</p>
                <p className="text-sm text-muted-foreground">نسبة الحضور</p>
              </div>
            </div>

            {absentDetails.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">أيام الغياب:</p>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <ul className="list-disc pr-5 space-y-1 text-sm">
                    {absentDetails.map((label, idx) => (
                      <li key={idx}>{label}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              المدفوعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">قيمة الاشتراك: {student.monthly_fee} ج</p>
              </div>
              <Badge className={paymentStatus.paid ? 'bg-success' : 'bg-destructive'}>
                {paymentStatus.paid ? 'مدفوع' : 'غير مدفوع'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Lesson Scores */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              درجات الحصص
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lessonScores.length > 0 ? (
              <div className="space-y-2">
                {lessonScores.map((lesson, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
                    <span className="font-medium">{lesson.lessonName}</span>
                    <div className="flex gap-4">
                      <span>
                        شيت: {lesson.sheetScore !== null ? `${lesson.sheetScore}/${lesson.sheetMax}` : '-'}
                      </span>
                      <span>
                        تسميع: {lesson.recitationScore !== null ? `${lesson.recitationScore}/${lesson.recitationMax}` : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا توجد حصص مسجلة لهذا الشهر.</p>
            )}
          </CardContent>
        </Card>

        {/* Exam Results */}
        {examResults.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                نتائج الامتحانات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {examResults.map((exam, index) => {
                  const percentage = exam.absent || exam.score === null
                    ? 0
                    : Math.round((exam.score / exam.maxScore) * 100);
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
                      <span className="font-medium">{exam.examName}</span>
                      <div className="flex items-center gap-2">
                        {exam.absent ? (
                          <Badge variant="destructive">غائب</Badge>
                        ) : (
                          <>
                            <span>{exam.score}/{exam.maxScore}</span>
                            <Badge className={
                              percentage >= 75 ? 'bg-success' : 
                              percentage >= 50 ? 'bg-warning' : 'bg-destructive'
                            }>
                              {percentage}%
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button onClick={handleDownloadPDF} className="w-full gap-2">
          <Download className="h-4 w-4" />
          طباعة / حفظ PDF
        </Button>
        <Button onClick={handleShare} variant="outline" className="w-full gap-2">
          <Share2 className="h-4 w-4" />
          إرسال/مشاركة (واتساب)
        </Button>
      </div>
    </div>
  );
}
