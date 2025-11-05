/**
 * Weather API Type Definitions
 * Comprehensive type system for weather data from Open-Meteo API
 */

/**
 * Hourly weather data for a single time point
 */
export interface HourlyWeatherData {
  /** Timestamp of the forecast (ISO 8601 format) */
  time: string;

  /** Air temperature in Celsius */
  temperature: number;

  /** Relative humidity as percentage (0-100) */
  humidity: number;

  /** Precipitation (rain/snow) in mm */
  precipitation: number;

  /** Precipitation probability as percentage (0-100) */
  precipitationProbability: number;

  /** Wind speed at 10m in km/h */
  windSpeed: number;

  /** Wind direction in degrees (0-360) */
  windDirection: number;

  /** Atmospheric pressure at sea level in hPa */
  pressure: number;

  /** UV Index (0+) */
  uvIndex: number;

  /** Sunshine duration in hours */
  sunshineDuration: number;

  /** Weather code (WMO standard) */
  weatherCode: number;

  /** Visibility in meters */
  visibility: number;

  /** Relative humidity in percentage */
  relativeHumidity: number;

  /** Dew point in Celsius */
  dewPoint: number;

  /** Apparent temperature (feels like) in Celsius */
  apparentTemperature: number;

  /** Precipitation duration in minutes */
  precipitationDuration: number;

  /** Evapotranspiration in mm */
  evapotranspiration?: number;

  /** Soil moisture in percentage */
  soilMoisture?: number;

  /** Cloud cover in percentage (0-100) */
  cloudCover?: number;

  /** Cloud cover low in percentage (0-100) */
  cloudCoverLow?: number;

  /** Cloud cover mid in percentage (0-100) */
  cloudCoverMid?: number;

  /** Cloud cover high in percentage (0-100) */
  cloudCoverHigh?: number;

  /** Shortwave radiation in W/m² */
  shortwaveRadiation?: number;

  /** Direct radiation in W/m² */
  directRadiation?: number;

  /** Diffuse radiation in W/m² */
  diffuseRadiation?: number;
}

/**
 * Daily weather summary
 */
export interface DailyWeatherData {
  /** Date in YYYY-MM-DD format */
  date: string;

  /** Maximum temperature in Celsius */
  temperatureMax: number;

  /** Minimum temperature in Celsius */
  temperatureMin: number;

  /** Sunrise time in HH:MM format */
  sunrise: string;

  /** Sunset time in HH:MM format */
  sunset: string;

  /** Total precipitation in mm */
  precipitation: number;

  /** Maximum precipitation intensity in mm */
  precipitationMax: number;

  /** Precipitation probability as percentage (0-100) */
  precipitationProbability: number;

  /** Weather code (WMO standard) */
  weatherCode: number;

  /** Maximum wind speed in km/h */
  windSpeedMax: number;

  /** Dominant wind direction in degrees (0-360) */
  windDirection: number;

  /** Maximum UV Index */
  uvIndexMax: number;

  /** Total sunshine duration in hours */
  sunshineDuration: number;
}

/**
 * Sunrise/Sunset data
 */
export interface AstronomyData {
  /** Date in YYYY-MM-DD format */
  date: string;

  /** Sunrise time in HH:MM format */
  sunrise: string;

  /** Sunset time in HH:MM format */
  sunset: string;

  /** Sunrise hour as decimal (e.g., 6.5 = 06:30) */
  sunriseDecimal?: number;

  /** Sunset hour as decimal */
  sunsetDecimal?: number;

  /** Day length in hours */
  dayLength?: number;
}

/**
 * Complete weather forecast data
 */
export interface ForecastData {
  /** Location latitude */
  latitude: number;

  /** Location longitude */
  longitude: number;

  /** Elevation in meters */
  elevation: number;

  /** Timezone identifier (e.g., "Europe/London") */
  timezone: string;

  /** UTC offset in seconds */
  utcOffsetSeconds: number;

  /** Hourly forecast data (up to 72 hours) */
  hourly: HourlyWeatherData[];

  /** Daily forecast data (up to 16 days) */
  daily: DailyWeatherData[];

  /** Astronomy data (sunrise/sunset) */
  astronomy?: AstronomyData[];

  /** Timestamp when forecast was generated */
  generatedAt: string;

  /** Forecast validity period in hours */
  validityPeriodHours?: number;
}

/**
 * Weather API provider configuration
 */
export interface WeatherProviderConfig {
  /** API endpoint URL */
  apiUrl: string;

  /** Request timeout in milliseconds */
  timeoutMs: number;

  /** Retry configuration */
  retryConfig?: {
    maxRetries: number;
    delayMs: number;
    backoffMultiplier: number;
  };

  /** Weather model(s) to use */
  models?: string[];
}

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  /** Cached data */
  data: T;

  /** Timestamp when cached (milliseconds since epoch) */
  cachedAt: number;

  /** Time-to-live in milliseconds */
  ttlMs: number;

  /** Whether this is stale data (older than TTL) */
  isStale: boolean;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Memory cache TTL in milliseconds */
  memoryTtlMs: number;

  /** IndexedDB cache TTL in milliseconds */
  indexedDbTtlMs: number;

  /** Whether to use memory cache */
  useMemoryCache: boolean;

  /** Whether to use IndexedDB cache */
  useIndexedDb: boolean;

  /** Database name for IndexedDB */
  dbName: string;

  /** Object store name for IndexedDB */
  storeName: string;

  /** Maximum cache size in MB (for IndexedDB cleanup) */
  maxSizeMb: number;
}

/**
 * Cache layer enum
 */
export enum CacheLayer {
  MEMORY = 'memory',
  INDEXED_DB = 'indexed_db',
  NETWORK = 'network'
}

/**
 * Cache retrieval result with source
 */
export interface CacheResult<T> {
  /** Retrieved data */
  data: T;

  /** Which cache layer provided the data */
  source: CacheLayer;

  /** Whether the data is fresh (within TTL) */
  isFresh: boolean;

  /** Age of cached data in milliseconds */
  ageMs: number;
}

/**
 * API error response
 */
export interface ApiError {
  /** Error code */
  code: string;

  /** Human-readable error message */
  message: string;

  /** HTTP status code (if applicable) */
  statusCode?: number;

  /** Original error details */
  originalError?: Error;

  /** Request information for debugging */
  context?: Record<string, unknown>;
}

/**
 * Weather data metrics for algorithm input
 */
export interface WeatherMetrics {
  /** Vapor Pressure Deficit in kPa */
  vaporPressureDeficit: number;

  /** Dew point spread in Celsius */
  dewPointSpread: number;

  /** Wet bulb temperature in Celsius */
  wetBulbTemperature: number;

  /** Wind chill factor */
  windChill: number;

  /** Heat index */
  heatIndex: number;

  /** Relative humidity percentage */
  relativeHumidity: number;

  /** Saturation vapor pressure */
  saturationVaporPressure: number;
}

/**
 * Location information
 */
export interface Location {
  /** Latitude */
  latitude: number;

  /** Longitude */
  longitude: number;

  /** Place name */
  name?: string;

  /** Country/Region code */
  countryCode?: string;

  /** Timezone */
  timezone?: string;

  /** Elevation in meters */
  elevation?: number;
}

/**
 * Weather API response wrapper
 */
export interface WeatherApiResponse<T> {
  /** Response data */
  data: T;

  /** Success flag */
  success: boolean;

  /** Error information if any */
  error?: ApiError;

  /** Metadata about the response */
  metadata?: {
    responseTimeMs: number;
    source: string;
    timestamp: string;
  };
}
