import { useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Settings as SettingsIcon, User, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

export default function Settings() {
  const { user, updatePassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const passwordSchema = useMemo(
    () =>
      z
        .string()
        .min(6, 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'),
    []
  );

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? 'كلمة المرور غير صالحة');
      return;
    }

    const { error } = await updatePassword(newPassword);
    if (error) {
      toast.error('تعذّر تحديث كلمة المرور. أعد المحاولة.');
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    toast.success('تم تحديث كلمة المرور بنجاح');
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            الإعدادات
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة بيانات الحساب وإعدادات النظام
          </p>
        </div>

        {/* Account Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              الحساب
            </CardTitle>
            <CardDescription>
              بيانات حسابك الحالية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                value={user?.email ?? ''}
                readOnly
                placeholder="-"
              />
              <p className="text-sm text-muted-foreground">
                هذا هو البريد المستخدم لتسجيل الدخول.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              تغيير كلمة المرور
            </CardTitle>
            <CardDescription>
              تحديث كلمة المرور الخاصة بك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة"
                    className="pl-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                />
              </div>

              <Button type="submit" className="gap-2">
                <Lock className="h-4 w-4" />
                تغيير كلمة المرور
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
