import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { useGroups } from '@/hooks/useGroups';
import { useStudents } from '@/hooks/useStudents';
import { GRADE_LABELS, DAYS_AR, Group } from '@/types';
import { Users, Plus, Pencil, Trash2, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Groups() {
  const { groups, addGroup, updateGroup, deleteGroup, getTodayGroups } = useGroups();
  const { getStudentsByGroup } = useStudents();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [filterDay, setFilterDay] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    grade: '1' as '1' | '2' | '3',
    day: 'السبت',
    time: '10:00',
  });

  const todayGroups = getTodayGroups();
  
  const filteredGroups = filterDay === 'all' 
    ? groups 
    : filterDay === 'today'
    ? todayGroups
    : groups.filter(g => g.day === filterDay);

  const resetForm = () => {
    setFormData({
      name: '',
      grade: '1',
      day: 'السبت',
      time: '10:00',
    });
  };

  const handleAddGroup = () => {
    if (!formData.name) {
      toast.error('برجاء إدخال اسم المجموعة');
      return;
    }
    addGroup(formData);
    toast.success('تم إضافة المجموعة بنجاح');
    resetForm();
    setIsAddOpen(false);
  };

  const handleUpdateGroup = () => {
    if (!editingGroup) return;
    updateGroup(editingGroup.id, formData);
    toast.success('تم تحديث المجموعة');
    setEditingGroup(null);
    resetForm();
  };

  const handleDeleteGroup = (group: Group) => {
    const studentsCount = getStudentsByGroup(group.name).length;
    if (studentsCount > 0) {
      if (!confirm(`هذه المجموعة تحتوي على ${studentsCount} طالب. هل أنت متأكد من الحذف؟`)) {
        return;
      }
    }
    deleteGroup(group.id);
    toast.success('تم حذف المجموعة');
  };

  const openEditDialog = (group: Group) => {
    setFormData({
      name: group.name,
      grade: group.grade,
      day: group.day,
      time: group.time,
    });
    setEditingGroup(group);
  };

  const GroupForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">اسم المجموعة</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="مثال: مجموعة الساعة 10"
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
        <label className="text-sm font-medium">يوم الحصة</label>
        <Select
          value={formData.day}
          onValueChange={(value) => setFormData({ ...formData, day: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAYS_AR.map((day) => (
              <SelectItem key={day} value={day}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">وقت الحصة</label>
        <Input
          type="time"
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          dir="ltr"
        />
      </div>

      <Button
        onClick={isEdit ? handleUpdateGroup : handleAddGroup}
        className="w-full"
      >
        {isEdit ? 'حفظ التعديلات' : 'إضافة المجموعة'}
      </Button>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">المجموعات</h1>
            <p className="text-muted-foreground mt-1">
              إدارة المجموعات وجدول الحصص
            </p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                إضافة مجموعة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة مجموعة جديدة</DialogTitle>
              </DialogHeader>
              <GroupForm />
            </DialogContent>
          </Dialog>
        </div>

        {/* Today's Groups Alert */}
        {todayGroups.length > 0 && (
          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-bold text-primary">مجموعات اليوم</p>
                  <p className="text-sm text-muted-foreground">
                    {todayGroups.map(g => `${g.name} (${g.time})`).join(' - ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">فلترة حسب اليوم</label>
                <Select value={filterDay} onValueChange={setFilterDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأيام</SelectItem>
                    <SelectItem value="today">مجموعات اليوم</SelectItem>
                    {DAYS_AR.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Groups List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => {
              const studentsCount = getStudentsByGroup(group.name).length;
              const isToday = todayGroups.some(g => g.id === group.id);

              return (
                <Card 
                  key={group.id} 
                  className={`hover:shadow-md transition-shadow ${isToday ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{group.name}</h3>
                          <Badge variant="outline">{GRADE_LABELS[group.grade]}</Badge>
                        </div>
                      </div>
                      {isToday && (
                        <Badge className="bg-primary">اليوم</Badge>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{group.day}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{group.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{studentsCount} طالب</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`/attendance?group=${encodeURIComponent(group.name)}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          تسجيل الحضور
                        </Button>
                      </Link>
                      <Dialog
                        open={editingGroup?.id === group.id}
                        onOpenChange={(open) => !open && setEditingGroup(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(group)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>تعديل المجموعة</DialogTitle>
                          </DialogHeader>
                          <GroupForm isEdit />
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteGroup(group)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  لا يوجد مجموعات
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  اضغط على "إضافة مجموعة جديدة" لإضافة أول مجموعة
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
