import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudents } from '@/hooks/useStudents';
import { useAttendance } from '@/hooks/useAttendance';
import { usePayments } from '@/hooks/usePayments';
import { useExams } from '@/hooks/useExams';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import {
  Users,
  UserCheck,
  UserX,
  CreditCard,
  TrendingUp,
  Calendar,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/PageLoading';

export default function Dashboard() {
  const { students, loading: studentsLoading } = useStudents();
  const { attendance, loading: attendanceLoading, getAbsentStudents } = useAttendance();
  const { loading: paymentsLoading, getPaymentStats } = usePayments();
  const { exams, loading: examsLoading } = useExams();
  const { activeGradeLevels, loading: gradesLoading } = useGradeLevels();

  const isLoading = studentsLoading || attendanceLoading || paymentsLoading || examsLoading || gradesLoading;

  const today = new Date().toISOString().split('T')[0];
  const todayAbsent = getAbsentStudents(today);
  const todayAttendance = attendance.filter(a => a.date === today);
  const presentToday = todayAttendance.filter(a => a.present).length;

  const paymentStats = getPaymentStats();

  const statCards = [
    {
      title: 'إجمالي الطلاب',
      value: students.length,
      icon: Users,
      color: 'bg-primary',
      link: '/students',
    },
    {
      title: 'الحاضرين اليوم',
      value: presentToday,
      icon: UserCheck,
      color: 'bg-success',
      link: '/attendance',
    },
    {
      title: 'الغائبين اليوم',
      value: todayAbsent.length,
      icon: UserX,
      color: 'bg-destructive',
      link: '/attendance',
    },
    {
      title: 'إيرادات الشهر',
      value: `${paymentStats.totalAmount} ج`,
      icon: TrendingUp,
      color: 'bg-secondary',
      link: '/payments',
    },
  ];

  const gradeStats = activeGradeLevels.map((g) => ({
    grade: g.code,
    label: g.label,
    count: students.filter((s) => s.grade === g.code).length,
  }));

  return (
    <Layout>
      {isLoading ? (
        <PageLoading title="جاري تحميل لوحة التحكم" description="بنجهّز الإحصائيات…" />
      ) : (
        <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">
            مرحباً بك في نظام متابعة الطلاب
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link key={index} to={stat.link}>
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {stat.title}
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center`}
                      >
                        <Icon className="h-7 w-7 text-primary-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grade Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                توزيع الطلاب حسب السنة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {gradeStats.map((stat) => (
                <div key={stat.grade} className="flex items-center justify-between">
                  <span className="font-medium">{stat.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{
                          width: `${students.length > 0 ? (stat.count / students.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-lg font-bold text-primary min-w-[2rem] text-left">
                      {stat.count}
                    </span>
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  لا يوجد طلاب بعد
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                إجراءات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Link to="/students">
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span>إضافة طالب</span>
                </Button>
              </Link>
              <Link to="/attendance">
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <UserCheck className="h-6 w-6" />
                  <span>تسجيل الحضور</span>
                </Button>
              </Link>
              <Link to="/payments">
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <CreditCard className="h-6 w-6" />
                  <span>تسجيل دفعة</span>
                </Button>
              </Link>
              <Link to="/exams">
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  <span>إضافة امتحان</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {(todayAbsent.length > 0 || paymentStats.unpaid > 0) && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                تنبيهات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayAbsent.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span>يوجد {todayAbsent.length} طالب غائب اليوم</span>
                  <Link to="/attendance">
                    <Button size="sm" variant="outline">
                      عرض التفاصيل
                    </Button>
                  </Link>
                </div>
              )}
              {paymentStats.unpaid > 0 && (
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span>يوجد {paymentStats.unpaid} طالب لم يدفع هذا الشهر</span>
                  <Link to="/payments">
                    <Button size="sm" variant="outline">
                      عرض التفاصيل
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      )}
    </Layout>
  );
}
