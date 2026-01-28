import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudents } from '@/hooks/useStudents';
import { useGroups } from '@/hooks/useGroups';
import { GRADE_LABELS } from '@/types';
import { GraduationCap, Users, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AcademicYears() {
  const { students } = useStudents();
  const { groups } = useGroups();

  const grades = ['1', '2', '3'] as const;

  const getStats = (grade: '1' | '2' | '3') => {
    const gradeStudents = students.filter(s => s.grade === grade);
    const gradeGroups = groups.filter(g => g.grade === grade);
    return {
      studentsCount: gradeStudents.length,
      groupsCount: gradeGroups.length,
      groups: gradeGroups,
    };
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            السنوات الدراسية
          </h1>
          <p className="text-muted-foreground mt-1">
            عرض تفاصيل كل سنة دراسية
          </p>
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
                        <h2 className="text-2xl font-bold">{GRADE_LABELS[grade]}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          العام الدراسي 2024/2025
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
    </Layout>
  );
}
