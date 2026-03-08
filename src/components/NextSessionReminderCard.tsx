import { useState } from 'react';
import { formatTime12 } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NextSessionReminder } from '@/hooks/useNextSessionReminders';
import { Group, Student } from '@/types';
import { BookOpen, ClipboardList, FileText, MessageCircle, Mic, StickyNote, Eye, Users, User, Send, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sendWhatsAppMessage, createNextSessionReminderMessage, buildFromTemplate } from '@/utils/whatsapp';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';
import { toast } from 'sonner';
import { MessagePreviewDialog } from '@/components/MessagePreviewDialog';

const sendWhatsAppToMultiple = async (
  students: Student[],
  messageCreator: (student: Student) => string
) => {
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const phone = student.student_phone || student.parent_phone;
    const message = messageCreator(student);
    setTimeout(() => {
      sendWhatsAppMessage(phone, message);
    }, i * 500);
  }
};

interface NextSessionReminderCardProps {
  reminder: NextSessionReminder;
  group: Group;
  compact?: boolean;
  students?: Student[];
  onSendWhatsApp?: () => void;
}

export function NextSessionReminderCard({ 
  reminder, 
  group, 
  compact = false,
  students = [],
  onSendWhatsApp 
}: NextSessionReminderCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [sendMode, setSendMode] = useState<'individual' | 'group'>('group');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const { getTemplateByCode } = useWhatsAppTemplates();
  
  const hasContent = reminder.homework || reminder.recitation || reminder.exam || reminder.sheet || reminder.note;
  const hasWhatsAppGroup = !!group.whatsapp_group_link;
  
  if (!hasContent) return null;

  const buildContentBlock = () => {
    let content = '';
    if (reminder.homework) content += `الواجب: ${reminder.homework}\n`;
    if (reminder.recitation) content += `التسميع: ${reminder.recitation}\n`;
    if (reminder.exam) content += `الامتحان: ${reminder.exam}\n`;
    if (reminder.sheet) content += `الشيت: ${reminder.sheet}\n`;
    if (reminder.note) content += `ملاحظة: ${reminder.note}\n`;
    return content.trim();
  };

  const buildMessage = (student: Student) => {
    const tpl = getTemplateByCode('next_session');
    if (tpl && tpl.is_active) {
      return buildFromTemplate(tpl.template, {
        studentName: student.name,
        groupName: group.name,
        content: buildContentBlock(),
      });
    }
    return createNextSessionReminderMessage(student.name, group.name, {
      homework: reminder.homework,
      recitation: reminder.recitation,
      exam: reminder.exam,
      sheet: reminder.sheet,
      note: reminder.note,
    });
  };

  const messageTemplate = (() => {
    const tpl = getTemplateByCode('next_session');
    if (tpl && tpl.is_active) {
      return buildFromTemplate(tpl.template, {
        studentName: '{studentName}',
        groupName: group.name,
        content: buildContentBlock(),
      });
    }
    return createNextSessionReminderMessage('{studentName}', group.name, {
      homework: reminder.homework,
      recitation: reminder.recitation,
      exam: reminder.exam,
      sheet: reminder.sheet,
      note: reminder.note,
    });
  })();

  const handleSendIndividual = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) {
      toast.error('اختر طالب أولاً');
      return;
    }
    const phone = student.student_phone || student.parent_phone;
    const message = buildMessage(student);
    sendWhatsAppMessage(phone, message);
    toast.success(`تم فتح الواتساب لـ ${student.name}`);
  };

  const handleOpenGroupPreview = () => {
    if (students.length === 0) {
      toast.error('لا يوجد طلاب في هذه المجموعة');
      return;
    }
    setShowPreview(true);
  };

  const buildGroupMessage = () => {
    const tpl = getTemplateByCode('next_session');
    if (tpl && tpl.is_active) {
      return buildFromTemplate(tpl.template, {
        studentName: 'الطلاب',
        groupName: group.name,
        content: buildContentBlock(),
      });
    }
    return createNextSessionReminderMessage('الطلاب', group.name, {
      homework: reminder.homework,
      recitation: reminder.recitation,
      exam: reminder.exam,
      sheet: reminder.sheet,
      note: reminder.note,
    });
  };

  const handleSendToWhatsAppGroup = () => {
    const message = buildGroupMessage();
    const encodedMessage = encodeURIComponent(message);
    if (group.whatsapp_group_link) {
      // Send directly to the group link
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      toast.success('سيتم فتح واتساب، اختر الجروب وأرسل الرسالة');
    } else {
      // No link — open WhatsApp and let user choose
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      toast.success('اختر المحادثة أو الجروب وأرسل الرسالة');
    }
  };

  const handleConfirmSend = () => {
    sendWhatsAppToMultiple(students, buildMessage);
    toast.success(`جاري فتح الواتساب لـ ${students.length} طالب...`);
    setShowPreview(false);
    if (onSendWhatsApp) onSendWhatsApp();
  };

  const renderSendOptions = () => (
    <div className="mt-3 space-y-2 border-t pt-3">
      {hasWhatsAppGroup ? (
        <Button
          size="sm"
          variant="default"
          onClick={handleSendToWhatsAppGroup}
          className="gap-1 text-xs w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <Send className="h-3 w-3" />
          إرسال لجروب الواتساب
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue placeholder="اختر طالب للإرسال..." />
            </SelectTrigger>
            <SelectContent>
              {students.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => handleSendIndividual(selectedStudentId)}
            disabled={!selectedStudentId}
            className="gap-1 text-xs"
          >
            <User className="h-3 w-3" />
            إرسال
          </Button>
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <>
        <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="h-4 w-4 text-warning" />
            <span className="font-semibold text-sm text-warning">المطلوب الحصة القادمة</span>
            <Badge variant="outline" className="text-xs">{group.name}</Badge>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {reminder.homework && (
              <Badge variant="secondary" className="gap-1">
                <BookOpen className="h-3 w-3" />
                واجب: {reminder.homework}
              </Badge>
            )}
            {reminder.recitation && (
              <Badge variant="secondary" className="gap-1">
                <Mic className="h-3 w-3" />
                تسميع: {reminder.recitation}
              </Badge>
            )}
            {reminder.exam && (
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                امتحان: {reminder.exam}
              </Badge>
            )}
            {reminder.sheet && (
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                شيت: {reminder.sheet}
              </Badge>
            )}
            {reminder.note && (
              <Badge variant="secondary" className="gap-1">
                <StickyNote className="h-3 w-3" />
                {reminder.note}
              </Badge>
            )}
          </div>
          {students.length > 0 && renderSendOptions()}
        </div>

        <MessagePreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          template={messageTemplate}
          students={students}
          variables={{}}
          title="معاينة رسالة المطلوب للحصة الجاية"
          onConfirmSend={handleConfirmSend}
          messageBuilder={buildMessage}
        />
      </>
    );
  }

  return (
    <>
      <Card className="border-warning/30 bg-warning/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5 text-warning" />
            المطلوب الحصة القادمة - {group.name}
            <Badge variant="outline" className="ml-auto">
              {group.days.join(' - ')} - {formatTime12(group.time)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {reminder.homework && (
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="font-medium">الواجب:</span>
                <span>{reminder.homework}</span>
              </div>
            )}
            {reminder.recitation && (
              <div className="flex items-center gap-2 text-sm">
                <Mic className="h-4 w-4 text-primary" />
                <span className="font-medium">التسميع:</span>
                <span>{reminder.recitation}</span>
              </div>
            )}
            {reminder.exam && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium">الامتحان:</span>
                <span>{reminder.exam}</span>
              </div>
            )}
            {reminder.sheet && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-secondary" />
                <span className="font-medium">الشيت:</span>
                <span>{reminder.sheet}</span>
              </div>
            )}
          </div>
          {reminder.note && (
            <div className="flex items-start gap-2 text-sm pt-2 border-t">
              <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="font-medium">ملاحظات:</span>
              <span className="text-muted-foreground">{reminder.note}</span>
            </div>
          )}
          
          {students.length > 0 && renderSendOptions()}

          <div className="flex justify-end pt-2">
            <Link to={`/attendance?group=${group.id}`}>
              <Button size="sm" variant="outline">
                فتح الحضور
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <MessagePreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        template={messageTemplate}
        students={students}
        variables={{}}
        title="معاينة رسالة المطلوب للحصة الجاية"
        onConfirmSend={handleConfirmSend}
        messageBuilder={buildMessage}
      />
    </>
  );
}