import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { Fingerprint, Trash2, Smartphone, Plus } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useState } from 'react';

export function BiometricSettingsCard() {
  const { supported, loading, credentials, registerBiometric, removeCredential } = useWebAuthn();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            تسجيل الدخول بالبصمة
          </CardTitle>
          <CardDescription>
            هذا الجهاز لا يدعم المصادقة البيومترية (البصمة / بصمة الوجه)
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-primary" />
          تسجيل الدخول بالبصمة
        </CardTitle>
        <CardDescription>
          سجّل بصمة إصبعك أو بصمة وجهك للدخول السريع بدون كلمة مرور
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {credentials.length > 0 && (
          <div className="space-y-2">
            {credentials.map((cred: any) => (
              <div
                key={cred.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">{cred.device_name || 'جهاز غير معروف'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(cred.created_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(cred.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={() => registerBiometric()}
          disabled={loading}
          className="w-full gap-2"
          variant={credentials.length > 0 ? 'outline' : 'default'}
        >
          {loading ? (
            'جاري التسجيل...'
          ) : (
            <>
              <Plus className="h-4 w-4" />
              {credentials.length > 0 ? 'إضافة جهاز آخر' : 'تسجيل البصمة'}
            </>
          )}
        </Button>

        {credentials.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            ✅ البصمة مُفعّلة - يمكنك الدخول بالبصمة من صفحة تسجيل الدخول
          </p>
        )}

        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="حذف البصمة"
          description="هل أنت متأكد من حذف هذه البصمة؟ ستحتاج لتسجيلها مرة أخرى."
          confirmText="نعم، حذف"
          cancelText="إلغاء"
          onConfirm={() => {
            if (deleteId) removeCredential(deleteId);
            setDeleteId(null);
          }}
          variant="destructive"
        />
      </CardContent>
    </Card>
  );
}
