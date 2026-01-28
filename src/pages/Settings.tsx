import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Settings as SettingsIcon, User, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { currentUsername, updateCredentials } = useAuth();
  
  const [username, setUsername] = useState(currentUsername);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleUpdateUsername = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('برجاء إدخال اسم المستخدم');
      return;
    }

    // Get stored credentials
    const stored = localStorage.getItem('auth_credentials');
    const credentials = stored ? JSON.parse(stored) : { username: 'admin', password: 'admin123' };

    updateCredentials(username.trim(), credentials.password);
    toast.success('تم تحديث اسم المستخدم بنجاح');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();

    // Get stored credentials
    const stored = localStorage.getItem('auth_credentials');
    const credentials = stored ? JSON.parse(stored) : { username: 'admin', password: 'admin123' };

    if (currentPassword !== credentials.password) {
      toast.error('كلمة المرور الحالية غير صحيحة');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    updateCredentials(credentials.username, newPassword);
    setCurrentPassword('');
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

        {/* Username Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              اسم المستخدم
            </CardTitle>
            <CardDescription>
              تعديل اسم المستخدم الخاص بك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateUsername} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                />
              </div>
              <Button type="submit" className="gap-2">
                <Save className="h-4 w-4" />
                حفظ التغييرات
              </Button>
            </form>
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
                <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الحالية"
                    className="pl-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

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
