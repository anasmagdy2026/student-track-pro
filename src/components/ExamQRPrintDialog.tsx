import { useState } from 'react';
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
import { QRCodeSVG } from 'qrcode.react';
import { useGroups } from '@/hooks/useGroups';
import { useStudents } from '@/hooks/useStudents';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { Printer, Users } from 'lucide-react';
import { Exam } from '@/types';

interface ExamQRPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: Exam;
}

export function ExamQRPrintDialog({ open, onOpenChange, exam }: ExamQRPrintDialogProps) {
  const { groups } = useGroups();
  const { students, getStudentsByGroup } = useStudents();
  const { getGradeLabel } = useGradeLevels();
  
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const gradeGroups = groups.filter(g => g.grade === exam.grade);
  const groupStudents = selectedGroup ? getStudentsByGroup(selectedGroup) : [];
  const selectedGroupData = groups.find(g => g.id === selectedGroup);

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePreview = () => {
    if (!selectedGroup) return;
    setShowPreview(true);
  };

  // Split students into groups of 4 for each page
  const chunkedStudents: typeof groupStudents[] = [];
  for (let i = 0; i < groupStudents.length; i += 4) {
    chunkedStudents.push(groupStudents.slice(i, i + 4));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            طباعة أوراق QR للامتحان
          </DialogTitle>
          <DialogDescription>
            {exam.name} - {getGradeLabel(exam.grade)}
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">اختر المجموعة</label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المجموعة" />
                </SelectTrigger>
                <SelectContent>
                  {gradeGroups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} - {group.days.join(', ')} ({group.time})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedGroup && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>عدد الطلاب: {groupStudents.length}</span>
                  <span className="text-muted-foreground">
                    ({Math.ceil(groupStudents.length / 4)} صفحة)
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button onClick={handleGeneratePreview} disabled={!selectedGroup || groupStudents.length === 0}>
                معاينة وطباعة
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center no-print">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                رجوع
              </Button>
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                طباعة
              </Button>
            </div>

            {/* Print Preview - 4 students per page */}
            <div className="print-area">
              {chunkedStudents.map((pageStudents, pageIndex) => (
                <div 
                  key={pageIndex} 
                  className="exam-qr-page"
                  style={{
                    pageBreakAfter: pageIndex < chunkedStudents.length - 1 ? 'always' : 'auto',
                    minHeight: '297mm',
                    width: '210mm',
                    padding: '10mm',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5mm',
                  }}
                >
                  {pageStudents.map((student, studentIndex) => (
                    <div 
                      key={student.id}
                      style={{
                        flex: 1,
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8mm',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10mm',
                        backgroundColor: '#fff',
                        minHeight: '65mm',
                      }}
                    >
                      {/* QR Code - Top Left */}
                      <div 
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <QRCodeSVG
                          value={`STUDENT:${student.code}:${student.id}`}
                          size={60}
                          level="H"
                          includeMargin={false}
                        />
                        <p style={{ 
                          fontSize: '9px', 
                          fontFamily: 'monospace',
                          margin: 0,
                          color: '#666',
                        }}>
                          {student.code}
                        </p>
                      </div>

                      {/* Student Info */}
                      <div style={{ flex: 1 }}>
                        <p style={{ 
                          fontSize: '14px', 
                          fontWeight: 'bold',
                          margin: 0,
                          marginBottom: '4px',
                        }}>
                          {student.name}
                        </p>
                        <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>
                          {selectedGroupData?.name} - {getGradeLabel(exam.grade)}
                        </p>
                      </div>

                      {/* Exam Info - Right Side */}
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>
                          {exam.name}
                        </p>
                        <p style={{ fontSize: '10px', color: '#888', margin: 0 }}>
                          {new Date(exam.date).toLocaleDateString('ar-EG')}
                        </p>
                        <div
                          style={{
                            marginTop: '8px',
                            border: '2px solid #000',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        >
                          الدرجة: _______ / {exam.max_score}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <style>{`
              @media print {
                .no-print { display: none !important; }
                body * { visibility: hidden; }
                .print-area, .print-area * { visibility: visible; }
                .print-area { 
                  position: absolute; 
                  left: 0; 
                  top: 0; 
                  width: 100%; 
                }
                .exam-qr-page {
                  page-break-after: always;
                  page-break-inside: avoid;
                }
                @page {
                  size: A4;
                  margin: 0;
                }
              }
            `}</style>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
