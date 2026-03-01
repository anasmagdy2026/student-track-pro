import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useGroupLessonLog } from '@/hooks/useGroupLessonLog';
import { BookOpen, Plus, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
}

export function GroupLessonLogDialog({ open, onOpenChange, groupId, groupName }: Props) {
  const { entries, loading, addEntry, deleteEntry, getLatestEntry } = useGroupLessonLog(open ? groupId : undefined);
  const [showAdd, setShowAdd] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [newDate, setNewDate] = useState(today);
  const [newTopic, setNewTopic] = useState('');
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const latest = getLatestEntry();

  const handleAdd = async () => {
    if (!newTopic.trim()) { toast.error('أدخل الموضوع'); return; }
    setSaving(true);
    try {
      await addEntry({ group_id: groupId, date: newDate, topic: newTopic.trim(), note: newNote.trim() || undefined });
      toast.success('تم إضافة الموضوع');
      setNewTopic('');
      setNewNote('');
      setShowAdd(false);
    } catch { toast.error('حدث خطأ'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try { await deleteEntry(id); toast.success('تم الحذف'); }
    catch { toast.error('حدث خطأ'); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            سجل المطلوب - {groupName}
          </DialogTitle>
        </DialogHeader>

        {/* Latest / Next Session */}
        {latest && (
          <div className="bg-primary/10 rounded-lg p-4 space-y-1">
            <p className="text-sm font-bold text-primary">الحصة القادمة (آخر إضافة)</p>
            <p className="font-bold">{latest.topic}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(latest.date + 'T00:00:00').toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            {latest.note && <p className="text-sm text-muted-foreground">{latest.note}</p>}
          </div>
        )}

        {/* Add New */}
        {showAdd ? (
          <div className="space-y-3 border rounded-lg p-4">
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>الموضوع / المطلوب</Label>
              <Input value={newTopic} onChange={e => setNewTopic(e.target.value)} placeholder="مثال: شرح الفصل الثالث" />
            </div>
            <div className="space-y-2">
              <Label>ملاحظة (اختياري)</Label>
              <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={saving} className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => { setNewDate(today); setShowAdd(true); }} className="gap-2 w-full">
            <Plus className="h-4 w-4" />
            إضافة موضوع جديد
          </Button>
        )}

        {/* History */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-muted-foreground">السجل</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">جاري التحميل...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا يوجد سجل بعد</p>
          ) : (
            entries.map(entry => (
              <div key={entry.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      {new Date(entry.date + 'T00:00:00').toLocaleDateString('ar-EG')}
                    </Badge>
                  </div>
                  <p className="font-medium mt-1">{entry.topic}</p>
                  {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                </div>
                <Button size="icon" variant="ghost" className="text-destructive shrink-0" onClick={() => handleDelete(entry.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
