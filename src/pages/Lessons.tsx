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
  const { groups, getGroupById } = useGroups();
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

  // Form state - مفصولة لتجنب مشكلة الكتابة
  const [lessonName, setLessonName] = useState('');
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);
  const [lessonGrade, setLessonGrade] = useState<'1' | '2' | '3'>('1');
  const [lessonGroupId, setLessonGroupId] = useState('');
  const [selectAllGroups, setSelectAllGroups] = useState(false);
  const [sheetMaxScore, setSheetMaxScore] = useState(10);
  const [recitationMaxScore, setRecitationMaxScore] = useState(10);

  const [sheetScores, setSheetScores] = useState<Record<string, number>>({});
  const [recitationScores, setRecitationScores] = useState<Record<string, number>>({});

  const filteredLessons = filterGroup === 'all'
    ? lessons
    : lessons.filter(l => l.group_id === filterGroup);

  const filteredGroupsByGrade = groups.filter(g => g.grade === lessonGrade);

  const resetForm = () => {
    setLessonName('');
    setLessonDate(new Date().toISOString().split('T')[0]);
    setLessonGrade('1');
    setLessonGroupId('');
    setSelectAllGroups(false);
    setSheetMaxScore(10);
    setRecitationMaxScore(10);
  };

  const handleAddLesson = async () => {
    if (!lessonName) {
      toast.error('برجاء إدخال عنوان الحصة');
      return;
    }

    if (!selectAllGroups && !lessonGroupId) {
      toast.error('برجاء اختيار المجموعة أو تحديد جميع المجموعات');
      return;
    }

    try {
      if (selectAllGroups) {
        // Create lesson for all groups in the selected grade
        const gradeGroups = filteredGroupsByGrade;
        if (gradeGroups.length === 0) {
          toast.error('لا توجد مجموعات لهذه السنة الدراسية');
          return;
        }
        
        for (const group of gradeGroups) {
          await addLesson({
            name: lessonName,
            date: lessonDate,
            grade: lessonGrade,
            group_id: group.id,
            sheet_max_score: sheetMaxScore,
            recitation_max_score: recitationMaxScore,
          });
        }
        toast.success(`تم إضافة الحصة لـ ${gradeGroups.length} مجموعة`);
      } else {
        await addLesson({
          name: lessonName,
          date: lessonDate,
          grade: lessonGrade,
          group_id: lessonGroupId,
          sheet_max_score: sheetMaxScore,
          recitation_max_score: recitationMaxScore,
        });
        toast.success('تم إضافة الحصة بنجاح');
      }
      resetForm();
      setIsAddOpen(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة الحصة');
    }
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    if (confirm(`هل أنت متأكد من حذف الحصة "${lesson.name}"؟`)) {
      try {
        await deleteLesson(lesson.id);
        toast.success('تم حذف الحصة');
      } catch (error) {
        toast.error('حدث خطأ أثناء حذف الحصة');
      }
    }
  };

  const openGradesDialog = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    
    // Load existing scores
    const sheets = getLessonSheets(lesson.id);
    const recs = getLessonRecitations(lesson.id);
    
    const sheetMap: Record<string, number> = {};
    sheets.forEach(s => {
      sheetMap[s.student_id] = s.score;
    });
    setSheetScores(sheetMap);

    const recMap: Record<string, number> = {};
    recs.forEach(r => {
      recMap[r.student_id] = r.score;
    });
    setRecitationScores(recMap);

    setIsGradesOpen(true);
  };

  const handleSaveSheetScores = async () => {
    if (!selectedLesson) return;
    try {
      for (const [studentId, score] of Object.entries(sheetScores)) {
        if (score !== undefined && !isNaN(score)) {
          await addSheet(selectedLesson.id, studentId, score);
        }
      }
      toast.success('تم حفظ درجات الشيت');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الدرجات');
    }
  };

  const handleSaveRecitationScores = async () => {
    if (!selectedLesson) return;
    try {
      for (const [studentId, score] of Object.entries(recitationScores)) {
        if (score !== undefined && !isNaN(score)) {
          await addRecitation(selectedLesson.id, studentId, score);
        }
      }
      toast.success('تم حفظ درجات التسميع');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الدرجات');
    }
  };

  const lessonGroup = selectedLesson ? getGroupById(selectedLesson.group_id || '') : null;
  const lessonStudents = selectedLesson && selectedLesson.group_id
    ? getStudentsByGroup(selectedLesson.group_id)
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
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) resetForm();
          }}>
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
                    value={lessonName}
                    onChange={(e) => setLessonName(e.target.value)}
                    placeholder="مثال: الفصل الأول - الدرس 1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">تاريخ الحصة</label>
                  <Input
                    type="date"
                    value={lessonDate}
                    onChange={(e) => setLessonDate(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">درجة الشيت النهائية</label>
                    <Input
                      type="number"
                      value={sheetMaxScore}
                      onChange={(e) => setSheetMaxScore(Number(e.target.value))}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">درجة التسميع النهائية</label>
                    <Input
                      type="number"
                      value={recitationMaxScore}
                      onChange={(e) => setRecitationMaxScore(Number(e.target.value))}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">السنة الدراسية</label>
                  <Select
                    value={lessonGrade}
                    onValueChange={(value: '1' | '2' | '3') => {
                      setLessonGrade(value);
                      setLessonGroupId('');
                    }}
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
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="selectAllGroups"
                      checked={selectAllGroups}
                      onChange={(e) => {
                        setSelectAllGroups(e.target.checked);
                        if (e.target.checked) {
                          setLessonGroupId('');
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="selectAllGroups" className="text-sm font-medium cursor-pointer">
                      جميع مجموعات {GRADE_LABELS[lessonGrade]} ({filteredGroupsByGrade.length} مجموعة)
                    </label>
                  </div>
                  
                  {!selectAllGroups && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">المجموعة</label>
                      <Select
                        value={lessonGroupId}
                        onValueChange={(value) => setLessonGroupId(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المجموعة" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredGroupsByGrade.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name} ({group.days.join(' - ')}) - {group.time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
                      <SelectItem key={group.id} value={group.id}>
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
              const group = getGroupById(lesson.group_id || '');
              const students = group ? getStudentsByGroup(group.id) : [];

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
                            <Badge variant="secondary">{group?.name || '-'}</Badge>
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
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>درجة الشيت: {selectedLesson?.sheet_max_score}</span>
                <span>درجة التسميع: {selectedLesson?.recitation_max_score}</span>
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
                              value={sheetScores[student.id] ?? ''}
                              onChange={(e) =>
                                setSheetScores({
                                  ...sheetScores,
                                  [student.id]: Number(e.target.value),
                                })
                              }
                              className="w-20 text-center"
                              placeholder="0"
                              min={0}
                              max={selectedLesson?.sheet_max_score}
                              dir="ltr"
                            />
                            <span className="text-muted-foreground">
                              / {selectedLesson?.sheet_max_score}
                            </span>
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
                              value={recitationScores[student.id] ?? ''}
                              onChange={(e) =>
                                setRecitationScores({
                                  ...recitationScores,
                                  [student.id]: Number(e.target.value),
                                })
                              }
                              className="w-20 text-center"
                              placeholder="0"
                              min={0}
                              max={selectedLesson?.recitation_max_score}
                              dir="ltr"
                            />
                            <span className="text-muted-foreground">
                              / {selectedLesson?.recitation_max_score}
                            </span>
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