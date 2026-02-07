import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getPendingOperations,
  markAsSynced,
  clearSyncedOperations,
  getPendingCount,
  OfflineOperation,
} from '@/lib/offlineDb';
import { useOnlineStatus } from './useOnlineStatus';
import { toast } from 'sonner';

export function useOfflineSync() {
  const { isOnline, wasOffline, resetWasOffline } = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  // Sync a single operation
  const syncOperation = async (operation: OfflineOperation): Promise<boolean> => {
    const { table, type, data } = operation;

    try {
      switch (type) {
        case 'insert': {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await supabase.from(table as any).insert(data as any);
          if (error) throw error;
          break;
        }
        case 'update': {
          const { id, ...updateData } = data;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await supabase.from(table as any).update(updateData as any).eq('id', id as string);
          if (error) throw error;
          break;
        }
        case 'delete': {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await supabase.from(table as any).delete().eq('id', data.id as string);
          if (error) throw error;
          break;
        }
      }
      return true;
    } catch (error) {
      console.error(`Failed to sync operation ${operation.id}:`, error);
      return false;
    }
  };

  // Sync all pending operations
  const syncAll = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const pendingOps = await getPendingOperations();
      
      if (pendingOps.length === 0) {
        setIsSyncing(false);
        return;
      }

      // Sort by timestamp to maintain order
      pendingOps.sort((a, b) => a.timestamp - b.timestamp);

      for (const op of pendingOps) {
        const success = await syncOperation(op);
        if (success) {
          await markAsSynced(op.id);
          successCount++;
        } else {
          failCount++;
        }
      }

      // Clean up synced operations
      await clearSyncedOperations();
      await updatePendingCount();
      setLastSyncTime(new Date());

      if (successCount > 0) {
        toast.success(`تم مزامنة ${successCount} عملية بنجاح`);
      }
      if (failCount > 0) {
        toast.error(`فشل مزامنة ${failCount} عملية`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('حدث خطأ أثناء المزامنة');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, updatePendingCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (wasOffline && isOnline) {
      syncAll();
      resetWasOffline();
    }
  }, [wasOffline, isOnline, syncAll, resetWasOffline]);

  // Initial pending count
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncAll,
    updatePendingCount,
  };
}
