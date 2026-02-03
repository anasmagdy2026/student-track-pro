import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRScanner } from '@/components/QRScanner';
import { useStudents } from '@/hooks/useStudents';
import { Exam, ExamResult } from '@/types';
import { ScanLine, CheckCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ExamQRScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: Exam;
  onScoreAdded: (studentId: string, score: number) => void;
}

export function ExamQRScoreDialog({ open, onOpenChange, exam, onScoreAdded }: ExamQRScoreDialogProps) {
  const { getStudentByCode, students } = useStudents();

  const [showScanner, setShowScanner] = useState(false);
  const [scannedStudent, setScannedStudent] = useState<{
    id: string;
    name: string;
    code: string;
    existingScore?: number;
  } | null>(null);
  const [score, setScore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localResults, setLocalResults] = useState<ExamResult[]>([]);

  // Fetch exam results when dialog opens
  useEffect(() => {
    if (open) {
      setScannedStudent(null);
      setScore('');
      setShowScanner(true);
      
      // Fetch latest results for this exam
      supabase
        .from('exam_results')
        .select('*')
        .eq('exam_id', exam.id)
        .then(({ data }) => {
          if (data) {
            setLocalResults(data as ExamResult[]);
          }
        });
    }
  }, [open, exam.id]);

  const handleScan = (code: string) => {
    setShowScanner(false);
    
    const student = getStudentByCode(code);
    if (!student) {
      toast.error('كود الطالب غير موجود');
      setShowScanner(true);
      return;
    }

    if (student.grade !== exam.grade) {
      toast.error('الطالب ليس في نفس السنة الدراسية للامتحان');
      setShowScanner(true);
      return;
    }

    // Check for existing score from local results
    const existingResult = localResults.find(r => r.student_id === student.id);

    setScannedStudent({
      id: student.id,
      name: student.name,
      code: student.code,
      existingScore: existingResult?.score,
    });
    
    if (existingResult) {
      setScore(String(existingResult.score));
    } else {
      setScore('');
    }
  };

  const handleSubmitScore = async () => {
    if (!scannedStudent) return;

    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 0 || numScore > exam.max_score) {
      toast.error(`الدرجة يجب أن تكون بين 0 و ${exam.max_score}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if result already exists
      const existingResult = localResults.find(r => r.student_id === scannedStudent.id);
      
      if (existingResult) {
        // Update existing result
        const { error } = await supabase
          .from('exam_results')
          .update({ score: numScore, notified: false })
          .eq('id', existingResult.id);
        
        if (error) throw error;
        
        // Update local state
        setLocalResults(prev => 
          prev.map(r => r.id === existingResult.id ? { ...r, score: numScore, notified: false } : r)
        );
      } else {
        // Insert new result
        const { data, error } = await supabase
          .from('exam_results')
          .insert([{
            exam_id: exam.id,
            student_id: scannedStudent.id,
            score: numScore,
            notified: false,
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        // Add to local state
        setLocalResults(prev => [...prev, data as ExamResult]);
      }
      
      onScoreAdded(scannedStudent.id, numScore);
      toast.success(`✅ تم حفظ درجة ${scannedStudent.name}: ${numScore}/${exam.max_score}`);
      
      // Reset for next scan
      setScannedStudent(null);
      setScore('');
      setShowScanner(true);
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الدرجة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanAnother = () => {
    setScannedStudent(null);
    setScore('');
    setShowScanner(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            إدخال الدرجات بمسح QR
          </DialogTitle>
          <DialogDescription>
            {exam.name} - الدرجة النهائية: {exam.max_score}
          </DialogDescription>
        </DialogHeader>

        {showScanner && (
          <div className="py-4">
            <QRScanner
              onScan={handleScan}
              onClose={() => setShowScanner(false)}
              title="امسح باركود الطالب"
              inline
            />
          </div>
        )}

        {scannedStudent && !showScanner && (
          <div className="space-y-4">
            {/* Student Info */}
            <div className="p-4 bg-primary/10 rounded-lg flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-lg">{scannedStudent.name}</p>
                <p className="text-sm text-muted-foreground font-mono">{scannedStudent.code}</p>
              </div>
              {scannedStudent.existingScore !== undefined && (
                <div className="mr-auto text-sm text-warning">
                  درجة سابقة: {scannedStudent.existingScore}
                </div>
              )}
            </div>

            {/* Score Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">الدرجة</label>
              <Input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder={`أدخل الدرجة (0-${exam.max_score})`}
                min={0}
                max={exam.max_score}
                dir="ltr"
                autoFocus
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                onClick={handleSubmitScore} 
                className="flex-1 gap-2"
                disabled={isSubmitting || !score}
              >
                <CheckCircle className="h-4 w-4" />
                حفظ الدرجة
              </Button>
              <Button 
                variant="outline" 
                onClick={handleScanAnother}
                className="gap-2"
              >
                <ScanLine className="h-4 w-4" />
                مسح آخر
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
