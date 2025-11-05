# @weather-apps/weather-api

Weather data fetching and intelligent caching service for weather decision applications.

## Features

- **Open-Meteo Integration**: Fetches weather data from Open-Meteo API using UK Met Office models
- **72+ Hour Forecast**: Hourly weather data for 3+ days with comprehensive meteorological parameters
- **Smart Multi-tier Caching**: Memory → IndexedDB → Network with automatic fallback
- **Automatic Retry**: Exponential backoff for transient failures
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Performance Optimized**: Stale-while-revalidate pattern and efficient caching strategies
- **Error Handling**: Graceful degradation and detailed error context

## Installation

```bash
npm install @weather-apps/weather-api
```

## Quick Start

### Basic Usage

```typescript
import { OpenMeteoProvider, SmartCache } from '@weather-apps/weather-api';

// Create provider and cache
const provider = new OpenMeteoProvider();
const cache = new SmartCache();

// Fetch weather data
const location = { latitude: 51.5074, longitude: -0.1278 }; // London
const forecast = await provider.fetchForecast(location);

console.log(forecast.hourly[0]); // First hour data
console.log(forecast.daily[0]);  // First day data
```

### With Caching

```typescript
import { OpenMeteoProvider, SmartCache, ForecastData, Location } from '@weather-apps/weather-api';

const provider = new OpenMeteoProvider();
const cache = new SmartCache();

async function getWeatherWithCache(location: Location): Promise<ForecastData> {
  const cacheKey = `weather-${location.latitude}-${location.longitude}`;

  // Try to get from cache first
  const cached = await cache.get<ForecastData>(cacheKey);
  if (cached?.isFresh) {
    console.log('Using fresh cached data');
    return cached.data;
  }

  // Fetch from API if cache is stale or missing
  const forecast = await provider.fetchForecast(location);

  // Store in cache for 10 minutes
  await cache.set(cacheKey, forecast, 10 * 60 * 1000);

  return forecast;
}

// Usage
const london: Location = {
  latitude: 51.5074,
  longitude: -0.1278,
  name: 'London'
};

const forecast = await getWeatherWithCache(london);
```

## Core Components

### OpenMeteoProvider

Fetches weather forecast data from Open-Meteo API.

#### Configuration

```typescript
const provider = new OpenMeteoProvider({
  apiUrl: 'https://api.open-meteo.com/v1/forecast',
  timeoutMs: 15000,
  retryConfig: {
    maxRetries: 3,
    delayMs: 1000,
    backoffMultiplier: 2
  },
  models: ['ukmo', 'ukvp'] // UK Met Office models
});
```

#### Methods

**`fetchForecast(location: Location): Promise<ForecastData>`**

Fetches 72+ hour hourly forecast and 7-day daily forecast.

```typescript
const forecast = await provider.fetchForecast({
  latitude: 51.5074,
  longitude: -0.1278,
  name: 'London',
  timezone: 'Europe/London'
});

console.log(forecast.hourly);      // 72+ hours of hourly data
console.log(forecast.daily);       // 7 days of daily data
console.log(forecast.astronomy);   // Sunrise/sunset data
```

**`fetchAstronomy(location: Location): Promise<AstronomyData[]>`**

Fetches sunrise/sunset data.

```typescript
const astronomy = await provider.fetchAstronomy({
  latitude: 51.5074,
  longitude: -0.1278
});

console.log(astronomy[0].sunrise);  // "06:45"
console.log(astronomy[0].sunset);   // "20:15"
```

**`checkHealth(): Promise<boolean>`**

Checks if the Open-Meteo API is accessible.

```typescript
const isHealthy = await provider.checkHealth();
if (isHealthy) {
  console.log('API is available');
}
```

### SmartCache

Multi-tier caching system with memory → IndexedDB → network fallback.

#### Configuration

```typescript
const cache = new SmartCache({
  memoryTtlMs: 5 * 60 * 1000,        // 5 minutes memory cache
  indexedDbTtlMs: 24 * 60 * 60 * 1000, // 24 hours IndexedDB cache
  useMemoryCache: true,
  useIndexedDb: true,
  dbName: 'weather-api-cache',
  storeName: 'forecasts',
  maxSizeMb: 50
});
```

#### Methods

**`get<T>(key: string): Promise<CacheResult<T> | null>`**

Retrieves data from cache with automatic tier fallback.

```typescript
const result = await cache.get<ForecastData>('weather-51.5074--0.1278');

if (result) {
  console.log(result.data);        // Cached data
  console.log(result.source);      // 'memory', 'indexed_db', or 'network'
  console.log(result.isFresh);     // true if within TTL
  console.log(result.ageMs);       // Age of cached data
}
```

**`set<T>(key: string, data: T, ttlMs?: number): Promise<void>`**

Stores data in all available cache layers.

```typescript
await cache.set(
  'weather-51.5074--0.1278',
  forecast,
  10 * 60 * 1000  // 10 minute TTL
);
```

**`remove(key: string): Promise<void>`**

Removes specific cache entry.

```typescript
await cache.remove('weather-51.5074--0.1278');
```

**`clear(): Promise<void>`**

Clears all cache.

```typescript
await cache.clear();
```

**`getStats(): Promise<CacheStats>`**

Gets cache statistics.

```typescript
const stats = await cache.getStats();
console.log(`Memory: ${stats.memoryEntries} entries, ${stats.memoryBytes} bytes`);
console.log(`IndexedDB: ${stats.indexedDbEntries} entries`);
```

**`cleanup(): Promise<void>`**

Manual cleanup of expired entries.

```typescript
await cache.cleanup();
```

## Type Definitions

### Location

```typescript
interface Location {
  latitude: number;
  longitude: number;
  name?: string;
  countryCode?: string;
  timezone?: string;
  elevation?: number;
}
```

### ForecastData

Complete weather forecast with hourly, daily, and astronomy data.

```typescript
interface ForecastData {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  utcOffsetSeconds: number;
  hourly: HourlyWeatherData[];
  daily: DailyWeatherData[];
  astronomy?: AstronomyData[];
  generatedAt: string;
  validityPeriodHours?: number;
}
```

### HourlyWeatherData

Single hour of weather data.

```typescript
interface HourlyWeatherData {
  time: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  precipitationProbability: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  uvIndex: number;
  sunshineDuration: number;
  weatherCode: number;
  visibility: number;
  dewPoint: number;
  apparentTemperature: number;
  // ... and more
}
```

### DailyWeatherData

Daily weather summary.

```typescript
interface DailyWeatherData {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  sunrise: string;
  sunset: string;
  precipitation: number;
  precipitationMax: number;
  precipitationProbability: number;
  weatherCode: number;
  windSpeedMax: number;
  windDirection: number;
  uvIndexMax: number;
  sunshineDuration: number;
}
```

## Advanced Examples

### Weather with Stale-While-Revalidate

```typescript
async function getWeatherSWR(location: Location): Promise<ForecastData> {
  const cacheKey = `weather-${location.latitude}-${location.longitude}`;

  // Try cache first (returns stale data if needed)
  const cached = await cache.get<ForecastData>(cacheKey);
  if (cached) {
    // Return stale data immediately
    const data = cached.data;

    // But also revalidate in background if stale
    if (!cached.isFresh) {
      provider.fetchForecast(location)
        .then(fresh => cache.set(cacheKey, fresh, 10 * 60 * 1000))
        .catch(err => console.error('Background refresh failed:', err));
    }

    return data;
  }

  // No cache - fetch from network
  const forecast = await provider.fetchForecast(location);
  await cache.set(cacheKey, forecast, 10 * 60 * 1000);
  return forecast;
}
```

### Batch Location Forecasts

```typescript
async function getMultipleForecastsWithCache(
  locations: Location[]
): Promise<ForecastData[]> {
  const promises = locations.map(async (location) => {
    const cacheKey = `weather-${location.latitude}-${location.longitude}`;
    const cached = await cache.get<ForecastData>(cacheKey);

    if (cached?.isFresh) {
      return cached.data;
    }

    const forecast = await provider.fetchForecast(location);
    await cache.set(cacheKey, forecast, 10 * 60 * 1000);
    return forecast;
  });

  return Promise.all(promises);
}

// Usage
const locations: Location[] = [
  { latitude: 51.5074, longitude: -0.1278, name: 'London' },
  { latitude: 53.3498, longitude: -6.2603, name: 'Dublin' },
  { latitude: 55.9533, longitude: -3.1883, name: 'Edinburgh' }
];

const forecasts = await getMultipleForecastsWithCache(locations);
```

### API Health Monitoring

```typescript
async function monitorApiHealth(): Promise<void> {
  const interval = setInterval(async () => {
    const isHealthy = await provider.checkHealth();
    console.log(`Open-Meteo API health: ${isHealthy ? 'UP' : 'DOWN'}`);

    if (!isHealthy) {
      console.warn('Weather API is unavailable, will use cached data');
    }
  }, 60000); // Check every minute

  return () => clearInterval(interval);
}
```

## Error Handling

### Provider Errors

```typescript
import { ApiError } from '@weather-apps/weather-api';

try {
  const forecast = await provider.fetchForecast(location);
} catch (error) {
  const apiError = error as ApiError;
  console.error(`Error: ${apiError.code}`);
  console.error(`Message: ${apiError.message}`);
  console.error(`Status: ${apiError.statusCode}`);
  console.error(`Context:`, apiError.context);

  // Handle specific errors
  if (apiError.code === 'RATE_LIMIT') {
    console.log('API rate limited, will retry later');
  }
}
```

## Performance Considerations

### Memory Cache
- Extremely fast (microseconds)
- Default: 5 minute TTL
- Perfect for repeated requests within short time windows

### IndexedDB Cache
- Very fast (milliseconds)
- Default: 24 hour TTL
- Persists across browser sessions
- Fallback when memory cache expires

### Network Requests
- Automatic retry with exponential backoff
- 15 second timeout
- Max 3 retries by default
- Graceful degradation to cached data

## Browser Support

- **Memory Cache**: All browsers
- **IndexedDB**: IE 10+, modern browsers
- **Graceful Degradation**: Works in restricted environments (falls back to network-only)

## API Rate Limits

Open-Meteo API:
- **Free tier**: 10,000 calls/day
- **No authentication**: Public API
- **Recommended cache TTL**: 10 minutes for weather, 24 hours for astronomy

## Security

- No API keys required (public API)
- CORS-enabled for browser usage
- All network requests use HTTPS
- Cache data is domain-isolated

## Testing

```typescript
import { OpenMeteoProvider, SmartCache } from '@weather-apps/weather-api';

describe('Weather API', () => {
  let provider: OpenMeteoProvider;
  let cache: SmartCache;

  beforeEach(() => {
    provider = new OpenMeteoProvider();
    cache = new SmartCache({
      useIndexedDb: false // Disable in tests
    });
  });

  it('should fetch forecast data', async () => {
    const forecast = await provider.fetchForecast({
      latitude: 51.5074,
      longitude: -0.1278
    });

    expect(forecast.hourly.length).toBeGreaterThan(0);
    expect(forecast.daily.length).toBeGreaterThan(0);
  });

  it('should cache forecast data', async () => {
    const location = { latitude: 51.5074, longitude: -0.1278 };
    const key = 'test-forecast';

    const forecast = await provider.fetchForecast(location);
    await cache.set(key, forecast);

    const cached = await cache.get(key);
    expect(cached?.data).toEqual(forecast);
    expect(cached?.isFresh).toBe(true);
  });
});
```

## Contributing

Contributions welcome! Please ensure:

1. Type safety: `npx tsc --noEmit`
2. Tests pass: `npm test`
3. Code style: `npm run lint`

## License

MIT - See LICENSE file in root workspace

## Related Packages

- `@weather-apps/core-algorithm` - Weather scoring algorithm
- `@weather-apps/geolocation` - Location resolution
- `@weather-apps/ai-services` - AI-powered summaries
