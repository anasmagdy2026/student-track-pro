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

interface StudentFormProps {
  initialData?: {
    name: string;
    grade: '1' | '2' | '3';
    group_id: string;
    parent_phone: string;
    student_phone?: string;
    monthly_fee: number;
  };
  groups: Group[];
  getGroupsByGrade: (grade: string) => Group[];
  onSubmit: (data: {
    name: string;
    grade: '1' | '2' | '3';
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
  const [name, setName] = useState(initialData?.name || '');
  const [grade, setGrade] = useState<'1' | '2' | '3'>(initialData?.grade || '1');
  const [groupId, setGroupId] = useState(initialData?.group_id || '');
  const [parentPhone, setParentPhone] = useState(initialData?.parent_phone || '');
  const [studentPhone, setStudentPhone] = useState(initialData?.student_phone || '');
  const [monthlyFee, setMonthlyFee] = useState(initialData?.monthly_fee || 0);

  const availableGroups = getGroupsByGrade(grade);

  // إعادة تعيين المجموعة عند تغيير السنة الدراسية
  useEffect(() => {
    if (!isEdit) {
      setGroupId('');
    }
  }, [grade, isEdit]);

  const handleSubmit = () => {
    onSubmit({
      name,
      grade,
      group_id: groupId,
      parent_phone: parentPhone,
      student_phone: studentPhone || undefined,
      monthly_fee: monthlyFee,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">اسم الطالب</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="أدخل اسم الطالب"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">السنة الدراسية</label>
        <Select
          value={grade}
          onValueChange={(value: '1' | '2' | '3') => setGrade(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">أولى ثانوي</SelectItem>
            <SelectItem value="2">تانية ثانوي</SelectItem>
            <SelectItem value="3">تالتة ثانوي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">المجموعة</label>
        <Select value={groupId} onValueChange={setGroupId}>
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
          onChange={(e) => setParentPhone(e.target.value)}
          placeholder="01xxxxxxxxx"
          dir="ltr"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">رقم هاتف الطالب (اختياري)</label>
        <Input
          value={studentPhone}
          onChange={(e) => setStudentPhone(e.target.value)}
          placeholder="01xxxxxxxxx"
          dir="ltr"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">قيمة الدرس الشهرية (جنيه)</label>
        <Input
          type="number"
          value={monthlyFee || ''}
          onChange={(e) => setMonthlyFee(Number(e.target.value))}
          placeholder="0"
          dir="ltr"
        />
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
