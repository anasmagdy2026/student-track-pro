import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, Database, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { exportStudentsExcel } from '@/utils/exportExcel';
import { useGradeLevels } from '@/hooks/useGradeLevels';

// Tables backed up in order (parents first for restore)
const BACKUP_TABLES = [
  'grade_levels',
  'groups',
  'students',
  'sibling_links',
  'payments',
  'attendance',
  'exams',
  'exam_results',
  'lessons',
  'lesson_sheets',
  'lesson_recitations',
  'lesson_homework',
  'group_lesson_log',
  'group_next_session_reminders',
  'student_behavior',
  'student_blocks',
  'whatsapp_templates',
  'app_settings',
  'alert_rules',
] as const;

type TableName = typeof BACKUP_TABLES[number];

async function fetchAll(table: TableName) {
  const all: any[] = [];
  const pageSize = 1000;
  let from = 0;
  // paginate to bypass 1000-row limit
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from(table as any)
      .select('*')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

export function BackupCard() {
  const [stats, setStats] = useState({ students: 0, groups: 0, payments: 0, attendance: 0 });
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getGradeLabel } = useGradeLevels();

  useEffect(() => {
    (async () => {
      const tables: TableName[] = ['students', 'groups', 'payments', 'attendance'];
      const results = await Promise.all(
        tables.map((t) => supabase.from(t as any).select('*', { count: 'exact', head: true }))
      );
      setStats({
        students: results[0].count ?? 0,
        groups: results[1].count ?? 0,
        payments: results[2].count ?? 0,
        attendance: results[3].count ?? 0,
      });
    })();
  }, []);

  const handleBackup = async () => {
    setLoading(true);
    try {
      const payload: Record<string, any[]> = {};
      for (const t of BACKUP_TABLES) {
        payload[t] = await fetchAll(t);
      }
      const json = JSON.stringify(
        { version: 1, exported_at: new Date().toISOString(), data: payload },
        null,
        2
      );
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('تم تحميل النسخة الاحتياطية بنجاح');
    } catch (e: any) {
      toast.error(`فشل التصدير: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('تحذير: الاستيراد سيضيف البيانات الموجودة في الملف إلى قاعدة البيانات الحالية. هل تريد المتابعة؟')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed.data ?? parsed;
      if (!data || typeof data !== 'object') throw new Error('ملف غير صالح');

      let totalInserted = 0;
      for (const t of BACKUP_TABLES) {
        const rows = data[t];
        if (!Array.isArray(rows) || rows.length === 0) continue;
        // upsert by id when present, in chunks
        const chunkSize = 500;
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          const { error } = await supabase
            .from(t as any)
            .upsert(chunk, { onConflict: 'id' });
          if (error) throw new Error(`${t}: ${error.message}`);
          totalInserted += chunk.length;
        }
      }
      toast.success(`تم استيراد ${totalInserted} سجل بنجاح. أعد تحميل الصفحة لرؤية التغييرات.`);
    } catch (err: any) {
      toast.error(`فشل الاستيراد: ${err.message ?? err}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExcelExport = async () => {
    setLoading(true);
    try {
      const [students, groups, payments, attendance, exams, examResults] = await Promise.all([
        fetchAll('students'),
        fetchAll('groups'),
        fetchAll('payments'),
        fetchAll('attendance'),
        fetchAll('exams'),
        fetchAll('exam_results'),
      ]);
      exportStudentsExcel({
        students: students as any,
        payments: payments as any,
        attendance: attendance as any,
        exams: exams as any,
        examResults: examResults as any,
        groups: groups as any,
        getGradeLabel,
      });
      toast.success('تم تصدير ملف Excel بنجاح');
    } catch (e: any) {
      toast.error(`فشل التصدير: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            النسخ الاحتياطي وتصدير البيانات
          </CardTitle>
          <CardDescription>تصدير واستيراد بيانات المنصة لحفظها أو نقلها</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">نسخة احتياطية كاملة (JSON)</CardTitle>
          <CardDescription>تصدير جميع بيانات المنصة في ملف JSON واحد يمكن استعادته لاحقاً</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <div className="text-xs text-muted-foreground">طلاب</div>
              <div className="text-xl font-bold">{stats.students}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <div className="text-xs text-muted-foreground">مجموعات</div>
              <div className="text-xl font-bold">{stats.groups}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <div className="text-xs text-muted-foreground">مدفوعات</div>
              <div className="text-xl font-bold">{stats.payments}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <div className="text-xs text-muted-foreground">حضور</div>
              <div className="text-xl font-bold">{stats.attendance}</div>
            </div>
          </div>
          <Button onClick={handleBackup} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            تحميل النسخة الاحتياطية
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">استيراد نسخة احتياطية</CardTitle>
          <CardDescription>رفع ملف JSON تم تصديره مسبقاً لاستعادة البيانات</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="backup-file">اختر ملف JSON للاستيراد</Label>
          <Input
            ref={fileInputRef}
            id="backup-file"
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            disabled={importing}
          />
          {importing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري استيراد البيانات…
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            تصدير Excel
          </CardTitle>
          <CardDescription>تصدير بيانات الطلاب والمدفوعات والحضور والدرجات في ملف Excel</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExcelExport} disabled={loading} variant="outline" className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            تحميل ملف Excel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
