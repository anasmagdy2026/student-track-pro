import { addToOfflineQueue } from '@/lib/offlineDb';
import { supabase } from '@/integrations/supabase/client';

type TableName = 'attendance' | 'payments' | 'exam_results' | 'students' | 'groups' | 'lessons' | 'lesson_homework' | 'lesson_recitations' | 'lesson_sheets';

interface OfflineAwareOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Check if we're online
function isOnline(): boolean {
  return navigator.onLine;
}

// Insert with offline support
export async function offlineInsert<T extends Record<string, unknown>>(
  table: TableName,
  data: T,
  options?: OfflineAwareOptions
): Promise<{ success: boolean; offline: boolean; id?: string }> {
  // Generate a temporary ID for offline operations
  const tempId = data.id as string || crypto.randomUUID();
  const dataWithId = { ...data, id: tempId };

  if (!isOnline()) {
    try {
      await addToOfflineQueue(table, 'insert', dataWithId);
      options?.onSuccess?.();
      return { success: true, offline: true, id: tempId };
    } catch (error) {
      options?.onError?.(error as Error);
      return { success: false, offline: true };
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(table as any).insert(dataWithId);
    
    if (error) {
      // If online insert fails, try offline
      await addToOfflineQueue(table, 'insert', dataWithId);
      options?.onSuccess?.();
      return { success: true, offline: true, id: tempId };
    }
    
    options?.onSuccess?.();
    return { success: true, offline: false, id: tempId };
  } catch (error) {
    // Fallback to offline
    await addToOfflineQueue(table, 'insert', dataWithId);
    options?.onSuccess?.();
    return { success: true, offline: true, id: tempId };
  }
}

// Update with offline support
export async function offlineUpdate<T extends Record<string, unknown>>(
  table: TableName,
  id: string,
  data: T,
  options?: OfflineAwareOptions
): Promise<{ success: boolean; offline: boolean }> {
  const dataWithId = { ...data, id };

  if (!isOnline()) {
    try {
      await addToOfflineQueue(table, 'update', dataWithId);
      options?.onSuccess?.();
      return { success: true, offline: true };
    } catch (error) {
      options?.onError?.(error as Error);
      return { success: false, offline: true };
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(table as any).update(data as any).eq('id', id);
    
    if (error) {
      await addToOfflineQueue(table, 'update', dataWithId);
      options?.onSuccess?.();
      return { success: true, offline: true };
    }
    
    options?.onSuccess?.();
    return { success: true, offline: false };
  } catch (error) {
    await addToOfflineQueue(table, 'update', dataWithId);
    options?.onSuccess?.();
    return { success: true, offline: true };
  }
}

// Delete with offline support
export async function offlineDelete(
  table: TableName,
  id: string,
  options?: OfflineAwareOptions
): Promise<{ success: boolean; offline: boolean }> {
  if (!isOnline()) {
    try {
      await addToOfflineQueue(table, 'delete', { id });
      options?.onSuccess?.();
      return { success: true, offline: true };
    } catch (error) {
      options?.onError?.(error as Error);
      return { success: false, offline: true };
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(table as any).delete().eq('id', id);
    
    if (error) {
      await addToOfflineQueue(table, 'delete', { id });
      options?.onSuccess?.();
      return { success: true, offline: true };
    }
    
    options?.onSuccess?.();
    return { success: true, offline: false };
  } catch (error) {
    await addToOfflineQueue(table, 'delete', { id });
    options?.onSuccess?.();
    return { success: true, offline: true };
  }
}
