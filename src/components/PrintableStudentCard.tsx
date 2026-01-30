import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '@/components/ui/badge';
import { GRADE_LABELS, Student, Group } from '@/types';
import { User } from 'lucide-react';

interface PrintableStudentCardProps {
  student: Student;
  group?: Group | null;
}

/**
 * Pure-HTML/SVG printable card (no canvas) so Arabic/RTL and QR render reliably in print.
 */
export function PrintableStudentCard({ student, group }: PrintableStudentCardProps) {
  return (
    <div className="print-card" dir="rtl">
      <div className="print-card__inner">
        <div className="print-card__header">
          <User className="print-card__icon" />
          <h3 className="print-card__title">كارت حضور وغياب الطالب</h3>
        </div>

        <div className="print-card__qr">
          <QRCodeSVG
            value={`STUDENT:${student.code}:${student.id}`}
            size={120}
            level="H"
            includeMargin={false}
          />
        </div>

        <div className="print-card__info">
          <div className="print-card__name">{student.name}</div>
          <div className="print-card__code">
            <Badge variant="outline" className="text-lg font-mono px-3 py-1">
              {student.code}
            </Badge>
          </div>
          <div className="print-card__grade">
            <Badge className="bg-primary/20 text-primary">{GRADE_LABELS[student.grade]}</Badge>
          </div>
          {group && (
            <div className="print-card__group">
              {group.name} - <span dir="ltr">{group.time}</span>
            </div>
          )}

          <div className="print-card__footer">مستر محمد مجدي للتواصل 01060744547</div>
        </div>
      </div>
    </div>
  );
}
