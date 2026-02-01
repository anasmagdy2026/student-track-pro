import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useStudents } from '@/hooks/useStudents';
import { useAttendance } from '@/hooks/useAttendance';
import { useGroups } from '@/hooks/useGroups';
import { QRScanner } from '@/components/QRScanner';
import { DAYS_AR } from '@/types';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { usePayments } from '@/hooks/usePayments';
import { useExams } from '@/hooks/useExams';
import { useStudentBlocks } from '@/hooks/useStudentBlocks';
import { useAlertEvents } from '@/hooks/useAlertEvents';
import { useAlertRules } from '@/hooks/useAlertRules';
import { buildAttendanceAlerts } from '@/lib/alertRules';
import { AlertDecisionDialog } from '@/components/AlertDecisionDialog';
import {
  sendWhatsAppMessage,
  createAbsenceMessage,
  createLateMessageForParent,
  createLateMessageForStudent,
} from '@/utils/whatsapp';
import { Calendar, UserCheck, MessageCircle, Users, Search, ScanLine, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLessons } from '@/hooks/useLessons';
import { PageLoading } from '@/components/PageLoading';

type PendingAttendanceAction = {
  studentId: string;
  present: boolean;
  source: 'checkbox' | 'code' | 'qr' | 'bulk' | 'absent-button';
};

export default function Attendance() {
  const [searchParams] = useSearchParams();
  const { students, loading: studentsLoading, getStudentByCode } = useStudents();
  const { loading: attendanceLoading, markAttendance, getAttendanceByDate, markAsNotified } = useAttendance();
  const { groups, loading: groupsLoading, getTodayGroups, getGroupById } = useGroups();
  const { loading: paymentsLoading, isMonthPaid } = usePayments();
  const { exams, results, loading: examsLoading } = useExams();
  const { lessons, sheets, recitations, loading: lessonsLoading } = useLessons();
  const { loading: gradesLoading, getGradeLabel } = useGradeLevels();
  const { loading: blocksLoading, isBlocked, getActiveBlock, freezeStudent } = useStudentBlocks();
  const { createEvent } = useAlertEvents();
  const { rules, loading: rulesLoading } = useAlertRules();

  const isLoading =
    studentsLoading ||
    attendanceLoading ||
    groupsLoading ||
    paymentsLoading ||
    examsLoading ||
    lessonsLoading ||
    gradesLoading ||
    blocksLoading ||
    rulesLoading;

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>(searchParams.get('group') || 'all'); // group_id
  const [studentCode, setStudentCode] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lateDecisionOpen, setLateDecisionOpen] = useState(false);
  const [groupDecisionOpen, setGroupDecisionOpen] = useState(false);
  const [pending, setPending] = useState<PendingAttendanceAction | null>(null);
  const [lateContext, setLateContext] = useState<{
    studentId: string;
    lateMinutes: number;
    groupName: string;
    groupTime: string;
  } | null>(null);

  const [quickScanMismatch, setQuickScanMismatch] = useState<{
    studentName: string;
    studentCode: string;
    studentGroupName: string;
    studentGroupTime: string;
    selectedGroupName: string;
    selectedGroupTime: string;
  } | null>(null);

  const [groupDecisionContext, setGroupDecisionContext] = useState<{
    studentId: string;
    studentGroupName: string;
    studentGroupTime: string;
    selectedGroupName: string;
    selectedGroupTime: string;
    reason: 'different_group' | 'different_day';
  } | null>(null);

  const todayGroups = getTodayGroups();
  const todayAttendance = getAttendanceByDate(selectedDate);

  const [alertDecisionOpen, setAlertDecisionOpen] = useState(false);
  const [pendingAlert, setPendingAlert] = useState<{
    studentId: string;
    title: string;
    description: string;
    ruleCodes: string[];
  } | null>(null);

  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false);
  const [blockedContext, setBlockedContext] = useState<{
    studentName: string;
    reason: string;
  } | null>(null);

  // Auto-select today's group if available
  useEffect(() => {
    if (!searchParams.get('group') && todayGroups.length === 1) {
      setSelectedGroup(todayGroups[0].id);
    }
  }, [todayGroups, searchParams]);

  const filteredStudents = students.filter((student) => {
    const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
    const matchesGroup = selectedGroup === 'all' || student.group_id === selectedGroup;
    return matchesGrade && matchesGroup;
  });

  const getStudentAttendance = (studentId: string) => {
    return todayAttendance.find((a) => a.student_id === studentId);
  };

  const parseTimeToDate = (dateIso: string, timeHHmm: string) => {
    const [h, m] = timeHHmm.split(':').map(Number);
    const d = new Date(`${dateIso}T00:00:00`);
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  };

  const getLateMinutes = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student?.group_id) return null;
    const group = getGroupById(student.group_id);
    if (!group?.time) return null;

    const now = new Date();
    const scheduled = parseTimeToDate(selectedDate, group.time);
    const diffMinutes = Math.floor((now.getTime() - scheduled.getTime()) / 60000);
    return diffMinutes;
  };

  // Check if session has ended based on group's time_to
  const isSessionEnded = (studentId: string): { ended: boolean; endTime: string | null; groupName: string | null } => {
    const student = students.find((s) => s.id === studentId);
    if (!student?.group_id) return { ended: false, endTime: null, groupName: null };
    
    const group = getGroupById(student.group_id);
    // Use time_to from the DB row (cast as extended group)
    const groupData = groups.find(g => g.id === student.group_id) as any;
    const timeTo = groupData?.time_to;
    
    if (!timeTo) return { ended: false, endTime: null, groupName: group?.name || null };
    
    const now = new Date();
    const endTimeDate = parseTimeToDate(selectedDate, timeTo);
    
    // Session ends when current time is after time_to (0 minutes tolerance)
    if (now > endTimeDate) {
      return { ended: true, endTime: timeTo, groupName: group?.name || null };
    }
    
    return { ended: false, endTime: timeTo, groupName: group?.name || null };
  };

  const [sessionEndedDialogOpen, setSessionEndedDialogOpen] = useState(false);
  const [sessionEndedContext, setSessionEndedContext] = useState<{
    studentName: string;
    groupName: string;
    endTime: string;
  } | null>(null);

  const getDayNameForDate = (dateIso: string) => {
    const d = new Date(`${dateIso}T00:00:00`);
    return DAYS_AR[d.getDay()];
  };

  const requestGroupDecision = (ctx: {
    studentId: string;
    studentGroupName: string;
    studentGroupTime: string;
    selectedGroupName: string;
    selectedGroupTime: string;
    reason: 'different_group' | 'different_day';
  }) => {
    // Helpful banner for quick scan flows to reduce repeated allow/deny prompts
    if (pending?.source === 'code' || pending?.source === 'qr') {
      const student = students.find((s) => s.id === ctx.studentId);
      if (student) {
        setQuickScanMismatch({
          studentName: student.name,
          studentCode: student.code,
          studentGroupName: ctx.studentGroupName,
          studentGroupTime: ctx.studentGroupTime,
          selectedGroupName: ctx.selectedGroupName,
          selectedGroupTime: ctx.selectedGroupTime,
        });
      }
    }
    setGroupDecisionContext(ctx);
    setGroupDecisionOpen(true);
  };

  const performAttendance = async (
    studentId: string,
    present: boolean,
    opts?: { skipAlertsOnce?: boolean; showBlockedDialog?: boolean }
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    // Full freeze: prevent any attendance registration
    if (isBlocked(studentId)) {
      const block = getActiveBlock(studentId);

      const reason = block?.reason || 'الطالب محظور من دخول الحصة.';
      if (opts?.showBlockedDialog === false) {
        toast.error(`الطالب مُجمّد: ${reason}`);
      } else {
        setBlockedContext({ studentName: student.name, reason });
        setBlockedDialogOpen(true);
      }
      return;
    }

    // prevent duplicate present
    const existing = getStudentAttendance(studentId);
    if (present && existing?.present) {
      toast.error('تم تحضير الطالب بالفعل');
      return;
    }

    // Rule: prevent attendance after session has ended (0 minutes tolerance)
    if (present) {
      const sessionCheck = isSessionEnded(studentId);
      if (sessionCheck.ended && sessionCheck.endTime && sessionCheck.groupName) {
        setSessionEndedContext({
          studentName: student.name,
          groupName: sessionCheck.groupName,
          endTime: sessionCheck.endTime,
        });
        setSessionEndedDialogOpen(true);
        return;
      }
    }

    if (present) {
      const studentGroup = student.group_id ? getGroupById(student.group_id) : null;

      // Alert rules before group/late checks (as requested: during check-in)
      // When the user chooses “Allow once” from the alert dialog, we skip this block once
      // to prevent an infinite loop reopening the same alert dialog.
      if (!opts?.skipAlertsOnce) {
      // Fetch last 60 days attendance for accurate rule checks.
      const since = new Date(selectedDate);
      since.setDate(since.getDate() - 60);
      const sinceIso = since.toISOString().slice(0, 10);
      const { data: attRows, error: attErr } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .gte('date', sinceIso)
        .lte('date', selectedDate);
      if (attErr) {
        console.error(attErr);
      }

      // Homework rule: determine today's lesson for this student/group, then check homework status.
      const todayLesson = lessons
        .filter((l) => l.date === selectedDate)
        .filter((l) => l.grade === student.grade)
        .find((l) => {
          if (!l.group_id) return false;
          if (student.group_id) return l.group_id === student.group_id;
          return selectedGroup !== 'all' ? l.group_id === selectedGroup : false;
        });

      let homeworkStatus: 'done' | 'not_done' | null = null;
      if (todayLesson) {
        const { data: hwRow } = await supabase
          .from('lesson_homework')
          .select('status')
          .eq('lesson_id', todayLesson.id)
          .eq('student_id', studentId)
          .maybeSingle();
        homeworkStatus = (hwRow?.status as 'done' | 'not_done' | undefined) ?? 'not_done';
      }

      // Performance <50% rule: compute simple monthly average across (sheets+recitations+exams)
      const month = selectedDate.slice(0, 7);
      const monthLessons = lessons
        .filter((l) => l.date.startsWith(month))
        .filter((l) => l.grade === student.grade)
        .filter((l) => {
          if (!student.group_id) return true;
          if (!l.group_id) return true;
          return l.group_id === student.group_id;
        });
      const lessonScoreItems: number[] = [];
      for (const l of monthLessons) {
        const sheet = sheets.find((s) => s.lesson_id === l.id && s.student_id === studentId);
        const rec = recitations.find((r) => r.lesson_id === l.id && r.student_id === studentId);
        if (l.sheet_max_score > 0) lessonScoreItems.push(((sheet?.score ?? 0) as number) / l.sheet_max_score);
        if (l.recitation_max_score > 0) lessonScoreItems.push(((rec?.score ?? 0) as number) / l.recitation_max_score);
      }

      const monthExams = exams.filter((e) => e.date.startsWith(month) && e.grade === student.grade);
      const examScoreItems: number[] = [];
      for (const e of monthExams) {
        const res = results.find((r) => r.exam_id === e.id && r.student_id === studentId);
        if (e.max_score > 0) examScoreItems.push(((res?.score ?? 0) as number) / e.max_score);
      }

      const allItems = [...lessonScoreItems, ...examScoreItems].filter((n) => typeof n === 'number' && !Number.isNaN(n));
      const avg = allItems.length ? allItems.reduce((a, b) => a + b, 0) / allItems.length : null;
      const performanceBelow50 = avg !== null && avg < 0.5;

       const alertsRaw = buildAttendanceAlerts({
        student,
        selectedDate,
        now: new Date(),
        studentAttendance: (attRows as any) || [],
        isMonthPaid: isMonthPaid(studentId, selectedDate.slice(0, 7)),
        exams,
        homeworkStatus,
        performanceBelow50,
      });

       // Apply activation toggles from alert_rules (if a rule exists and is disabled, skip it)
       const rulesByCode = new Map(rules.map((r) => [r.code, r] as const));
       const alerts = alertsRaw.filter((a) => {
         const rule = rulesByCode.get(a.ruleCode);
         return rule ? !!rule.is_active : true;
       });

       if (alerts.length > 0) {
        // Create events in DB (best-effort)
        for (const a of alerts) {
          // eslint-disable-next-line no-await-in-loop
          try {
            await createEvent({
              studentId,
              ruleCode: a.ruleCode,
              title: a.title,
              message: a.message,
              severity: a.severity,
              context: { selectedDate, ...a.context },
            });
          } catch {
            // ignore
          }
        }

        setPendingAlert({
          studentId,
          title: 'تنبيه أثناء التحضير',
          description: alerts.map((a) => `• ${a.title}: ${a.message}`).join('\n'),
          ruleCodes: alerts.map((a) => a.ruleCode),
        });
        setAlertDecisionOpen(true);
        return;
      }

      } // end alert rules block

      // Rule 1: student can only attend in their own group.
      if (selectedGroup !== 'all') {
        if (!student?.group_id || student.group_id !== selectedGroup) {
          const selectedG = getGroupById(selectedGroup);
          requestGroupDecision({
            studentId,
            studentGroupName: studentGroup?.name || 'بدون مجموعة',
            studentGroupTime: studentGroup?.time || '-',
            selectedGroupName: selectedG?.name || 'غير معروف',
            selectedGroupTime: selectedG?.time || '-',
            reason: 'different_group',
          });
          return;
        }
      } else {
        // Rule 2 (when all groups): verify today's date is one of the student's group days.
        if (studentGroup?.days?.length) {
          const dayName = getDayNameForDate(selectedDate);
          if (!studentGroup.days.includes(dayName)) {
            requestGroupDecision({
              studentId,
              studentGroupName: studentGroup.name,
              studentGroupTime: studentGroup.time,
              selectedGroupName: 'كل المجموعات',
              selectedGroupTime: dayName,
              reason: 'different_day',
            });
            return;
          }
        }
      }

      // Existing rule: late more than 10 minutes
      const lateMinutes = getLateMinutes(studentId);
      if (lateMinutes !== null && lateMinutes > 10 && studentGroup) {
        setLateContext({
          studentId,
          lateMinutes,
          groupName: studentGroup.name,
          groupTime: studentGroup.time,
        });
        setLateDecisionOpen(true);
        return;
      }
    }

    const res = await markAttendance(studentId, selectedDate, present);
    if (res.status === 'already_present') {
      toast.error('تم تحضير الطالب بالفعل');
      return;
    }
    toast.success(present ? 'تم تسجيل الحضور' : 'تم تسجيل الغياب');
  };

  const handleAlertAllow = async () => {
    setAlertDecisionOpen(false);
    const ctx = pendingAlert;
    setPendingAlert(null);
    if (!ctx) return;
    await performAttendance(ctx.studentId, true, { skipAlertsOnce: true });
  };

  const handleAlertFreeze = async () => {
    setAlertDecisionOpen(false);
    const ctx = pendingAlert;
    setPendingAlert(null);
    if (!ctx) return;

    try {
      await freezeStudent({
        studentId: ctx.studentId,
        reason: 'قرار: تجميد كامل بعد تنبيه أثناء التحضير',
        triggeredByRuleCode: ctx.ruleCodes[0],
      });
      await markAttendance(ctx.studentId, selectedDate, false);
      toast.error('تم تجميد الطالب واعتباره غائباً');
    } catch {
      toast.error('تعذر تجميد الطالب');
    }
  };

  const requestAttendance = (action: PendingAttendanceAction) => {
    setPending(action);

    // always confirm present before recording
    if (action.present) {
      setConfirmOpen(true);
      return;
    }

    // absent doesn't need confirmation
    performAttendance(action.studentId, false);
  };

  const handleMarkAllPresent = () => {
    // keep bulk behind confirmation to match “تأكيد الحضور قبل التسجيل”
    setPending({ studentId: 'bulk', present: true, source: 'bulk' });
    setConfirmOpen(true);
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim()) return;
    processStudentCode(studentCode.trim());
  };

  const processStudentCode = (code: string) => {
    const student = getStudentByCode(code);
    if (student) {
      requestAttendance({ studentId: student.id, present: true, source: 'code' });
      setStudentCode('');
    } else {
      toast.error('كود الطالب غير موجود');
    }
  };

  const handleQRScan = (code: string) => {
    setShowQRScanner(false);
    processStudentCode(code);
  };

  const handleConfirm = async () => {
    const action = pending;
    setConfirmOpen(false);

    if (!action) return;
    if (action.source === 'bulk') {
      // bulk: mark present for all filtered students
      for (const s of filteredStudents) {
        // eslint-disable-next-line no-await-in-loop
        await performAttendance(s.id, true, { showBlockedDialog: false });
      }
      toast.success('تم تسجيل حضور جميع الطلاب');
      setPending(null);
      return;
    }

    await performAttendance(action.studentId, action.present);
    setPending(null);
  };

  const handleLateAllow = async () => {
    if (!lateContext) return;
    setLateDecisionOpen(false);
    const res = await markAttendance(lateContext.studentId, selectedDate, true);
    if (res.status === 'already_present') {
      toast.error('تم تحضير الطالب بالفعل');
    } else {
      toast.success(`تم تسجيل حضور متأخر (${lateContext.lateMinutes} دقيقة)`);
    }
    setLateContext(null);
    setPending(null);
  };

  const handleLateDeny = async () => {
    if (!lateContext) return;
    setLateDecisionOpen(false);
    await markAttendance(lateContext.studentId, selectedDate, false);
    toast.error('تم رفض تسجيل التحضير بسبب التأخير');
    setLateContext(null);
    setPending(null);
  };

  const handleGroupAllow = async () => {
    if (!groupDecisionContext) return;
    setGroupDecisionOpen(false);
    const res = await markAttendance(groupDecisionContext.studentId, selectedDate, true);
    if (res.status === 'already_present') {
      toast.error('تم تحضير الطالب بالفعل');
    } else {
      toast.success('تم تسجيل الحضور (سماح استثنائي)');
    }
    setGroupDecisionContext(null);
    setPending(null);
  };

  const handleGroupDeny = async () => {
    if (!groupDecisionContext) return;
    setGroupDecisionOpen(false);
    await markAttendance(groupDecisionContext.studentId, selectedDate, false);
    toast.error('تم رفض تسجيل الحضور (اعتُبر غائب)');
    setGroupDecisionContext(null);
    setPending(null);
  };

  const handleSendLateMessage = (studentId: string, target: 'parent' | 'student') => {
    const student = students.find((s) => s.id === studentId);
    if (!student?.group_id) return;
    const group = getGroupById(student.group_id);
    if (!group) return;

    const lateMinutes = getLateMinutes(studentId);
    const late = lateMinutes !== null ? Math.max(0, lateMinutes) : 0;
    if (late <= 0) {
      toast.error('لا يوجد تأخير مسجل');
      return;
    }

    if (target === 'parent') {
      const msg = createLateMessageForParent(student.name, selectedDate, group.name, group.time, late);
      sendWhatsAppMessage(student.parent_phone, msg);
      toast.success('تم فتح الواتساب');
      return;
    }

    if (!student.student_phone) {
      toast.error('رقم هاتف الطالب غير مسجل');
      return;
    }
    const msg = createLateMessageForStudent(student.name, selectedDate, group.name, group.time, late);
    sendWhatsAppMessage(student.student_phone, msg);
    toast.success('تم فتح الواتساب');
  };

  const handleSendAbsenceMessage = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    const attendance = getStudentAttendance(studentId);
    if (!student || !attendance) return;

    const message = createAbsenceMessage(student.name, selectedDate);
    sendWhatsAppMessage(student.parent_phone, message);
    markAsNotified(attendance.id);
    toast.success('تم فتح الواتساب');
  };

  const presentCount = filteredStudents.filter((s) => {
    const att = getStudentAttendance(s.id);
    return att?.present;
  }).length;

  const absentCount = filteredStudents.filter((s) => {
    const att = getStudentAttendance(s.id);
    return att && !att.present;
  }).length;

  return (
    <Layout>
      {isLoading ? (
        <PageLoading title="جاري تحميل الحضور" description="بنجهّز قوائم الطلاب والتقارير…" />
      ) : (
        <div className="space-y-6 animate-fade-in">
        {/* Quick scan mismatch banner */}
        {quickScanMismatch && (
          <Card className="bg-muted/40">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    تنبيه: مجموعة مختلفة أثناء المسح السريع
                  </p>
                  <p className="text-sm text-muted-foreground">
                    الطالب: {quickScanMismatch.studentName} ({quickScanMismatch.studentCode})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    مجموعة الطالب: {quickScanMismatch.studentGroupName} ({quickScanMismatch.studentGroupTime}) — المجموعة المختارة: {quickScanMismatch.selectedGroupName} ({quickScanMismatch.selectedGroupTime})
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setQuickScanMismatch(null)}
                  className="shrink-0"
                >
                  إخفاء التنبيه
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">الحضور والغياب</h1>
            <p className="text-muted-foreground mt-1">
              تسجيل حضور وغياب الطلاب
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to={`/attendance/daily-absence?group=${selectedGroup}`}>
              <Button variant="outline" className="gap-2">
                عرض غياب اليوم
              </Button>
            </Link>
            <Button onClick={handleMarkAllPresent} className="gap-2">
              <UserCheck className="h-5 w-5" />
              تسجيل حضور الكل
            </Button>
          </div>
        </div>

        {/* Today's Groups Alert */}
        {todayGroups.length > 0 && (
          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-primary" />
                <div className="flex-1">
                  <p className="font-bold text-primary">مجموعات اليوم</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {todayGroups.map(g => (
                      <Button
                        key={g.id}
                        variant={selectedGroup === g.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedGroup(g.id)}
                      >
                        {g.name} ({g.time})
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Code Entry */}
        <Card className="border-secondary/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ScanLine className="h-5 w-5 text-secondary" />
              تسجيل سريع بالكود أو QR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <form onSubmit={handleCodeSubmit} className="flex-1 flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder="أدخل كود الطالب..."
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
                <Button type="submit" className="gap-2">
                  <UserCheck className="h-4 w-4" />
                  تسجيل حضور
                </Button>
              </form>
              <Button 
                variant="outline" 
                onClick={() => setShowQRScanner(true)}
                className="gap-2"
              >
                <ScanLine className="h-4 w-4" />
                مسح QR
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">التاريخ</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">السنة</label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="كل السنوات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل السنوات</SelectItem>
                    <SelectItem value="1">أولى ثانوي</SelectItem>
                    <SelectItem value="2">تانية ثانوي</SelectItem>
                    <SelectItem value="3">تالتة ثانوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">المجموعة</label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="كل المجموعات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المجموعات</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({g.time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-primary/10">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{filteredStudents.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي الطلاب</p>
            </CardContent>
          </Card>
          <Card className="bg-success/10">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-success">{presentCount}</p>
              <p className="text-sm text-muted-foreground">حاضر</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-destructive">{absentCount}</p>
              <p className="text-sm text-muted-foreground">غائب</p>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              قائمة الطلاب - {new Date(selectedDate).toLocaleDateString('ar-EG')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.length > 0 ? (
              <div className="space-y-3">
                {filteredStudents.map((student) => {
                  const attendance = getStudentAttendance(student.id);
                  const isPresent = attendance?.present ?? false;
                  const isAbsent = attendance && !attendance.present;
                  const studentGroup = student.group_id ? getGroupById(student.group_id) : null;

                  return (
                    <div
                      key={student.id}
                      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border transition-colors ${
                        isPresent
                          ? 'bg-success/10 border-success/30'
                          : isAbsent
                          ? 'bg-destructive/10 border-destructive/30'
                          : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`present-${student.id}`}
                            checked={isPresent}
                            onCheckedChange={(checked) =>
                              requestAttendance({
                                studentId: student.id,
                                present: checked === true,
                                source: 'checkbox',
                              })
                            }
                            className="h-6 w-6"
                          />
                          <label
                            htmlFor={`present-${student.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            حاضر
                          </label>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold">{student.name}</p>
                            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                              {student.code}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getGradeLabel(student.grade)} - {studentGroup?.name || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:flex-wrap">
                        {isPresent && studentGroup?.time && (
                          (() => {
                            const late = getLateMinutes(student.id);
                            if (late !== null && late > 0) {
                              return (
                                <span className="text-xs px-2 py-1 rounded bg-warning/10 text-warning" dir="rtl">
                                  متأخر {late} د
                                </span>
                              );
                            }
                            return null;
                          })()
                        )}

                        {isPresent && studentGroup?.time && (
                          (() => {
                            const late = getLateMinutes(student.id);
                            if (late !== null && late > 0) {
                              return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSendLateMessage(student.id, 'parent')}
                                    className="gap-1 w-full"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                    تأخير للولي
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSendLateMessage(student.id, 'student')}
                                    className="gap-1 w-full"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                    تأخير للطالب
                                  </Button>
                                </div>
                              );
                            }
                            return null;
                          })()
                        )}

                        {!isPresent && attendance && (
                          <Button
                            size="sm"
                            variant={attendance.notified ? 'ghost' : 'default'}
                            onClick={() => handleSendAbsenceMessage(student.id)}
                            disabled={attendance.notified}
                            className="gap-1 w-full sm:w-auto"
                          >
                            <MessageCircle className="h-4 w-4" />
                            {attendance.notified ? 'تم الإرسال' : 'إرسال للولي'}
                          </Button>
                        )}
                        {!attendance && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => requestAttendance({ studentId: student.id, present: false, source: 'absent-button' })}
                            className="w-full sm:w-auto"
                          >
                            تسجيل غياب
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  لا يوجد طلاب
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  قم بإضافة طلاب أولاً من صفحة الطلاب
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScanner
            onScan={handleQRScan}
            onClose={() => setShowQRScanner(false)}
            title="مسح QR لتسجيل الحضور"
          />
        )}

        {/* Confirm Attendance */}
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="تأكيد تسجيل الحضور"
          description={
            pending?.source === 'bulk'
              ? 'هل أنت متأكد من تسجيل حضور جميع الطلاب في القائمة الحالية؟'
              : 'هل أنت متأكد من تسجيل حضور الطالب؟'
          }
          confirmText="تسجيل الحضور"
          cancelText="إلغاء"
          onConfirm={handleConfirm}
        />

        {/* Late Decision */}
        <ConfirmDialog
          open={lateDecisionOpen}
          onOpenChange={setLateDecisionOpen}
          title="تأخير أكثر من 10 دقائق"
          description={
            lateContext
              ? `الطالب متأخر ${lateContext.lateMinutes} دقيقة عن ميعاد المجموعة (${lateContext.groupTime}). هل تريد السماح بالدخول؟`
              : ''
          }
          confirmText="السماح بالدخول"
          cancelText="رفض الدخول"
          onConfirm={handleLateAllow}
          onCancel={handleLateDeny}
          variant="destructive"
        />

        {/* Group/Day Decision */}
        <ConfirmDialog
          open={groupDecisionOpen}
          onOpenChange={setGroupDecisionOpen}
          title={
            groupDecisionContext?.reason === 'different_group'
              ? 'الطالب ليس في هذه المجموعة'
              : 'اليوم ليس من أيام مجموعة الطالب'
          }
          description={(() => {
            if (!groupDecisionContext) return '';
            if (groupDecisionContext.reason === 'different_group') {
              return `مجموعة الطالب: ${groupDecisionContext.studentGroupName} (${groupDecisionContext.studentGroupTime})\nالمجموعة المختارة: ${groupDecisionContext.selectedGroupName} (${groupDecisionContext.selectedGroupTime})\nهل تريد السماح بتسجيل الحضور؟`;
            }
            return `مجموعة الطالب: ${groupDecisionContext.studentGroupName} (${groupDecisionContext.studentGroupTime})\nاليوم: ${groupDecisionContext.selectedGroupTime}\nهل تريد السماح بتسجيل الحضور؟`;
          })()}
          confirmText="السماح"
          cancelText="رفض (يُعتبر غائب)"
          onConfirm={handleGroupAllow}
          onCancel={handleGroupDeny}
          variant="destructive"
        />

        <AlertDecisionDialog
          open={alertDecisionOpen}
          onOpenChange={setAlertDecisionOpen}
          title={pendingAlert?.title || ''}
          description={pendingAlert?.description || ''}
          onAllow={handleAlertAllow}
          onFreeze={handleAlertFreeze}
        />

        <AlertDialog
          open={blockedDialogOpen}
          onOpenChange={(open) => {
            setBlockedDialogOpen(open);
            if (!open) setBlockedContext(null);
          }}
        >
          <AlertDialogContent className="border-destructive/40 bg-card">
            <AlertDialogHeader>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <AlertDialogTitle className="text-destructive">تحذير: الطالب مُجمّد</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="mt-3 text-center whitespace-pre-line">
                {blockedContext
                  ? `الطالب: ${blockedContext.studentName}\nغير مسموح بدخول الحصة.\n\nالسبب: ${blockedContext.reason}`
                  : ''}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center">
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                حسناً
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Session Ended Dialog */}
        <AlertDialog
          open={sessionEndedDialogOpen}
          onOpenChange={(open) => {
            setSessionEndedDialogOpen(open);
            if (!open) {
              setSessionEndedContext(null);
              setPending(null);
            }
          }}
        >
          <AlertDialogContent className="border-destructive/40 bg-card">
            <AlertDialogHeader>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Clock className="h-10 w-10 text-destructive" />
                </div>
                <AlertDialogTitle className="text-destructive">انتهى وقت الحصة</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="mt-3 text-center whitespace-pre-line">
                {sessionEndedContext
                  ? `الطالب: ${sessionEndedContext.studentName}\nالمجموعة: ${sessionEndedContext.groupName}\n\nانتهى وقت الحصة (${sessionEndedContext.endTime})\nلا يمكن تسجيل الحضور بعد انتهاء الحصة.`
                  : ''}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center">
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                حسناً
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      )}
    </Layout>
  );
}
