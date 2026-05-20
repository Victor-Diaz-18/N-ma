import { api } from "./api";
import { listPendingSubmissions, removePendingSubmission } from "./offline";
import { toast } from "sonner";

let syncing = false;

export async function syncPending() {
  if (syncing || !navigator.onLine) return { synced: 0, failed: 0 };
  syncing = true;
  let synced = 0, failed = 0;
  try {
    const items = await listPendingSubmissions();
    for (const item of items) {
      try {
        await api.post(item.url, item.payload);
        await removePendingSubmission(item.id);
        synced++;
      } catch (e) {
        // If it's a real server error (4xx), drop it; if network, keep for retry
        if (e.response && e.response.status >= 400 && e.response.status < 500) {
          await removePendingSubmission(item.id);
        }
        failed++;
      }
    }
    if (synced > 0) toast.success(`${synced} entrega${synced > 1 ? "s" : ""} sincronizada${synced > 1 ? "s" : ""}`);
  } finally {
    syncing = false;
  }
  return { synced, failed };
}

export function installSyncListeners() {
  window.addEventListener("online", () => {
    syncPending();
  });
  // Try once at startup if online
  if (navigator.onLine) {
    setTimeout(() => syncPending(), 1500);
  }
  // Periodic retry every 60s
  setInterval(() => {
    if (navigator.onLine) syncPending();
  }, 60000);
}

export async function pendingCount() {
  const items = await listPendingSubmissions();
  return items.length;
}
