import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Student, Group, GRADE_LABELS, MONTHS_AR } from '@/types';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  XCircle,
  BookOpen,
  CreditCard
} from 'lucide-react';

interface MonthlyReportProps {
  student: Student;
  group?: Group | null;
  month: string;
  attendanceRecords: { date: string; present: boolean }[];
  paymentStatus: { paid: boolean; amount: number };
  lessonScores: { lessonName: string; sheetScore: number | null; recitationScore: number | null; sheetMax: number; recitationMax: number }[];
  examResults: { examName: string; score: number; maxScore: number }[];
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

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`تقرير-${student.name}-${monthName}-${year}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div ref={reportRef} className="bg-white p-6 space-y-6" dir="rtl">
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
        {lessonScores.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                درجات الحصص
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}

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
                  const percentage = Math.round((exam.score / exam.maxScore) * 100);
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
                      <span className="font-medium">{exam.examName}</span>
                      <div className="flex items-center gap-2">
                        <span>{exam.score}/{exam.maxScore}</span>
                        <Badge className={
                          percentage >= 75 ? 'bg-success' : 
                          percentage >= 50 ? 'bg-warning' : 'bg-destructive'
                        }>
                          {percentage}%
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Button onClick={handleDownloadPDF} className="w-full gap-2">
        <Download className="h-4 w-4" />
        تحميل التقرير PDF
      </Button>
    </div>
  );
}
