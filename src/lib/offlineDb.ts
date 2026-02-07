import { openDB, IDBPDatabase } from 'idb';

// Types for offline operations
export interface OfflineOperation {
  id: string;
  table: string;
  type: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  synced: boolean;
}

const DB_NAME = 'mr-magdy-offline';
const DB_VERSION = 1;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbInstance: IDBPDatabase<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDB(): Promise<IDBPDatabase<any>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create offline queue store
      if (!db.objectStoreNames.contains('offline-queue')) {
        const store = db.createObjectStore('offline-queue', { keyPath: 'id' });
        store.createIndex('by-synced', 'synced');
        store.createIndex('by-timestamp', 'timestamp');
      }
    },
  });

  return dbInstance;
}

// Generate unique ID for operations
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Add operation to offline queue
export async function addToOfflineQueue(
  table: string,
  type: 'insert' | 'update' | 'delete',
  data: Record<string, unknown>
): Promise<string> {
  const db = await getDB();
  const operation: OfflineOperation = {
    id: generateId(),
    table,
    type,
    data,
    timestamp: Date.now(),
    synced: false,
  };

  await db.add('offline-queue', operation);
  return operation.id;
}

// Get all pending operations
export async function getPendingOperations(): Promise<OfflineOperation[]> {
  const db = await getDB();
  const tx = db.transaction('offline-queue', 'readonly');
  const store = tx.objectStore('offline-queue');
  const all = await store.getAll();
  return all.filter((op: OfflineOperation) => !op.synced);
}

// Mark operation as synced
export async function markAsSynced(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('offline-queue', 'readwrite');
  const store = tx.objectStore('offline-queue');
  const operation = await store.get(id);
  
  if (operation) {
    operation.synced = true;
    await store.put(operation);
  }
  
  await tx.done;
}

// Delete synced operations
export async function clearSyncedOperations(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('offline-queue', 'readwrite');
  const store = tx.objectStore('offline-queue');
  const all = await store.getAll();
  
  for (const op of all) {
    if (op.synced) {
      await store.delete(op.id);
    }
  }
  
  await tx.done;
}

// Get pending count
export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('offline-queue', 'readonly');
  const store = tx.objectStore('offline-queue');
  const all = await store.getAll();
  return all.filter((op: OfflineOperation) => !op.synced).length;
}
