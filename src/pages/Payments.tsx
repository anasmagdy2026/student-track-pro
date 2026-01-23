import { useState } from 'react';
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
import { useStudents } from '@/hooks/useStudents';
import { usePayments } from '@/hooks/usePayments';
import { GRADE_LABELS, MONTHS_AR } from '@/types';
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
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Payments() {
  const { students, getAllGroups } = useStudents();
  const { addPayment, isMonthPaid, payments, markAsNotified } = usePayments();

  const currentDate = new Date();
  const currentMonth = currentDate.toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const groups = getAllGroups();

  const filteredStudents = students.filter((student) => {
    const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
    const matchesGroup = selectedGroup === 'all' || student.group === selectedGroup;
    return matchesGrade && matchesGroup;
  });

  const handlePayment = (studentId: string, amount: number) => {
    addPayment(studentId, selectedMonth, amount);
    toast.success('تم تسجيل الدفع بنجاح');
  };

  const handleSendReminder = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const monthIndex = parseInt(selectedMonth.split('-')[1]) - 1;
    const monthName = MONTHS_AR[monthIndex];
    const message = createPaymentReminderMessage(student.name, monthName, student.monthlyFee);
    sendWhatsAppMessage(student.parentPhone, message);

    // Find payment record to mark as notified
    const payment = payments.find(
      (p) => p.studentId === studentId && p.month === selectedMonth
    );
    if (payment) {
      markAsNotified(payment.id);
    }
    toast.success('تم فتح الواتساب');
  };

  const paidStudents = filteredStudents.filter((s) => isMonthPaid(s.id, selectedMonth));
  const unpaidStudents = filteredStudents.filter((s) => !isMonthPaid(s.id, selectedMonth));
  const totalExpected = filteredStudents.reduce((sum, s) => sum + s.monthlyFee, 0);
  const totalReceived = paidStudents.reduce((sum, s) => sum + s.monthlyFee, 0);

  // Generate month options
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
                    {groups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
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
                          <p className="font-bold">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {GRADE_LABELS[student.grade]} - {student.group}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          {student.monthlyFee} ج
                        </Badge>
                        {isPaid ? (
                          <Badge className="bg-success text-success-foreground">
                            مدفوع
                          </Badge>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handlePayment(student.id, student.monthlyFee)}
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
      </div>
    </Layout>
  );
}
