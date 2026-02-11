import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStudents } from '@/hooks/useStudents';
import { useGroups } from '@/hooks/useGroups';
import { usePayments } from '@/hooks/usePayments';
import { useStudentBlocks } from '@/hooks/useStudentBlocks';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { MonthlyUnpaidReport } from '@/components/MonthlyUnpaidReport';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { QRScanner } from '@/components/QRScanner';
import { MONTHS_AR } from '@/types';
import {
  sendWhatsAppMessage,
  createPaymentReminderMessage,
} from '@/utils/whatsapp';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  MessageCircle,
  Users,
  Search,
  ScanLine,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageLoading } from '@/components/PageLoading';
import { useAppSettings } from '@/hooks/useAppSettings';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function Payments() {
  const { students, loading: studentsLoading, getStudentByCode } = useStudents();
  const { groups, loading: groupsLoading, getGroupById } = useGroups();
  const { loading: paymentsLoading, addPayment, isMonthPaid, payments, markAsNotified, markAsUnpaid } = usePayments();
  const { loading: blocksLoading, isBlocked, getActiveBlock } = useStudentBlocks();
  const { activeGradeLevels, loading: gradesLoading, getGradeLabel } = useGradeLevels();

  const isLoading = studentsLoading || groupsLoading || paymentsLoading || blocksLoading || gradesLoading;
  const { getSetting } = useAppSettings();
  const { sendNotification } = usePushNotifications();
  const paymentNotifSent = useRef(false);

  // Get current month using local time
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1; // 1-indexed
  const currentMonth = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  
  // Calculate previous month
  const getPreviousMonth = (month: string) => {
    const [year, m] = month.split('-').map(Number);
    const prevDate = new Date(year, m - 2, 1);
    return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  };
  
  const previousMonth = getPreviousMonth(currentMonth);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [studentCode, setStudentCode] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showUnpaidReport, setShowUnpaidReport] = useState(false);
  
  // تأكيد الدفع
  const [confirmPayment, setConfirmPayment] = useState<{
    open: boolean;
    studentId: string;
    studentName: string;
    amount: number;
  }>({ open: false, studentId: '', studentName: '', amount: 0 });

  // تأكيد الاسترداد
  const [confirmRefund, setConfirmRefund] = useState<{
    open: boolean;
    paymentId: string;
    studentName: string;
  }>({ open: false, paymentId: '', studentName: '' });

  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false);
  const [blockedContext, setBlockedContext] = useState<{
    studentName: string;
    reason: string;
    actionLabel: string;
  } | null>(null);

  // Helper function to check if student was registered before or in the selected month
  const wasStudentRegisteredInMonth = (student: { registered_at?: string }, month: string) => {
    if (!student.registered_at) return true; // If no registration date, assume always registered
    const registeredMonth = student.registered_at.slice(0, 7); // YYYY-MM
    return registeredMonth <= month;
  };

  // Filter students - also filter by registration date for the selected month
  const filteredStudents = students.filter((student) => {
    const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
    const matchesGroup = selectedGroup === 'all' || student.group_id === selectedGroup;
    const wasRegistered = wasStudentRegisteredInMonth(student, selectedMonth);
    return matchesGrade && matchesGroup && wasRegistered;
  });

  const showBlockedDialog = (studentId: string, actionLabel: string, fallbackReason: string) => {
    const st = students.find((s) => s.id === studentId);
    const b = getActiveBlock(studentId);
    setBlockedContext({
      studentName: st?.name ?? 'الطالب',
      reason: b?.reason || fallbackReason,
      actionLabel,
    });
    setBlockedDialogOpen(true);
  };

  const handlePayment = async (studentId: string, amount: number) => {
    try {
      if (isBlocked(studentId)) {
        showBlockedDialog(studentId, 'تسجيل الدفع', 'غير مسموح بتسجيل الدفع أثناء التجميد.');
        return;
      }
      await addPayment(studentId, selectedMonth, amount);
      toast.success('✅ تم تسجيل الدفع بنجاح! شكراً لك.');
      setConfirmPayment({ open: false, studentId: '', studentName: '', amount: 0 });
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الدفع');
    }
  };

  const handleRefund = async (paymentId: string) => {
    try {
      // no refund when student is expelled/frozen
      const payment = payments.find((p) => p.id === paymentId);
      if (payment && isBlocked(payment.student_id)) {
        showBlockedDialog(payment.student_id, 'استرداد المبلغ', 'غير مسموح بالاسترداد في حالة التجميد.');
        return;
      }
      await markAsUnpaid(paymentId);
      toast.success('✅ تم استرداد المبلغ بنجاح');
      setConfirmRefund({ open: false, paymentId: '', studentName: '' });
    } catch (error) {
      toast.error('حدث خطأ أثناء استرداد المبلغ');
    }
  };

  const openPaymentConfirm = (studentId: string, studentName: string, amount: number) => {
    setConfirmPayment({ open: true, studentId, studentName, amount });
  };

  const openRefundConfirm = (paymentId: string, studentName: string) => {
    setConfirmRefund({ open: true, paymentId, studentName });
  };

  const processStudentCode = (code: string) => {
    const student = getStudentByCode(code);
    if (student) {
      if (isBlocked(student.id)) {
        showBlockedDialog(student.id, 'تسجيل الدفع', 'غير مسموح بالدفع/الإجراءات أثناء التجميد.');
        return;
      }
      if (isMonthPaid(student.id, selectedMonth)) {
        toast.info(`${student.name} دفع بالفعل هذا الشهر`);
      } else {
        openPaymentConfirm(student.id, student.name, student.monthly_fee);
      }
      setStudentCode('');
    } else {
      toast.error('كود الطالب غير موجود');
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim()) return;
    processStudentCode(studentCode.trim());
  };

  const handleQRScan = (code: string) => {
    setShowQRScanner(false);
    processStudentCode(code);
  };

  const handleSendReminder = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const monthIndex = parseInt(selectedMonth.split('-')[1]) - 1;
    const monthName = MONTHS_AR[monthIndex];
    const message = createPaymentReminderMessage(student.name, monthName, student.monthly_fee);
    sendWhatsAppMessage(student.parent_phone, message);

    const payment = payments.find(
      (p) => p.student_id === studentId && p.month === selectedMonth
    );
    if (payment) {
      await markAsNotified(payment.id);
    }
    toast.success('تم فتح الواتساب');
  };

  const paidStudents = filteredStudents.filter((s) => isMonthPaid(s.id, selectedMonth));
  const unpaidStudents = filteredStudents.filter((s) => !isMonthPaid(s.id, selectedMonth));
  
  // Check for students who didn't pay last month (only show when viewing current month)
  // Also filter by registration date
  const unpaidLastMonth = selectedMonth === currentMonth 
    ? filteredStudents.filter((s) => {
        const wasRegistered = wasStudentRegisteredInMonth(s, previousMonth);
        return wasRegistered && !isMonthPaid(s.id, previousMonth);
      })
    : [];

  // Send payment overdue notification once per session
  useEffect(() => {
    if (paymentNotifSent.current || isLoading) return;
    if (unpaidLastMonth.length > 0 && getSetting('notify_payment_enabled') === 'true') {
      paymentNotifSent.current = true;
      sendNotification(
        '💰 تنبيه مدفوعات متأخرة',
        `يوجد ${unpaidLastMonth.length} طالب لم يدفع الشهر السابق`,
        'payment'
      ).catch(() => { /* non-blocking */ });
    }
  }, [unpaidLastMonth.length, isLoading]);

  const totalExpected = filteredStudents.reduce((sum, s) => sum + s.monthly_fee, 0);
  const totalReceived = paidStudents.reduce((sum, s) => sum + s.monthly_fee, 0);

  // Generate month options centered on current month
  const monthOptions = [];
  for (let i = -6; i <= 6; i++) {
    const date = new Date(currentYear, currentMonthNum - 1 + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    monthOptions.push({
      value,
      label: `${MONTHS_AR[monthIndex]} ${year}`,
    });
  }

  return (
    <Layout>
      {isLoading ? (
        <PageLoading title="جاري تحميل المدفوعات" description="بنجهّز سجل المدفوعات…" />
      ) : (
        <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">المدفوعات</h1>
            <p className="text-muted-foreground mt-1">
              متابعة دفع مصاريف الشهر
            </p>
          </div>
          <Button onClick={() => setShowUnpaidReport(true)} variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            تقرير المتأخرين
          </Button>
        </div>

        {/* Alert for unpaid previous month */}
        {unpaidLastMonth.length > 0 && selectedMonth === currentMonth && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-destructive/10 rounded-full flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-destructive">
                    تنبيه: {unpaidLastMonth.length} طالب لم يدفع الشهر السابق
                  </p>
                  <p className="text-sm text-muted-foreground">
                    يُنصح بمتابعة تحصيل المتأخرات قبل الشهر الجديد
                  </p>
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
              تسجيل دفع سريع بالكود أو QR
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
                  <CreditCard className="h-4 w-4" />
                  تسجيل دفع
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
                <label className="text-sm font-medium mb-2 block">الشهر</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">السنة</label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="كل السنوات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل السنوات</SelectItem>
                    {activeGradeLevels.map((g) => (
                      <SelectItem key={g.code} value={g.code}>
                        {g.label}
                      </SelectItem>
                    ))}
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
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary/10">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{filteredStudents.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي الطلاب</p>
            </CardContent>
          </Card>
          <Card className="bg-success/10">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-success">{paidStudents.length}</p>
              <p className="text-sm text-muted-foreground">دفعوا</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-destructive">{unpaidStudents.length}</p>
              <p className="text-sm text-muted-foreground">لم يدفعوا</p>
            </CardContent>
          </Card>
          <Card className="bg-secondary/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-secondary">{totalReceived} ج</p>
              <p className="text-sm text-muted-foreground">من {totalExpected} ج</p>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              قائمة الطلاب
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.length > 0 ? (
              <div className="space-y-3">
                {filteredStudents.map((student) => {
                  const isPaid = isMonthPaid(student.id, selectedMonth);
                  const group = student.group_id ? getGroupById(student.group_id) : null;
                  const payment = payments.find(
                    (p) => p.student_id === student.id && p.month === selectedMonth && p.paid
                  );

                  return (
                    <div
                      key={student.id}
                      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border transition-colors ${
                        isPaid
                          ? 'bg-success/10 border-success/30'
                          : 'bg-destructive/10 border-destructive/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isPaid ? 'bg-success' : 'bg-destructive'
                          }`}
                        >
                          {isPaid ? (
                            <CheckCircle className="h-5 w-5 text-success-foreground" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{student.name}</p>
                            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                              {student.code}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getGradeLabel(student.grade)} - {group?.name || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          {student.monthly_fee} ج
                        </Badge>
                        {isPaid ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-success text-success-foreground">
                              مدفوع
                            </Badge>
                            {payment && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => openRefundConfirm(payment.id, student.name)}
                              >
                                <RotateCcw className="h-4 w-4 ml-1" />
                                استرداد
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                if (isBlocked(student.id)) {
                                  showBlockedDialog(student.id, 'تسجيل الدفع', 'غير مسموح بتسجيل الدفع أثناء التجميد.');
                                  return;
                                }
                                openPaymentConfirm(student.id, student.name, student.monthly_fee);
                              }}
                            >
                              تسجيل الدفع
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendReminder(student.id)}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
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

        {/* تأكيد الدفع */}
        <ConfirmDialog
          open={confirmPayment.open}
          onOpenChange={(open) => setConfirmPayment({ ...confirmPayment, open })}
          title="تأكيد الدفع"
          description={`هل أنت متأكد من تسجيل دفع ${confirmPayment.amount} جنيه للطالب ${confirmPayment.studentName}؟`}
          confirmText="نعم، سجل الدفع"
          cancelText="إلغاء"
          onConfirm={() => handlePayment(confirmPayment.studentId, confirmPayment.amount)}
        />

        {/* تأكيد الاسترداد */}
        <ConfirmDialog
          open={confirmRefund.open}
          onOpenChange={(open) => setConfirmRefund({ ...confirmRefund, open })}
          title="تأكيد الاسترداد"
          description={`هل أنت متأكد من استرداد المبلغ للطالب ${confirmRefund.studentName}؟`}
          confirmText="نعم، استرداد"
          cancelText="إلغاء"
          onConfirm={() => handleRefund(confirmRefund.paymentId)}
          variant="destructive"
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
                  ? `الطالب: ${blockedContext.studentName}\nلا يمكن تنفيذ: ${blockedContext.actionLabel}\n\nالسبب: ${blockedContext.reason}`
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

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScanner
            onScan={handleQRScan}
            onClose={() => setShowQRScanner(false)}
            title="مسح QR لتسجيل الدفع"
          />
        )}

        {/* Monthly Unpaid Report */}
        <MonthlyUnpaidReport 
          open={showUnpaidReport} 
          onOpenChange={setShowUnpaidReport} 
        />
        </div>
      )}
    </Layout>
  );
}