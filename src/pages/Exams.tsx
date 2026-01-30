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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useStudents } from '@/hooks/useStudents';
import { useGroups } from '@/hooks/useGroups';
import { useExams } from '@/hooks/useExams';
import { GRADE_LABELS, Exam } from '@/types';
import {
  sendWhatsAppMessage,
  createExamResultMessage,
} from '@/utils/whatsapp';
import {
  FileText,
  Plus,
  Trash2,
  MessageCircle,
  Search,
  QrCode,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Exams() {
  const { students, getStudentByCode } = useStudents();
  const { getGroupById } = useGroups();
  const {
    exams,
    addExam,
    deleteExam,
    addResult,
    saveAllResults,
    getExamResults,
    markResultAsNotified,
  } = useExams();

  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [studentCode, setStudentCode] = useState('');
  const [codeScore, setCodeScore] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examMaxScore, setExamMaxScore] = useState(100);
  const [examGrade, setExamGrade] = useState<'1' | '2' | '3'>('1');

  const [scores, setScores] = useState<Record<string, number>>({});

  const saveScoreOnBlur = async (studentId: string) => {
    if (!selectedExam) return;
    const score = scores[studentId];
    if (score === undefined || Number.isNaN(score)) return;
    if (score < 0 || score > selectedExam.max_score) return;
    try {
      await addResult(selectedExam.id, studentId, score);
    } catch {
      toast.error('تعذر حفظ درجة الامتحان');
    }
  };

  const resetExamForm = () => {
    setExamName('');
    setExamDate(new Date().toISOString().split('T')[0]);
    setExamMaxScore(100);
    setExamGrade('1');
  };

  const handleAddExam = async () => {
    if (!examName) {
      toast.error('برجاء إدخال اسم الامتحان');
      return;
    }
    try {
      await addExam({
        name: examName,
        date: examDate,
        max_score: examMaxScore,
        grade: examGrade,
      });
      toast.success('تم إضافة الامتحان بنجاح');
      resetExamForm();
      setIsAddExamOpen(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة الامتحان');
    }
  };

  const handleDeleteExam = async (exam: Exam) => {
    if (confirm(`هل أنت متأكد من حذف امتحان "${exam.name}"؟`)) {
      try {
        await deleteExam(exam.id);
        toast.success('تم حذف الامتحان');
      } catch (error) {
        toast.error('حدث خطأ أثناء حذف الامتحان');
      }
    }
  };

  const openResults = (exam: Exam) => {
    setSelectedExam(exam);
    const results = getExamResults(exam.id);
    const scoresMap: Record<string, number> = {};
    results.forEach((r) => {
      scoresMap[r.student_id] = r.score;
    });
    setScores(scoresMap);
    setSearchTerm('');
    setIsResultsOpen(true);
  };

  // إضافة درجة فردية فوراً عند الضغط على "إضافة"
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim() || !selectedExam) return;

    const student = getStudentByCode(studentCode.trim());
    if (student) {
      if (student.grade !== selectedExam.grade) {
        toast.error('هذا الطالب ليس في نفس السنة الدراسية للامتحان');
        return;
      }
      const score = Number(codeScore);
      if (isNaN(score) || score < 0 || score > selectedExam.max_score) {
        toast.error(`الدرجة يجب أن تكون بين 0 و ${selectedExam.max_score}`);
        return;
      }
      
      // حفظ الدرجة فوراً في قاعدة البيانات
      try {
        await addResult(selectedExam.id, student.id, score);
        setScores({ ...scores, [student.id]: score });
        toast.success(`✅ تم حفظ درجة: ${student.name} - ${score}/${selectedExam.max_score}`);
        setStudentCode('');
        setCodeScore('');
      } catch (error) {
        toast.error('حدث خطأ أثناء حفظ الدرجة');
      }
    } else {
      toast.error('كود الطالب غير موجود');
    }
  };

  const handleSaveScores = async () => {
    if (!selectedExam) return;
    try {
      await saveAllResults(selectedExam.id, scores);
      toast.success('✅ تم حفظ جميع الدرجات بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الدرجات');
    }
  };

  const handleSendResult = async (studentId: string) => {
    if (!selectedExam) return;
    const student = students.find((s) => s.id === studentId);
    const score = scores[studentId];
    if (!student || score === undefined) return;

    const results = getExamResults(selectedExam.id);
    const result = results.find((r) => r.student_id === studentId);

    const message = createExamResultMessage(
      student.name,
      selectedExam.name,
      score,
      selectedExam.max_score
    );
    sendWhatsAppMessage(student.parent_phone, message);

    if (result) {
      await markResultAsNotified(result.id);
    }
    toast.success('تم فتح الواتساب');
  };

  const examStudents = selectedExam
    ? students.filter((s) => s.grade === selectedExam.grade)
    : [];

  // فلترة الطلاب حسب البحث
  const filteredExamStudents = examStudents.filter(
    (s) =>
      s.name.includes(searchTerm) ||
      s.code.includes(searchTerm)
  );

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">الامتحانات</h1>
            <p className="text-muted-foreground mt-1">
              إدارة الامتحانات ودرجات الطلاب
            </p>
          </div>
          <Dialog open={isAddExamOpen} onOpenChange={(open) => {
            setIsAddExamOpen(open);
            if (!open) resetExamForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                إضافة امتحان جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة امتحان جديد</DialogTitle>
                <DialogDescription>أدخل بيانات الامتحان الجديد</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">اسم الامتحان</label>
                  <Input
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="مثال: امتحان الفصل الأول"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">تاريخ الامتحان</label>
                  <Input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">الدرجة النهائية</label>
                  <Input
                    type="number"
                    value={examMaxScore}
                    onChange={(e) => setExamMaxScore(Number(e.target.value))}
                    placeholder="أدخل الدرجة النهائية للامتحان"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">السنة الدراسية</label>
                  <Select
                    value={examGrade}
                    onValueChange={(value: '1' | '2' | '3') => setExamGrade(value)}
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
                <Button onClick={handleAddExam} className="w-full">
                  إضافة الامتحان
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Exams List */}
        <div className="grid gap-4">
          {exams.length > 0 ? (
            exams.map((exam) => {
              const results = getExamResults(exam.id);
              const gradeStudents = students.filter((s) => s.grade === exam.grade);

              return (
                <Card key={exam.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                          <FileText className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{exam.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline">{GRADE_LABELS[exam.grade]}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(exam.date).toLocaleDateString('ar-EG')}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              الدرجة النهائية: {exam.max_score}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className="bg-primary/10 text-primary">
                          {results.length} / {gradeStudents.length} طالب
                        </Badge>
                        <Button
                          variant="outline"
                          onClick={() => openResults(exam)}
                        >
                          إدخال الدرجات
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteExam(exam)}
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
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  لا يوجد امتحانات
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  اضغط على "إضافة امتحان جديد" لإضافة أول امتحان
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Dialog */}
        <Dialog open={isResultsOpen} onOpenChange={setIsResultsOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                إدخال درجات: {selectedExam?.name} (الدرجة النهائية: {selectedExam?.max_score})
              </DialogTitle>
                <DialogDescription>أدخل درجات الطلاب - يتم الحفظ تلقائياً عند ترك الخانة</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Quick Code Entry */}
              <Card className="border-secondary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <QrCode className="h-4 w-4 text-secondary" />
                    إدخال سريع بالكود (يحفظ تلقائياً)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCodeSubmit} className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={studentCode}
                        onChange={(e) => setStudentCode(e.target.value)}
                        placeholder="كود الطالب"
                        className="pr-9"
                        dir="ltr"
                      />
                    </div>
                    <Input
                      type="number"
                      value={codeScore}
                      onChange={(e) => setCodeScore(e.target.value)}
                      placeholder="الدرجة"
                      className="w-24"
                      max={selectedExam?.max_score}
                      min={0}
                      dir="ltr"
                    />
                    <Button type="submit" size="sm">
                      إضافة الدرجة
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Search Students */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث باسم الطالب أو الكود..."
                  className="pr-9"
                />
              </div>

              {filteredExamStudents.length > 0 ? (
                <>
                  {filteredExamStudents.map((student) => {
                    const results = selectedExam
                      ? getExamResults(selectedExam.id)
                      : [];
                    const result = results.find((r) => r.student_id === student.id);
                    const percentage = selectedExam
                      ? Math.round(
                          ((scores[student.id] || 0) / selectedExam.max_score) * 100
                        )
                      : 0;
                    const group = student.group_id ? getGroupById(student.group_id) : null;

                    return (
                      <div
                        key={student.id}
                        className="flex items-center gap-4 p-3 bg-muted rounded-xl"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{student.name}</p>
                            <span className="text-xs font-mono bg-background px-2 py-0.5 rounded">
                              {student.code}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {group?.name || '-'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            value={scores[student.id] ?? ''}
                            onChange={(e) =>
                              setScores({
                                ...scores,
                                [student.id]: Number(e.target.value),
                              })
                            }
                            onBlur={() => saveScoreOnBlur(student.id)}
                            className="w-20 text-center"
                            placeholder="0"
                            max={selectedExam?.max_score}
                            min={0}
                            dir="ltr"
                          />
                          <span className="text-muted-foreground">
                            / {selectedExam?.max_score}
                          </span>
                          {scores[student.id] !== undefined && (
                            <Badge
                              className={
                                percentage >= 75
                                  ? 'bg-success text-success-foreground'
                                  : percentage >= 50
                                  ? 'bg-warning text-warning-foreground'
                                  : 'bg-destructive text-destructive-foreground'
                              }
                            >
                              {percentage}%
                            </Badge>
                          )}
                          {scores[student.id] !== undefined && (
                            <Button
                              size="icon"
                              variant={result?.notified ? 'ghost' : 'outline'}
                              onClick={() => handleSendResult(student.id)}
                              disabled={result?.notified}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <Button onClick={handleSaveScores} className="w-full gap-2">
                    <Save className="h-4 w-4" />
                    حفظ جميع الدرجات
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'لا يوجد طلاب بهذا الاسم أو الكود' : 'لا يوجد طلاب في هذه السنة الدراسية'}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
