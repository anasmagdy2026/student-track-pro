import { useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useStudents } from '@/hooks/useStudents';
import { useAlertEvents } from '@/hooks/useAlertEvents';
import { useAlertRules } from '@/hooks/useAlertRules';
import { useStudentBlocks } from '@/hooks/useStudentBlocks';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Snowflake, Undo2, Search } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const severityVariant = (severity: string): 'default' | 'secondary' | 'destructive' => {
  if (severity === 'critical') return 'destructive';
  if (severity === 'warning') return 'secondary';
  return 'default';
};

export default function Alerts() {
  const { students } = useStudents();
  const { events, resolveEvent, createEvent } = useAlertEvents();
  const { rules, loading: rulesLoading, setRuleActive } = useAlertRules();
  const { isBlocked, getActiveBlock, freezeStudent, unfreezeStudent } = useStudentBlocks();

  const [query, setQuery] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [togglingRuleIds, setTogglingRuleIds] = useState<Set<string>>(new Set());

  const handleToggleRule = async (ruleId: string, nextActive: boolean) => {
    setTogglingRuleIds((prev) => new Set(prev).add(ruleId));
    try {
      await setRuleActive(ruleId, nextActive);
      toast.success(nextActive ? 'تم تفعيل التنبيه' : 'تم تعطيل التنبيه');
    } catch {
      toast.error('تعذر تحديث حالة التنبيه');
    } finally {
      setTogglingRuleIds((prev) => {
        const copy = new Set(prev);
        copy.delete(ruleId);
        return copy;
      });
    }
  };

  const studentById = useMemo(() => {
    const map = new Map<string, (typeof students)[number]>();
    for (const s of students) map.set(s.id, s);
    return map;
  }, [students]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events
      .filter((e) => (showResolved ? true : e.status === 'open'))
      .filter((e) => {
        if (!q) return true;
        const st = studentById.get(e.student_id);
        return (
          e.title.toLowerCase().includes(q) ||
          e.message.toLowerCase().includes(q) ||
          e.rule_code.toLowerCase().includes(q) ||
          (st?.name?.toLowerCase().includes(q) ?? false) ||
          (st?.code?.toLowerCase().includes(q) ?? false)
        );
      });
  }, [events, query, showResolved, studentById]);

  const handleFreeze = async (studentId: string, ruleCode?: string) => {
    try {
      await freezeStudent({
        studentId,
        reason: 'قرار يدوي من شاشة التنبيهات: تجميد كامل',
        triggeredByRuleCode: ruleCode,
      });
      // سجل قرار بسيط في التنبيهات (اختياري)
      try {
        await createEvent({
          studentId,
          ruleCode: 'decision_freeze' as any,
          title: 'قرار: تجميد كامل',
          message: 'تم اتخاذ قرار تجميد كامل من شاشة التنبيهات.',
          severity: 'info',
          context: { source: 'alerts_page' },
        });
      } catch {
        // ignore
      }
      toast.success('تم تجميد الطالب');
    } catch {
      toast.error('تعذر تجميد الطالب');
    }
  };

  const handleUnfreeze = async (studentId: string) => {
    try {
      await unfreezeStudent(studentId);
      try {
        await createEvent({
          studentId,
          ruleCode: 'decision_unfreeze' as any,
          title: 'قرار: فك التجميد',
          message: 'تم فك التجميد من شاشة التنبيهات.',
          severity: 'info',
          context: { source: 'alerts_page' },
        });
      } catch {
        // ignore
      }
      toast.success('تم فك التجميد');
    } catch {
      toast.error('تعذر فك التجميد');
    }
  };

  const handleResolve = async (eventId: string, studentId: string) => {
    try {
      await resolveEvent(eventId);
      try {
        await createEvent({
          studentId,
          ruleCode: 'decision_resolve' as any,
          title: 'قرار: حلّ التنبيه',
          message: 'تم حلّ التنبيه من شاشة التنبيهات.',
          severity: 'info',
          context: { source: 'alerts_page', resolved_event_id: eventId },
        });
      } catch {
        // ignore
      }
      toast.success('تم حلّ التنبيه');
    } catch {
      toast.error('تعذر حلّ التنبيه');
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">التنبيهات</h1>
            <p className="text-muted-foreground mt-1">عرض التنبيهات المفتوحة وإدارة القرارات (تجميد/فك/حلّ)</p>
          </div>
          <Button
            variant={showResolved ? 'secondary' : 'outline'}
            onClick={() => setShowResolved((v) => !v)}
          >
            {showResolved ? 'عرض المفتوح فقط' : 'إظهار المحلول'}
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث باسم الطالب / الكود / عنوان التنبيه / القاعدة..."
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>قواعد التنبيهات (تفعيل / تعطيل)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rulesLoading ? (
              <div className="text-sm text-muted-foreground">جاري تحميل القواعد...</div>
            ) : rules.length === 0 ? (
              <div className="text-sm text-muted-foreground">لا توجد قواعد تنبيهات حالياً.</div>
            ) : (
              <div className="space-y-2">
                {rules.map((r) => {
                  const busy = togglingRuleIds.has(r.id);
                  return (
                    <div
                      key={r.id}
                      className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium text-foreground truncate">{r.title}</div>
                          <Badge variant={severityVariant(r.severity)}>
                            {r.severity === 'critical' ? 'حرج' : r.severity === 'warning' ? 'تحذير' : 'معلومة'}
                          </Badge>
                          <Badge variant="outline" className="font-mono text-xs">
                            {r.code}
                          </Badge>
                        </div>
                        {r.description && (
                          <div className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                            {r.description}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm text-muted-foreground">{r.is_active ? 'مفعل' : 'معطل'}</span>
                        <Switch
                          dir="ltr"
                          checked={r.is_active}
                          disabled={busy}
                          onCheckedChange={(checked) => handleToggleRule(r.id, checked)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              لا توجد تنبيهات {showResolved ? '' : 'مفتوحة'} حالياً.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((e) => {
              const student = studentById.get(e.student_id);
              const blocked = isBlocked(e.student_id);
              const block = getActiveBlock(e.student_id);

              return (
                <Card key={e.id} className={e.status === 'open' ? 'border-warning/40' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-warning" />
                          <span>{e.title}</span>
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            الطالب: <span className="font-medium text-foreground">{student?.name ?? '—'}</span>
                          </span>
                          <span>•</span>
                          <span>
                            الكود: <span className="font-medium text-foreground">{student?.code ?? '—'}</span>
                          </span>
                          <span>•</span>
                          <span>
                            القاعدة: <span className="font-medium text-foreground">{e.rule_code}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={severityVariant(e.severity)}>
                          {e.severity === 'critical' ? 'حرج' : e.severity === 'warning' ? 'تحذير' : 'معلومة'}
                        </Badge>
                        <Badge variant={e.status === 'open' ? 'secondary' : 'default'}>
                          {e.status === 'open' ? 'مفتوح' : 'محلول'}
                        </Badge>
                        {blocked && <Badge variant="destructive">مُجمّد</Badge>}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm leading-6 whitespace-pre-line">{e.message}</p>

                    <Separator />

                    <div className="text-sm">
                      <div className="font-medium mb-2">تاريخ القرارات</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">إنشاء:</span>{' '}
                          {new Date(e.created_at).toLocaleString('ar-EG')}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">حلّ:</span>{' '}
                          {e.resolved_at ? new Date(e.resolved_at).toLocaleString('ar-EG') : '—'}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">آخر تحديث للتجميد:</span>{' '}
                          {block?.updated_at ? new Date(block.updated_at).toLocaleString('ar-EG') : '—'}
                        </div>
                      </div>
                      {block?.reason && (
                        <div className="mt-2 text-muted-foreground">
                          <span className="font-medium text-foreground">سبب التجميد:</span> {block.reason}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
                      {blocked ? (
                        <Button variant="outline" onClick={() => handleUnfreeze(e.student_id)}>
                          <Undo2 className="h-4 w-4 ml-2" />
                          فك التجميد
                        </Button>
                      ) : (
                        <Button variant="secondary" onClick={() => handleFreeze(e.student_id, e.rule_code)}>
                          <Snowflake className="h-4 w-4 ml-2" />
                          تجميد كامل
                        </Button>
                      )}

                      <Button
                        variant="default"
                        onClick={() => handleResolve(e.id, e.student_id)}
                        disabled={e.status !== 'open'}
                      >
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                        حلّ التنبيه
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
