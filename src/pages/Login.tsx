import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { GraduationCap, Eye, EyeOff, Lock, User, Fingerprint } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { toast } from 'sonner';
import { z } from 'zod';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { supported, loading: biometricLoading, authenticateWithBiometric } = useWebAuthn();
  const biometricTriggered = useRef(false);

  // Check if user had previously logged in with biometric on this device
  const [savedUsername, setSavedUsername] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('biometric_username');
    if (stored) setSavedUsername(stored);
  }, []);

  // Auto-trigger biometric login if saved username exists and device supports it
  useEffect(() => {
    if (supported && savedUsername && !biometricTriggered.current) {
      biometricTriggered.current = true;
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        handleBiometricLogin(savedUsername);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [supported, savedUsername]);

  const schema = useMemo(
    () =>
      z.object({
        username: z.string().min(2, 'اسم المستخدم قصير جداً'),
        password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
      }),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const parsed = schema.safeParse({ username, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? 'بيانات غير صحيحة');
      setLoading(false);
      return;
    }

    try {
      const { error } = await signIn(username, password);
      if (error) {
        toast.error(error.message || 'فشل تسجيل الدخول: تأكد من اسم المستخدم وكلمة المرور');
        return;
      }
      // Save username for biometric login
      localStorage.setItem('biometric_username', username);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || 'حدث خطأ غير متوقع أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async (usernameOverride?: string) => {
    const usernameToUse = usernameOverride || savedUsername || username;
    if (!usernameToUse) {
      toast.error('أدخل اسم المستخدم أولاً ثم اضغط على البصمة');
      return;
    }

    const result = await authenticateWithBiometric(usernameToUse);
    if (result.success) {
      localStorage.setItem('biometric_username', usernameToUse);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="border-0 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-l from-primary to-primary/80 p-8 text-center">
            <div className="w-20 h-20 bg-primary-foreground/20 rounded-2xl mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
              <GraduationCap className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary-foreground">
              مستر محمد مجدي
            </h1>
            <p className="text-primary-foreground/80 mt-2">
              نظام متابعة الطلاب
            </p>
          </div>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  اسم المستخدم
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={savedUsername ? `آخر دخول: ${savedUsername}` : 'أدخل اسم المستخدم'}
                    className="pr-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="pr-10 pl-10 h-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>

            {/* Biometric Login */}
            {supported && (
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">أو</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base gap-3"
                  disabled={biometricLoading}
                  onClick={() => handleBiometricLogin()}
                >
                  <Fingerprint className="h-6 w-6" />
                  {biometricLoading ? 'جاري المصادقة...' : 'الدخول بالبصمة'}
                </Button>

                {savedUsername && (
                  <p className="text-xs text-muted-foreground text-center">
                    سيتم تسجيل الدخول كـ <span className="font-bold">{savedUsername}</span>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          تصميم وبرمجة: أنس أبو المجد
        </p>
      </div>
    </div>
  );
}
