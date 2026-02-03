import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStudents } from '@/hooks/useStudents';
import { useGroups } from '@/hooks/useGroups';
import { usePayments } from '@/hooks/usePayments';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { MONTHS_AR } from '@/types';
import { FileText, Printer, Users, XCircle } from 'lucide-react';

interface MonthlyUnpaidReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MonthlyUnpaidReport({ open, onOpenChange }: MonthlyUnpaidReportProps) {
  const { students } = useStudents();
  const { groups, getGroupById } = useGroups();
  const { isMonthPaid } = usePayments();
  const { getGradeLabel } = useGradeLevels();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthNum = currentDate.getMonth() + 1;
  const currentMonth = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const printRef = useRef<HTMLDivElement>(null);

  // Generate month options
  const monthOptions = [];
  for (let i = -6; i <= 2; i++) {
    const date = new Date(currentYear, currentMonthNum - 1 + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    monthOptions.push({
      value,
      label: `${MONTHS_AR[monthIndex]} ${year}`,
    });
  }

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
    const matchesGroup = selectedGroup === 'all' || student.group_id === selectedGroup;
    return matchesGrade && matchesGroup;
  });

  // Get unpaid students
  const unpaidStudents = filteredStudents.filter(s => !isMonthPaid(s.id, selectedMonth));
  const totalUnpaid = unpaidStudents.reduce((sum, s) => sum + s.monthly_fee, 0);

  const monthName = (() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return `${MONTHS_AR[month - 1]} ${year}`;
  })();

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير المتأخرين في الدفع - ${monthName}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            direction: rtl;
          }
          h1 {
            text-align: center;
            color: #333;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .summary {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: right;
          }
          th {
            background: #333;
            color: white;
          }
          tr:nth-child(even) {
            background: #f9f9f9;
          }
          .total {
            font-weight: bold;
            font-size: 18px;
            color: #dc2626;
          }
          .print-date {
            text-align: center;
            color: #666;
            margin-top: 20px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        ${printContents}
        <div class="print-date">
          تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تقرير المتأخرين في الدفع
          </DialogTitle>
          <DialogDescription>
            عرض الطلاب الذين لم يدفعوا مصاريف الشهر
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-2 block">الشهر</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">السنة الدراسية</label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="كل السنوات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل السنوات</SelectItem>
                <SelectItem value="sec1">أولى ثانوي</SelectItem>
                <SelectItem value="sec2">تانية ثانوي</SelectItem>
                <SelectItem value="sec3">تالتة ثانوي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">المجموعة</label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
                <SelectValue placeholder="كل المجموعات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المجموعات</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-destructive/10 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <span className="text-3xl font-bold text-destructive">{unpaidStudents.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">طالب لم يدفع</p>
          </div>
          <div className="p-4 bg-destructive/10 rounded-lg text-center">
            <span className="text-3xl font-bold text-destructive">{totalUnpaid} ج</span>
            <p className="text-sm text-muted-foreground">إجمالي المتأخرات</p>
          </div>
        </div>

        {/* Print Button */}
        <div className="flex justify-end mb-4">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            طباعة التقرير
          </Button>
        </div>

        {/* Report Content */}
        <div ref={printRef}>
          <h1>تقرير المتأخرين في الدفع - {monthName}</h1>
          
          <div className="summary">
            <div>عدد الطلاب المتأخرين: <strong>{unpaidStudents.length}</strong></div>
            <div className="total">إجمالي المتأخرات: {totalUnpaid} جنيه</div>
          </div>

          {unpaidStudents.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>اسم الطالب</th>
                  <th>الكود</th>
                  <th>السنة</th>
                  <th>المجموعة</th>
                  <th>المبلغ المستحق</th>
                  <th>رقم ولي الأمر</th>
                </tr>
              </thead>
              <tbody>
                {unpaidStudents.map((student, index) => {
                  const group = student.group_id ? getGroupById(student.group_id) : null;
                  return (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td>{student.name}</td>
                      <td>{student.code}</td>
                      <td>{getGradeLabel(student.grade)}</td>
                      <td>{group?.name || '-'}</td>
                      <td>{student.monthly_fee} ج</td>
                      <td dir="ltr">{student.parent_phone}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                جميع الطلاب دفعوا مصاريف الشهر 🎉
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
