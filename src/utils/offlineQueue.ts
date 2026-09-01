// src/utils/offlineQueue.ts

export interface PendingScan {
  id: string;
  createdAt: string;
  sides: string[];
  imageBlobs: { side: string; base64: string; name: string }[];
  captureMethod: string;
}

const DB_NAME = 'LegalMetriX_OfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_scans';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePendingScan(scan: PendingScan): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(scan);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save pending scan to IndexedDB:', err);
    // Fallback to localStorage
    const existing = JSON.parse(localStorage.getItem('legalmetrix_pending_scans') || '[]');
    existing.push(scan);
    localStorage.setItem('legalmetrix_pending_scans', JSON.stringify(existing));
  }
}

export async function getPendingScans(): Promise<PendingScan[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    const existing = JSON.parse(localStorage.getItem('legalmetrix_pending_scans') || '[]');
    return existing;
  }
}

export async function removePendingScan(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    let existing: PendingScan[] = JSON.parse(localStorage.getItem('legalmetrix_pending_scans') || '[]');
    existing = existing.filter(s => s.id !== id);
    localStorage.setItem('legalmetrix_pending_scans', JSON.stringify(existing));
  }
}

// Convert base64 data URL to Blob
export function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Sync pending scans when online
export async function syncPendingScans(
  apiUrl: string,
  onProgress?: (syncedId: string, success: boolean) => void
): Promise<number> {
  if (!navigator.onLine) return 0;
  const pending = await getPendingScans();
  if (!pending.length) return 0;

  let successCount = 0;

  for (const scan of pending) {
    try {
      const formData = new FormData();
      formData.append('sides', JSON.stringify(scan.sides));
      formData.append('capture_method', scan.captureMethod || 'camera');

      for (const item of scan.imageBlobs) {
        const blob = dataURLtoBlob(item.base64);
        formData.append('images', blob, item.name || `${item.side}.jpg`);
      }

      const response = await fetch(`${apiUrl}/api/scans/`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        await removePendingScan(scan.id);
        successCount++;
        onProgress?.(scan.id, true);
      } else {
        onProgress?.(scan.id, false);
      }
    } catch (err) {
      console.error('Error syncing scan:', scan.id, err);
      onProgress?.(scan.id, false);
    }
  }

  return successCount;
}
