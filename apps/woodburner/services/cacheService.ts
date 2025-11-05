/**
 * IndexedDB Caching Service for Weather Data
 * Implements intelligent caching to reduce API calls and improve performance
 */

interface CacheItem<T> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface WeatherCacheData {
  currentRecommendation: any;
  weeklyForecast: any[];
  weatherData: any[];
  locationName: string;
  localTime: string;
  timezone: string;
}

class CacheService {
  private dbName = 'GetTheWashingOutCache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  private stores = {
    weather: 'weather-cache',
    locations: 'location-cache',
    preferences: 'user-preferences'
  };

  // Cache durations in milliseconds
  private cacheDurations = {
    weather: 10 * 60 * 1000, // 10 minutes
    location: 24 * 60 * 60 * 1000, // 24 hours
    preferences: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        Object.values(this.stores).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'key' });
            store.createIndex('timestamp', 'timestamp');
            store.createIndex('expiresAt', 'expiresAt');
          }
        });
      };
    });
  }

  private generateWeatherKey(location: string): string {
    // Create a normalized key for weather data
    return `weather_${location.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }

  private generateLocationKey(input: string): string {
    return `location_${input.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }

  async cacheWeatherData(location: string, data: WeatherCacheData): Promise<void> {
    if (!this.db) await this.init();
    
    const key = this.generateWeatherKey(location);
    const cacheItem: CacheItem<WeatherCacheData> = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.cacheDurations.weather
    };

    return this.setItem(this.stores.weather, cacheItem);
  }

  async getWeatherData(location: string): Promise<WeatherCacheData | null> {
    if (!this.db) await this.init();
    
    const key = this.generateWeatherKey(location);
    const item = await this.getItem<WeatherCacheData>(this.stores.weather, key);
    
    if (item && item.expiresAt > Date.now()) {
      console.log('Cache hit for weather data:', location);
      return item.data;
    }

    if (item) {
      // Expired - remove from cache
      await this.removeItem(this.stores.weather, key);
    }

    return null;
  }

  async cacheLocationData(input: string, locationData: any): Promise<void> {
    if (!this.db) await this.init();
    
    const key = this.generateLocationKey(input);
    const cacheItem: CacheItem<any> = {
      key,
      data: locationData,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.cacheDurations.location
    };

    return this.setItem(this.stores.locations, cacheItem);
  }

  async getLocationData(input: string): Promise<any | null> {
    if (!this.db) await this.init();
    
    const key = this.generateLocationKey(input);
    const item = await this.getItem<any>(this.stores.locations, key);
    
    if (item && item.expiresAt > Date.now()) {
      console.log('Cache hit for location data:', input);
      return item.data;
    }

    if (item) {
      await this.removeItem(this.stores.locations, key);
    }

    return null;
  }

  async cacheUserPreferences(preferences: any): Promise<void> {
    if (!this.db) await this.init();
    
    const cacheItem: CacheItem<any> = {
      key: 'user_preferences',
      data: preferences,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.cacheDurations.preferences
    };

    return this.setItem(this.stores.preferences, cacheItem);
  }

  async getUserPreferences(): Promise<any | null> {
    if (!this.db) await this.init();
    
    const item = await this.getItem<any>(this.stores.preferences, 'user_preferences');
    return item && item.expiresAt > Date.now() ? item.data : null;
  }

  private async setItem<T>(storeName: string, item: CacheItem<T>): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async getItem<T>(storeName: string, key: string): Promise<CacheItem<T> | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  private async removeItem(storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearExpiredItems(): Promise<void> {
    if (!this.db) await this.init();
    
    const now = Date.now();
    
    for (const storeName of Object.values(this.stores)) {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const index = store.index('expiresAt');
      const request = index.openCursor(IDBKeyRange.upperBound(now));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    }
  }

  async getCacheStats(): Promise<{
    weatherItems: number;
    locationItems: number;
    preferenceItems: number;
    totalSize: number;
  }> {
    if (!this.db) await this.init();

    const stats = {
      weatherItems: 0,
      locationItems: 0,
      preferenceItems: 0,
      totalSize: 0
    };

    for (const [type, storeName] of Object.entries(this.stores)) {
      const count = await this.getStoreItemCount(storeName);
      if (type === 'weather') stats.weatherItems = count;
      else if (type === 'locations') stats.locationItems = count;
      else if (type === 'preferences') stats.preferenceItems = count;
    }

    return stats;
  }

  private async getStoreItemCount(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;