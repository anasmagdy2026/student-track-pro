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
      :root {
        /* Match app theme tokens (HSL) */
        --background: 220 20% 97%;
        --foreground: 222 47% 11%;
        --card: 0 0% 100%;
        --muted: 220 14% 96%;
        --muted-foreground: 220 9% 46%;
        --border: 220 13% 91%;
        --primary: 217 91% 40%;
        --secondary: 38 92% 50%;
        --success: 142 76% 36%;
        --destructive: 0 84% 60%;
      }

      body {
        font-family: 'Cairo', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        background: hsl(var(--background));
        color: hsl(var(--foreground));
        margin: 0;
      }

      /* Layout helpers used by the report */
      .border { border: 1px solid hsl(var(--border)) !important; }
      .rounded-lg { border-radius: 10px !important; }
      .rounded-xl { border-radius: 14px !important; }
      .p-3 { padding: 12px !important; }
      .p-4 { padding: 14px !important; }
      .p-5 { padding: 16px !important; }
      .p-6 { padding: 18px !important; }
      .mb-3 { margin-bottom: 12px !important; }
      .mt-1 { margin-top: 4px !important; }
      .mt-3 { margin-top: 12px !important; }
      .mt-4 { margin-top: 16px !important; }
      .space-y-6 > * + * { margin-top: 16px !important; }
      .space-y-4 > * + * { margin-top: 12px !important; }
      .space-y-3 > * + * { margin-top: 10px !important; }
      .space-y-2 > * + * { margin-top: 8px !important; }
      .grid { display: grid !important; }
      .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
      .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      .gap-3 { gap: 10px !important; }
      .gap-2 { gap: 8px !important; }
      .gap-4 { gap: 12px !important; }
      .text-center { text-align: center !important; }

      /* Typography */
      .tracking-tight { letter-spacing: -0.01em !important; }
      .text-2xl { font-size: 22px !important; }
      .text-lg { font-size: 17px !important; }
      .text-sm { font-size: 13px !important; }
      .text-xs { font-size: 12px !important; }
      .font-bold { font-weight: 700 !important; }
      .font-extrabold { font-weight: 800 !important; }
      .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important; }
      .text-foreground { color: hsl(var(--foreground)) !important; }
      .text-muted-foreground { color: hsl(var(--muted-foreground)) !important; }
      .text-primary { color: hsl(var(--primary)) !important; }
      .text-secondary { color: hsl(var(--secondary)) !important; }
      .text-success { color: hsl(var(--success)) !important; }
      .text-destructive { color: hsl(var(--destructive)) !important; }

      /* Background helpers */
      .bg-card { background: hsl(var(--card)) !important; }
      .bg-background { background: hsl(var(--background)) !important; }
      .bg-muted { background: hsl(var(--muted)) !important; }
      .bg-muted\/20 { background: hsl(var(--muted) / 0.20) !important; }
      .bg-muted\/60 { background: hsl(var(--muted) / 0.60) !important; }
      .bg-background\/60 { background: hsl(var(--background) / 0.60) !important; }
      .bg-primary\/5 { background: hsl(var(--primary) / 0.05) !important; }
      .bg-primary\/10 { background: hsl(var(--primary) / 0.10) !important; }
      .bg-secondary\/10 { background: hsl(var(--secondary) / 0.10) !important; }
      .bg-success\/10 { background: hsl(var(--success) / 0.10) !important; }
      .bg-destructive\/10 { background: hsl(var(--destructive) / 0.10) !important; }

      /* Badge (minimal) */
      .inline-flex { display: inline-flex !important; }
      .items-center { align-items: center !important; }
      .justify-center { justify-content: center !important; }

      /* Hide interactive buttons in print */
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
      <div ref={reportRef} className="bg-card p-6 space-y-6 rounded-xl border" dir="rtl">
        {/* Header */}
        <header className="rounded-xl border bg-primary/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">التقرير الشهري</h1>
              <p className="text-sm text-muted-foreground">{monthName} {year}</p>
            </div>

            <div className="text-left" dir="ltr">
              <Badge variant="outline" className="font-mono">
                {student.code}
              </Badge>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">الطالب</p>
              <p className="font-bold text-foreground line-clamp-1">{student.name}</p>
            </div>
            <div className="rounded-lg border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">السنة</p>
              <p className="font-bold text-foreground">{GRADE_LABELS[student.grade]}</p>
            </div>
            <div className="rounded-lg border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">المجموعة</p>
              <p className="font-bold text-foreground line-clamp-1">{group?.name || '-'}</p>
            </div>
          </div>
        </header>

        {/* Evaluation */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="grid place-items-center h-9 w-9 rounded-lg bg-primary/10 text-primary">
                <CheckCircle className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-foreground">التقييم</h2>
            </div>
            {examsStats.total > 0 && (
              <Badge variant="outline" className="text-muted-foreground">
                الامتحانات: متوسط {examsStats.averagePercentage}% — غياب {examsStats.absent}/{examsStats.total}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border bg-primary/5 p-4">
              <p className="text-sm text-muted-foreground">الحضور</p>
              <div className="mt-1 flex items-end justify-between">
                <p className="text-3xl font-extrabold text-primary">{attendancePercentage}%</p>
                <p className="text-xs text-muted-foreground">{presentCount}/{attendanceRecords.length || 0}</p>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${attendancePercentage}%` }} />
              </div>
            </div>

            <div className="rounded-xl border bg-secondary/10 p-4">
              <p className="text-sm text-muted-foreground">الحصص</p>
              <div className="mt-1 flex items-end justify-between">
                <p className="text-3xl font-extrabold text-secondary">{lessonsAverage}%</p>
                <p className="text-xs text-muted-foreground">عدد الحصص: {lessonScores.length}</p>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-secondary" style={{ width: `${lessonsAverage}%` }} />
              </div>
            </div>

            <div className="rounded-xl border bg-success/10 p-4">
              <p className="text-sm text-muted-foreground">التقييم العام</p>
              <div className="mt-1 flex items-end justify-between">
                <p className="text-3xl font-extrabold text-success">{overallPercentage}%</p>
                <p className="text-xs text-muted-foreground">ملخص الشهر</p>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-success" style={{ width: `${overallPercentage}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* Student Info (compact) */}
        <section className="rounded-xl border bg-muted/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="grid place-items-center h-9 w-9 rounded-lg bg-muted text-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground">بيانات الطالب</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">الاسم</p>
              <p className="font-bold text-foreground line-clamp-1">{student.name}</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">الكود</p>
              <p className="font-bold text-foreground font-mono" dir="ltr">{student.code}</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">السنة</p>
              <p className="font-bold text-foreground">{GRADE_LABELS[student.grade]}</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">المجموعة</p>
              <p className="font-bold text-foreground line-clamp-1">{group?.name || '-'}</p>
            </div>
          </div>
        </section>

        {/* Attendance */}
        <section className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="grid place-items-center h-9 w-9 rounded-lg bg-primary/10 text-primary">
                <CheckCircle className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-foreground">الحضور والغياب</h2>
            </div>
            <Badge variant="outline" className="text-muted-foreground">
              إجمالي الأيام: {attendanceRecords.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border bg-success/10 p-4 text-center">
              <p className="text-3xl font-extrabold text-success">{presentCount}</p>
              <p className="text-sm text-muted-foreground">حضور</p>
            </div>
            <div className="rounded-xl border bg-destructive/10 p-4 text-center">
              <p className="text-3xl font-extrabold text-destructive">{absentCount}</p>
              <p className="text-sm text-muted-foreground">غياب</p>
            </div>
            <div className="rounded-xl border bg-primary/10 p-4 text-center">
              <p className="text-3xl font-extrabold text-primary">{attendancePercentage}%</p>
              <p className="text-sm text-muted-foreground">نسبة الحضور</p>
            </div>
          </div>

          {absentDetails.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-bold text-foreground">أيام الغياب</p>
              <div className="rounded-xl border bg-muted/20 p-3">
                <ul className="list-disc pr-5 space-y-1 text-sm">
                  {absentDetails.map((label, idx) => (
                    <li key={idx} className="text-foreground">{label}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* Payment Status */}
        <section className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="grid place-items-center h-9 w-9 rounded-lg bg-muted text-foreground">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">المدفوعات</h2>
                <p className="text-sm text-muted-foreground">قيمة الاشتراك: {student.monthly_fee} ج</p>
              </div>
            </div>

            <Badge className={paymentStatus.paid ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>
              {paymentStatus.paid ? 'مدفوع' : 'غير مدفوع'}
            </Badge>
          </div>
        </section>

        {/* Lesson Scores */}
        <section className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="grid place-items-center h-9 w-9 rounded-lg bg-secondary/10 text-secondary">
                <BookOpen className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-foreground">درجات الحصص</h2>
            </div>
            <Badge variant="outline" className="text-muted-foreground">
              {lessonScores.length} حصة
            </Badge>
          </div>

          {lessonScores.length > 0 ? (
            <div className="space-y-2">
              {lessonScores.map((lesson, index) => (
                <div key={index} className="rounded-xl border bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground line-clamp-1">{lesson.lessonName}</p>
                      <p className="text-xs text-muted-foreground">شيت + تسميع</p>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <Badge className="bg-primary/10 text-primary">
                        شيت: {lesson.sheetScore !== null ? `${lesson.sheetScore}/${lesson.sheetMax}` : '-'}
                      </Badge>
                      <Badge className="bg-secondary/10 text-secondary">
                        تسميع: {lesson.recitationScore !== null ? `${lesson.recitationScore}/${lesson.recitationMax}` : '-'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد حصص مسجلة لهذا الشهر.</p>
          )}
        </section>

        {/* Exam Results */}
        {examResults.length > 0 && (
          <section className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="grid place-items-center h-9 w-9 rounded-lg bg-muted text-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-foreground">نتائج الامتحانات</h2>
            </div>

            <div className="space-y-2">
              {examResults.map((exam, index) => {
                const percentage = exam.absent || exam.score === null
                  ? 0
                  : Math.round((exam.score / exam.maxScore) * 100);

                const badgeClass = exam.absent
                  ? 'bg-destructive text-destructive-foreground'
                  : percentage >= 75
                    ? 'bg-success text-success-foreground'
                    : percentage >= 50
                      ? 'bg-warning text-warning-foreground'
                      : 'bg-destructive text-destructive-foreground';

                return (
                  <div key={index} className="rounded-xl border bg-muted/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-foreground line-clamp-1">{exam.examName}</p>
                      <div className="flex items-center gap-2">
                        {exam.absent ? (
                          <Badge className={badgeClass}>غائب</Badge>
                        ) : (
                          <>
                            <Badge variant="outline" className="font-mono" dir="ltr">
                              {exam.score}/{exam.maxScore}
                            </Badge>
                            <Badge className={badgeClass}>{percentage}%</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
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
