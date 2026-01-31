import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useStudents } from '@/hooks/useStudents';
import { useGroups } from '@/hooks/useGroups';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { GraduationCap, Users, UsersRound, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLoading } from '@/components/PageLoading';

export default function AcademicYears() {
  const { students, loading: studentsLoading } = useStudents();
  const { groups, loading: groupsLoading } = useGroups();
  const { activeGradeLevels, loading: gradesLoading, getGradeLabel } = useGradeLevels();

  const isLoading = studentsLoading || groupsLoading || gradesLoading;

  const [academicYearLabel, setAcademicYearLabel] = useLocalStorage<string>('academic_year_label', '2024/2025');
  const [draftAcademicYearLabel, setDraftAcademicYearLabel] = useState<string>(academicYearLabel);

  const grades = activeGradeLevels.map((g) => g.code);

  const getStats = (grade: string) => {
    const gradeStudents = students.filter((s) => s.grade === grade);
    const gradeGroups = groups.filter((g) => g.grade === grade);
    return {
      studentsCount: gradeStudents.length,
      groupsCount: gradeGroups.length,
      groups: gradeGroups,
    };
  };

  return (
    <Layout>
      {isLoading ? (
        <PageLoading title="جاري تحميل السنوات الدراسية" description="بنجهّز الإحصائيات…" />
      ) : (
        <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              السنوات الدراسية
            </h1>
            <p className="text-muted-foreground mt-1">عرض تفاصيل كل سنة دراسية</p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setDraftAcademicYearLabel(academicYearLabel)}
              >
                <Pencil className="h-4 w-4" />
                إضافة / تعديل العام الدراسي
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>تعديل العام الدراسي</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <label className="text-sm font-medium">العام الدراسي</label>
                <Input
                  value={draftAcademicYearLabel}
                  onChange={(e) => setDraftAcademicYearLabel(e.target.value)}
                  placeholder="مثال: 2025/2026"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">سيظهر هذا النص داخل كل بطاقات السنوات.</p>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="default"
                  onClick={() => {
                    const v = draftAcademicYearLabel.trim() || '2024/2025';
                    setAcademicYearLabel(v);
                  }}
                >
                  حفظ
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Academic Years Grid */}
        <div className="grid gap-6">
          {grades.map((grade) => {
            const stats = getStats(grade);
            
            return (
              <Card key={grade} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <GraduationCap className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{getGradeLabel(grade)}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          العام الدراسي {academicYearLabel}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Badge variant="secondary" className="text-lg px-4 py-2 gap-2">
                        <Users className="h-4 w-4" />
                        {stats.studentsCount} طالب
                      </Badge>
                      <Badge variant="outline" className="text-lg px-4 py-2 gap-2">
                        <UsersRound className="h-4 w-4" />
                        {stats.groupsCount} مجموعة
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.groups.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stats.groups.map((group) => {
                        const groupStudents = students.filter(s => s.group_id === group.id);
                        
                        return (
                          <Link
                            key={group.id}
                            to={`/groups?highlight=${group.id}`}
                            className="block"
                          >
                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-bold">{group.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {group.days.join(' - ')}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {group.time}
                                    </p>
                                  </div>
                                  <Badge>{groupStudents.length} طالب</Badge>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-muted/30 rounded-xl">
                      <UsersRound className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">لا توجد مجموعات لهذه السنة</p>
                      <Link to="/groups" className="text-primary hover:underline text-sm mt-2 inline-block">
                        إضافة مجموعة جديدة
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        </div>
      )}
    </Layout>
  );
}
