import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Download, Smartphone, Check, Share, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">مستر محمد مجدي</CardTitle>
          <CardDescription>نظام متابعة وإدارة الطلاب</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-primary">التطبيق مثبت بالفعل!</h3>
                <p className="text-muted-foreground text-sm">
                  يمكنك فتح التطبيق من الشاشة الرئيسية
                </p>
              </div>
              <Button asChild className="w-full">
                <a href="/dashboard">فتح التطبيق</a>
              </Button>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-xl">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  طريقة التثبيت على الآيفون
                </h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0">1</Badge>
                    <span className="flex items-center gap-2">
                      اضغط على زر المشاركة
                      <Share className="h-4 w-4 text-primary" />
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0">2</Badge>
                    <span>اختر "إضافة إلى الشاشة الرئيسية"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0">3</Badge>
                    <span>اضغط "إضافة"</span>
                  </li>
                </ol>
              </div>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-xl text-center">
                <Smartphone className="h-12 w-12 text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  ثبّت التطبيق على جهازك للوصول السريع والعمل بدون إنترنت
                </p>
                <Button onClick={handleInstallClick} className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  تثبيت التطبيق
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-xl">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  طريقة التثبيت على الأندرويد
                </h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0">1</Badge>
                    <span className="flex items-center gap-2">
                      اضغط على قائمة المتصفح
                      <MoreVertical className="h-4 w-4 text-primary" />
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0">2</Badge>
                    <span>اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0">3</Badge>
                    <span>اضغط "تثبيت"</span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-3">مميزات التطبيق:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                يعمل بدون إنترنت
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                وصول سريع من الشاشة الرئيسية
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                تجربة كتطبيق حقيقي
              </li>
            </ul>
          </div>

          <Button variant="outline" asChild className="w-full">
            <a href="/">العودة لتسجيل الدخول</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
