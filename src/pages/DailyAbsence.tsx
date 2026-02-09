import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useStudents } from '@/hooks/useStudents';
import { useGroups } from '@/hooks/useGroups';
import { useAttendance } from '@/hooks/useAttendance';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { Printer, UserX, ArrowRight, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageLoading } from '@/components/PageLoading';
import { useAppSettings } from '@/hooks/useAppSettings';

export default function DailyAbsence() {
  const [searchParams] = useSearchParams();
  const { students, loading: studentsLoading } = useStudents();
  const { groups, loading: groupsLoading, getTodayGroups, getGroupById } = useGroups();
  const { loading: attendanceLoading, getAttendanceByDate, markAttendance } = useAttendance();
  const { loading: gradesLoading, getGradeLabel } = useGradeLevels();
  const { teacherName, teacherPhone } = useAppSettings();
  const displayFooter = `${teacherName || 'مستر محمد مجدي'} للتواصل ${teacherPhone || '01060744547'}`;

  const isLoading = studentsLoading || groupsLoading || attendanceLoading || gradesLoading;

  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedGroup, setSelectedGroup] = useState<string>(searchParams.get('group') || 'all');
  const [confirmAutoAbsent, setConfirmAutoAbsent] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const todayGroups = getTodayGroups();

  useEffect(() => {
    if (!searchParams.get('group') && todayGroups.length === 1) {
      setSelectedGroup(todayGroups[0].id);
    }
  }, [todayGroups, searchParams]);

  const attendanceForDate = getAttendanceByDate(selectedDate);

  const groupStudents = useMemo(() => {
    if (selectedGroup === 'all') return [];
    return students.filter((s) => s.group_id === selectedGroup);
  }, [students, selectedGroup]);

  const absentRows = useMemo(() => {
    if (selectedGroup === 'all') return [];
    return groupStudents
      .map((s) => {
        const record = attendanceForDate.find((a) => a.student_id === s.id);
        const present = record?.present ?? false;
        const hasAny = !!record;
        const isAbsent = !hasAny || !present;
        return {
          student: s,
          record,
          isAbsent,
          isNotMarked: !hasAny,
        };
      })
      .filter((r) => r.isAbsent);
  }, [attendanceForDate, groupStudents, selectedGroup]);

  const handleAutoMarkAbsent = async () => {
    if (selectedGroup === 'all') {
      toast.error('اختر مجموعة أولاً');
      return;
    }
    const notMarked = absentRows.filter((r) => r.isNotMarked);
    if (notMarked.length === 0) {
      toast.success('كل الطلبة تم تسجيلهم بالفعل');
      return;
    }

    try {
      for (const r of notMarked) {
        // eslint-disable-next-line no-await-in-loop
        await markAttendance(r.student.id, selectedDate, false);
      }
      toast.success(`تم تسجيل غياب ${notMarked.length} طالب/ة تلقائياً`);
    } catch {
      toast.error('حدث خطأ أثناء تسجيل الغياب');
    } finally {
      setConfirmAutoAbsent(false);
    }
  };

  const handlePrint = async () => {
    if (!reportRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>تقرير غياب اليوم</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            body { font-family: 'Cairo', sans-serif; margin: 0; padding: 12mm; }
            img { width: 100%; height: auto; }
            @page { size: A4; margin: 10mm; }
          </style>
        </head>
        <body>
          <img src="${canvas.toDataURL('image/png')}" alt="تقرير غياب اليوم" />
          <script>
            window.onload = function () {
              window.print();
              window.onafterprint = function () { window.close(); };
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch {
      toast.error('تعذر الطباعة');
    }
  };

  const selectedGroupObj = selectedGroup !== 'all' ? getGroupById(selectedGroup) : null;

  return (
    <Layout>
      {isLoading ? (
        <PageLoading title="جاري تحميل تقرير الغياب" description="بنجهّز بيانات اليوم…" />
      ) : (
        <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link to="/attendance">
              <Button variant="ghost" size="icon">
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">غياب اليوم</h1>
              <p className="text-muted-foreground mt-1">عرض الطلبة غير المُحضّرين وطباعة التقرير</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setConfirmAutoAbsent(true)}
              disabled={selectedGroup === 'all'}
            >
              <Wand2 className="h-4 w-4" />
              الطلبة التي لم تقم بالحضور
            </Button>
            <Button variant="default" className="gap-2" onClick={handlePrint} disabled={absentRows.length === 0}>
              <Printer className="h-4 w-4" />
              طباعة تقرير الغياب
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">التاريخ</label>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} dir="ltr" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">المجموعة</label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المجموعة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">اختر مجموعة...</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({g.time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">الملخص</label>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="gap-2">
                    <UserX className="h-4 w-4" />
                    {absentRows.length} غائب
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Printable Report */}
        <div ref={reportRef} className="bg-white p-6 space-y-4" dir="rtl">
          <div className="text-center border-b pb-3">
            <h2 className="text-xl font-bold">تقرير غياب اليوم</h2>
            <p className="text-sm">{new Date(selectedDate).toLocaleDateString('ar-EG')}</p>
            {selectedGroupObj && (
              <p className="text-sm text-muted-foreground">
                  {selectedGroupObj.name} — {getGradeLabel(selectedGroupObj.grade)} — <span dir="ltr">{selectedGroupObj.time}</span>
              </p>
            )}
          </div>

          {selectedGroup === 'all' ? (
            <div className="text-center text-muted-foreground">اختر مجموعة لعرض الغياب</div>
          ) : absentRows.length === 0 ? (
            <div className="text-center text-muted-foreground">لا يوجد غياب مسجل لهذا اليوم</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>ملاحظة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {absentRows.map((r) => (
                    <TableRow key={r.student.id}>
                      <TableCell className="font-mono font-bold">{r.student.code}</TableCell>
                      <TableCell className="font-medium">{r.student.name}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">غائب</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.isNotMarked ? 'لم يتم التحضير' : 'تم تسجيل غياب'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="pt-3 border-t text-xs text-muted-foreground text-center">
            {displayFooter}
          </div>
        </div>

        <ConfirmDialog
          open={confirmAutoAbsent}
          onOpenChange={setConfirmAutoAbsent}
          title="تسجيل الغياب تلقائياً"
          description="سيتم تسجيل غياب كل الطلبة الذين لم يتم تحضيرهم اليوم في هذه المجموعة. هل تريد المتابعة؟"
          confirmText="تسجيل الغياب"
          cancelText="إلغاء"
          onConfirm={handleAutoMarkAbsent}
        />
        </div>
      )}
    </Layout>
  );
}
