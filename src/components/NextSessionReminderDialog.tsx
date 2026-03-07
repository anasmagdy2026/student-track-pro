import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, BookOpen, FileText, ClipboardList, PenTool, StickyNote, Trash2, History, RotateCcw } from 'lucide-react';
import { NextSessionReminder, ReminderLogEntry } from '@/hooks/useNextSessionReminders';

interface NextSessionReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  groupId: string;
  reminder: NextSessionReminder | undefined;
  onSave: (data: {
    homework?: string | null;
    recitation?: string | null;
    exam?: string | null;
    sheet?: string | null;
    note?: string | null;
  }) => Promise<void>;
  onClear: () => Promise<void>;
  onArchiveAndNew: () => Promise<void>;
  onFetchLog: (groupId: string) => Promise<ReminderLogEntry[]>;
  onRestoreLog: (groupId: string, entry: ReminderLogEntry) => Promise<void>;
}

export function NextSessionReminderDialog({
  open,
  onOpenChange,
  groupName,
  groupId,
  reminder,
  onSave,
  onClear,
  onFetchLog,
  onRestoreLog,
}: NextSessionReminderDialogProps) {
  const [homework, setHomework] = useState('');
  const [recitation, setRecitation] = useState('');
  const [exam, setExam] = useState('');
  const [sheet, setSheet] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [logEntries, setLogEntries] = useState<ReminderLogEntry[]>([]);
  const [loadingLog, setLoadingLog] = useState(false);

  useEffect(() => {
    if (open) {
      setHomework(reminder?.homework || '');
      setRecitation(reminder?.recitation || '');
      setExam(reminder?.exam || '');
      setSheet(reminder?.sheet || '');
      setNote(reminder?.note || '');
      setShowHistory(false);
    }
  }, [open, reminder]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        homework: homework || null,
        recitation: recitation || null,
        exam: exam || null,
        sheet: sheet || null,
        note: note || null,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await onClear();
      setHomework('');
      setRecitation('');
      setExam('');
      setSheet('');
      setNote('');
      onOpenChange(false);
    } finally {
      setIsClearing(false);
    }
  };

  const handleShowHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    setLoadingLog(true);
    const entries = await onFetchLog(groupId);
    setLogEntries(entries);
    setLoadingLog(false);
    setShowHistory(true);
  };

  const handleRestore = async (entry: ReminderLogEntry) => {
    setHomework(entry.homework || '');
    setRecitation(entry.recitation || '');
    setExam(entry.exam || '');
    setSheet(entry.sheet || '');
    setNote(entry.note || '');
    setShowHistory(false);
  };

  const hasContent = homework || recitation || exam || sheet || note;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            المطلوب الحصة الجاية
          </DialogTitle>
          <DialogDescription>
            {groupName} - سجّل المطلوب عشان متنساش
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              الواجب
            </Label>
            <Input
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              placeholder="مثال: صفحة 15 إلى 20"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <PenTool className="h-4 w-4 text-green-500" />
              التسميع
            </Label>
            <Input
              value={recitation}
              onChange={(e) => setRecitation(e.target.value)}
              placeholder="مثال: سورة البقرة من آية 1 إلى 10"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-500" />
              الامتحان
            </Label>
            <Input
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              placeholder="مثال: امتحان الوحدة الأولى"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-orange-500" />
              الشيت
            </Label>
            <Input
              value={sheet}
              onChange={(e) => setSheet(e.target.value)}
              placeholder="مثال: شيت تمارين على الوحدة"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-purple-500" />
              ملاحظات إضافية
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="أي ملاحظات تانية..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleSave} className="flex-1" disabled={isSaving || isClearing}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              'حفظ'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleShowHistory}
            disabled={loadingLog}
            className="gap-1"
          >
            {loadingLog ? <Loader2 className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
          </Button>
          {hasContent && (
            <Button 
              variant="outline" 
              onClick={handleClear} 
              disabled={isSaving || isClearing}
              className="text-destructive hover:text-destructive"
            >
              {isClearing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* History */}
        {showHistory && (
          <div className="mt-4 border-t pt-4">
            <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
              <History className="h-4 w-4" />
              السجل السابق
            </h4>
            {logEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">لا يوجد سجل سابق</p>
            ) : (
              <ScrollArea className="max-h-60">
                <div className="space-y-2">
                  {logEntries.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRestore(entry)}
                          className="h-7 gap-1 text-xs"
                        >
                          <RotateCcw className="h-3 w-3" />
                          استعادة
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {entry.homework && <Badge variant="secondary" className="text-xs">واجب: {entry.homework}</Badge>}
                        {entry.recitation && <Badge variant="secondary" className="text-xs">تسميع: {entry.recitation}</Badge>}
                        {entry.exam && <Badge variant="secondary" className="text-xs">امتحان: {entry.exam}</Badge>}
                        {entry.sheet && <Badge variant="secondary" className="text-xs">شيت: {entry.sheet}</Badge>}
                        {entry.note && <Badge variant="outline" className="text-xs">ملاحظة: {entry.note}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
