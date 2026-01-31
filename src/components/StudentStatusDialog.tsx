import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type StudentBlock = {
  id: string;
  student_id: string;
  is_active: boolean;
  block_type: string;
  reason: string | null;
  triggered_by_rule_code: string | null;
  created_at: string;
  updated_at: string;
};

type AlertEvent = {
  id: string;
  student_id: string;
  rule_code: string;
  title: string;
  message: string;
  created_at: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  activeBlock: StudentBlock | null;
  blocks: StudentBlock[];
  decisionEvents: AlertEvent[];
};

export function StudentStatusDialog({
  open,
  onOpenChange,
  studentName,
  activeBlock,
  blocks,
  decisionEvents,
}: Props) {
  const freezeHistory = useMemo(() => {
    return [...blocks].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
  }, [blocks]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>حالة التجميد والسجل — {studentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-foreground">الحالة الحالية</h3>
              {activeBlock ? (
                <Badge variant="destructive">مُجمّد</Badge>
              ) : (
                <Badge variant="secondary">غير مُجمّد</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-sm text-muted-foreground">السبب</div>
                <div className="mt-1 text-sm font-medium text-foreground whitespace-pre-line">
                  {activeBlock?.reason || '—'}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-sm text-muted-foreground">آخر تحديث</div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {activeBlock?.updated_at ? new Date(activeBlock.updated_at).toLocaleString('ar-EG') : '—'}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-sm text-muted-foreground">نوع الحظر</div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {activeBlock?.block_type || '—'}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-foreground">سجل التجميد</h3>
            {freezeHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا يوجد سجل تجميد بعد.</p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>السبب</TableHead>
                      <TableHead>قاعدة التنبيه</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {freezeHistory.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(b.updated_at).toLocaleString('ar-EG')}
                        </TableCell>
                        <TableCell>
                          {b.is_active ? (
                            <Badge variant="destructive">مُجمّد</Badge>
                          ) : (
                            <Badge variant="secondary">مفكوك</Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-pre-line">{b.reason || '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{b.triggered_by_rule_code || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-foreground">سجل القرارات</h3>
            {decisionEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا يوجد قرارات مسجلة بعد.</p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>القرار</TableHead>
                      <TableHead>ملاحظة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {decisionEvents.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(e.created_at).toLocaleString('ar-EG')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{e.title}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-pre-line">{e.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
