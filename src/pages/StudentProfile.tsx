import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useLessons } from '@/hooks/useLessons';
import { useStudentBlocks } from '@/hooks/useStudentBlocks';
import { useAlertEvents } from '@/hooks/useAlertEvents';
import { supabase } from '@/integrations/supabase/client';
import { StudentCard } from '@/components/StudentCard';
import { MonthlyReport } from '@/components/MonthlyReport';
import { StudentStatusDialog } from '@/components/StudentStatusDialog';
import { MONTHS_AR } from '@/types';
import { useGradeLevels } from '@/hooks/useGradeLevels';
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
  BookOpen,
  Mic,
  QrCode,
  Download,
  Snowflake,
  Undo2,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStudentById } = useStudents();
  const { getStudentAttendance, getAttendanceStats, markAsNotified, getAttendanceByMonth } = useAttendance();
  const { getStudentPayments, markAsNotified: markPaymentNotified, isMonthPaid, getPaymentByMonth } = usePayments();
  const { exams, getStudentResultsWithExams, markResultAsNotified } = useExams();
  const { getGroupById } = useGroups();
  const { lessons, getStudentSheets, getStudentRecitations, getLessonById } = useLessons();
  const { getGradeLabel } = useGradeLevels();
  const { blocks, isBlocked, getActiveBlock, freezeStudent, unfreezeStudent, refetch: refetchBlocks } = useStudentBlocks();
  const { events, createEvent } = useAlertEvents();

  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [attendanceMonth, setAttendanceMonth] = useState<string>('all');
  const [reportMonth, setReportMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);
  const [freezeReason, setFreezeReason] = useState('');

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const student = getStudentById(id || '');
  const attendance = getStudentAttendance(id || '');
  const attendanceStats = getAttendanceStats(id || '');
  const payments = getStudentPayments(id || '');
  const examResults = getStudentResultsWithExams(id || '');
  const studentGroup = student?.group_id ? getGroupById(student.group_id) : null;

  const activeBlock = useMemo(() => {
    if (!student) return null;
    return getActiveBlock(student.id);
  }, [student, getActiveBlock]);

  const studentFreezeBlocks = useMemo(() => {
    if (!student) return [];
    return blocks.filter((b) => b.student_id === student.id);
  }, [blocks, student]);

  const decisionEvents = useMemo(() => {
    if (!student) return [];
    const decisionCodes = new Set(['decision_freeze', 'decision_unfreeze', 'decision_resolve']);
    return events
      .filter((e) => e.student_id === student.id)
      .filter((e) => decisionCodes.has(e.rule_code))
      .slice(0, 50);
  }, [events, student]);

  // Get lesson sheets and recitations for this student
  const studentSheets = getStudentSheets(id || '');
  const studentRecitations = getStudentRecitations(id || '');

  // Get available months from lessons
  const availableMonths = Array.from(
    new Set(
      lessons.map((l) => l.date.substring(0, 7))
    )
  ).sort().reverse();

  // Get available months from attendance (for month filter in attendance section)
  const availableAttendanceMonths = useMemo(() => {
    return Array.from(new Set(attendance.map((a) => a.date.substring(0, 7)))).sort().reverse();
  }, [attendance]);

  const filteredAttendance = useMemo(() => {
    const base = attendanceMonth === 'all'
      ? attendance
      : attendance.filter((a) => a.date.startsWith(attendanceMonth));

    const sorted = [...base].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Preserve previous behavior: last 10 records when no month filter is selected
    return attendanceMonth === 'all' ? sorted.slice(0, 10) : sorted;
  }, [attendance, attendanceMonth]);

  const filteredAttendanceStats = useMemo(() => {
    if (attendanceMonth === 'all') return attendanceStats;
    const monthRecords = attendance.filter((a) => a.date.startsWith(attendanceMonth));
    const present = monthRecords.filter((a) => a.present).length;
    const absent = monthRecords.filter((a) => !a.present).length;
    return { present, absent, total: monthRecords.length };
  }, [attendanceMonth, attendance, attendanceStats]);

  // Filter lesson data by month
  const filteredSheets = filterMonth === 'all'
    ? studentSheets
    : studentSheets.filter((s) => {
        const lesson = getLessonById(s.lesson_id);
        return lesson?.date.startsWith(filterMonth);
      });

  const filteredRecitations = filterMonth === 'all'
    ? studentRecitations
    : studentRecitations.filter((r) => {
        const lesson = getLessonById(r.lesson_id);
        return lesson?.date.startsWith(filterMonth);
      });

  // Prepare monthly report data
  const getReportData = () => {
    if (!student) return null;

    const registeredAt = (student.registered_at || student.created_at?.slice(0, 10) || '').slice(0, 10);

    const payment = getPaymentByMonth(student.id, reportMonth);
    const paymentStatus = {
      paid: payment?.paid ?? false,
      amount: payment?.amount ?? student.monthly_fee,
    };

    // Lessons for the report:
    // - in selected month
    // - match student's grade
    // - if lesson has no group_id, treat it as a general lesson for the grade
    // - after registration date
    const monthLessons = lessons
      .filter((l) => l.date.startsWith(reportMonth))
      .filter((l) => !registeredAt || l.date >= registeredAt)
      .filter((l) => {
        if (!student.group_id) return true;
        // If lesson isn't tied to a group, include it (common source of "empty report")
        if (!l.group_id) return true;
        return l.group_id === student.group_id;
      })
      .filter((l) => l.grade === student.grade);

    // Attendance for the report should reflect actual class days.
    // We treat any lesson date without an attendance record as Absent (present=false)
    // so the report shows meaningful حضور/غياب even if attendance wasn't explicitly saved.
    const monthAttendance = getAttendanceByMonth(student.id, reportMonth)
      .filter((a) => !registeredAt || a.date >= registeredAt);

    // Attendance dates should reflect actual class/activity days.
    // Use union of lesson dates and recorded attendance dates to avoid empty sections.
    const lessonDates = Array.from(
      new Set([
        ...monthLessons.map((l) => l.date),
        ...monthAttendance.map((a) => a.date),
      ])
    ).sort();
    const attendanceRecordMap = new Map(monthAttendance.map((a) => [a.date, a.present] as const));
    const attendanceRecords = lessonDates.map((date) => ({
      date,
      present: attendanceRecordMap.get(date) ?? false,
    }));

    // Show lessons in the report even if the student has no recorded scores yet.
    // This fixes cases where الشيتات/التسميع don't appear at all.
    const lessonScores = monthLessons
      .map((lesson) => {
        const sheet = studentSheets.find((s) => s.lesson_id === lesson.id);
        const recitation = studentRecitations.find((r) => r.lesson_id === lesson.id);
        return {
          lessonName: lesson.name,
          sheetScore: sheet?.score ?? null,
          recitationScore: recitation?.score ?? null,
          sheetMax: lesson.sheet_max_score,
          recitationMax: lesson.recitation_max_score,
        };
      })
      .sort((a, b) => a.lessonName.localeCompare(b.lessonName, 'ar'));

    const monthExams = exams.filter(e => e.date.startsWith(reportMonth) && e.grade === student.grade);
    // If no grade exists => consider absent
    const examResultsData = monthExams.map(exam => {
      const result = examResults.find(r => r.exam?.id === exam.id);
      return {
        examName: exam.name,
        score: result?.score ?? null,
        maxScore: exam.max_score,
        absent: !result,
      };
    });

    return {
      attendanceRecords,
      paymentStatus,
      lessonScores,
      examResults: examResultsData,
    };
  };

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
    const message = createAbsenceMessage(student.name, date);
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

  const getMonthLabel = (month: string) => {
    const [year, monthNum] = month.split('-');
    return `${MONTHS_AR[parseInt(monthNum) - 1]} ${year}`;
  };

  const reportData = getReportData();

  const handleFreeze = async () => {
    const reason = freezeReason.trim() || 'قرار يدوي: تجميد كامل من ملف الطالب';
    try {
      await freezeStudent({ studentId: student.id, reason });
      try {
        await createEvent({
          studentId: student.id,
          ruleCode: 'decision_freeze',
          title: 'قرار: تجميد كامل',
          message: reason,
          severity: 'info',
          context: { source: 'student_profile' },
        });
      } catch {
        // ignore
      }
      toast.success('تم تجميد الطالب');
      setFreezeDialogOpen(false);
      setFreezeReason('');
    } catch {
      toast.error('تعذر تجميد الطالب');
    }
  };

  const handleUnfreeze = async () => {
    try {
      await unfreezeStudent(student.id);
      try {
        await createEvent({
          studentId: student.id,
          ruleCode: 'decision_unfreeze',
          title: 'قرار: فك التجميد',
          message: 'تم فك التجميد من ملف الطالب.',
          severity: 'info',
          context: { source: 'student_profile' },
        });
      } catch {
        // ignore
      }
      toast.success('تم فك التجميد');
    } catch {
      toast.error('تعذر فك التجميد');
    }
  };

  const handleDeleteFreezeHistory = async () => {
    try {
      const { error } = await supabase
        .from('student_blocks')
        .delete()
        .eq('student_id', student.id);
      if (error) throw error;
      await refetchBlocks();
      toast.success('تم حذف سجل التجميد');
    } catch {
      toast.error('تعذر حذف سجل التجميد');
    }
  };

  // Generate month options for report
  const currentDate = new Date();
  const reportMonthOptions = [];
  for (let i = -6; i <= 1; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const value = date.toISOString().slice(0, 7);
    reportMonthOptions.push({
      value,
      label: getMonthLabel(value),
    });
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
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
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setStatusDialogOpen(true)}>
              <Snowflake className="h-4 w-4" />
              حالة التجميد
              {isBlocked(student.id) ? (
                <Badge variant="destructive">مُجمّد</Badge>
              ) : (
                <Badge variant="secondary">غير مُجمّد</Badge>
              )}
            </Button>

            {/* Student Card Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <QrCode className="h-4 w-4" />
                  بطاقة الطالب
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>بطاقة الطالب</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center">
                  <StudentCard student={student} group={studentGroup} />
                </div>
              </DialogContent>
            </Dialog>

            {/* Monthly Report Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  التقرير الشهري
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>التقرير الشهري</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={reportMonth} onValueChange={setReportMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الشهر" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportMonthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {reportData && (
                    <MonthlyReport
                      student={student}
                      group={studentGroup}
                      month={reportMonth}
                      attendanceRecords={reportData.attendanceRecords}
                      paymentStatus={reportData.paymentStatus}
                      lessonScores={reportData.lessonScores}
                      examResults={reportData.examResults}
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <StudentStatusDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          studentName={student.name}
          activeBlock={activeBlock}
          blocks={studentFreezeBlocks}
          decisionEvents={decisionEvents}
          onUnfreeze={handleUnfreeze}
          onDeleteFreezeHistory={handleDeleteFreezeHistory}
        />

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
                <p className="font-bold text-lg">{getGradeLabel(student.grade)}</p>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-sm text-muted-foreground">المجموعة</p>
                <p className="font-bold text-lg">{studentGroup?.name || '-'}</p>
                {studentGroup?.time && (
                  <p className="text-xs text-muted-foreground mt-1" dir="ltr">
                    {studentGroup.time}
                  </p>
                )}
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-sm text-muted-foreground">رسوم الشهر</p>
                <p className="font-bold text-lg">{student.monthly_fee} جنيه</p>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-sm text-muted-foreground">هاتف ولي الأمر</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-lg font-mono" dir="ltr">{student.parent_phone}</p>
                  <a
                    href={`tel:${student.parent_phone}`}
                    className="text-sm underline text-primary"
                  >
                    اتصال
                  </a>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-xl">
                <p className="text-sm text-muted-foreground">هاتف الطالب</p>
                {student.student_phone ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-lg font-mono" dir="ltr">{student.student_phone}</p>
                    <a
                      href={`tel:${student.student_phone}`}
                      className="text-sm underline text-primary"
                    >
                      اتصال
                    </a>
                  </div>
                ) : (
                  <p className="font-bold text-lg">-</p>
                )}
              </div>

              <div className="p-4 bg-muted rounded-xl">
                <p className="text-sm text-muted-foreground">تاريخ التسجيل</p>
                <p className="font-bold text-lg">
                  {student.registered_at
                    ? new Date(student.registered_at).toLocaleDateString('ar-EG')
                    : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Stats */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                الحضور والغياب
              </CardTitle>

              <Select value={attendanceMonth} onValueChange={setAttendanceMonth}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="فلترة بالشهر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الشهور</SelectItem>
                  {availableAttendanceMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {getMonthLabel(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-success/10 rounded-xl text-center">
                <p className="text-3xl font-bold text-success">{filteredAttendanceStats.present}</p>
                <p className="text-sm text-muted-foreground">حضور</p>
              </div>
              <div className="p-4 bg-destructive/10 rounded-xl text-center">
                <p className="text-3xl font-bold text-destructive">{filteredAttendanceStats.absent}</p>
                <p className="text-sm text-muted-foreground">غياب</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-xl text-center">
                <p className="text-3xl font-bold text-primary">{filteredAttendanceStats.total}</p>
                <p className="text-sm text-muted-foreground">إجمالي</p>
              </div>
            </div>

            {filteredAttendance.length > 0 ? (
              <>
                {/* Mobile: cards */}
                <div className="space-y-3 md:hidden">
                  {filteredAttendance.map((record) => (
                      <div key={record.id} className="rounded-xl border bg-muted/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{new Date(record.date).toLocaleDateString('ar-EG')}</p>
                            <div className="mt-2">
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
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            {!record.present && (
                              <Button
                                size="sm"
                                variant={record.notified ? 'ghost' : 'outline'}
                                onClick={() => handleSendAbsenceMessage(record.date, record.id)}
                                disabled={record.notified}
                                className="justify-center"
                              >
                                <MessageCircle className="h-4 w-4 ml-1" />
                                {record.notified ? 'تم الإرسال' : 'إرسال للولي'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Desktop/Tablet: table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-center">الحالة</TableHead>
                        <TableHead className="text-center">إرسال رسالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAttendance.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="text-right">
                              {new Date(record.date).toLocaleDateString('ar-EG')}
                            </TableCell>
                            <TableCell className="text-center">
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
                            <TableCell className="text-center">
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
              </>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                لا يوجد سجل حضور بعد
              </p>
            )}
          </CardContent>
        </Card>

        {/* Lesson Scores (Sheets & Recitations) */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                درجات الحصص (الشيتات والتسميع)
              </CardTitle>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="فلترة بالشهر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الشهور</SelectItem>
                  {availableMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {getMonthLabel(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Sheets */}
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  الشيتات
                </h3>
                {filteredSheets.length > 0 ? (
                  <div className="space-y-2">
                    {filteredSheets.map((sheet) => {
                      const lesson = getLessonById(sheet.lesson_id);
                      if (!lesson) return null;
                      const percentage = Math.round((sheet.score / lesson.sheet_max_score) * 100);
                      return (
                        <div
                          key={sheet.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-xl"
                        >
                          <div>
                            <p className="font-medium">{lesson.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(lesson.date).toLocaleDateString('ar-EG')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">
                              {sheet.score} / {lesson.sheet_max_score}
                            </span>
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    لا توجد درجات شيتات
                  </p>
                )}
              </div>

              {/* Recitations */}
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Mic className="h-5 w-5 text-secondary" />
                  التسميع
                </h3>
                {filteredRecitations.length > 0 ? (
                  <div className="space-y-2">
                    {filteredRecitations.map((rec) => {
                      const lesson = getLessonById(rec.lesson_id);
                      if (!lesson) return null;
                      const percentage = Math.round((rec.score / lesson.recitation_max_score) * 100);
                      return (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-xl"
                        >
                          <div>
                            <p className="font-medium">{lesson.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(lesson.date).toLocaleDateString('ar-EG')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">
                              {rec.score} / {lesson.recitation_max_score}
                            </span>
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    لا توجد درجات تسميع
                  </p>
                )}
              </div>
            </div>
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
                لا يوجد سجل مدفوعات
              </p>
            )}
          </CardContent>
        </Card>

        {/* Exam Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              نتائج الامتحانات
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
                      const percentage = Math.round(
                        (result.score / (result.exam?.max_score || 1)) * 100
                      );
                      return (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">
                            {result.exam?.name}
                          </TableCell>
                          <TableCell>
                            {result.exam?.date
                              ? new Date(result.exam.date).toLocaleDateString('ar-EG')
                              : '-'}
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
                              {result.notified ? 'تم الإرسال' : 'إرسال'}
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
                لا توجد نتائج امتحانات
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
