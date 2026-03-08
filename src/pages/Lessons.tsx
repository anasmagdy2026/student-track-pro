import { useState, useMemo } from 'react';
import { formatTime12 } from '@/lib/utils';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useGroups } from '@/hooks/useGroups';
import { useStudents } from '@/hooks/useStudents';
import { useLessons } from '@/hooks/useLessons';
import { useStudentBlocks } from '@/hooks/useStudentBlocks';
import { useNextSessionReminders } from '@/hooks/useNextSessionReminders';
import { NextSessionReminderCard } from '@/components/NextSessionReminderCard';
import { Lesson } from '@/types';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { 
  BookOpen, 
  Plus, 
  Pencil, 
  Trash2, 
  FileText, 
  Mic,
  Users,
  Search,
  Loader2,
  ClipboardList,
  ChevronDown,
  Calendar,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageLoading } from '@/components/PageLoading';

export default function Lessons() {
  const { groups, loading: groupsLoading, getGroupById } = useGroups();
  const { loading: studentsLoading, getStudentsByGroup } = useStudents();
  const {
    lessons,
    loading: lessonsLoading,
    addLesson,
    updateLesson,
    deleteLesson,
    addSheet,
    addRecitation,
    getLessonSheets,
    getLessonRecitations,
  } = useLessons();

  const { loading: blocksLoading, isBlocked, getActiveBlock } = useStudentBlocks();
  const { activeGradeLevels, loading: gradesLoading, getGradeLabel } = useGradeLevels();
  const { reminders, loading: remindersLoading, hasReminder, getReminderByGroupId } = useNextSessionReminders();

  const isLoading = groupsLoading || studentsLoading || lessonsLoading || blocksLoading || gradesLoading || remindersLoading;

  // Get groups with reminders for today's lessons
  const todayLessons = lessons.filter(l => l.date === new Date().toISOString().split('T')[0]);
  const todayGroupIds = [...new Set(todayLessons.map(l => l.group_id).filter(Boolean))] as string[];
  const todayReminders = todayGroupIds
    .filter(gid => hasReminder(gid))
    .map(gid => ({ group: getGroupById(gid)!, reminder: getReminderByGroupId(gid)! }))
    .filter(r => r.group && r.reminder);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editSheetMax, setEditSheetMax] = useState(10);
  const [editRecitationMax, setEditRecitationMax] = useState(10);
  const [editGroupId, setEditGroupId] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [isAddToGroupsOpen, setIsAddToGroupsOpen] = useState(false);
  const [addToGroupsLesson, setAddToGroupsLesson] = useState<Lesson | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [addToGroupsSearch, setAddToGroupsSearch] = useState('');
  const [groupDates, setGroupDates] = useState<Record<string, string>>({});
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isGradesOpen, setIsGradesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('sheet');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  // Form state
  const [lessonName, setLessonName] = useState('');
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);
  const [lessonGrade, setLessonGrade] = useState<string>(activeGradeLevels[0]?.code ?? 'sec1');
  const [lessonGroupId, setLessonGroupId] = useState('');
  const [selectAllGroups, setSelectAllGroups] = useState(false);
  const [sheetMaxScore, setSheetMaxScore] = useState(10);
  const [recitationMaxScore, setRecitationMaxScore] = useState(10);

  const [sheetScores, setSheetScores] = useState<Record<string, number>>({});
  const [recitationScores, setRecitationScores] = useState<Record<string, number>>({});
  const [gradesSearch, setGradesSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ active: boolean; done: number; total: number }>(
    { active: false, done: 0, total: 0 }
  );

  const filteredGroupsByGrade = groups.filter(g => g.grade === lessonGrade);

  // Group lessons by group_id
  const groupedLessons = useMemo(() => {
    const filtered = lessons.filter((lesson) => {
      const matchesGrade = filterGrade === 'all' || lesson.grade === filterGrade;
      const matchesGroup = filterGroup === 'all' || lesson.group_id === filterGroup;
      const matchesSearch = !searchQuery.trim() || lesson.name.includes(searchQuery.trim());
      return matchesGrade && matchesGroup && matchesSearch;
    });

    const map = new Map<string, Lesson[]>();
    for (const lesson of filtered) {
      const key = lesson.group_id || 'no-group';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(lesson);
    }

    // Sort lessons within each group by date descending
    for (const [, arr] of map) {
      arr.sort((a, b) => b.date.localeCompare(a.date));
    }

    return map;
  }, [lessons, filterGrade, filterGroup, searchQuery]);

  const totalLessons = Array.from(groupedLessons.values()).reduce((s, arr) => s + arr.length, 0);

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const resetForm = () => {
    setLessonName('');
    setLessonDate(new Date().toISOString().split('T')[0]);
    setLessonGrade(activeGradeLevels[0]?.code ?? 'sec1');
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

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (selectAllGroups) {
        const gradeGroups = filteredGroupsByGrade;
        if (gradeGroups.length === 0) {
          toast.error('لا توجد مجموعات لهذه السنة الدراسية');
          return;
        }

        setBulkProgress({ active: true, done: 0, total: gradeGroups.length });
        
        for (const group of gradeGroups) {
          await addLesson({
            name: lessonName,
            date: lessonDate,
            grade: lessonGrade,
            group_id: group.id,
            sheet_max_score: sheetMaxScore,
            recitation_max_score: recitationMaxScore,
          });

          setBulkProgress((prev) => ({
            active: true,
            total: prev.total,
            done: Math.min(prev.total, prev.done + 1),
          }));
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
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setBulkProgress({ active: false, done: 0, total: 0 }), 450);
    }
  };

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setEditName(lesson.name);
    setEditDate(lesson.date);
    setEditSheetMax(lesson.sheet_max_score);
    setEditRecitationMax(lesson.recitation_max_score);
    setEditGroupId(lesson.group_id || '');
    setEditGrade(lesson.grade);
    setIsEditOpen(true);
  };

  const editFilteredGroups = groups.filter(g => g.grade === editGrade);

  const handleEditLesson = async () => {
    if (!editingLesson || !editName) {
      toast.error('برجاء إدخال عنوان الحصة');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateLesson(editingLesson.id, {
        name: editName,
        date: editDate,
        sheet_max_score: editSheetMax,
        recitation_max_score: editRecitationMax,
        group_id: editGroupId || null,
        grade: editGrade,
      });
      toast.success('تم تعديل الحصة بنجاح');
      setIsEditOpen(false);
      setEditingLesson(null);
    } catch {
      toast.error('حدث خطأ أثناء تعديل الحصة');
    } finally {
      setIsSubmitting(false);
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
    
    const sheets = getLessonSheets(lesson.id);
    const recs = getLessonRecitations(lesson.id);
    
    const sheetMap: Record<string, number> = {};
    sheets.forEach(s => { sheetMap[s.student_id] = s.score; });
    setSheetScores(sheetMap);

    const recMap: Record<string, number> = {};
    recs.forEach(r => { recMap[r.student_id] = r.score; });
    setRecitationScores(recMap);

    setIsGradesOpen(true);
  };

  const handleSaveSheetScores = async () => {
    if (!selectedLesson) return;
    try {
      for (const [studentId, score] of Object.entries(sheetScores)) {
        if (score !== undefined && !isNaN(score)) {
          if (isBlocked(studentId)) {
            const b = getActiveBlock(studentId);
            toast.error(`لا يمكن حفظ درجات: الطالب مُجمّد (${b?.reason || 'مجمّد'})`);
            continue;
          }
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
          if (isBlocked(studentId)) {
            const b = getActiveBlock(studentId);
            toast.error(`لا يمكن حفظ درجات: الطالب مُجمّد (${b?.reason || 'مجمّد'})`);
            continue;
          }
          await addRecitation(selectedLesson.id, studentId, score);
        }
      }
      toast.success('تم حفظ درجات التسميع');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الدرجات');
    }
  };

  const lessonStudents = selectedLesson && selectedLesson.group_id
    ? getStudentsByGroup(selectedLesson.group_id)
    : [];

  const filteredLessonStudents = lessonStudents.filter((s) => {
    if (!gradesSearch.trim()) return true;
    return s.name.includes(gradesSearch) || s.code.includes(gradesSearch);
  });

  const saveSheetOnBlur = async (studentId: string) => {
    if (!selectedLesson) return;
    if (isBlocked(studentId)) {
      const b = getActiveBlock(studentId);
      toast.error(`لا يمكن تسجيل درجات: الطالب مُجمّد (${b?.reason || 'مجمّد'})`);
      return;
    }
    const score = sheetScores[studentId];
    if (score === undefined || Number.isNaN(score)) return;
    if (score < 0 || score > selectedLesson.sheet_max_score) return;
    try {
      await addSheet(selectedLesson.id, studentId, score);
    } catch {
      toast.error('تعذر حفظ درجة الشيت');
    }
  };

  const saveRecitationOnBlur = async (studentId: string) => {
    if (!selectedLesson) return;
    if (isBlocked(studentId)) {
      const b = getActiveBlock(studentId);
      toast.error(`لا يمكن تسجيل درجات: الطالب مُجمّد (${b?.reason || 'مجمّد'})`);
      return;
    }
    const score = recitationScores[studentId];
    if (score === undefined || Number.isNaN(score)) return;
    if (score < 0 || score > selectedLesson.recitation_max_score) return;
    try {
      await addRecitation(selectedLesson.id, studentId, score);
    } catch {
      toast.error('تعذر حفظ درجة التسميع');
    }
  };

  return (
    <Layout>
      {isLoading ? (
        <PageLoading title="جاري تحميل الحصص" description="بنجهّز الحصص والدرجات…" />
      ) : (
        <>
      {bulkProgress.active && bulkProgress.total > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-primary/15">
          <div
            className="h-full bg-primary transition-[width] duration-200 ease-out"
            style={{
              width: `${Math.round((bulkProgress.done / bulkProgress.total) * 100)}%`,
            }}
          />
        </div>
      )}
      <div className="space-y-6 animate-fade-in">
        {/* Today's Reminders */}
        {todayReminders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-warning" />
              المطلوب لحصص اليوم
            </h2>
            {todayReminders.map(({ group, reminder }) => (
              <NextSessionReminderCard 
                key={group.id} 
                group={group} 
                reminder={reminder} 
                compact 
                students={getStudentsByGroup(group.id)}
              />
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">الحصص</h1>
            <p className="text-muted-foreground mt-1">
              {totalLessons} حصة في {groupedLessons.size} مجموعة
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
                    onValueChange={(value) => {
                      setLessonGrade(value);
                      setLessonGroupId('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeGradeLevels.map((g) => (
                        <SelectItem key={g.code} value={g.code}>
                          {g.label}
                        </SelectItem>
                      ))}
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
                      جميع مجموعات {getGradeLabel(lessonGrade)} ({filteredGroupsByGrade.length} مجموعة)
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
                              {group.name} ({group.days.join(' - ')}) - {formatTime12(group.time)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <Button onClick={handleAddLesson} className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : (
                    'إضافة الحصة'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الحصة..."
                className="pr-9"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">السنة الدراسية</label>
                <Select value={filterGrade} onValueChange={(v) => {
                  setFilterGrade(v);
                  setFilterGroup('all');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="كل السنوات" />
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
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">المجموعة</label>
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="كل المجموعات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المجموعات</SelectItem>
                    {groups
                      .filter((g) => filterGrade === 'all' || g.grade === filterGrade)
                      .map((group) => (
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

        {/* Lessons grouped by group */}
        <div className="space-y-4">
          {groupedLessons.size > 0 ? (
            Array.from(groupedLessons.entries()).map(([groupId, groupLessons]) => {
              const group = getGroupById(groupId);
              const isOpen = openGroups.has(groupId);
              const students = group ? getStudentsByGroup(group.id) : [];

              return (
                <Collapsible key={groupId} open={isOpen} onOpenChange={() => toggleGroup(groupId)}>
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-right">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{group?.name || 'بدون مجموعة'}</h3>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <Badge variant="outline" className="text-xs">{getGradeLabel(group?.grade || '')}</Badge>
                              {group?.days?.length ? (
                                <span className="text-xs text-muted-foreground">{group.days.join(' · ')} - {formatTime12(group.time)}</span>
                              ) : null}
                              <Badge variant="secondary" className="text-xs">{groupLessons.length} حصة</Badge>
                              <Badge variant="outline" className="text-xs">{students.length} طالب</Badge>
                            </div>
                          </div>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t">
                        {groupLessons.map((lesson, idx) => {
                          const sheetsList = getLessonSheets(lesson.id);
                          const recsList = getLessonRecitations(lesson.id);

                          return (
                            <div
                              key={lesson.id}
                              className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${idx > 0 ? 'border-t' : ''} hover:bg-muted/30 transition-colors`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-semibold">{lesson.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(lesson.date).toLocaleDateString('ar-EG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                    <Badge className="bg-primary/10 text-primary text-[10px] gap-0.5 px-1.5 py-0">
                                      <FileText className="h-2.5 w-2.5" />
                                      شيت: {sheetsList.length}/{students.length}
                                    </Badge>
                                    <Badge className="bg-secondary/10 text-secondary text-[10px] gap-0.5 px-1.5 py-0">
                                      <Mic className="h-2.5 w-2.5" />
                                      تسميع: {recsList.length}/{students.length}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openGradesDialog(lesson)}
                                  className="gap-1 text-xs"
                                >
                                  <Pencil className="h-3 w-3" />
                                  الدرجات
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEditDialog(lesson)}
                                  title="تعديل"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="إضافة لمجموعات أخرى"
                                  onClick={() => {
                                    setAddToGroupsLesson(lesson);
                                    const gradeGroups = groups.filter(g => g.grade === lesson.grade && g.id !== lesson.group_id);
                                    setSelectedGroupIds(new Set());
                                    setIsAddToGroupsOpen(true);
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteLesson(lesson)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
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

        {/* Edit Lesson Dialog */}
        <Dialog open={isEditOpen} onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditingLesson(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل الحصة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">عنوان الحصة</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="عنوان الحصة"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">تاريخ الحصة</label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">السنة الدراسية</label>
                <Select value={editGrade} onValueChange={(v) => { setEditGrade(v); setEditGroupId(''); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activeGradeLevels.map((g) => (
                      <SelectItem key={g.code} value={g.code}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">المجموعة</label>
                <Select value={editGroupId} onValueChange={setEditGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المجموعة" />
                  </SelectTrigger>
                  <SelectContent>
                    {editFilteredGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} ({group.days.join(' - ')}) - {formatTime12(group.time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">درجة الشيت النهائية</label>
                  <Input
                    type="number"
                    value={editSheetMax}
                    onChange={(e) => setEditSheetMax(Number(e.target.value))}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">درجة التسميع النهائية</label>
                  <Input
                    type="number"
                    value={editRecitationMax}
                    onChange={(e) => setEditRecitationMax(Number(e.target.value))}
                    dir="ltr"
                  />
                </div>
              </div>
              <Button onClick={handleEditLesson} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add to Groups Dialog */}
        <Dialog open={isAddToGroupsOpen} onOpenChange={(open) => {
          setIsAddToGroupsOpen(open);
          if (!open) { setAddToGroupsLesson(null); setSelectedGroupIds(new Set()); setAddToGroupsSearch(''); setGroupDates({}); }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة الحصة لمجموعات أخرى</DialogTitle>
            </DialogHeader>
            {addToGroupsLesson && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-semibold">{addToGroupsLesson.name}</p>
                  <p className="text-sm text-muted-foreground">{addToGroupsLesson.date}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">اختر المجموعات</label>
                  <div className="relative mb-2">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={addToGroupsSearch}
                      onChange={(e) => setAddToGroupsSearch(e.target.value)}
                      placeholder="بحث باسم المجموعة..."
                      className="pr-9"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
                    {groups
                      .filter(g => g.grade === addToGroupsLesson.grade && g.id !== addToGroupsLesson.group_id)
                      .filter(g => !addToGroupsSearch.trim() || g.name.includes(addToGroupsSearch.trim()))
                      .map(group => {
                        const alreadyExists = lessons.some(
                          l => l.name === addToGroupsLesson.name && l.date === addToGroupsLesson.date && l.group_id === group.id
                        );
                        return (
                          <label
                            key={group.id}
                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${alreadyExists ? 'opacity-50' : ''}`}
                          >
                            <input
                              type="checkbox"
                              disabled={alreadyExists}
                              checked={selectedGroupIds.has(group.id)}
                              onChange={(e) => {
                                setSelectedGroupIds(prev => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(group.id);
                                  else next.delete(group.id);
                                  return next;
                                });
                                if (e.target.checked && !groupDates[group.id]) {
                                  setGroupDates(prev => ({ ...prev, [group.id]: new Date().toISOString().split('T')[0] }));
                                }
                              }}
                              className="h-4 w-4 rounded border-input shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{group.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {group.days.join(' · ')} - {formatTime12(group.time)}
                                {alreadyExists && ' (مضافة بالفعل)'}
                              </p>
                              {selectedGroupIds.has(group.id) && (
                                <Input
                                  type="date"
                                  value={groupDates[group.id] || ''}
                                  onChange={(e) => setGroupDates(prev => ({ ...prev, [group.id]: e.target.value }))}
                                  className="mt-1.5 h-8 text-xs"
                                  dir="ltr"
                                />
                              )}
                            </div>
                          </label>
                        );
                      })}
                  </div>
                  {selectedGroupIds.size > 0 && (
                    <p className="text-sm text-muted-foreground">تم اختيار {selectedGroupIds.size} مجموعة</p>
                  )}
                </div>
                <Button
                  className="w-full"
                  disabled={selectedGroupIds.size === 0 || isSubmitting}
                  onClick={async () => {
                    if (!addToGroupsLesson || selectedGroupIds.size === 0) return;
                    setIsSubmitting(true);
                    try {
                      for (const gid of selectedGroupIds) {
                        await addLesson({
                          name: addToGroupsLesson.name,
                          date: addToGroupsLesson.date,
                          grade: addToGroupsLesson.grade,
                          group_id: gid,
                          sheet_max_score: addToGroupsLesson.sheet_max_score,
                          recitation_max_score: addToGroupsLesson.recitation_max_score,
                        });
                      }
                      toast.success(`تم إضافة الحصة لـ ${selectedGroupIds.size} مجموعة`);
                      setIsAddToGroupsOpen(false);
                      setAddToGroupsLesson(null);
                      setSelectedGroupIds(new Set());
                    } catch {
                      toast.error('حدث خطأ أثناء إضافة الحصة');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> جاري الإضافة...</>
                  ) : (
                    <>إضافة لـ {selectedGroupIds.size} مجموعة</>
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

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

              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={gradesSearch}
                  onChange={(e) => setGradesSearch(e.target.value)}
                  placeholder="بحث باسم الطالب أو الكود..."
                  className="pr-9"
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
                  {filteredLessonStudents.length > 0 ? (
                    <>
                      {filteredLessonStudents.map((student) => (
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
                              onBlur={() => saveSheetOnBlur(student.id)}
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
                      <Button onClick={handleSaveSheetScores} variant="outline" className="w-full">
                        حفظ (اختياري)
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">لا يوجد نتائج للبحث / لا يوجد طلاب</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="recitation" className="space-y-4 mt-4">
                  {filteredLessonStudents.length > 0 ? (
                    <>
                      {filteredLessonStudents.map((student) => (
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
                              onBlur={() => saveRecitationOnBlur(student.id)}
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
                      <Button onClick={handleSaveRecitationScores} variant="outline" className="w-full">
                        حفظ (اختياري)
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">لا يوجد نتائج للبحث / لا يوجد طلاب</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </div>
        </>
      )}
    </Layout>
  );
}
