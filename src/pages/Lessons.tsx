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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGroups } from '@/hooks/useGroups';
import { useStudents } from '@/hooks/useStudents';
import { useLessons } from '@/hooks/useLessons';
import { GRADE_LABELS, Lesson } from '@/types';
import { 
  BookOpen, 
  Plus, 
  Pencil, 
  Trash2, 
  FileText, 
  Mic,
  Users 
} from 'lucide-react';
import { toast } from 'sonner';

export default function Lessons() {
  const { groups } = useGroups();
  const { getStudentsByGroup } = useStudents();
  const {
    lessons,
    addLesson,
    deleteLesson,
    addSheet,
    addRecitation,
    getLessonSheets,
    getLessonRecitations,
  } = useLessons();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isGradesOpen, setIsGradesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('sheet');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    grade: '1' as '1' | '2' | '3',
    group: '',
  });

  const [sheetScores, setSheetScores] = useState<Record<string, { score: number; maxScore: number }>>({});
  const [recitationScores, setRecitationScores] = useState<Record<string, { score: number; maxScore: number }>>({});
  const [defaultMaxScore, setDefaultMaxScore] = useState(10);

  const filteredLessons = filterGroup === 'all'
    ? lessons
    : lessons.filter(l => l.group === filterGroup);

  const resetForm = () => {
    setFormData({
      name: '',
      date: new Date().toISOString().split('T')[0],
      grade: '1',
      group: '',
    });
  };

  const handleAddLesson = () => {
    if (!formData.name || !formData.group) {
      toast.error('برجاء ملء جميع البيانات');
      return;
    }
    addLesson(formData);
    toast.success('تم إضافة الحصة بنجاح');
    resetForm();
    setIsAddOpen(false);
  };

  const handleDeleteLesson = (lesson: Lesson) => {
    if (confirm(`هل أنت متأكد من حذف الحصة "${lesson.name}"؟`)) {
      deleteLesson(lesson.id);
      toast.success('تم حذف الحصة');
    }
  };

  const openGradesDialog = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    
    // Load existing scores
    const sheets = getLessonSheets(lesson.id);
    const recs = getLessonRecitations(lesson.id);
    
    const sheetMap: Record<string, { score: number; maxScore: number }> = {};
    sheets.forEach(s => {
      sheetMap[s.studentId] = { score: s.score, maxScore: s.maxScore };
    });
    setSheetScores(sheetMap);

    const recMap: Record<string, { score: number; maxScore: number }> = {};
    recs.forEach(r => {
      recMap[r.studentId] = { score: r.score, maxScore: r.maxScore };
    });
    setRecitationScores(recMap);

    setIsGradesOpen(true);
  };

  const handleSaveSheetScores = () => {
    if (!selectedLesson) return;
    Object.entries(sheetScores).forEach(([studentId, data]) => {
      if (data.score !== undefined) {
        addSheet(selectedLesson.id, studentId, data.score, data.maxScore || defaultMaxScore);
      }
    });
    toast.success('تم حفظ درجات الشيت');
  };

  const handleSaveRecitationScores = () => {
    if (!selectedLesson) return;
    Object.entries(recitationScores).forEach(([studentId, data]) => {
      if (data.score !== undefined) {
        addRecitation(selectedLesson.id, studentId, data.score, data.maxScore || defaultMaxScore);
      }
    });
    toast.success('تم حفظ درجات التسميع');
  };

  const lessonStudents = selectedLesson
    ? getStudentsByGroup(selectedLesson.group)
    : [];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">الحصص</h1>
            <p className="text-muted-foreground mt-1">
              إدارة الحصص والشيتات والتسميع
            </p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                إضافة حصة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة حصة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">عنوان الحصة</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: الفصل الأول - الدرس 1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">تاريخ الحصة</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    dir="ltr"
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
                  <Select
                    value={formData.group}
                    onValueChange={(value) => setFormData({ ...formData, group: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المجموعة" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.name}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddLesson} className="w-full">
                  إضافة الحصة
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">فلترة حسب المجموعة</label>
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المجموعات</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.name}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lessons List */}
        <div className="grid gap-4">
          {filteredLessons.length > 0 ? (
            filteredLessons.map((lesson) => {
              const sheets = getLessonSheets(lesson.id);
              const recs = getLessonRecitations(lesson.id);
              const students = getStudentsByGroup(lesson.group);

              return (
                <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                          <BookOpen className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{lesson.name}</h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <Badge variant="outline">{GRADE_LABELS[lesson.grade]}</Badge>
                            <Badge variant="secondary">{lesson.group}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(lesson.date).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex gap-2">
                          <Badge className="bg-primary/10 text-primary gap-1">
                            <FileText className="h-3 w-3" />
                            شيت: {sheets.length}/{students.length}
                          </Badge>
                          <Badge className="bg-secondary/10 text-secondary gap-1">
                            <Mic className="h-3 w-3" />
                            تسميع: {recs.length}/{students.length}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => openGradesDialog(lesson)}
                        >
                          <Pencil className="h-4 w-4 ml-2" />
                          إدخال الدرجات
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteLesson(lesson)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  لا يوجد حصص
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  اضغط على "إضافة حصة جديدة" لإضافة أول حصة
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Grades Dialog */}
        <Dialog open={isGradesOpen} onOpenChange={setIsGradesOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                درجات الحصة: {selectedLesson?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">الدرجة النهائية الافتراضية:</label>
                <Input
                  type="number"
                  value={defaultMaxScore}
                  onChange={(e) => setDefaultMaxScore(Number(e.target.value))}
                  className="w-24"
                  dir="ltr"
                />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sheet" className="gap-2">
                    <FileText className="h-4 w-4" />
                    الشيت
                  </TabsTrigger>
                  <TabsTrigger value="recitation" className="gap-2">
                    <Mic className="h-4 w-4" />
                    التسميع
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sheet" className="space-y-4 mt-4">
                  {lessonStudents.length > 0 ? (
                    <>
                      {lessonStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center gap-4 p-3 bg-muted rounded-xl"
                        >
                          <div className="flex-1">
                            <p className="font-bold">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.code}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={sheetScores[student.id]?.score ?? ''}
                              onChange={(e) =>
                                setSheetScores({
                                  ...sheetScores,
                                  [student.id]: {
                                    score: Number(e.target.value),
                                    maxScore: sheetScores[student.id]?.maxScore || defaultMaxScore,
                                  },
                                })
                              }
                              className="w-20 text-center"
                              placeholder="0"
                              min={0}
                              dir="ltr"
                            />
                            <span className="text-muted-foreground">/</span>
                            <Input
                              type="number"
                              value={sheetScores[student.id]?.maxScore ?? defaultMaxScore}
                              onChange={(e) =>
                                setSheetScores({
                                  ...sheetScores,
                                  [student.id]: {
                                    score: sheetScores[student.id]?.score || 0,
                                    maxScore: Number(e.target.value),
                                  },
                                })
                              }
                              className="w-20 text-center"
                              min={1}
                              dir="ltr"
                            />
                          </div>
                        </div>
                      ))}
                      <Button onClick={handleSaveSheetScores} className="w-full">
                        حفظ درجات الشيت
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">لا يوجد طلاب في هذه المجموعة</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="recitation" className="space-y-4 mt-4">
                  {lessonStudents.length > 0 ? (
                    <>
                      {lessonStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center gap-4 p-3 bg-muted rounded-xl"
                        >
                          <div className="flex-1">
                            <p className="font-bold">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.code}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={recitationScores[student.id]?.score ?? ''}
                              onChange={(e) =>
                                setRecitationScores({
                                  ...recitationScores,
                                  [student.id]: {
                                    score: Number(e.target.value),
                                    maxScore: recitationScores[student.id]?.maxScore || defaultMaxScore,
                                  },
                                })
                              }
                              className="w-20 text-center"
                              placeholder="0"
                              min={0}
                              dir="ltr"
                            />
                            <span className="text-muted-foreground">/</span>
                            <Input
                              type="number"
                              value={recitationScores[student.id]?.maxScore ?? defaultMaxScore}
                              onChange={(e) =>
                                setRecitationScores({
                                  ...recitationScores,
                                  [student.id]: {
                                    score: recitationScores[student.id]?.score || 0,
                                    maxScore: Number(e.target.value),
                                  },
                                })
                              }
                              className="w-20 text-center"
                              min={1}
                              dir="ltr"
                            />
                          </div>
                        </div>
                      ))}
                      <Button onClick={handleSaveRecitationScores} className="w-full">
                        حفظ درجات التسميع
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">لا يوجد طلاب في هذه المجموعة</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
