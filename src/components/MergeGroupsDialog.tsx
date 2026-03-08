import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Group } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Merge, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: Group[];
  getStudentCount: (groupId: string) => number;
  onMerged: () => void;
  fridayOnly?: boolean;
}

export function MergeGroupsDialog({ open, onOpenChange, groups, getStudentCount, onMerged, fridayOnly }: Props) {
  const [targetGroupId, setTargetGroupId] = useState<string>('');
  const [sourceGroupIds, setSourceGroupIds] = useState<string[]>([]);
  const [merging, setMerging] = useState(false);

  const toggleSource = (id: string) => {
    setSourceGroupIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const totalStudents = sourceGroupIds.reduce((sum, id) => sum + getStudentCount(id), 0);

  const handleMerge = async () => {
    if (!targetGroupId) { toast.error('اختر المجموعة المستهدفة'); return; }
    if (sourceGroupIds.length === 0) { toast.error('اختر مجموعة واحدة على الأقل للدمج'); return; }
    if (sourceGroupIds.includes(targetGroupId)) { toast.error('لا يمكن دمج المجموعة مع نفسها'); return; }

    setMerging(true);
    try {
      // Move all students from source groups to target group
      const { error } = await supabase
        .from('students')
        .update({ group_id: targetGroupId })
        .in('group_id', sourceGroupIds);

      if (error) throw error;

      toast.success(`تم نقل ${totalStudents} طالب إلى المجموعة المستهدفة`);
      setSourceGroupIds([]);
      setTargetGroupId('');
      onMerged();
      onOpenChange(false);
    } catch (err) {
      toast.error('حدث خطأ أثناء الدمج');
      console.error(err);
    }
    setMerging(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5 text-primary" />
            {fridayOnly ? 'دمج مجموعات حصص الجمعة' : 'دمج المجموعات'}
          </DialogTitle>
          <DialogDescription>
            {fridayOnly
              ? 'نقل طلاب مجموعات الجمعة المختارة إلى مجموعة مستهدفة'
              : 'نقل طلاب المجموعات المختارة إلى مجموعة مستهدفة'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Target Group */}
          <div className="space-y-2">
            <label className="text-sm font-medium">المجموعة المستهدفة (التي سيُنقل إليها الطلاب)</label>
            <Select value={targetGroupId} onValueChange={setTargetGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المجموعة المستهدفة" />
              </SelectTrigger>
              <SelectContent>
                {(fridayOnly ? groups.filter(g => g.has_friday_session) : groups).map(g => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name} ({getStudentCount(g.id)} طالب)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source Groups */}
          <div className="space-y-2">
            <label className="text-sm font-medium">المجموعات المراد دمجها (نقل طلابها)</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {groups.filter(g => g.id !== targetGroupId).map(g => {
                const count = getStudentCount(g.id);
                return (
                  <label key={g.id} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted/50">
                    <Checkbox
                      checked={sourceGroupIds.includes(g.id)}
                      onCheckedChange={() => toggleSource(g.id)}
                    />
                    <span className="flex-1">{g.name}</span>
                    <span className="text-xs text-muted-foreground">{count} طالب</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          {sourceGroupIds.length > 0 && targetGroupId && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold">سيتم نقل {totalStudents} طالب</p>
                <p className="text-muted-foreground">
                  من {sourceGroupIds.length} مجموعة إلى "{groups.find(g => g.id === targetGroupId)?.name}"
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button
            onClick={handleMerge}
            disabled={merging || !targetGroupId || sourceGroupIds.length === 0}
            className="gap-2"
          >
            <Merge className="h-4 w-4" />
            {merging ? 'جاري الدمج...' : 'تنفيذ الدمج'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
