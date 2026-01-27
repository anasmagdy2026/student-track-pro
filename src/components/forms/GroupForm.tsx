import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GROUP_DAY_PATTERNS } from '@/types';

interface GroupFormProps {
  initialData?: {
    name: string;
    grade: '1' | '2' | '3';
    days: string[];
    time: string;
  };
  onSubmit: (data: {
    name: string;
    grade: '1' | '2' | '3';
    days: string[];
    time: string;
  }) => void;
  isEdit?: boolean;
}

export function GroupForm({ initialData, onSubmit, isEdit = false }: GroupFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [grade, setGrade] = useState<'1' | '2' | '3'>(initialData?.grade || '1');
  const [days, setDays] = useState<string[]>(
    initialData?.days || ['السبت', 'الإثنين', 'الأربعاء']
  );
  const [time, setTime] = useState(initialData?.time || '10:00');

  const handleSubmit = () => {
    onSubmit({ name, grade, days, time });
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
        <label className="text-sm font-medium">أيام الحصة</label>
        <Select
          value={days.join(',')}
          onValueChange={(value) => setDays(value.split(','))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GROUP_DAY_PATTERNS.map((pattern) => (
              <SelectItem key={pattern.label} value={pattern.days.join(',')}>
                {pattern.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">وقت الحصة</label>
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          dir="ltr"
        />
      </div>

      <Button onClick={handleSubmit} className="w-full">
        {isEdit ? 'حفظ التعديلات' : 'إضافة المجموعة'}
      </Button>
    </div>
  );
}
