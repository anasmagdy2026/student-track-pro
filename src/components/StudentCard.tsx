import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Student, Group } from '@/types';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { Download, User, Printer } from 'lucide-react';
import { useRef } from 'react';

interface StudentCardProps {
  student: Student;
  group?: Group | null;
  showDownload?: boolean;
}

export function StudentCard({ student, group, showDownload = true }: StudentCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { getGradeLabel } = useGradeLevels();

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
      
      const dataUrl = canvas.toDataURL('image/png');

      // Use iframe printing to avoid popup blockers and blank pages
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('aria-hidden', 'true');

      const srcdoc = `<!doctype html>
<html dir="rtl" lang="ar">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>طباعة بطاقة الطالب - ${student.name}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
    <style>
      body {
        font-family: 'Cairo', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        background: white;
      }
      img { width: 86mm; height: auto; }
      @media print {
        @page { size: A4; margin: 10mm; }
        body { min-height: auto; }
      }
    </style>
  </head>
  <body>
    <img id="cardImg" src="${dataUrl}" alt="بطاقة الطالب" />
    <script>
      (function () {
        const img = document.getElementById('cardImg');
        const doPrint = () => {
          setTimeout(() => {
            window.focus();
            window.print();
          }, 50);
        };
        if (img && img.complete) {
          doPrint();
        } else if (img) {
          img.onload = doPrint;
          img.onerror = doPrint;
        } else {
          window.onload = doPrint;
        }
      })();
    </script>
  </body>
</html>`;

      iframe.onload = () => {
        // Remove after print dialog is triggered
        setTimeout(() => iframe.remove(), 2000);
      };

      iframe.srcdoc = srcdoc;
      document.body.appendChild(iframe);
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
              <h3 className="text-lg font-bold text-primary">كارت حضور وغياب الطالب</h3>
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
                {getGradeLabel(student.grade)}
              </Badge>
              {group && (
                <p className="text-sm text-muted-foreground">
                  {group.name} - {group.time}
                </p>
              )}

              <div className="pt-3 border-t text-xs text-muted-foreground">
                مستر محمد مجدي للتواصل 01060744547
              </div>
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
