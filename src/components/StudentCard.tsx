import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GRADE_LABELS, Student, Group } from '@/types';
import { Download, User, Printer } from 'lucide-react';
import { useRef } from 'react';

interface StudentCardProps {
  student: Student;
  group?: Group | null;
  showDownload?: boolean;
}

export function StudentCard({ student, group, showDownload = true }: StudentCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `student-card-${student.code}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading card:', error);
    }
  };

  const handlePrint = async () => {
    if (!cardRef.current) return;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <title>طباعة بطاقة الطالب - ${student.name}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
              body {
                font-family: 'Cairo', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: white;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              @media print {
                body {
                  margin: 0;
                  padding: 20mm;
                }
              }
            </style>
          </head>
          <body>
            <img src="${canvas.toDataURL('image/png')}" alt="بطاقة الطالب" />
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Error printing card:', error);
    }
  };

  return (
    <div className="space-y-3">
      <Card ref={cardRef} className="w-80 bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {/* Header */}
            <div className="flex items-center justify-center gap-2">
              <User className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-bold text-primary">بطاقة الطالب</h3>
            </div>
            
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-xl shadow-sm">
                <QRCodeSVG
                  value={`STUDENT:${student.code}:${student.id}`}
                  size={120}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>
            
            {/* Student Info */}
            <div className="space-y-2">
              <h4 className="text-xl font-bold">{student.name}</h4>
              <div className="flex justify-center gap-2">
                <Badge variant="outline" className="text-lg font-mono px-3 py-1">
                  {student.code}
                </Badge>
              </div>
              <Badge className="bg-primary/20 text-primary">
                {GRADE_LABELS[student.grade]}
              </Badge>
              {group && (
                <p className="text-sm text-muted-foreground">
                  {group.name} - {group.time}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {showDownload && (
        <div className="flex gap-2 w-80">
          <Button onClick={handleDownload} variant="outline" className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            تحميل
          </Button>
          <Button onClick={handlePrint} variant="default" className="flex-1 gap-2">
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
        </div>
      )}
    </div>
  );
}
