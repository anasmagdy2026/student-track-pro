import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NextSessionReminder } from '@/hooks/useNextSessionReminders';
import { Group } from '@/types';
import { BookOpen, ClipboardList, FileText, Mic, StickyNote } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NextSessionReminderCardProps {
  reminder: NextSessionReminder;
  group: Group;
  compact?: boolean;
}

export function NextSessionReminderCard({ reminder, group, compact = false }: NextSessionReminderCardProps) {
  const hasContent = reminder.homework || reminder.recitation || reminder.exam || reminder.sheet || reminder.note;
  
  if (!hasContent) return null;

  if (compact) {
    return (
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
      </div>
    );
  }

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-5 w-5 text-warning" />
          المطلوب الحصة القادمة - {group.name}
          <Badge variant="outline" className="ml-auto">
            {group.days.join(' - ')} - {group.time}
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
        <div className="flex justify-end pt-2">
          <Link to={`/attendance?group=${group.id}`}>
            <Button size="sm" variant="outline">
              فتح الحضور
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
