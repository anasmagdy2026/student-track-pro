import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useGroups } from '@/hooks/useGroups';
import { useStudents } from '@/hooks/useStudents';
import { GroupForm } from '@/components/forms/GroupForm';
import { DAYS_AR, Group } from '@/types';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { Users, Plus, Pencil, Trash2, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Groups() {
  const { groups, addGroup, updateGroup, deleteGroup, getTodayGroups } = useGroups();
  const { getStudentsByGroup } = useStudents();
  const { getGradeLabel } = useGradeLevels();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [filterDay, setFilterDay] = useState<string>('all');

  const todayGroups = getTodayGroups();
  
  const filteredGroups = filterDay === 'all' 
    ? groups 
    : filterDay === 'today'
    ? todayGroups
    : groups.filter(g => g.days.includes(filterDay));

  const handleAddGroup = async (data: {
    name: string;
    grade: string;
    days: string[];
    time: string;
  }) => {
    if (!data.name) {
      toast.error('برجاء إدخال اسم المجموعة');
      return;
    }
    try {
      await addGroup(data);
      toast.success('تم إضافة المجموعة بنجاح');
      setIsAddOpen(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة المجموعة');
    }
  };

  const handleUpdateGroup = async (data: {
    name: string;
    grade: string;
    days: string[];
    time: string;
  }) => {
    if (!editingGroup) return;
    try {
      await updateGroup(editingGroup.id, data);
      toast.success('تم تحديث المجموعة');
      setEditingGroup(null);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث المجموعة');
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    const studentsCount = getStudentsByGroup(group.id).length;
    if (studentsCount > 0) {
      if (!confirm(`هذه المجموعة تحتوي على ${studentsCount} طالب. هل أنت متأكد من الحذف؟`)) {
        return;
      }
    }
    try {
      await deleteGroup(group.id);
      toast.success('تم حذف المجموعة');
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف المجموعة');
    }
  };

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
                <DialogDescription>أدخل بيانات المجموعة الجديدة</DialogDescription>
              </DialogHeader>
              <GroupForm onSubmit={handleAddGroup} />
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
              const studentsCount = getStudentsByGroup(group.id).length;
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
                          <Badge variant="outline">{getGradeLabel(group.grade)}</Badge>
                        </div>
                      </div>
                      {isToday && (
                        <Badge className="bg-primary">اليوم</Badge>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{group.days.join(' - ')}</span>
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
                      <Link to={`/attendance?group=${encodeURIComponent(group.id)}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          تسجيل الحضور
                        </Button>
                      </Link>
                      <Dialog
                        open={editingGroup?.id === group.id}
                        onOpenChange={(open) => {
                          if (!open) setEditingGroup(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingGroup(group)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>تعديل المجموعة</DialogTitle>
                            <DialogDescription>قم بتعديل بيانات المجموعة</DialogDescription>
                          </DialogHeader>
                          {editingGroup && (
                            <GroupForm
                              initialData={{
                                name: editingGroup.name,
                                grade: editingGroup.grade,
                                days: editingGroup.days,
                                time: editingGroup.time,
                              }}
                              onSubmit={handleUpdateGroup}
                              isEdit
                            />
                          )}
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
