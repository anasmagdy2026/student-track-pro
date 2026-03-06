import { useMemo, useRef, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useStudents } from '@/hooks/useStudents';
import { useGroups } from '@/hooks/useGroups';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { PrintableStudentCard } from '@/components/PrintableStudentCard';
import { toast } from 'sonner';
import { Printer, Search, Users } from 'lucide-react';
import { PageLoading } from '@/components/PageLoading';

export default function PrintCards() {
  const { students, loading: studentsLoading } = useStudents();
  const { groups, loading: groupsLoading, getGroupById, getGroupsByGrade } = useGroups();
  const { activeGradeLevels, loading: gradeLevelsLoading } = useGradeLevels();

  const isLoading = studentsLoading || groupsLoading || gradeLevelsLoading;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const printAreaRef = useRef<HTMLDivElement>(null);

  const filteredGroups = useMemo(() => {
    if (filterGrade === 'all') return groups;
    return getGroupsByGrade(filterGrade);
  }, [filterGrade, groups, getGroupsByGrade]);

  const filteredStudents = useMemo(() => {
    const q = searchTerm.trim();
    return students
      .filter((s) => {
        const matchesSearch = !q || s.name.includes(q) || s.code.includes(q);
        const matchesGrade = filterGrade === 'all' || s.grade === filterGrade;
        const matchesGroup = filterGroup === 'all' || s.group_id === filterGroup;
        return matchesSearch && matchesGrade && matchesGroup;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [students, searchTerm, filterGrade, filterGroup]);

  const selectedStudents = useMemo(() => {
    return filteredStudents.filter((s) => selectedIds[s.id]);
  }, [filteredStudents, selectedIds]);

  const allOnPageSelected = filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length;

  const toggleSelectAllOnPage = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      for (const s of filteredStudents) {
        next[s.id] = checked;
      }
      return next;
    });
  };

  const toggleStudent = (studentId: string, checked: boolean) => {
    setSelectedIds((prev) => ({ ...prev, [studentId]: checked }));
  };

  const clearSelection = () => setSelectedIds({});

  const printSelected = () => {
    if (selectedStudents.length === 0) {
      toast.error('اختر طالب واحد على الأقل للطباعة');
      return;
    }
    if (!printAreaRef.current) return;

    const html = printAreaRef.current.outerHTML;
    const title = `طباعة-كروت-${selectedStudents.length}`;

    // Always use iframe+srcdoc (more reliable than popup for avoiding blank print pages)
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('aria-hidden', 'true');

      const srcdoc = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
    <style>
      @page { size: A4; margin: 10mm; }
      html, body { direction: rtl; }
      body { font-family: 'Cairo', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #fff; margin: 0; }

      /* 4 cards per page (2 columns) */
      .print-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8mm;
        align-items: start;
      }

      /* Card sizing: 3.37in x 2.125in */
      .print-card {
        width: 3.37in;
        height: 2.125in;
        break-inside: avoid;
        page-break-inside: avoid;
        overflow: hidden;
        position: relative;
        border-radius: 12px;
        border: 3px solid #2d6b4f;
        background: linear-gradient(135deg, #f8faf9 0%, #eef3f0 100%);
      }
      .print-card__border-text {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
      }
      .print-card__border-text span {
        position: absolute;
        font-size: 6px;
        font-weight: 700;
        color: rgba(45,107,79,0.15);
        letter-spacing: 2px;
        white-space: nowrap;
        font-family: Arial, sans-serif;
      }
      .print-card__border-text-top { top: 2px; left: 0; right: 0; text-align: center; }
      .print-card__border-text-bottom { bottom: 2px; left: 0; right: 0; text-align: center; }
      .print-card__border-text-left {
        top: 50%; left: -30px;
        transform: rotate(90deg) translateX(-50%);
        transform-origin: center;
      }
      .print-card__border-text-right {
        top: 50%; right: -30px;
        transform: rotate(-90deg) translateX(50%);
        transform-origin: center;
      }
      .print-card__inner {
        padding: 4mm 5mm 3mm;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        z-index: 1;
      }
      .print-card__header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-bottom: 1mm;
        background: linear-gradient(90deg, transparent, rgba(45,107,79,0.08), transparent);
        padding: 1mm 0;
        border-radius: 4px;
      }
      .print-card__laurel { font-size: 14px; }
      .print-card__title {
        margin: 0;
        font-size: 11px;
        font-weight: 800;
        color: #2d6b4f;
      }
      .print-card__body {
        display: flex;
        align-items: center;
        gap: 4mm;
        flex: 1;
        direction: ltr;
      }
      .print-card__qr {
        flex-shrink: 0;
      }
      .print-card__qr-frame {
        background: white;
        border: 2px solid rgba(45,107,79,0.2);
        border-radius: 6px;
        padding: 3px;
      }
      .print-card__info {
        flex: 1;
        text-align: right;
        direction: rtl;
      }
      .print-card__name {
        font-size: 15px;
        font-weight: 800;
        color: #1a1a1a;
        margin-bottom: 2mm;
        line-height: 1.3;
      }
      .print-card__code {
        font-size: 16px;
        font-weight: 700;
        color: #333;
        font-family: 'Courier New', monospace;
        letter-spacing: 1px;
      }
      .print-card__footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1mm;
        padding-top: 1mm;
        border-top: 1px solid rgba(45,107,79,0.15);
      }
      .print-card__footer-code {
        font-size: 10px;
        font-weight: 700;
        color: #333;
        font-family: 'Courier New', monospace;
      }
      .print-card__footer-grade {
        font-size: 10px;
        font-weight: 700;
        color: #2d6b4f;
      }
    </style>
  </head>
  <body>
    ${html}
  </body>
</html>`;

      iframe.onload = () => {
        const w = iframe.contentWindow;
        if (!w) return;
        // Give layout/fonts a tick to settle to avoid blank output
        setTimeout(() => {
          w.focus();
          w.print();
          setTimeout(() => iframe.remove(), 1500);
        }, 200);
      };

      iframe.srcdoc = srcdoc;
      document.body.appendChild(iframe);
    } catch (e) {
      console.error('Print cards failed:', e);
      toast.error('تعذر بدء الطباعة. جرّب مرة أخرى.');
    }
  };

  return (
    <Layout>
      {isLoading ? (
        <PageLoading title="جاري تحميل بيانات الطباعة" description="بنجهّز الطلاب والمجموعات…" />
      ) : (
        <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">طباعة كروت الطلاب</h1>
            <p className="text-muted-foreground mt-1">اختر الطلاب ثم اطبع الكروت المحددة فقط</p>
          </div>
          <Button onClick={printSelected} className="gap-2">
            <Printer className="h-5 w-5" />
            طباعة الكروت المحددة ({selectedStudents.length})
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث بالاسم أو الكود..."
                  className="pr-10"
                />
              </div>

              <Select
                value={filterGrade}
                onValueChange={(v) => {
                  setFilterGrade(v);
                  setFilterGroup('all');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="السنة الدراسية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل السنوات</SelectItem>
                  {activeGradeLevels.map((g) => (
                    <SelectItem key={g.code} value={g.code} disabled={gradeLevelsLoading}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="المجموعة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المجموعات</SelectItem>
                  {filteredGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} ({g.days.join(' - ')}) - {g.time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <Checkbox checked={allOnPageSelected} onCheckedChange={(v) => toggleSelectAllOnPage(v === true)} />
                <span>تحديد كل الطلاب في النتائج الحالية ({filteredStudents.length})</span>
              </label>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={clearSelection} disabled={Object.values(selectedIds).every((v) => !v)}>
                  مسح التحديد
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              قائمة الطلاب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredStudents.length === 0 ? (
              <p className="text-muted-foreground">لا يوجد طلاب مطابقين للبحث/الفلاتر.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredStudents.map((s) => {
                  const group = s.group_id ? getGroupById(s.group_id) : null;
                  const checked = !!selectedIds[s.id];
                  return (
                    <label
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={checked} onCheckedChange={(v) => toggleStudent(s.id, v === true)} />
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-sm text-muted-foreground" dir="ltr">
                            {s.code}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground text-left">
                        {group?.name || '-'}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hidden print area */}
        <div className="sr-only" aria-hidden="true">
          <div ref={printAreaRef} className="print-grid">
            {selectedStudents.map((s) => (
              <PrintableStudentCard key={s.id} student={s} group={s.group_id ? getGroupById(s.group_id) : null} />
            ))}
          </div>
        </div>
        </div>
      )}
    </Layout>
  );
}
