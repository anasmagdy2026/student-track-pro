import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useStudents } from '@/hooks/useStudents';
import { useAttendance } from '@/hooks/useAttendance';
import { usePayments } from '@/hooks/usePayments';
import { useExams } from '@/hooks/useExams';
import { useGroups } from '@/hooks/useGroups';
import { GRADE_LABELS, MONTHS_AR } from '@/types';
import {
  sendWhatsAppMessage,
  createAbsenceMessage,
  createPaymentReminderMessage,
  createExamResultMessage,
} from '@/utils/whatsapp';
import {
  ArrowRight,
  User,
  Calendar,
  CreditCard,
  FileText,
  MessageCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStudentById } = useStudents();
  const { getStudentAttendance, getAttendanceStats, markAsNotified } = useAttendance();
  const { getStudentPayments, markAsNotified: markPaymentNotified } = usePayments();
  const { getStudentResultsWithExams, markResultAsNotified } = useExams();
  const { getGroupById } = useGroups();

  const student = getStudentById(id || '');
  const attendance = getStudentAttendance(id || '');
  const attendanceStats = getAttendanceStats(id || '');
  const payments = getStudentPayments(id || '');
  const examResults = getStudentResultsWithExams(id || '');
  const studentGroup = student?.group_id ? getGroupById(student.group_id) : null;

  if (!student) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">الطالب غير موجود</p>
          <Button onClick={() => navigate('/students')} className="mt-4">
            العودة للطلاب
          </Button>
        </div>
      </Layout>
    );
  }

  const handleSendAbsenceMessage = (date: string, attendanceId: string) => {
    const formattedDate = new Date(date).toLocaleDateString('ar-EG');
    const message = createAbsenceMessage(student.name, formattedDate);
    sendWhatsAppMessage(student.parent_phone, message);
    markAsNotified(attendanceId);
    toast.success('تم فتح الواتساب');
  };

  const handleSendPaymentReminder = (month: string, paymentId: string) => {
    const monthIndex = parseInt(month.split('-')[1]) - 1;
    const monthName = MONTHS_AR[monthIndex];
    const message = createPaymentReminderMessage(student.name, monthName, student.monthly_fee);
    sendWhatsAppMessage(student.parent_phone, message);
    markPaymentNotified(paymentId);
    toast.success('تم فتح الواتساب');
  };

  const handleSendExamResult = (resultId: string, examName: string, score: number, maxScore: number) => {
    const message = createExamResultMessage(student.name, examName, score, maxScore);
    sendWhatsAppMessage(student.parent_phone, message);
    markResultAsNotified(resultId);
    toast.success('تم فتح الواتساب');
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/students')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{student.name}</h1>
            <p className="text-muted-foreground mt-1">
              كود الطالب: <span className="font-mono font-bold text-primary">{student.code}</span>
            </p>
          </div>
        </div>

        {/* Student Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              بيانات الطالب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-sm text-muted-foreground">السنة الدراسية</p>
                <p className="font-bold text-lg">{GRADE_LABELS[student.grade]}</p>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-sm text-muted-foreground">المجموعة</p>
                <p className="font-bold text-lg">{studentGroup?.name || '-'}</p>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-sm text-muted-foreground">رسوم الشهر</p>
                <p className="font-bold text-lg">{student.monthly_fee} جنيه</p>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-sm text-muted-foreground">هاتف ولي الأمر</p>
                <p className="font-bold text-lg font-mono" dir="ltr">{student.parent_phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              الحضور والغياب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-success/10 rounded-xl text-center">
                <p className="text-3xl font-bold text-success">{attendanceStats.present}</p>
                <p className="text-sm text-muted-foreground">حضور</p>
              </div>
              <div className="p-4 bg-destructive/10 rounded-xl text-center">
                <p className="text-3xl font-bold text-destructive">{attendanceStats.absent}</p>
                <p className="text-sm text-muted-foreground">غياب</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-xl text-center">
                <p className="text-3xl font-bold text-primary">{attendanceStats.total}</p>
                <p className="text-sm text-muted-foreground">إجمالي</p>
              </div>
            </div>

            {attendance.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>إرسال رسالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {new Date(record.date).toLocaleDateString('ar-EG')}
                          </TableCell>
                          <TableCell>
                            {record.present ? (
                              <Badge className="bg-success text-success-foreground">
                                <CheckCircle className="h-3 w-3 ml-1" />
                                حاضر
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 ml-1" />
                                غائب
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!record.present && (
                              <Button
                                size="sm"
                                variant={record.notified ? 'ghost' : 'outline'}
                                onClick={() => handleSendAbsenceMessage(record.date, record.id)}
                                disabled={record.notified}
                              >
                                <MessageCircle className="h-4 w-4 ml-1" />
                                {record.notified ? 'تم الإرسال' : 'إرسال للولي'}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                لا يوجد سجل حضور بعد
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              سجل المدفوعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الشهر</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>إرسال تذكير</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments
                      .sort((a, b) => b.month.localeCompare(a.month))
                      .map((payment) => {
                        const monthIndex = parseInt(payment.month.split('-')[1]) - 1;
                        return (
                          <TableRow key={payment.id}>
                            <TableCell>{MONTHS_AR[monthIndex]}</TableCell>
                            <TableCell>{payment.amount} جنيه</TableCell>
                            <TableCell>
                              {payment.paid ? (
                                <Badge className="bg-success text-success-foreground">
                                  <CheckCircle className="h-3 w-3 ml-1" />
                                  مدفوع
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 ml-1" />
                                  غير مدفوع
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {!payment.paid && (
                                <Button
                                  size="sm"
                                  variant={payment.notified ? 'ghost' : 'outline'}
                                  onClick={() => handleSendPaymentReminder(payment.month, payment.id)}
                                  disabled={payment.notified}
                                >
                                  <MessageCircle className="h-4 w-4 ml-1" />
                                  {payment.notified ? 'تم الإرسال' : 'تذكير'}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                لا يوجد سجل مدفوعات بعد
              </p>
            )}
          </CardContent>
        </Card>

        {/* Exam Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              درجات الامتحانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {examResults.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الامتحان</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الدرجة</TableHead>
                      <TableHead>النسبة</TableHead>
                      <TableHead>إرسال النتيجة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examResults.map((result) => {
                      const percentage = Math.round((result.score / (result.exam?.max_score || 1)) * 100);
                      return (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">
                            {result.exam?.name}
                          </TableCell>
                          <TableCell>
                            {result.exam && new Date(result.exam.date).toLocaleDateString('ar-EG')}
                          </TableCell>
                          <TableCell>
                            {result.score} / {result.exam?.max_score}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                percentage >= 75
                                  ? 'bg-success text-success-foreground'
                                  : percentage >= 50
                                  ? 'bg-warning text-warning-foreground'
                                  : 'bg-destructive text-destructive-foreground'
                              }
                            >
                              {percentage}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={result.notified ? 'ghost' : 'outline'}
                              onClick={() =>
                                handleSendExamResult(
                                  result.id,
                                  result.exam?.name || '',
                                  result.score,
                                  result.exam?.max_score || 100
                                )
                              }
                              disabled={result.notified}
                            >
                              <MessageCircle className="h-4 w-4 ml-1" />
                              {result.notified ? 'تم الإرسال' : 'إرسال للولي'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                لا يوجد نتائج امتحانات بعد
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}