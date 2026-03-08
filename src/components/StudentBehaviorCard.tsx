import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useStudentBehavior, type BehaviorNote } from '@/hooks/useStudentBehavior';
import { ThumbsUp, ThumbsDown, Plus, Trash2, Star } from 'lucide-react';

interface StudentBehaviorCardProps {
  studentId: string;
  filterMonth?: string;
}

export function StudentBehaviorCard({ studentId, filterMonth }: StudentBehaviorCardProps) {
  const { getStudentNotes, getStudentNotesByMonth, addNote, deleteNote, categories } = useStudentBehavior();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [type, setType] = useState<'positive' | 'negative'>('positive');
  const [category, setCategory] = useState('behavior');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const allNotes = filterMonth
    ? getStudentNotesByMonth(studentId, filterMonth)
    : getStudentNotes(studentId);

  // Show latest 20
  const displayNotes = allNotes.slice(0, 20);

  const positiveCount = allNotes.filter(n => n.type === 'positive').length;
  const negativeCount = allNotes.filter(n => n.type === 'negative').length;

  const handleAdd = async () => {
    if (!note.trim()) return;
    const success = await addNote({
      student_id: studentId,
      date,
      type,
      category,
      note: note.trim(),
    });
    if (success) {
      setNote('');
      setDialogOpen(false);
    }
  };

  const getCategoryLabel = (val: string) => categories.find(c => c.value === val)?.label || val;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            تقييم السلوك
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة ملاحظة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة ملاحظة سلوك</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={type === 'positive' ? 'default' : 'outline'}
                    className={`flex-1 gap-2 ${type === 'positive' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={() => setType('positive')}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    إيجابي
                  </Button>
                  <Button
                    variant={type === 'negative' ? 'default' : 'outline'}
                    className={`flex-1 gap-2 ${type === 'negative' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    onClick={() => setType('negative')}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    سلبي
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>التاريخ</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>الملاحظة</Label>
                  <Textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="اكتب ملاحظتك هنا..."
                    rows={3}
                  />
                </div>

                <Button onClick={handleAdd} className="w-full" disabled={!note.trim()}>
                  إضافة
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-green-500/10 rounded-xl text-center">
            <p className="text-2xl font-bold text-green-600">{positiveCount}</p>
            <p className="text-xs text-muted-foreground">إيجابي 👍</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl text-center">
            <p className="text-2xl font-bold text-red-600">{negativeCount}</p>
            <p className="text-xs text-muted-foreground">سلبي 👎</p>
          </div>
        </div>

        {displayNotes.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 text-sm">لا توجد ملاحظات سلوك مسجلة</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {displayNotes.map(n => (
              <div key={n.id} className={`flex items-start justify-between p-3 rounded-lg ${n.type === 'positive' ? 'bg-green-500/5 border border-green-500/20' : 'bg-red-500/5 border border-red-500/20'}`}>
                <div className="flex items-start gap-2 flex-1">
                  {n.type === 'positive' ? (
                    <ThumbsUp className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <ThumbsDown className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm">{n.note}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{getCategoryLabel(n.category)}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.date).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                  onClick={() => deleteNote(n.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
