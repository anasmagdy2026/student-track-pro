import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type PageLoadingProps = {
  title?: string;
  description?: string;
};

export function PageLoading({
  title = "جاري تحميل البيانات",
  description = "ثواني ونكون خلّصنا…",
}: PageLoadingProps) {
  return (
    <div className="relative min-h-[60vh]">
      {/* Soft overlay */}
      <div className="absolute inset-0 rounded-2xl bg-background/40 backdrop-blur-[2px]" />

      <div className="relative flex items-center justify-center py-10">
        <Card className="w-full max-w-xl border-border/60 bg-card/90 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-foreground truncate">{title}</div>
                <div className="text-sm text-muted-foreground truncate">{description}</div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-5/6" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
