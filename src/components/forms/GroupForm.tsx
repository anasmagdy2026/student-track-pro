import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DAYS_AR, GROUP_DAY_PATTERNS } from '@/types';
import { useGradeLevels } from '@/hooks/useGradeLevels';

interface GroupFormProps {
  initialData?: {
    name: string;
    grade: string;
    days: string[];
    time: string;
    time_from?: string | null;
    time_to?: string | null;
  };
  onSubmit: (data: {
    name: string;
    grade: string;
    days: string[];
    time: string;
    time_from: string | null;
    time_to: string | null;
  }) => void;
  isEdit?: boolean;
}

export function GroupForm({ initialData, onSubmit, isEdit = false }: GroupFormProps) {
  const { activeGradeLevels } = useGradeLevels();
  const firstGrade = activeGradeLevels[0]?.code ?? 'sec1';
  const [name, setName] = useState(initialData?.name || '');
  const [grade, setGrade] = useState<string>(initialData?.grade || firstGrade);
  const [days, setDays] = useState<string[]>(
    initialData?.days || ['السبت', 'الإثنين', 'الأربعاء']
  );
  const [time, setTime] = useState(initialData?.time || '10:00');
  const [timeFrom, setTimeFrom] = useState(initialData?.time_from || '');
  const [timeTo, setTimeTo] = useState(initialData?.time_to || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPatternLabel = (valueDays: string[]) => {
    const match = GROUP_DAY_PATTERNS.find((p) =>
      p.days.length === valueDays.length && p.days.every((d, idx) => d === valueDays[idx])
    );
    return match?.label;
  };

  const initialMode: 'pattern' | 'custom' = getPatternLabel(days) ? 'pattern' : 'custom';
  const [daysMode, setDaysMode] = useState<'pattern' | 'custom'>(initialMode);

  const handleToggleDay = (day: string, checked: boolean) => {
    setDays((prev) => {
      const next = checked
        ? (prev.includes(day) ? prev : [...prev, day])
        : prev.filter((d) => d !== day);

      // Keep a consistent order in UI (based on DAYS_AR)
      const order = new Map(DAYS_AR.map((d, i) => [d, i] as const));
      return [...next].sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999));
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        grade,
        days,
        time,
        time_from: timeFrom || null,
        time_to: timeTo || null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">اسم المجموعة</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: مجموعة الساعة 10"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">السنة الدراسية</label>
        <Select
          value={grade}
          onValueChange={(value) => setGrade(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {activeGradeLevels.map((g) => (
              <SelectItem key={g.code} value={g.code}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">أيام الحصة</label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={daysMode === 'pattern' ? 'default' : 'outline'}
            onClick={() => {
              setDaysMode('pattern');
              if (!getPatternLabel(days)) {
                setDays(GROUP_DAY_PATTERNS[0]?.days || []);
              }
            }}
          >
            أنماط جاهزة
          </Button>
          <Button
            type="button"
            variant={daysMode === 'custom' ? 'default' : 'outline'}
            onClick={() => {
              setDaysMode('custom');
              if (days.length === 0) setDays(['السبت']);
            }}
          >
            أيام مخصصة
          </Button>
          <div className="flex items-center justify-end text-sm text-muted-foreground">
            {days.length ? days.join(' - ') : '—'}
          </div>
        </div>

        {daysMode === 'pattern' ? (
          <Select
            value={getPatternLabel(days) ? days.join(',') : GROUP_DAY_PATTERNS[0]?.days.join(',')}
            onValueChange={(value) => setDays(value.split(','))}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر النمط" />
            </SelectTrigger>
            <SelectContent>
              {GROUP_DAY_PATTERNS.map((pattern) => (
                <SelectItem key={pattern.label} value={pattern.days.join(',')}>
                  {pattern.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3">
            {DAYS_AR.map((day) => {
              const checked = days.includes(day);
              return (
                <label key={day} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => handleToggleDay(day, v === true)}
                  />
                  <span>{day}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">وقت الحصة (للعرض)</label>
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          dir="ltr"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">وقت البداية (من)</label>
          <Input
            type="time"
            value={timeFrom}
            onChange={(e) => setTimeFrom(e.target.value)}
            dir="ltr"
            placeholder="مثال: 10:00"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">وقت النهاية (إلى)</label>
          <Input
            type="time"
            value={timeTo}
            onChange={(e) => setTimeTo(e.target.value)}
            dir="ltr"
            placeholder="مثال: 11:30"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        يُستخدم وقت النهاية لمنع تسجيل الحضور بعد انتهاء الحصة
      </p>

      <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري الحفظ...
          </>
        ) : isEdit ? (
          'حفظ التعديلات'
        ) : (
          'إضافة المجموعة'
        )}
      </Button>
    </div>
  );
}
