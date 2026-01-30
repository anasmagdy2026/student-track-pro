import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Shield, User, Lock, KeyRound, Mail } from 'lucide-react';

export default function SetupAdmin() {
  const navigate = useNavigate();
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        bootstrapToken: z.string().min(10, 'كود التفعيل غير صحيح'),
        username: z.string().min(2, 'اسم المستخدم قصير جداً'),
        password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
        email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
      }),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Common mistake: user pastes the secret NAME instead of its VALUE.
    if (bootstrapToken.trim() === 'ADMIN_BOOTSTRAP_TOKEN') {
      toast.error('اكتب قيمة كود التفعيل نفسها (مش اسمها). انسخه من Backend/Secrets ثم الصقه هنا');
      return;
    }

    const parsed = schema.safeParse({ bootstrapToken, username, password, email });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? 'بيانات غير صحيحة');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bootstrap-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-bootstrap-token': bootstrapToken,
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
            email: email.trim() || undefined,
          }),
        }
      );

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(payload?.error || 'فشل إنشاء المدير');
        return;
      }

      toast.success('تم إنشاء حساب المدير بنجاح — يمكنك تسجيل الدخول الآن');
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="border-0 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-l from-primary to-primary/80 p-8 text-center">
            <div className="w-20 h-20 bg-primary-foreground/20 rounded-2xl mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
              <Shield className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary-foreground">تهيئة حساب المدير</h1>
            <p className="text-primary-foreground/80 mt-2">تُستخدم مرة واحدة فقط عند الإعداد الأول</p>
          </div>

          <CardHeader className="pb-0" />
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">كود التفعيل</label>
                <div className="relative">
                  <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={bootstrapToken}
                    onChange={(e) => setBootstrapToken(e.target.value)}
                    placeholder="الصق قيمة كود التفعيل (وليس اسم المتغير)"
                    className="pr-10 h-12"
                    autoComplete="off"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  ملاحظة: لا تكتب <span className="font-mono">ADMIN_BOOTSTRAP_TOKEN</span> نفسها — لازم تلصق القيمة الطويلة.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">اسم المستخدم</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: admin"
                    className="pr-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="pr-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">البريد الإلكتروني (اختياري)</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="إن تركته فارغاً سيتم إنشاء بريد داخلي"
                    className="pr-10 h-12"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  'إنشاء المدير'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
