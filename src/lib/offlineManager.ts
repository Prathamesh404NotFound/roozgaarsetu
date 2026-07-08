import { ref, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { toast } from "sonner";

export interface OfflineAction {
  id: string;
  type: "accept_job" | "complete_job" | "toggle_availability";
  path: string;
  data: Record<string, unknown>;
  description: string;
  timestamp: number;
}

const QUEUE_KEY = "roozgaarsetu_offline_queue";

// Helper to load queue
export const getOfflineQueue = (): OfflineAction[] => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load offline queue:", e);
    return [];
  }
};

// Helper to save queue
const saveOfflineQueue = (queue: OfflineAction[]) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to save offline queue:", e);
  }
};

// Queue an action
export const queueOfflineAction = (
  type: OfflineAction["type"],
  path: string,
  data: Record<string, unknown>,
  description: string
): OfflineAction => {
  const queue = getOfflineQueue();
  const newAction: OfflineAction = {
    id: `act_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
    type,
    path,
    data,
    description,
    timestamp: Date.now(),
  };

  queue.push(newAction);
  saveOfflineQueue(queue);

  // Dispatch event to notify listeners (e.g. dashboard)
  window.dispatchEvent(new Event("offline-queue-changed"));

  toast.warning(`Offline: "${description}" queued. It will sync automatically when back online.`, {
    duration: 5000,
  });

  return newAction;
};

// Synchronize all queued actions
export const syncOfflineQueue = async (): Promise<boolean> => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return true;

  toast.info(`Attempting to sync ${queue.length} offline action(s)...`, {
    id: "offline-syncing",
  });

  const remainingQueue: OfflineAction[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (const action of queue) {
    try {
      const dbRef = ref(database, action.path);
      await update(dbRef, {
        ...action.data,
        updatedAt: new Date().toISOString(),
      });
      successCount++;
    } catch (err) {
      console.error(`Failed to sync queued action ${action.id}:`, err);
      remainingQueue.push(action);
      failedCount++;
    }
  }

  saveOfflineQueue(remainingQueue);
  window.dispatchEvent(new Event("offline-queue-changed"));

  if (successCount > 0) {
    toast.success(`Back Online! Synced ${successCount} queued action(s) successfully.`, {
      id: "offline-syncing",
    });
  } else if (failedCount > 0) {
    toast.error(`Sync failed for some actions. Will retry when connection improves.`, {
      id: "offline-syncing",
    });
  }

  return remainingQueue.length === 0;
};
