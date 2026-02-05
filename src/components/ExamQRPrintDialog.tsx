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

type CardsPerPage = '4' | '8' | '16' | 'all';

export function ExamQRPrintDialog({ open, onOpenChange, exam }: ExamQRPrintDialogProps) {
  const { groups } = useGroups();
  const { students, getStudentsByGroup } = useStudents();
  const { getGradeLabel } = useGradeLevels();
  
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [cardsPerPage, setCardsPerPage] = useState<CardsPerPage>('16');
  const [showPreview, setShowPreview] = useState(false);

  const gradeGroups = groups.filter(g => g.grade === exam.grade);
  const groupStudents = selectedGroup ? getStudentsByGroup(selectedGroup) : [];
  const selectedGroupData = groups.find(g => g.id === selectedGroup);

  const handlePrint = () => {
    const printContent = document.getElementById('exam-qr-print-content');
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsNum = cardsPerPage === 'all' ? groupStudents.length : parseInt(cardsPerPage);
    // Calculate proper card height based on available space (277mm - gaps)
    const gapMM = 2;
    const totalGap = gapMM * (cardsNum - 1);
    const availableHeight = 277 - totalGap;
    const cardHeight = `${Math.floor(availableHeight / cardsNum)}mm`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>طباعة QR - ${exam.name}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4;
            margin: 5mm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page {
            page-break-after: always;
            width: 200mm;
            min-height: 287mm;
            display: flex;
            flex-direction: column;
            gap: ${gapMM}mm;
          }
          .page:last-child {
            page-break-after: auto;
          }
          .card {
            flex: 1;
            border: 2px solid #dc2626;
            border-radius: 6px;
            padding: 2mm 3mm;
            display: flex;
            align-items: flex-start;
            gap: 3mm;
            background: #fff;
            min-height: ${cardHeight};
            max-height: ${cardHeight};
            overflow: hidden;
          }
          .qr-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5mm;
            flex-shrink: 0;
          }
          .qr-section svg {
            width: ${cardsPerPage === '4' ? '45px' : cardsPerPage === '8' ? '35px' : '25px'} !important;
            height: ${cardsPerPage === '4' ? '45px' : cardsPerPage === '8' ? '35px' : '25px'} !important;
          }
          .student-code {
            font-size: ${cardsPerPage === '4' ? '8px' : '6px'};
            font-family: monospace;
            color: #666;
          }
          .student-info {
            flex: 1;
            min-width: 0;
            overflow: hidden;
          }
          .student-name {
            font-size: ${cardsPerPage === '4' ? '12px' : cardsPerPage === '8' ? '10px' : '9px'};
            font-weight: bold;
            margin-bottom: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .student-details {
            font-size: ${cardsPerPage === '4' ? '9px' : '7px'};
            color: #666;
          }
          .exam-info {
            text-align: left;
            flex-shrink: 0;
          }
          .exam-name {
            font-size: ${cardsPerPage === '4' ? '9px' : '7px'};
            font-weight: bold;
          }
          .exam-date {
            font-size: ${cardsPerPage === '4' ? '8px' : '6px'};
            color: #888;
          }
          .score-box {
            margin-top: 2px;
            border: 1px solid #000;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: ${cardsPerPage === '4' ? '9px' : '7px'};
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleGeneratePreview = () => {
    if (!selectedGroup) return;
    setShowPreview(true);
  };

  // Calculate cards per page
  const cardsNum = cardsPerPage === 'all' ? groupStudents.length : parseInt(cardsPerPage);
  
  // Split students into groups based on cards per page
  const chunkedStudents: typeof groupStudents[] = [];
  for (let i = 0; i < groupStudents.length; i += cardsNum) {
    chunkedStudents.push(groupStudents.slice(i, i + cardsNum));
  }

  // Calculate card dimensions based on cards per page
  const getCardStyle = () => {
    const baseHeight = 277; // A4 height in mm minus margins
    const gap = 2; // gap between cards
    const cardHeight = (baseHeight - (gap * (cardsNum - 1))) / cardsNum;
    
    return {
      flex: '1',
      border: '2px solid #dc2626', // Red border
      borderRadius: '6px',
      padding: '3mm',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '4mm',
      backgroundColor: '#fff',
      minHeight: `${cardHeight}mm`,
      maxHeight: `${cardHeight}mm`,
    };
  };

  const getQRSize = () => {
    switch (cardsPerPage) {
      case '4': return 50;
      case '8': return 40;
      case '16': return 30;
      case 'all': return Math.max(20, Math.floor(60 / groupStudents.length * 4));
      default: return 30;
    }
  };

  const getFontSize = () => {
    switch (cardsPerPage) {
      case '4': return { name: '14px', details: '11px', code: '9px' };
      case '8': return { name: '11px', details: '9px', code: '8px' };
      case '16': return { name: '10px', details: '8px', code: '7px' };
      case 'all': return { name: '9px', details: '7px', code: '6px' };
      default: return { name: '10px', details: '8px', code: '7px' };
    }
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

            <div className="space-y-2">
              <label className="text-sm font-medium">عدد الكروت في الصفحة</label>
              <Select value={cardsPerPage} onValueChange={(v) => setCardsPerPage(v as CardsPerPage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 كروت</SelectItem>
                  <SelectItem value="8">8 كروت</SelectItem>
                  <SelectItem value="16">16 كارت</SelectItem>
                  <SelectItem value="all">كل الكروت في صفحة واحدة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedGroup && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>عدد الطلاب: {groupStudents.length}</span>
                  <span className="text-muted-foreground">
                    ({cardsPerPage === 'all' ? '1' : Math.ceil(groupStudents.length / parseInt(cardsPerPage))} صفحة)
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
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                رجوع
              </Button>
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                طباعة
              </Button>
            </div>

            {/* Print Preview */}
            <div 
              id="exam-qr-print-content"
              className="bg-white p-4 border rounded-lg overflow-auto max-h-[60vh]"
            >
              {chunkedStudents.map((pageStudents, pageIndex) => (
                <div 
                  key={pageIndex} 
                  className="page"
                  style={{
                    pageBreakAfter: pageIndex < chunkedStudents.length - 1 ? 'always' : 'auto',
                    minHeight: '297mm',
                    width: '210mm',
                    padding: '10mm',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2mm',
                    marginBottom: pageIndex < chunkedStudents.length - 1 ? '20px' : '0',
                    backgroundColor: '#f9f9f9',
                  }}
                >
                  {pageStudents.map((student) => (
                    <div 
                      key={student.id}
                      style={getCardStyle()}
                    >
                      {/* QR Code */}
                      <div 
                        className="qr-section"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '1mm',
                        }}
                      >
                        <QRCodeSVG
                          value={`STUDENT:${student.code}:${student.id}`}
                          size={getQRSize()}
                          level="H"
                          includeMargin={false}
                        />
                        <p className="student-code" style={{ 
                          fontSize: getFontSize().code, 
                          fontFamily: 'monospace',
                          margin: 0,
                          color: '#666',
                        }}>
                          {student.code}
                        </p>
                      </div>

                      {/* Student Info */}
                      <div className="student-info" style={{ flex: 1 }}>
                        <p className="student-name" style={{ 
                          fontSize: getFontSize().name, 
                          fontWeight: 'bold',
                          margin: 0,
                          marginBottom: '2px',
                        }}>
                          {student.name}
                        </p>
                        <p className="student-details" style={{ 
                          fontSize: getFontSize().details, 
                          color: '#666', 
                          margin: 0 
                        }}>
                          {selectedGroupData?.name} - {getGradeLabel(exam.grade)}
                        </p>
                      </div>

                      {/* Exam Info */}
                      <div className="exam-info" style={{ textAlign: 'left' }}>
                        <p className="exam-name" style={{ 
                          fontSize: getFontSize().details, 
                          fontWeight: 'bold', 
                          margin: 0 
                        }}>
                          {exam.name}
                        </p>
                        <p className="exam-date" style={{ 
                          fontSize: getFontSize().code, 
                          color: '#888', 
                          margin: 0 
                        }}>
                          {new Date(exam.date).toLocaleDateString('ar-EG')}
                        </p>
                        <div
                          className="score-box"
                          style={{
                            marginTop: '4px',
                            border: '2px solid #000',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: getFontSize().details,
                          }}
                        >
                          الدرجة: ___ / {exam.max_score}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}