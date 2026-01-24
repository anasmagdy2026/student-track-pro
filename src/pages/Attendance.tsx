import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { GRADE_LABELS } from '@/types';
import {
  sendWhatsAppMessage,
  createAbsenceMessage,
} from '@/utils/whatsapp';
import { Calendar, UserCheck, MessageCircle, Users, Search, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export default function Attendance() {
  const [searchParams] = useSearchParams();
  const { students, getStudentByCode, getAllGroups } = useStudents();
  const { markAttendance, getAttendanceByDate, markAsNotified } = useAttendance();
  const { groups, getTodayGroups } = useGroups();

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>(searchParams.get('group') || 'all');
  const [studentCode, setStudentCode] = useState('');

  const todayGroups = getTodayGroups();
  const allGroups = getAllGroups();
  const todayAttendance = getAttendanceByDate(selectedDate);

  // Auto-select today's group if available
  useEffect(() => {
    if (!searchParams.get('group') && todayGroups.length === 1) {
      setSelectedGroup(todayGroups[0].name);
    }
  }, [todayGroups, searchParams]);

  const filteredStudents = students.filter((student) => {
    const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
    const matchesGroup = selectedGroup === 'all' || student.group === selectedGroup;
    return matchesGrade && matchesGroup;
  });

  const getStudentAttendance = (studentId: string) => {
    return todayAttendance.find((a) => a.studentId === studentId);
  };

  const handleAttendanceChange = (studentId: string, present: boolean) => {
    markAttendance(studentId, selectedDate, present);
    toast.success(present ? 'تم تسجيل الحضور' : 'تم تسجيل الغياب');
  };

  const handleMarkAllPresent = () => {
    filteredStudents.forEach((student) => {
      markAttendance(student.id, selectedDate, true);
    });
    toast.success('تم تسجيل حضور جميع الطلاب');
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim()) return;

    const student = getStudentByCode(studentCode.trim());
    if (student) {
      markAttendance(student.id, selectedDate, true);
      toast.success(`تم تسجيل حضور: ${student.name}`);
      setStudentCode('');
    } else {
      toast.error('كود الطالب غير موجود');
    }
  };

  const handleSendAbsenceMessage = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    const attendance = getStudentAttendance(studentId);
    if (!student || !attendance) return;

    const formattedDate = new Date(selectedDate).toLocaleDateString('ar-EG');
    const message = createAbsenceMessage(student.name, formattedDate);
    sendWhatsAppMessage(student.parentPhone, message);
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
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">الحضور والغياب</h1>
            <p className="text-muted-foreground mt-1">
              تسجيل حضور وغياب الطلاب
            </p>
          </div>
          <Button onClick={handleMarkAllPresent} className="gap-2">
            <UserCheck className="h-5 w-5" />
            تسجيل حضور الكل
          </Button>
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
                        variant={selectedGroup === g.name ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedGroup(g.name)}
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
              <QrCode className="h-5 w-5 text-secondary" />
              تسجيل سريع بالكود
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCodeSubmit} className="flex gap-3">
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
                    {allGroups.map((group) => (
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

                  return (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                        isPresent
                          ? 'bg-success/10 border-success/30'
                          : isAbsent
                          ? 'bg-destructive/10 border-destructive/30'
                          : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`present-${student.id}`}
                            checked={isPresent}
                            onCheckedChange={(checked) =>
                              handleAttendanceChange(student.id, checked === true)
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
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{student.name}</p>
                            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                              {student.code}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {GRADE_LABELS[student.grade]} - {student.group}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isPresent && attendance && (
                          <Button
                            size="sm"
                            variant={attendance.notified ? 'ghost' : 'default'}
                            onClick={() => handleSendAbsenceMessage(student.id)}
                            disabled={attendance.notified}
                            className="gap-1"
                          >
                            <MessageCircle className="h-4 w-4" />
                            {attendance.notified ? 'تم الإرسال' : 'إرسال للولي'}
                          </Button>
                        )}
                        {!attendance && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAttendanceChange(student.id, false)}
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
      </div>
    </Layout>
  );
}
