import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Wifi, WifiOff, Loader2, CloudUpload, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function OfflineStatusIndicator() {
  const { isOnline, isSyncing, pendingCount, syncAll, lastSyncTime } = useOfflineSync();

  if (isOnline && pendingCount === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-600 rounded-full text-xs">
            <Wifi className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">متصل</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>متصل بالإنترنت - كل البيانات متزامنة</p>
          {lastSyncTime && (
            <p className="text-xs text-muted-foreground">
              آخر مزامنة: {lastSyncTime.toLocaleTimeString('ar-EG')}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (!isOnline) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-destructive/10 text-destructive rounded-full text-xs">
            <WifiOff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">غير متصل</span>
            {pendingCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-xs">
                {pendingCount}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>غير متصل بالإنترنت</p>
          {pendingCount > 0 && (
            <p className="text-xs">
              {pendingCount} عملية في انتظار المزامنة
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            البيانات محفوظة محلياً وستتم مزامنتها تلقائياً
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Online with pending operations
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={syncAll}
          disabled={isSyncing}
          className="h-7 gap-1.5 px-2 bg-warning/10 text-warning hover:bg-warning/20"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="hidden sm:inline text-xs">جاري المزامنة...</span>
            </>
          ) : (
            <>
              <CloudUpload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">مزامنة</span>
              <Badge variant="secondary" className="h-4 px-1 text-xs">
                {pendingCount}
              </Badge>
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{pendingCount} عملية في انتظار المزامنة</p>
        <p className="text-xs text-muted-foreground">اضغط للمزامنة الآن</p>
      </TooltipContent>
    </Tooltip>
  );
}
