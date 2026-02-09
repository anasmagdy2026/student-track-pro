import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, User, Users, Eye, CheckCircle } from 'lucide-react';
import { Student } from '@/types';
import { sendWhatsAppMessage } from '@/utils/whatsapp';
import { toast } from 'sonner';

interface MessagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: string;
  students: Student[];
  variables: Record<string, string | ((student: Student) => string)>;
  title?: string;
  onConfirmSend: () => void;
  /** Optional: provide a function that builds the actual message per student (used for sending) */
  messageBuilder?: (student: Student) => string;
}

function resolveMessage(template: string, student: Student, variables: Record<string, string | ((student: Student) => string)>) {
  let message = template;
  Object.entries(variables).forEach(([key, value]) => {
    const replacement = typeof value === 'function' ? value(student) : value;
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), replacement);
  });
  message = message.replace(/\{studentName\}/g, student.name);
  return message;
}

export function MessagePreviewDialog({
  open,
  onOpenChange,
  template,
  students,
  variables,
  title = 'معاينة الرسالة',
  onConfirmSend,
  messageBuilder,
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
    return resolveMessage(template, selectedStudent, variables);
  }, [template, selectedStudent, variables]);

  const handleSendToStudent = (student: Student) => {
    const phone = student.student_phone || student.parent_phone;
    const message = messageBuilder ? messageBuilder(student) : resolveMessage(template, student, variables);
    sendWhatsAppMessage(phone, message);
    toast.success(`جاري فتح واتساب لـ ${student.name}`);
  };

  if (students.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            معاينة الرسالة قبل الإرسال لـ {students.length} طالب
          </DialogDescription>
        </DialogHeader>

        {/* Send All Button - Sticky at top for mobile visibility */}
        <div className="px-4 pb-2 flex flex-col sm:flex-row gap-2 border-b">
          <Button onClick={onConfirmSend} className="gap-2 flex-1" size="lg">
            <Send className="h-5 w-5" />
            إرسال للجميع ({students.length} طالب)
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:w-auto">
            إلغاء
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4 pb-4">
          <div className="space-y-4">
            {/* Student Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                اختر طالب للمعاينة
              </label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
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
            </div>

            {/* Selected Student Info + Individual Send */}
            {selectedStudent && (
              <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedStudent.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedStudent.student_phone || selectedStudent.parent_phone}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleSendToStudent(selectedStudent)}
                  className="gap-1 flex-shrink-0"
                >
                  <Send className="h-3 w-3" />
                  إرسال
                </Button>
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
