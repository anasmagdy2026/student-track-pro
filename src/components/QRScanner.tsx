import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationId: number;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsScanning(true);
          scanQRCode();
        }
      } catch (err) {
        setError('لا يمكن الوصول إلى الكاميرا');
        console.error('Camera error:', err);
      }
    };

    const scanQRCode = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      const scan = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Simple QR code detection using image data
          // In production, you'd use a library like jsQR
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // For now, we'll use manual code entry as fallback
          // Real QR scanning would require jsQR library
        }
        animationId = requestAnimationFrame(scan);
      };

      scan();
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [onScan]);

  return (
    <Card className="fixed inset-4 z-50 bg-background/95 backdrop-blur">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Camera className="h-5 w-5" />
            مسح رمز QR
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {error ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <div className="flex-1 relative bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-4 border-primary rounded-2xl animate-pulse" />
            </div>
            {isScanning && (
              <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
                وجّه الكاميرا نحو رمز QR
              </p>
            )}
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-4">
          ملاحظة: يمكنك استخدام إدخال الكود يدوياً كبديل
        </p>
      </CardContent>
    </Card>
  );
}
