import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Student, Group } from '@/types';
import { useAttendance } from '@/hooks/useAttendance';
import { usePayments } from '@/hooks/usePayments';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { useStudentBlocks } from '@/hooks/useStudentBlocks';
import { User, Phone, Calendar, CheckCircle, XCircle, CreditCard, ExternalLink, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';

interface StudentProfileDialogProps {
  student: Student | null;
  group?: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentProfileDialog({ student, group, open, onOpenChange }: StudentProfileDialogProps) {
  const { getAttendanceStats } = useAttendance();
  const { getStudentPayments } = usePayments();
  const { getGradeLabel } = useGradeLevels();
  const { isBlocked, getActiveBlock } = useStudentBlocks();

  const stats = useMemo(() => {
    if (!student) return { present: 0, absent: 0, total: 0 };
    return getAttendanceStats(student.id);
  }, [student, getAttendanceStats]);

  const payments = useMemo(() => {
    if (!student) return [];
    return getStudentPayments(student.id);
  }, [student, getStudentPayments]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const isCurrentMonthPaid = payments.some(p => p.month === currentMonth && p.paid);
  const blocked = student ? isBlocked(student.id) : false;
  const activeBlock = student ? getActiveBlock(student.id) : null;

  if (!student) return null;

  const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            بروفايل الطالب
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <User className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">{student.name}</h3>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary">{student.code}</Badge>
              <Badge variant="outline">{getGradeLabel(student.grade)}</Badge>
              {group && <Badge>{group.name}</Badge>}
            </div>
            {blocked && (
              <div className="flex items-center justify-center gap-1 text-destructive">
                <ShieldAlert className="h-4 w-4" />
                <span className="text-sm font-bold">مطرود: {activeBlock?.reason || 'بدون سبب'}</span>
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">ولي الأمر:</span>
              <span className="font-mono" dir="ltr">{student.parent_phone}</span>
            </div>
            {student.student_phone && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">الطالب:</span>
                <span className="font-mono" dir="ltr">{student.student_phone}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 rounded-xl bg-success/10">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <p className="text-lg font-bold text-success">{stats.present}</p>
              <p className="text-xs text-muted-foreground">حاضر</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-destructive/10">
              <div className="flex items-center justify-center gap-1 mb-1">
                <XCircle className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-lg font-bold text-destructive">{stats.absent}</p>
              <p className="text-xs text-muted-foreground">غائب</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-primary/10">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <p className="text-lg font-bold text-primary">{attendanceRate}%</p>
              <p className="text-xs text-muted-foreground">نسبة الحضور</p>
            </div>
          </div>

          {/* Payment Status */}
          <div className={`flex items-center gap-2 p-3 rounded-xl ${isCurrentMonthPaid ? 'bg-success/10' : 'bg-warning/10'}`}>
            <CreditCard className={`h-5 w-5 ${isCurrentMonthPaid ? 'text-success' : 'text-warning'}`} />
            <span className="font-medium">
              {isCurrentMonthPaid ? 'الشهر الحالي مدفوع ✓' : 'الشهر الحالي غير مدفوع'}
            </span>
            {student.monthly_fee > 0 && (
              <span className="mr-auto text-sm text-muted-foreground">{student.monthly_fee} ج.م</span>
            )}
          </div>

          {/* Full Profile Link */}
          <Link to={`/students/${student.id}`} onClick={() => onOpenChange(false)}>
            <Button variant="outline" className="w-full gap-2">
              <ExternalLink className="h-4 w-4" />
              عرض البروفايل الكامل
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
