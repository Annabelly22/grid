// IndexedDB wrapper for GRID app
// Provides much larger storage than localStorage (~5MB limit)

const DB_NAME = 'grid-db';
const DB_VERSION = 1;
const STORE_TRADES = 'tradeJournal';

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create trade journal store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_TRADES)) {
        db.createObjectStore(STORE_TRADES, { keyPath: 'id' });
      }
    };
  });
}

// Trade Journal operations
export async function loadTradesFromIDB(): Promise<TradeSession[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRADES, 'readonly');
      const store = tx.objectStore(STORE_TRADES);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to load from IndexedDB:', err);
    return [];
  }
}

export async function saveTradesToIDB(trades: TradeSession[]): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRADES, 'readwrite');
      const store = tx.objectStore(STORE_TRADES);

      // Clear existing and add all trades
      store.clear();
      trades.forEach(trade => store.put(trade));

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save to IndexedDB:', err);
    return false;
  }
}

export async function addTradeToIDB(trade: TradeSession): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRADES, 'readwrite');
      const store = tx.objectStore(STORE_TRADES);
      const request = store.put(trade);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to add trade to IndexedDB:', err);
    return false;
  }
}

export async function updateTradeInIDB(id: string, data: Partial<TradeSession>): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRADES, 'readwrite');
      const store = tx.objectStore(STORE_TRADES);

      // Get existing trade first
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (existing) {
          const updated = { ...existing, ...data };
          store.put(updated);
        }
      };

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to update trade in IndexedDB:', err);
    return false;
  }
}

export async function deleteTradeFromIDB(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRADES, 'readwrite');
      const store = tx.objectStore(STORE_TRADES);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to delete trade from IndexedDB:', err);
    return false;
  }
}

// Migration: Move data from localStorage to IndexedDB
export async function migrateFromLocalStorage(): Promise<void> {
  const KEY_TRADE_JOURNAL = 'grid_trade_journal';

  try {
    // Check if we have data in localStorage
    const localData = localStorage.getItem(KEY_TRADE_JOURNAL);
    if (!localData) return;

    const trades: TradeSession[] = JSON.parse(localData);
    if (!trades || trades.length === 0) return;

    // Check if IndexedDB already has data
    const idbTrades = await loadTradesFromIDB();
    if (idbTrades.length > 0) {
      // Already migrated, just clear localStorage to free space
      localStorage.removeItem(KEY_TRADE_JOURNAL);
      console.log('Migration: Cleared localStorage (IndexedDB already has data)');
      return;
    }

    // Migrate to IndexedDB
    const success = await saveTradesToIDB(trades);
    if (success) {
      // Clear localStorage to free up space
      localStorage.removeItem(KEY_TRADE_JOURNAL);
      console.log(`Migration: Moved ${trades.length} trades from localStorage to IndexedDB`);
    }
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

// Type import (avoid circular dependency)
import type { TradeSession } from './gameStore';
