import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, User, Users, Eye, CheckCircle } from 'lucide-react';
import { Student } from '@/types';

interface MessagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: string;
  students: Student[];
  variables: Record<string, string | ((student: Student) => string)>;
  title?: string;
  onConfirmSend: () => void;
}

export function MessagePreviewDialog({
  open,
  onOpenChange,
  template,
  students,
  variables,
  title = 'معاينة الرسالة',
  onConfirmSend,
}: MessagePreviewDialogProps) {
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setSelectedStudentIndex(0);
    }
  }, [open]);

  const selectedStudent = students[selectedStudentIndex];

  const previewMessage = useMemo(() => {
    if (!selectedStudent || !template) return '';

    let message = template;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const replacement = typeof value === 'function' ? value(selectedStudent) : value;
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), replacement);
    });

    // Always replace studentName with the selected student's name
    message = message.replace(/\{studentName\}/g, selectedStudent.name);

    return message;
  }, [template, selectedStudent, variables]);

  if (students.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            معاينة الرسالة قبل الإرسال لـ {students.length} طالب
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              اختر طالب للمعاينة
            </label>
            <ScrollArea className="h-24">
              <div className="flex flex-wrap gap-2">
                {students.map((student, index) => (
                  <Badge
                    key={student.id}
                    variant={index === selectedStudentIndex ? 'default' : 'outline'}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => setSelectedStudentIndex(index)}
                  >
                    {student.name}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Selected Student Info */}
          {selectedStudent && (
            <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{selectedStudent.name}</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {selectedStudent.student_phone || selectedStudent.parent_phone}
                </p>
              </div>
              <Badge variant="outline">
                {selectedStudent.student_phone ? 'رقم الطالب' : 'رقم ولي الأمر'}
              </Badge>
            </div>
          )}

          {/* Message Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              نص الرسالة
            </label>
            <div className="bg-[#e5ddd5] p-4 rounded-lg">
              <div className="bg-white rounded-lg p-3 shadow-sm max-w-[85%] mr-auto">
                <p className="whitespace-pre-wrap text-sm leading-relaxed" dir="rtl">
                  {previewMessage}
                </p>
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-4 p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm">سيتم الإرسال لـ</span>
              <Badge>{students.length} طالب</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <span>عبر الواتساب</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={onConfirmSend} className="gap-2">
            <Send className="h-4 w-4" />
            إرسال للجميع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
