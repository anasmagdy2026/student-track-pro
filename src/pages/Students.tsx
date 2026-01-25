import { useState, useEffect } from 'react';
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
import { GRADE_LABELS, Student } from '@/types';
import { Plus, Search, Eye, Pencil, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Students() {
  const { students, addStudent, updateStudent, deleteStudent } = useStudents();
  const { groups, getGroupsByGrade, getGroupById } = useGroups();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form state - مفصولة لتجنب مشكلة الكتابة
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState<'1' | '2' | '3'>('1');
  const [formGroupId, setFormGroupId] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formMonthlyFee, setFormMonthlyFee] = useState(0);

  // المجموعات المفلترة حسب السنة الدراسية
  const availableGroups = getGroupsByGrade(formGrade);

  // إعادة تعيين المجموعة عند تغيير السنة الدراسية
  useEffect(() => {
    setFormGroupId('');
  }, [formGrade]);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.includes(searchTerm) ||
      student.code.includes(searchTerm);
    const matchesGrade = filterGrade === 'all' || student.grade === filterGrade;
    const matchesGroup = filterGroup === 'all' || student.group_id === filterGroup;
    return matchesSearch && matchesGrade && matchesGroup;
  });

  const resetForm = () => {
    setFormName('');
    setFormGrade('1');
    setFormGroupId('');
    setFormParentPhone('');
    setFormMonthlyFee(0);
  };

  const handleAddStudent = async () => {
    if (!formName || !formGroupId || !formParentPhone) {
      toast.error('برجاء ملء جميع البيانات المطلوبة');
      return;
    }
    try {
      await addStudent({
        name: formName,
        grade: formGrade,
        group_id: formGroupId,
        parent_phone: formParentPhone,
        monthly_fee: formMonthlyFee,
      });
      toast.success('تم إضافة الطالب بنجاح');
      resetForm();
      setIsAddOpen(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة الطالب');
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;
    try {
      await updateStudent(editingStudent.id, {
        name: formName,
        grade: formGrade,
        group_id: formGroupId,
        parent_phone: formParentPhone,
        monthly_fee: formMonthlyFee,
      });
      toast.success('تم تحديث بيانات الطالب');
      setEditingStudent(null);
      resetForm();
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

  const openEditDialog = (student: Student) => {
    setFormName(student.name);
    setFormGrade(student.grade);
    setFormGroupId(student.group_id || '');
    setFormParentPhone(student.parent_phone);
    setFormMonthlyFee(student.monthly_fee);
    setEditingStudent(student);
  };

  const StudentForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">اسم الطالب</label>
        <Input
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="أدخل اسم الطالب"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">السنة الدراسية</label>
        <Select
          value={formGrade}
          onValueChange={(value: '1' | '2' | '3') => setFormGrade(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">أولى ثانوي</SelectItem>
            <SelectItem value="2">تانية ثانوي</SelectItem>
            <SelectItem value="3">تالتة ثانوي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">المجموعة</label>
        <Select
          value={formGroupId}
          onValueChange={setFormGroupId}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر المجموعة" />
          </SelectTrigger>
          <SelectContent>
            {availableGroups.length > 0 ? (
              availableGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name} ({group.time}) - {group.days.join(' / ')}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>
                لا توجد مجموعات لهذه السنة الدراسية
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {availableGroups.length === 0 && (
          <p className="text-xs text-muted-foreground">
            قم بإنشاء مجموعة لهذه السنة الدراسية أولاً
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">رقم واتساب ولي الأمر</label>
        <Input
          value={formParentPhone}
          onChange={(e) => setFormParentPhone(e.target.value)}
          placeholder="01xxxxxxxxx"
          dir="ltr"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">قيمة الدرس الشهرية (جنيه)</label>
        <Input
          type="number"
          value={formMonthlyFee || ''}
          onChange={(e) => setFormMonthlyFee(Number(e.target.value))}
          placeholder="0"
          dir="ltr"
        />
      </div>

      <Button
        onClick={isEdit ? handleUpdateStudent : handleAddStudent}
        className="w-full"
        disabled={availableGroups.length === 0 && !isEdit}
      >
        {isEdit ? 'حفظ التعديلات' : 'إضافة الطالب'}
      </Button>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">الطلاب</h1>
            <p className="text-muted-foreground mt-1">
              إجمالي {students.length} طالب
            </p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) resetForm();
          }}>
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
              <StudentForm />
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
                  <SelectItem value="1">أولى ثانوي</SelectItem>
                  <SelectItem value="2">تانية ثانوي</SelectItem>
                  <SelectItem value="3">تالتة ثانوي</SelectItem>
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
                          <TableCell>{GRADE_LABELS[student.grade]}</TableCell>
                          <TableCell>{group?.name || '-'}</TableCell>
                          <TableCell>{student.monthly_fee} ج</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Link to={`/student/${student.id}`}>
                                <Button size="icon" variant="ghost">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Dialog
                                open={editingStudent?.id === student.id}
                                onOpenChange={(open) => {
                                  if (!open) {
                                    setEditingStudent(null);
                                    resetForm();
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => openEditDialog(student)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>تعديل بيانات الطالب</DialogTitle>
                                    <DialogDescription>قم بتعديل بيانات الطالب</DialogDescription>
                                  </DialogHeader>
                                  <StudentForm isEdit />
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
    </Layout>
  );
}
