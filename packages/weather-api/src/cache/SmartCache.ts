/**
 * SmartCache - Multi-tier caching system
 * Implements memory cache → IndexedDB cache → network fallback pattern
 * Features:
 * - Ultra-fast memory cache
 * - Persistent IndexedDB cache
 * - Automatic TTL and cleanup
 * - Stale-while-revalidate support
 */

import {
  CacheConfig,
  CacheEntry,
  CacheLayer,
  CacheResult
} from '../types';

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: CacheConfig = {
  memoryTtlMs: 5 * 60 * 1000, // 5 minutes
  indexedDbTtlMs: 24 * 60 * 60 * 1000, // 24 hours
  useMemoryCache: true,
  useIndexedDb: true,
  dbName: 'weather-api-cache',
  storeName: 'forecasts',
  maxSizeMb: 50
};

/**
 * SmartCache implementation
 */
export class SmartCache {
  private config: CacheConfig;
  private memoryCache: Map<string, CacheEntry<unknown>>;
  private db: IDBDatabase | null = null;
  private dbInitPromise: Promise<void>;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };

    this.memoryCache = new Map();
    this.dbInitPromise = this.initializeDatabase();
  }

  /**
   * Get cached data with automatic fallback through cache layers
   * Returns the first available data from: memory → IndexedDB → stale data
   */
  async get<T>(key: string): Promise<CacheResult<T> | null> {
    // Try memory cache first
    if (this.config.useMemoryCache) {
      const memoryResult = this.getFromMemory<T>(key);
      if (memoryResult) {
        return memoryResult;
      }
    }

    // Try IndexedDB cache
    if (this.config.useIndexedDb) {
      const dbResult = await this.getFromIndexedDb<T>(key);
      if (dbResult) {
        return dbResult;
      }
    }

    return null;
  }

  /**
   * Set data in cache (both memory and IndexedDB)
   */
  async set<T>(key: string, data: T, ttlMs?: number): Promise<void> {
    const finalTtlMs = ttlMs ?? this.config.memoryTtlMs;

    // Set in memory cache
    if (this.config.useMemoryCache) {
      this.setInMemory(key, data, finalTtlMs);
    }

    // Set in IndexedDB
    if (this.config.useIndexedDb) {
      try {
        await this.setInIndexedDb(key, data, this.config.indexedDbTtlMs);
      } catch (error) {
        // Log but don't fail - IndexedDB is optional
        console.error('SmartCache: Failed to write to IndexedDB:', error);
      }
    }
  }

  /**
   * Remove specific cache entry
   */
  async remove(key: string): Promise<void> {
    // Remove from memory
    this.memoryCache.delete(key);

    // Remove from IndexedDB
    if (this.config.useIndexedDb) {
      try {
        await this.deleteFromIndexedDb(key);
      } catch (error) {
        console.error('SmartCache: Failed to delete from IndexedDB:', error);
      }
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    // Clear memory
    this.memoryCache.clear();

    // Clear IndexedDB
    if (this.config.useIndexedDb) {
      try {
        await this.clearIndexedDb();
      } catch (error) {
        console.error('SmartCache: Failed to clear IndexedDB:', error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memoryEntries: number;
    memoryBytes: number;
    indexedDbEntries?: number;
  }> {
    const memoryEntries = this.memoryCache.size;
    let memoryBytes = 0;

    // Estimate memory usage
    for (const [, entry] of this.memoryCache) {
      memoryBytes += JSON.stringify(entry).length * 2; // Rough estimate: 2 bytes per char
    }

    let indexedDbEntries: number | undefined;
    if (this.config.useIndexedDb && this.db) {
      try {
        indexedDbEntries = await this.countIndexedDbEntries();
      } catch (error) {
        console.error('SmartCache: Failed to count IndexedDB entries:', error);
      }
    }

    return {
      memoryEntries,
      memoryBytes,
      indexedDbEntries
    };
  }

  /**
   * Clean up expired entries (manual trigger)
   */
  async cleanup(): Promise<void> {
    // Clean memory cache
    const now = Date.now();
    for (const [key, entry] of this.memoryCache) {
      if (this.isExpired(entry, now)) {
        this.memoryCache.delete(key);
      }
    }

    // Clean IndexedDB
    if (this.config.useIndexedDb) {
      try {
        await this.cleanupIndexedDb();
      } catch (error) {
        console.error('SmartCache: Failed to cleanup IndexedDB:', error);
      }
    }
  }

  /**
   * Get from memory cache
   */
  private getFromMemory<T>(key: string): CacheResult<T> | null {
    const entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const ageMs = now - entry.cachedAt;
    const isFresh = ageMs < entry.ttlMs;

    // Remove if expired and TTL exceeded by 2x
    if (this.isExpired(entry, now) && ageMs > entry.ttlMs * 2) {
      this.memoryCache.delete(key);
      return null;
    }

    return {
      data: entry.data as T,
      source: CacheLayer.MEMORY,
      isFresh,
      ageMs
    };
  }

  /**
   * Set in memory cache
   */
  private setInMemory<T>(key: string, data: T, ttlMs: number): void {
    this.memoryCache.set(key, {
      data,
      cachedAt: Date.now(),
      ttlMs,
      isStale: false
    });
  }

  /**
   * Initialize IndexedDB database
   */
  private async initializeDatabase(): Promise<void> {
    if (!this.config.useIndexedDb) {
      return;
    }

    try {
      // Check if IndexedDB is available
      if (!('indexedDB' in globalThis)) {
        console.warn('SmartCache: IndexedDB not available');
        return;
      }

      const request = indexedDB.open(this.config.dbName, 1);

      return new Promise((resolve, reject) => {
        request.onerror = () => {
          console.error('SmartCache: Failed to open IndexedDB:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains(this.config.storeName)) {
            db.createObjectStore(this.config.storeName, { keyPath: 'key' });
          }
        };
      });
    } catch (error) {
      console.error('SmartCache: Failed to initialize IndexedDB:', error);
    }
  }

  /**
   * Get from IndexedDB
   */
  private async getFromIndexedDb<T>(key: string): Promise<CacheResult<T> | null> {
    try {
      await this.dbInitPromise;

      if (!this.db) {
        return null;
      }

      const transaction = this.db.transaction(this.config.storeName, 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.get(key);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const storedEntry = request.result;

          if (!storedEntry) {
            resolve(null);
            return;
          }

          const entry = storedEntry.value as CacheEntry<T>;
          const now = Date.now();
          const ageMs = now - entry.cachedAt;
          const isFresh = ageMs < entry.ttlMs;

          resolve({
            data: entry.data,
            source: CacheLayer.INDEXED_DB,
            isFresh,
            ageMs
          });
        };

        request.onerror = () => {
          resolve(null);
        };
      });
    } catch (error) {
      console.error('SmartCache: Error reading from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Set in IndexedDB
   */
  private async setInIndexedDb<T>(
    key: string,
    data: T,
    ttlMs: number
  ): Promise<void> {
    try {
      await this.dbInitPromise;

      if (!this.db) {
        return;
      }

      const entry: CacheEntry<T> = {
        data,
        cachedAt: Date.now(),
        ttlMs,
        isStale: false
      };

      const transaction = this.db.transaction(this.config.storeName, 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.put({ key, value: entry });

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('SmartCache: Error writing to IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Delete from IndexedDB
   */
  private async deleteFromIndexedDb(key: string): Promise<void> {
    try {
      await this.dbInitPromise;

      if (!this.db) {
        return;
      }

      const transaction = this.db.transaction(this.config.storeName, 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.delete(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('SmartCache: Error deleting from IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Clear all IndexedDB entries
   */
  private async clearIndexedDb(): Promise<void> {
    try {
      await this.dbInitPromise;

      if (!this.db) {
        return;
      }

      const transaction = this.db.transaction(this.config.storeName, 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.clear();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('SmartCache: Error clearing IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Count entries in IndexedDB
   */
  private async countIndexedDbEntries(): Promise<number> {
    try {
      await this.dbInitPromise;

      if (!this.db) {
        return 0;
      }

      const transaction = this.db.transaction(this.config.storeName, 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.count();

      return new Promise((resolve) => {
        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          resolve(0);
        };
      });
    } catch (error) {
      console.error('SmartCache: Error counting IndexedDB entries:', error);
      return 0;
    }
  }

  /**
   * Clean up expired IndexedDB entries
   */
  private async cleanupIndexedDb(): Promise<void> {
    try {
      await this.dbInitPromise;

      if (!this.db) {
        return;
      }

      const transaction = this.db.transaction(this.config.storeName, 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.getAll();

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const entries = request.result;
          const now = Date.now();
          const deleteTransaction = this.db!.transaction(
            this.config.storeName,
            'readwrite'
          );
          const deleteStore = deleteTransaction.objectStore(this.config.storeName);

          for (const entry of entries) {
            if (this.isExpired(entry.value, now)) {
              deleteStore.delete(entry.key);
            }
          }

          deleteTransaction.oncomplete = () => {
            resolve();
          };
        };

        request.onerror = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error('SmartCache: Error cleaning up IndexedDB:', error);
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<unknown>, now: number): boolean {
    return now - entry.cachedAt > entry.ttlMs;
  }
}
