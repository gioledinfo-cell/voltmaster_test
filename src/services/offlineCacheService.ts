import { Cantiere, ArticoloMagazzino } from '../types';

export interface OfflineCacheMetadata {
  lastUpdated: string;
  formattedTime: string;
  activeCantieriCount: number;
  materialiCount: number;
  storageEngine: 'IndexedDB' | 'LocalStorage';
  cacheSizeBytes?: number;
}

const DB_NAME = 'VoltMasterOfflineDB';
const DB_VERSION = 1;
const STORE_CANTIERI = 'active_cantieri';
const STORE_MATERIALI = 'materiali_magazzino';
const STORE_META = 'offline_metadata';

const LS_PREFIX = 'voltmaster_offline_';
const LS_CANTIERI_KEY = `${LS_PREFIX}active_cantieri`;
const LS_MATERIALI_KEY = `${LS_PREFIX}materiali`;
const LS_META_KEY = `${LS_PREFIX}meta`;

// Helper: Open IndexedDB with error handling
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_CANTIERI)) {
        db.createObjectStore(STORE_CANTIERI, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MATERIALI)) {
        db.createObjectStore(STORE_MATERIALI, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Filter only active Cantieri (in_corso, in_attesa, collaudo, sospeso)
 */
export function filterActiveCantieri(cantieri: Cantiere[]): Cantiere[] {
  return cantieri.filter((c) => c.stato !== 'completato');
}

/**
 * Save Active Cantieri and Materiali into both IndexedDB and LocalStorage mirror
 */
export async function saveActiveDataToOfflineCache(
  allCantieri: Cantiere[],
  allMateriali: ArticoloMagazzino[]
): Promise<OfflineCacheMetadata> {
  const activeCantieri = filterActiveCantieri(allCantieri);
  const now = new Date();
  const metadata: OfflineCacheMetadata = {
    lastUpdated: now.toISOString(),
    formattedTime: now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' · ' +
      now.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
    activeCantieriCount: activeCantieri.length,
    materialiCount: allMateriali.length,
    storageEngine: 'IndexedDB',
  };

  // Always sync to LocalStorage as instant synchronous fallback
  try {
    localStorage.setItem(LS_CANTIERI_KEY, JSON.stringify(activeCantieri));
    localStorage.setItem(LS_MATERIALI_KEY, JSON.stringify(allMateriali));
    localStorage.setItem(LS_META_KEY, JSON.stringify(metadata));
  } catch (lsErr) {
    console.warn('LocalStorage mirror warning:', lsErr);
  }

  // Try saving to IndexedDB for high-volume offline storage
  try {
    const db = await openIDB();

    // Save Cantieri
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_CANTIERI, STORE_MATERIALI, STORE_META], 'readwrite');
      const cantieriStore = tx.objectStore(STORE_CANTIERI);
      const materialiStore = tx.objectStore(STORE_MATERIALI);
      const metaStore = tx.objectStore(STORE_META);

      cantieriStore.clear();
      for (const item of activeCantieri) {
        cantieriStore.put(item);
      }

      materialiStore.clear();
      for (const item of allMateriali) {
        materialiStore.put(item);
      }

      metaStore.put({ key: 'metadata', ...metadata });

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });

    metadata.storageEngine = 'IndexedDB';
    return metadata;
  } catch (idbErr) {
    console.warn('IndexedDB write failed, fallen back to LocalStorage:', idbErr);
    metadata.storageEngine = 'LocalStorage';
    return metadata;
  }
}

/**
 * Retrieve cached active Cantieri, checking IndexedDB then LocalStorage
 */
export async function getCachedActiveCantieri(): Promise<Cantiere[]> {
  try {
    const db = await openIDB();
    return await new Promise<Cantiere[]>((resolve, reject) => {
      const tx = db.transaction(STORE_CANTIERI, 'readonly');
      const store = tx.objectStore(STORE_CANTIERI);
      const request = store.getAll();

      request.onsuccess = () => {
        db.close();
        if (request.result && request.result.length > 0) {
          resolve(request.result);
        } else {
          // Fallback to localStorage if empty
          resolve(getCachedActiveCantieriSync());
        }
      };
      request.onerror = () => {
        db.close();
        resolve(getCachedActiveCantieriSync());
      };
    });
  } catch {
    return getCachedActiveCantieriSync();
  }
}

/**
 * Synchronous read from LocalStorage (guarantees zero UI lag on startup)
 */
export function getCachedActiveCantieriSync(): Cantiere[] {
  try {
    const raw = localStorage.getItem(LS_CANTIERI_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Retrieve cached Materiali, checking IndexedDB then LocalStorage
 */
export async function getCachedMateriali(): Promise<ArticoloMagazzino[]> {
  try {
    const db = await openIDB();
    return await new Promise<ArticoloMagazzino[]>((resolve, reject) => {
      const tx = db.transaction(STORE_MATERIALI, 'readonly');
      const store = tx.objectStore(STORE_MATERIALI);
      const request = store.getAll();

      request.onsuccess = () => {
        db.close();
        if (request.result && request.result.length > 0) {
          resolve(request.result);
        } else {
          resolve(getCachedMaterialiSync());
        }
      };
      request.onerror = () => {
        db.close();
        resolve(getCachedMaterialiSync());
      };
    });
  } catch {
    return getCachedMaterialiSync();
  }
}

/**
 * Synchronous read of Materiali from LocalStorage
 */
export function getCachedMaterialiSync(): ArticoloMagazzino[] {
  try {
    const raw = localStorage.getItem(LS_MATERIALI_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Retrieve metadata about the offline cache
 */
export async function getOfflineCacheMetadata(): Promise<OfflineCacheMetadata | null> {
  try {
    const db = await openIDB();
    return await new Promise<OfflineCacheMetadata | null>((resolve) => {
      const tx = db.transaction(STORE_META, 'readonly');
      const store = tx.objectStore(STORE_META);
      const request = store.get('metadata');

      request.onsuccess = () => {
        db.close();
        if (request.result) {
          resolve(request.result);
        } else {
          resolve(getOfflineCacheMetadataSync());
        }
      };
      request.onerror = () => {
        db.close();
        resolve(getOfflineCacheMetadataSync());
      };
    });
  } catch {
    return getOfflineCacheMetadataSync();
  }
}

/**
 * Synchronous read of metadata
 */
export function getOfflineCacheMetadataSync(): OfflineCacheMetadata | null {
  try {
    const raw = localStorage.getItem(LS_META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Clear the offline cache
 */
export async function clearOfflineCache(): Promise<void> {
  try {
    localStorage.removeItem(LS_CANTIERI_KEY);
    localStorage.removeItem(LS_MATERIALI_KEY);
    localStorage.removeItem(LS_META_KEY);

    const db = await openIDB();
    const tx = db.transaction([STORE_CANTIERI, STORE_MATERIALI, STORE_META], 'readwrite');
    tx.objectStore(STORE_CANTIERI).clear();
    tx.objectStore(STORE_MATERIALI).clear();
    tx.objectStore(STORE_META).clear();
    tx.oncomplete = () => db.close();
  } catch (e) {
    console.error('Error clearing offline cache:', e);
  }
}

/* =========================================================================
 * OFFLINE ROL DRAFTS & QUEUED OUTBOX (MOBILE OUTDOOR & ASSENZA DI RETE)
 * ========================================================================= */

const LS_ROL_DRAFT_KEY = `${LS_PREFIX}campo_rol_draft`;
const LS_ROL_QUEUE_KEY = `${LS_PREFIX}campo_rol_outbox_queue`;

export interface QueuedOfflineRol {
  id: string;
  queuedAt: string;
  formattedTime: string;
  rolData: any;
  retryCount: number;
}

/**
 * Save current in-progress form draft to LocalStorage
 */
export function saveOfflineRolDraft(draft: any): void {
  try {
    localStorage.setItem(LS_ROL_DRAFT_KEY, JSON.stringify({
      savedAt: new Date().toISOString(),
      draft,
    }));
  } catch (err) {
    console.warn('Failed to save offline ROL draft:', err);
  }
}

/**
 * Get current in-progress draft
 */
export function getOfflineRolDraft(): any | null {
  try {
    const raw = localStorage.getItem(LS_ROL_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.draft || null;
  } catch {
    return null;
  }
}

/**
 * Clear the in-progress draft after successful submission
 */
export function clearOfflineRolDraft(): void {
  try {
    localStorage.removeItem(LS_ROL_DRAFT_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Add a completed ROL to the offline queue when no network is available
 */
export function enqueueOfflineRol(rolData: any): QueuedOfflineRol {
  const queue = getQueuedOfflineRols();
  const now = new Date();
  const queuedItem: QueuedOfflineRol = {
    id: `OFFLINE-ROL-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    queuedAt: now.toISOString(),
    formattedTime: now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
    rolData,
    retryCount: 0,
  };
  
  queue.push(queuedItem);
  try {
    localStorage.setItem(LS_ROL_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Error enqueuing offline ROL:', err);
  }
  return queuedItem;
}

/**
 * Get all queued ROLs waiting for connection
 */
export function getQueuedOfflineRols(): QueuedOfflineRol[] {
  try {
    const raw = localStorage.getItem(LS_ROL_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Remove a specific queued ROL after successful synchronization
 */
export function removeQueuedOfflineRol(id: string): void {
  try {
    const queue = getQueuedOfflineRols().filter((q) => q.id !== id);
    localStorage.setItem(LS_ROL_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Error removing queued ROL:', err);
  }
}

/**
 * Clear all queued ROLs
 */
export function clearQueuedOfflineRols(): void {
  try {
    localStorage.removeItem(LS_ROL_QUEUE_KEY);
  } catch {
    // Ignore
  }
}

