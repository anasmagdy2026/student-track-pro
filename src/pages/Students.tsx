import { useState } from 'react';
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
import { GRADE_LABELS, Student } from '@/types';
import { Plus, Search, Eye, Pencil, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Students() {
  const {
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    getAllGroups,
  } = useStudents();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    grade: '1' as '1' | '2' | '3',
    group: '',
    parentPhone: '',
    monthlyFee: 0,
  });

  const groups = getAllGroups();

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.includes(searchTerm) ||
      student.code.includes(searchTerm);
    const matchesGrade = filterGrade === 'all' || student.grade === filterGrade;
    const matchesGroup = filterGroup === 'all' || student.group === filterGroup;
    return matchesSearch && matchesGrade && matchesGroup;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      grade: '1',
      group: '',
      parentPhone: '',
      monthlyFee: 0,
    });
  };

  const handleAddStudent = () => {
    if (!formData.name || !formData.group || !formData.parentPhone) {
      toast.error('برجاء ملء جميع البيانات المطلوبة');
      return;
    }
    addStudent(formData);
    toast.success('تم إضافة الطالب بنجاح');
    resetForm();
    setIsAddOpen(false);
  };

  const handleUpdateStudent = () => {
    if (!editingStudent) return;
    updateStudent(editingStudent.id, formData);
    toast.success('تم تحديث بيانات الطالب');
    setEditingStudent(null);
    resetForm();
  };

  const handleDeleteStudent = (student: Student) => {
    if (confirm(`هل أنت متأكد من حذف الطالب ${student.name}؟`)) {
      deleteStudent(student.id);
      toast.success('تم حذف الطالب');
    }
  };

  const openEditDialog = (student: Student) => {
    setFormData({
      name: student.name,
      grade: student.grade,
      group: student.group,
      parentPhone: student.parentPhone,
      monthlyFee: student.monthlyFee,
    });
    setEditingStudent(student);
  };

  const StudentForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">اسم الطالب</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="أدخل اسم الطالب"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">السنة الدراسية</label>
        <Select
          value={formData.grade}
          onValueChange={(value: '1' | '2' | '3') =>
            setFormData({ ...formData, grade: value })
          }
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
        <Input
          value={formData.group}
          onChange={(e) => setFormData({ ...formData, group: e.target.value })}
          placeholder="مثال: المجموعة أ"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">رقم واتساب ولي الأمر</label>
        <Input
          value={formData.parentPhone}
          onChange={(e) =>
            setFormData({ ...formData, parentPhone: e.target.value })
          }
          placeholder="01xxxxxxxxx"
          dir="ltr"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">قيمة الدرس الشهرية (جنيه)</label>
        <Input
          type="number"
          value={formData.monthlyFee || ''}
          onChange={(e) =>
            setFormData({ ...formData, monthlyFee: Number(e.target.value) })
          }
          placeholder="0"
          dir="ltr"
        />
      </div>

      <Button
        onClick={isEdit ? handleUpdateStudent : handleAddStudent}
        className="w-full"
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
                    <SelectItem key={group} value={group}>
                      {group}
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
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-mono font-bold text-primary">
                          {student.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell>{GRADE_LABELS[student.grade]}</TableCell>
                        <TableCell>{student.group}</TableCell>
                        <TableCell>{student.monthlyFee} ج</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link to={`/student/${student.id}`}>
                              <Button size="icon" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Dialog
                              open={editingStudent?.id === student.id}
                              onOpenChange={(open) =>
                                !open && setEditingStudent(null)
                              }
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
                    ))}
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
