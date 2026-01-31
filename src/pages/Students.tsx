import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useStudents } from '@/hooks/useStudents';
import { useGroups } from '@/hooks/useGroups';
import { StudentForm } from '@/components/forms/StudentForm';
import { StudentCard } from '@/components/StudentCard';
import { Student } from '@/types';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { Plus, Search, Eye, Pencil, Trash2, Users, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { PageLoading } from '@/components/PageLoading';

export default function Students() {
  const { students, loading: studentsLoading, addStudent, updateStudent, deleteStudent } = useStudents();
  const { groups, loading: groupsLoading, getGroupsByGrade, getGroupById } = useGroups();
  const { activeGradeLevels, loading: gradesLoading, getGradeLabel } = useGradeLevels();

  const isLoading = studentsLoading || groupsLoading || gradesLoading;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterGroupTime, setFilterGroupTime] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [cardStudent, setCardStudent] = useState<Student | null>(null);

  const availableTimes = Array.from(
    new Set(groups.map((g) => g.time).filter(Boolean))
  ).sort();

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.includes(searchTerm) ||
      student.code.includes(searchTerm);
    const matchesGrade = filterGrade === 'all' || student.grade === filterGrade;
    const matchesGroup = filterGroup === 'all' || student.group_id === filterGroup;
    const group = student.group_id ? getGroupById(student.group_id) : null;
    const matchesTime = filterGroupTime === 'all' || group?.time === filterGroupTime;
    return matchesSearch && matchesGrade && matchesGroup && matchesTime;
  });

  const handleAddStudent = async (data: {
    name: string;
    grade: string;
    group_id: string;
    parent_phone: string;
    student_phone?: string;
    monthly_fee: number;
  }) => {
    if (!data.name || !data.group_id || !data.parent_phone) {
      toast.error('برجاء ملء جميع البيانات المطلوبة');
      return;
    }
    try {
      await addStudent(data);
      toast.success('تم إضافة الطالب بنجاح');
      setIsAddOpen(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة الطالب');
    }
  };

  const handleUpdateStudent = async (data: {
    name: string;
    grade: string;
    group_id: string;
    parent_phone: string;
    student_phone?: string;
    monthly_fee: number;
  }) => {
    if (!editingStudent) return;
    try {
      await updateStudent(editingStudent.id, data);
      toast.success('تم تحديث بيانات الطالب');
      setEditingStudent(null);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث بيانات الطالب');
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (confirm(`هل أنت متأكد من حذف الطالب ${student.name}؟`)) {
      try {
        await deleteStudent(student.id);
        toast.success('تم حذف الطالب');
      } catch (error) {
        toast.error('حدث خطأ أثناء حذف الطالب');
      }
    }
  };

  return (
    <Layout>
      {isLoading ? (
        <PageLoading title="جاري تحميل الطلاب" description="بنجهّز القوائم والفلاتر…" />
      ) : (
        <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">الطلاب</h1>
            <p className="text-muted-foreground mt-1">
              إجمالي {students.length} طالب
            </p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                إضافة طالب جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة طالب جديد</DialogTitle>
                <DialogDescription>أدخل بيانات الطالب الجديد</DialogDescription>
              </DialogHeader>
              <StudentForm
                groups={groups}
                getGroupsByGrade={getGroupsByGrade}
                onSubmit={handleAddStudent}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="البحث بالاسم أو الكود..."
                  className="pr-10"
                />
              </div>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="السنة" />
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
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="المجموعة" />
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

              <Select value={filterGroupTime} onValueChange={setFilterGroupTime}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="ميعاد المجموعة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المواعيد</SelectItem>
                  {availableTimes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardContent className="p-0">
            {filteredStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الكود</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>السنة</TableHead>
                      <TableHead>المجموعة</TableHead>
                      <TableHead>ميعاد المجموعة</TableHead>
                      <TableHead>الرسوم</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const group = student.group_id ? getGroupById(student.group_id) : null;
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-mono font-bold text-primary">
                            {student.code}
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.name}
                          </TableCell>
                          <TableCell>{getGradeLabel(student.grade)}</TableCell>
                          <TableCell>{group?.name || '-'}</TableCell>
                          <TableCell dir="ltr">{group?.time || '-'}</TableCell>
                          <TableCell>{student.monthly_fee} ج</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Link to={`/student/${student.id}`}>
                                <Button size="icon" variant="ghost">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setCardStudent(student)}
                                  >
                                    <QrCode className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>بطاقة الطالب</DialogTitle>
                                  </DialogHeader>
                                  <div className="flex justify-center">
                                    <StudentCard student={student} group={group} />
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Dialog
                                open={editingStudent?.id === student.id}
                                onOpenChange={(open) => {
                                  if (!open) setEditingStudent(null);
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setEditingStudent(student)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>تعديل بيانات الطالب</DialogTitle>
                                    <DialogDescription>قم بتعديل بيانات الطالب</DialogDescription>
                                  </DialogHeader>
                                  {editingStudent && (
                                    <StudentForm
                                      initialData={{
                                        name: editingStudent.name,
                                        grade: editingStudent.grade,
                                        group_id: editingStudent.group_id || '',
                                        parent_phone: editingStudent.parent_phone,
                                        student_phone: editingStudent.student_phone || '',
                                        monthly_fee: editingStudent.monthly_fee,
                                      }}
                                      groups={groups}
                                      getGroupsByGrade={getGroupsByGrade}
                                      onSubmit={handleUpdateStudent}
                                      isEdit
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteStudent(student)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  لا يوجد طلاب
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  اضغط على "إضافة طالب جديد" لإضافة أول طالب
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      )}
    </Layout>
  );
}
