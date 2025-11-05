/**
 * @weather-apps/weather-api
 * Weather data fetching and caching service for weather decision apps
 *
 * Main exports:
 * - OpenMeteoProvider: Weather data provider using Open-Meteo API
 * - SmartCache: Multi-tier caching system (memory → IndexedDB → network)
 * - Type definitions for all weather data structures
 */

// Type exports
export type {
  HourlyWeatherData,
  DailyWeatherData,
  AstronomyData,
  ForecastData,
  WeatherProviderConfig,
  CacheEntry,
  CacheConfig,
  CacheResult,
  ApiError,
  WeatherMetrics,
  Location,
  WeatherApiResponse
} from './types';

export { CacheLayer } from './types';

// Provider exports
export { OpenMeteoProvider } from './providers/OpenMeteoProvider';
export type { OpenMeteoProvider as IWeatherProvider } from './providers';

// Cache exports
export { SmartCache } from './cache/SmartCache';
export type { SmartCache as ICache } from './cache';
