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
import { useStudents } from '@/hooks/useStudents';
import { useExams } from '@/hooks/useExams';
import { GRADE_LABELS, Exam } from '@/types';
import {
  sendWhatsAppMessage,
  createExamResultMessage,
} from '@/utils/whatsapp';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  MessageCircle,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Exams() {
  const { students } = useStudents();
  const {
    exams,
    addExam,
    deleteExam,
    addResult,
    getExamResults,
    markResultAsNotified,
  } = useExams();

  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);

  // Form state
  const [examForm, setExamForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    maxScore: 100,
    grade: '1' as '1' | '2' | '3',
  });

  const [scores, setScores] = useState<Record<string, number>>({});

  const handleAddExam = () => {
    if (!examForm.name) {
      toast.error('برجاء إدخال اسم الامتحان');
      return;
    }
    addExam(examForm);
    toast.success('تم إضافة الامتحان بنجاح');
    setExamForm({
      name: '',
      date: new Date().toISOString().split('T')[0],
      maxScore: 100,
      grade: '1',
    });
    setIsAddExamOpen(false);
  };

  const handleDeleteExam = (exam: Exam) => {
    if (confirm(`هل أنت متأكد من حذف امتحان "${exam.name}"؟`)) {
      deleteExam(exam.id);
      toast.success('تم حذف الامتحان');
    }
  };

  const openResults = (exam: Exam) => {
    setSelectedExam(exam);
    const results = getExamResults(exam.id);
    const scoresMap: Record<string, number> = {};
    results.forEach((r) => {
      scoresMap[r.studentId] = r.score;
    });
    setScores(scoresMap);
    setIsResultsOpen(true);
  };

  const handleSaveScores = () => {
    if (!selectedExam) return;
    Object.entries(scores).forEach(([studentId, score]) => {
      if (score !== undefined && score !== null) {
        addResult(selectedExam.id, studentId, score);
      }
    });
    toast.success('تم حفظ الدرجات');
    setIsResultsOpen(false);
  };

  const handleSendResult = (studentId: string) => {
    if (!selectedExam) return;
    const student = students.find((s) => s.id === studentId);
    const score = scores[studentId];
    if (!student || score === undefined) return;

    const results = getExamResults(selectedExam.id);
    const result = results.find((r) => r.studentId === studentId);

    const message = createExamResultMessage(
      student.name,
      selectedExam.name,
      score,
      selectedExam.maxScore
    );
    sendWhatsAppMessage(student.parentPhone, message);

    if (result) {
      markResultAsNotified(result.id);
    }
    toast.success('تم فتح الواتساب');
  };

  const examStudents = selectedExam
    ? students.filter((s) => s.grade === selectedExam.grade)
    : [];

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
          <Dialog open={isAddExamOpen} onOpenChange={setIsAddExamOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                إضافة امتحان جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة امتحان جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">اسم الامتحان</label>
                  <Input
                    value={examForm.name}
                    onChange={(e) =>
                      setExamForm({ ...examForm, name: e.target.value })
                    }
                    placeholder="مثال: امتحان الفصل الأول"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">تاريخ الامتحان</label>
                  <Input
                    type="date"
                    value={examForm.date}
                    onChange={(e) =>
                      setExamForm({ ...examForm, date: e.target.value })
                    }
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">الدرجة الكبرى</label>
                  <Input
                    type="number"
                    value={examForm.maxScore}
                    onChange={(e) =>
                      setExamForm({ ...examForm, maxScore: Number(e.target.value) })
                    }
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">السنة الدراسية</label>
                  <Select
                    value={examForm.grade}
                    onValueChange={(value: '1' | '2' | '3') =>
                      setExamForm({ ...examForm, grade: value })
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
                              الدرجة: {exam.maxScore}
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
                          <Pencil className="h-4 w-4 ml-2" />
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                إدخال درجات: {selectedExam?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {examStudents.length > 0 ? (
                <>
                  {examStudents.map((student) => {
                    const results = selectedExam
                      ? getExamResults(selectedExam.id)
                      : [];
                    const result = results.find((r) => r.studentId === student.id);
                    const percentage = selectedExam
                      ? Math.round(
                          ((scores[student.id] || 0) / selectedExam.maxScore) * 100
                        )
                      : 0;

                    return (
                      <div
                        key={student.id}
                        className="flex items-center gap-4 p-3 bg-muted rounded-xl"
                      >
                        <div className="flex-1">
                          <p className="font-bold">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.group}
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
                            className="w-20 text-center"
                            placeholder="0"
                            max={selectedExam?.maxScore}
                            min={0}
                            dir="ltr"
                          />
                          <span className="text-muted-foreground">
                            / {selectedExam?.maxScore}
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
                  <Button onClick={handleSaveScores} className="w-full">
                    حفظ الدرجات
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    لا يوجد طلاب في هذه السنة الدراسية
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
