import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MemoryQueueItem {
  id: string;
  idempotencyKey: string;
  memory: {
    textContent?: string;
    imageUrl?: string;
  };
  queuedAt: number;
  retryCount: number;
  lastRetryAt?: number;
}

interface OfflineDB extends DBSchema {
  'pending-memories': {
    key: string;
    value: MemoryQueueItem;
    indexes: { 'by-queued': number };
  };
  'drafts': {
    key: string;
    value: {
      id: string;
      text: string;
      imageUrl?: string;
      updatedAt: number;
    };
  };
}

const MAX_QUEUE_SIZE = 50;
const QUEUE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

let db: IDBPDatabase<OfflineDB>;

async function getDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (!db) {
    db = await openDB<OfflineDB>('memory-connector', 1, {
      upgrade(db) {
        const pendingStore = db.createObjectStore('pending-memories', { keyPath: 'id' });
        pendingStore.createIndex('by-queued', 'queuedAt');
        db.createObjectStore('drafts', { keyPath: 'id' });
      },
    });
  }
  return db;
}

export async function queueMemory(
  item: Omit<MemoryQueueItem, 'queuedAt' | 'retryCount'>
): Promise<{ success: boolean; error?: string }> {
  const database = await getDB();

  // Check queue size
  const count = await database.count('pending-memories');
  if (count >= MAX_QUEUE_SIZE) {
    return { success: false, error: 'QUEUE_FULL' };
  }

  await database.put('pending-memories', {
    ...item,
    queuedAt: Date.now(),
    retryCount: 0,
  });

  return { success: true };
}

export async function getQueuedMemories(): Promise<MemoryQueueItem[]> {
  const database = await getDB();
  return database.getAllFromIndex('pending-memories', 'by-queued');
}

export async function removeFromQueue(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('pending-memories', id);
}

export async function processExpiredItems(): Promise<string[]> {
  const database = await getDB();
  const items = await database.getAll('pending-memories');
  const now = Date.now();
  const expiredIds: string[] = [];

  for (const item of items) {
    if (now - item.queuedAt > QUEUE_TTL_MS) {
      // Move to drafts
      await database.put('drafts', {
        id: item.id,
        text: item.memory.textContent || '',
        imageUrl: item.memory.imageUrl,
        updatedAt: now,
      });
      await database.delete('pending-memories', item.id);
      expiredIds.push(item.id);
    }
  }

  return expiredIds;
}

export async function getQueueSize(): Promise<number> {
  const database = await getDB();
  return database.count('pending-memories');
}

