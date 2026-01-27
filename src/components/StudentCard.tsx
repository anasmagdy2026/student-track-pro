import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GRADE_LABELS, Student, Group } from '@/types';
import { Download, User } from 'lucide-react';
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

  return (
    <div className="space-y-2">
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
        <Button onClick={handleDownload} variant="outline" className="w-80 gap-2">
          <Download className="h-4 w-4" />
          تحميل البطاقة
        </Button>
      )}
    </div>
  );
}
