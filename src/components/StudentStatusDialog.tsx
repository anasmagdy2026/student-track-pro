import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Snowflake, Trash2, Undo2 } from 'lucide-react';

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
  onFreeze: (reason: string) => Promise<void>;
  onUnfreeze: () => Promise<void>;
  onDeleteFreezeBlock: (blockId: string) => Promise<void>;
};

export function StudentStatusDialog({
  open,
  onOpenChange,
  studentName,
  activeBlock,
  blocks,
  decisionEvents,
  onFreeze,
  onUnfreeze,
  onDeleteFreezeBlock,
}: Props) {
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
  const [freezeReason, setFreezeReason] = useState('');
  const [busy, setBusy] = useState<'unfreeze' | 'delete' | null>(null);

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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              إدارة التجميد من نفس النافذة.
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!activeBlock && (
                <Button
                  variant="secondary"
                  disabled={busy !== null}
                  onClick={async () => {
                    const reason = freezeReason.trim() || 'قرار يدوي: تجميد كامل';
                    try {
                      setBusy('unfreeze');
                      await onFreeze(reason);
                      setFreezeReason('');
                    } finally {
                      setBusy(null);
                    }
                  }}
                  className="gap-2"
                >
                  <Snowflake className="h-4 w-4" />
                  تجميد كامل
                </Button>
              )}

              {activeBlock && (
                <Button
                  variant="outline"
                  disabled={busy !== null}
                  onClick={async () => {
                    try {
                      setBusy('unfreeze');
                      await onUnfreeze();
                    } finally {
                      setBusy(null);
                    }
                  }}
                  className="gap-2"
                >
                  <Undo2 className="h-4 w-4" />
                  فك التجميد
                </Button>
              )}
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-foreground">الحالة الحالية</h3>
              {activeBlock ? (
                <Badge variant="destructive">مُجمّد</Badge>
              ) : (
                <Badge variant="secondary">غير مُجمّد</Badge>
              )}
            </div>

            {!activeBlock && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="text-sm font-medium text-foreground">سبب التجميد (اختياري)</div>
                <Textarea
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  placeholder="مثال: غير مدفوع للشهر الحالي"
                  className="min-h-[80px]"
                />
              </div>
            )}

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
                      <TableHead />
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
                        <TableCell className="whitespace-nowrap">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            disabled={busy !== null}
                            onClick={() => setDeleteBlockId(b.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </Button>
                        </TableCell>
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

        <ConfirmDialog
          open={!!deleteBlockId}
          onOpenChange={(open) => {
            if (!open) setDeleteBlockId(null);
          }}
          variant="destructive"
          title="حذف سجل التجميد"
          description="سيتم حذف هذا السجل فقط من سجل التجميد. هل أنت متأكد؟"
          confirmText="حذف"
          cancelText="إلغاء"
          onConfirm={async () => {
            if (!deleteBlockId) return;
            try {
              setBusy('delete');
              await onDeleteFreezeBlock(deleteBlockId);
              setDeleteBlockId(null);
            } finally {
              setBusy(null);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
