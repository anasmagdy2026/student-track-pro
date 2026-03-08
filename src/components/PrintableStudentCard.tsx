import { QRCodeSVG } from 'qrcode.react';
import { Student, Group } from '@/types';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { useAppSettings } from '@/hooks/useAppSettings';

interface PrintableStudentCardProps {
  student: Student;
  group?: Group | null;
}

/**
 * Printable student ID card matching the professional green-bordered design.
 */
export function PrintableStudentCard({ student, group }: PrintableStudentCardProps) {
  const { getGradeLabel } = useGradeLevels();
  const { teacherName, teacherPhone } = useAppSettings();
  const displayName = teacherName || 'مستر محمد مجدي';
  const displayPhone = teacherPhone || '01060744547';

  return (
    <div className="print-card" dir="rtl">
      <div className="print-card__border-text">
        <span className="print-card__border-text-top">STUDENT ID STUDENT ID STUDENT ID STUDENT ID STUDENT ID STUDENT ID</span>
        <span className="print-card__border-text-bottom">STUDENT ID STUDENT ID STUDENT ID STUDENT ID STUDENT ID STUDENT ID</span>
        <span className="print-card__border-text-left">STUDENT ID STUDENT ID STUDENT ID</span>
        <span className="print-card__border-text-right">STUDENT ID STUDENT ID STUDENT ID</span>
      </div>
      <div className="print-card__inner">
        {/* Header */}
        <div className="print-card__header">
          <div className="print-card__laurel">🏛️</div>
          <h3 className="print-card__title">كارت حضور وغياب الطالب</h3>
        </div>

        {/* Body */}
        <div className="print-card__body">
          {/* QR Code - Left side */}
          <div className="print-card__qr">
            <div className="print-card__qr-frame">
              <QRCodeSVG
                value={`STUDENT:${student.code}:${student.id}`}
                size={80}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Info - Right side */}
          <div className="print-card__info">
            <div className="print-card__name">{student.name}</div>
            <div className="print-card__code">{student.code}</div>
            <div className="print-card__group-grade">
              {group?.name && <span>{group.name}</span>}
              {group?.name && <span> | </span>}
              <span>{getGradeLabel(student.grade)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="print-card__footer">
          <span className="print-card__footer-code">{student.code}</span>
          <span className="print-card__footer-grade">{getGradeLabel(student.grade)}</span>
        </div>
      </div>
    </div>
  );
}
