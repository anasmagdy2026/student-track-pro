import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Camera, 
  X, 
  RefreshCw, 
  Keyboard,
  ScanLine,
  FlipHorizontal,
} from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  title?: string;
  inline?: boolean;
}

type CameraFacing = 'environment' | 'user';
type ScanMode = 'camera' | 'manual';

export function QRScanner({ onScan, onClose, title = 'مسح رمز QR', inline = false }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const hasScannedRef = useRef(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanMode, setScanMode] = useState<ScanMode>('camera');
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('environment');

  const stopCamera = useCallback(() => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setError(null);
    hasScannedRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('لا يمكن الوصول إلى الكاميرا. تأكد من منح الإذن.');
      setScanMode('manual');
    }
  }, [cameraFacing, stopCamera]);

  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationIdRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      if (hasScannedRef.current) return;
      hasScannedRef.current = true;

      // Extract student code from QR data
      const data = code.data;
      let studentCode = data;
      
      // Handle format: STUDENT:CODE:ID
      if (data.startsWith('STUDENT:')) {
        const parts = data.split(':');
        if (parts.length >= 2) {
          studentCode = parts[1];
        }
      }
      
      stopCamera();
      onScan(studentCode);
      return;
    }

    animationIdRef.current = requestAnimationFrame(scanQRCode);
  }, [isScanning, onScan, stopCamera]);

  useEffect(() => {
    if (scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [scanMode, startCamera, stopCamera]);

  useEffect(() => {
    if (isScanning) {
      scanQRCode();
    }
  }, [isScanning, scanQRCode]);

  const handleSwitchCamera = () => {
    setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  const content = (
    <Card className={inline ? 'w-full' : 'w-full max-w-lg'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          {!inline && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardHeader>

        <CardContent className="space-y-4">
          {/* Mode Switch */}
          <div className="flex gap-2">
            <Button
              variant={scanMode === 'camera' ? 'default' : 'outline'}
              className="flex-1 gap-2"
              onClick={() => setScanMode('camera')}
            >
              <Camera className="h-4 w-4" />
              الكاميرا
            </Button>
            <Button
              variant={scanMode === 'manual' ? 'default' : 'outline'}
              className="flex-1 gap-2"
              onClick={() => setScanMode('manual')}
            >
              <Keyboard className="h-4 w-4" />
              إدخال يدوي
            </Button>
          </div>

          {scanMode === 'camera' ? (
            <>
              {error ? (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={startCamera} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    إعادة المحاولة
                  </Button>
                </div>
              ) : (
                <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Scanning Frame */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-4 border-primary rounded-2xl relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                      
                      {/* Scanning Line Animation */}
                      <div className="absolute inset-x-0 h-0.5 bg-primary animate-pulse top-1/2" />
                    </div>
                  </div>

                  {isScanning && (
                    <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm bg-black/50 py-2">
                      وجّه الكاميرا نحو رمز QR
                    </p>
                  )}
                </div>
              )}

              {/* Camera Controls */}
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchCamera}
                  className="gap-2"
                >
                  <FlipHorizontal className="h-4 w-4" />
                  {cameraFacing === 'environment' ? 'الكاميرا الأمامية' : 'الكاميرا الخلفية'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startCamera}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  إعادة تشغيل
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">كود الطالب</label>
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="أدخل كود الطالب..."
                  dir="ltr"
                  className="text-center text-lg font-mono"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={!manualCode.trim()}>
                <ScanLine className="h-4 w-4" />
                تأكيد الكود
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-muted-foreground">
            يمكنك مسح بطاقة الطالب أو إدخال الكود يدوياً
          </p>
        </CardContent>
      </Card>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4">
      {content}
    </div>
  );
}
