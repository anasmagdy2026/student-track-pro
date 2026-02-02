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

            {/* Print Preview - Each student on a page */}
            <div className="print-area">
              {groupStudents.map((student, index) => (
                <div 
                  key={student.id} 
                  className="exam-qr-page"
                  style={{
                    pageBreakAfter: index < groupStudents.length - 1 ? 'always' : 'auto',
                    minHeight: '100vh',
                    padding: '20mm',
                    position: 'relative',
                  }}
                >
                  {/* QR Code - Small, top-left */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '15mm',
                      left: '15mm',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <QRCodeSVG
                      value={`STUDENT:${student.code}:${student.id}`}
                      size={80}
                      level="H"
                      includeMargin={false}
                    />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        margin: 0,
                      }}>
                        {student.name}
                      </p>
                      <p style={{ 
                        fontSize: '10px', 
                        fontFamily: 'monospace',
                        margin: 0,
                        color: '#666',
                      }}>
                        {student.code}
                      </p>
                    </div>
                  </div>

                  {/* Exam Info - Top right */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '15mm',
                      right: '15mm',
                      textAlign: 'right',
                    }}
                  >
                    <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                      {exam.name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                      {selectedGroupData?.name} - {getGradeLabel(exam.grade)}
                    </p>
                    <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>
                      {new Date(exam.date).toLocaleDateString('ar-EG')}
                    </p>
                  </div>

                  {/* Score Area */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '60mm',
                      right: '15mm',
                      border: '2px solid #000',
                      padding: '10px 20px',
                      borderRadius: '8px',
                    }}
                  >
                    <p style={{ fontSize: '14px', margin: 0 }}>
                      الدرجة: _______ / {exam.max_score}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <style>{`
              @media print {
                .no-print { display: none !important; }
                body * { visibility: hidden; }
                .print-area, .print-area * { visibility: visible; }
                .print-area { position: absolute; left: 0; top: 0; width: 100%; }
                .exam-qr-page {
                  page-break-after: always;
                  page-break-inside: avoid;
                }
              }
            `}</style>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
