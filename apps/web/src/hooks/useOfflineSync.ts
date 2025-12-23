import { useEffect, useState } from 'react';
import { getQueuedMemories, removeFromQueue, processExpiredItems } from '../services/offline-queue';
import { createMemory } from '../api/memories';
import { createDraft } from '../utils/idempotency';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const updateQueueSize = async () => {
      const size = await getQueuedMemories().then((items) => items.length);
      setQueueSize(size);
    };
    updateQueueSize();
    const interval = setInterval(updateQueueSize, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isOnline) return;

    const sync = async () => {
      setSyncing(true);
      try {
        // Process expired items
        await processExpiredItems();

        // Get queued memories
        const queued = await getQueuedMemories();

        for (const item of queued) {
          try {
            const draft = createDraft(item.memory.textContent, item.memory.imageUrl);
            draft.idempotencyKey = item.idempotencyKey; // Use existing key

            await createMemory(draft);
            await removeFromQueue(item.id);
          } catch (error: any) {
            // Handle specific errors
            if (error.message.includes('DUPLICATE_CONTENT')) {
              // Mark as synced (duplicate)
              await removeFromQueue(item.id);
            } else if (error.message.includes('LIMIT_EXCEEDED')) {
              // Pause syncing
              break;
            } else if (error.message.includes('IDEMPOTENCY_KEY_REUSED')) {
              // Regenerate key and retry
              const newDraft = createDraft(item.memory.textContent, item.memory.imageUrl);
              try {
                await createMemory(newDraft);
                await removeFromQueue(item.id);
              } catch (retryError) {
                // Keep in queue for next sync
              }
            }
            // Other errors: keep in queue
          }
        }
      } finally {
        setSyncing(false);
      }
    };

    sync();
    const interval = setInterval(sync, 30000); // Sync every 30 seconds
    return () => clearInterval(interval);
  }, [isOnline]);

  return { isOnline, queueSize, syncing };
}

