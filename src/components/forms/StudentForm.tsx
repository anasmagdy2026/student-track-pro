import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Group } from '@/types';
import { z } from 'zod';
import { toast } from 'sonner';
import { useGradeLevels } from '@/hooks/useGradeLevels';

type StudentFormData = {
  name: string;
  grade: string;
  group_id: string;
  parent_phone: string;
  student_phone?: string;
  monthly_fee: number;
};

interface StudentFormProps {
  initialData?: {
    name: string;
    grade: string;
    group_id: string;
    parent_phone: string;
    student_phone?: string;
    monthly_fee: number;
  };
  groups: Group[];
  getGroupsByGrade: (grade: string) => Group[];
  onSubmit: (data: {
    name: string;
    grade: string;
    group_id: string;
    parent_phone: string;
    student_phone?: string;
    monthly_fee: number;
  }) => void;
  isEdit?: boolean;
}

export function StudentForm({
  initialData,
  groups,
  getGroupsByGrade,
  onSubmit,
  isEdit = false,
}: StudentFormProps) {
  const { activeGradeLevels } = useGradeLevels();
  const firstGrade = activeGradeLevels[0]?.code ?? 'sec1';
  const [name, setName] = useState(initialData?.name || '');
  const [grade, setGrade] = useState<string>(initialData?.grade || firstGrade);
  const [groupId, setGroupId] = useState(initialData?.group_id || '');
  const [parentPhone, setParentPhone] = useState(initialData?.parent_phone || '');
  const [studentPhone, setStudentPhone] = useState(initialData?.student_phone || '');
  const [monthlyFee, setMonthlyFee] = useState(initialData?.monthly_fee || 0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableGroups = getGroupsByGrade(grade);

  const schema = z.object({
    name: z
      .string()
      .trim()
      .min(2, 'اسم الطالب قصير جداً')
      .max(100, 'اسم الطالب طويل جداً'),
    grade: z.string().min(1, 'اختر السنة الدراسية'),
    group_id: z.string().min(1, 'اختر مجموعة'),
    parent_phone: z
      .string()
      .trim()
      .regex(/^01\d{9}$/, 'رقم واتساب ولي الأمر غير صحيح (مثال: 01xxxxxxxxx)'),
    student_phone: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v && v.length ? v : undefined))
      .refine((v) => v === undefined || /^01\d{9}$/.test(v), {
        message: 'رقم هاتف الطالب غير صحيح (مثال: 01xxxxxxxxx)',
      }),
    monthly_fee: z
      .number({ invalid_type_error: 'قيمة الدرس الشهرية غير صحيحة' })
      .min(0, 'القيمة لا يمكن أن تكون سالبة')
      .max(100000, 'القيمة كبيرة جداً'),
  });

  // إعادة تعيين المجموعة عند تغيير السنة الدراسية
  useEffect(() => {
    if (!isEdit) {
      setGroupId('');
    }
  }, [grade, isEdit]);

  const handleSubmit = () => {
    const parsed = schema.safeParse({
      name,
      grade,
      group_id: groupId,
      parent_phone: parentPhone,
      student_phone: studentPhone,
      monthly_fee: Number.isFinite(monthlyFee) ? monthlyFee : NaN,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      toast.error(Object.values(nextErrors)[0] ?? 'بيانات غير صحيحة');
      return;
    }

    setErrors({});
    onSubmit(parsed.data as StudentFormData);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">اسم الطالب</label>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((p) => ({ ...p, name: '' }));
          }}
          placeholder="أدخل اسم الطالب"
        />
        {!!errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">السنة الدراسية</label>
        <Select
          value={grade}
          onValueChange={(value) => {
            setGrade(value);
            if (errors.grade) setErrors((p) => ({ ...p, grade: '' }));
          }}
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
        <label className="text-sm font-medium">المجموعة</label>
        <Select
          value={groupId}
          onValueChange={(v) => {
            setGroupId(v);
            if (errors.group_id) setErrors((p) => ({ ...p, group_id: '' }));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر المجموعة" />
          </SelectTrigger>
          <SelectContent>
            {availableGroups.length > 0 ? (
              availableGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name} ({group.time}) - {group.days.join(' / ')}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                لا توجد مجموعات لهذه السنة الدراسية
              </div>
            )}
          </SelectContent>
        </Select>
        {!!errors.group_id && <p className="text-xs text-destructive">{errors.group_id}</p>}
        {availableGroups.length === 0 && (
          <p className="text-xs text-muted-foreground">
            قم بإنشاء مجموعة لهذه السنة الدراسية أولاً
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">رقم واتساب ولي الأمر</label>
        <Input
          value={parentPhone}
          onChange={(e) => {
            setParentPhone(e.target.value);
            if (errors.parent_phone) setErrors((p) => ({ ...p, parent_phone: '' }));
          }}
          placeholder="01xxxxxxxxx"
          dir="ltr"
        />
        {!!errors.parent_phone && <p className="text-xs text-destructive">{errors.parent_phone}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">رقم هاتف الطالب (اختياري)</label>
        <Input
          value={studentPhone}
          onChange={(e) => {
            setStudentPhone(e.target.value);
            if (errors.student_phone) setErrors((p) => ({ ...p, student_phone: '' }));
          }}
          placeholder="01xxxxxxxxx"
          dir="ltr"
        />
        {!!errors.student_phone && <p className="text-xs text-destructive">{errors.student_phone}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">قيمة الدرس الشهرية (جنيه)</label>
        <Input
          type="number"
          value={monthlyFee || ''}
          onChange={(e) => {
            setMonthlyFee(Number(e.target.value));
            if (errors.monthly_fee) setErrors((p) => ({ ...p, monthly_fee: '' }));
          }}
          placeholder="0"
          dir="ltr"
        />
        {!!errors.monthly_fee && <p className="text-xs text-destructive">{errors.monthly_fee}</p>}
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full"
        disabled={availableGroups.length === 0 && !isEdit}
      >
        {isEdit ? 'حفظ التعديلات' : 'إضافة الطالب'}
      </Button>
    </div>
  );
}
