import { useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';

export default function Payments() {
  const { students, getStudentByCode } = useStudents();
  const { groups, getGroupById } = useGroups();
  const { addPayment, isMonthPaid, payments, markAsNotified, markAsUnpaid } = usePayments();
  const { isBlocked, getActiveBlock } = useStudentBlocks();
  const { activeGradeLevels, getGradeLabel } = useGradeLevels();

  const currentDate = new Date();
  const currentMonth = currentDate.toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [studentCode, setStudentCode] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  
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

  const filteredStudents = students.filter((student) => {
    const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
    const matchesGroup = selectedGroup === 'all' || student.group_id === selectedGroup;
    return matchesGrade && matchesGroup;
  });

  const handlePayment = async (studentId: string, amount: number) => {
    try {
      if (isBlocked(studentId)) {
        const b = getActiveBlock(studentId);
        toast.error(`لا يمكن تسجيل الدفع: الطالب مُجمّد (${b?.reason || 'مجمّد'})`);
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
        toast.error('غير مسموح بالاسترداد في حالة الطرد/التجميد');
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
        const b = getActiveBlock(student.id);
        toast.error(`الطالب مُجمّد: ${b?.reason || 'غير مسموح بالدفع/الإجراءات'}`);
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
  const totalExpected = filteredStudents.reduce((sum, s) => sum + s.monthly_fee, 0);
  const totalReceived = paidStudents.reduce((sum, s) => sum + s.monthly_fee, 0);

  const monthOptions = [];
  for (let i = -6; i <= 6; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const value = date.toISOString().slice(0, 7);
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    monthOptions.push({
      value,
      label: `${MONTHS_AR[monthIndex]} ${year}`,
    });
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">المدفوعات</h1>
          <p className="text-muted-foreground mt-1">
            متابعة دفع مصاريف الشهر
          </p>
        </div>

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
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
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

                      <div className="flex items-center gap-3">
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
                              disabled={isBlocked(student.id)}
                              onClick={() => openPaymentConfirm(student.id, student.name, student.monthly_fee)}
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

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScanner
            onScan={handleQRScan}
            onClose={() => setShowQRScanner(false)}
            title="مسح QR لتسجيل الدفع"
          />
        )}
      </div>
    </Layout>
  );
}
