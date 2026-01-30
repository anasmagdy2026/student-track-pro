import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  allowText?: string;
  freezeText?: string;
  onAllow: () => void;
  onFreeze: () => void;
};

export function AlertDecisionDialog({
  open,
  onOpenChange,
  title,
  description,
  allowText = 'السماح بالدخول (مرة واحدة)',
  freezeText = 'تجميد كامل',
  onAllow,
  onFreeze,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription style={{ whiteSpace: 'pre-line' }}>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onAllow}>{allowText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onFreeze}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {freezeText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
