/**
 * Open-Meteo Weather API Provider
 * Fetches weather data from Open-Meteo API using UK Met Office models
 */

import {
  ForecastData,
  HourlyWeatherData,
  DailyWeatherData,
  AstronomyData,
  WeatherProviderConfig,
  ApiError,
  Location
} from '../types';

/**
 * Open-Meteo API response structure
 */
interface OpenMeteoHourlyResponse {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation: number[];
  precipitation_probability?: number[];
  weather_code: number[];
  wind_speed_10m: number[];
  wind_direction_10m: number[];
  pressure_msl: number[];
  uv_index: number[];
  sunshine_duration: number[];
  visibility: number[];
  dew_point_2m: number[];
  apparent_temperature: number[];
  precipitation_duration?: number[];
  evapotranspiration?: number[];
  soil_moisture_0_to_10cm?: number[];
  cloud_cover?: number[];
  cloud_cover_low?: number[];
  cloud_cover_mid?: number[];
  cloud_cover_high?: number[];
  shortwave_radiation?: number[];
  direct_radiation?: number[];
  diffuse_radiation?: number[];
}

interface OpenMeteoDailyResponse {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  precipitation_sum: number[];
  precipitation_max: number[];
  precipitation_probability_max?: number[];
  weather_code: number[];
  wind_speed_10m_max: number[];
  wind_direction_10m_dominant: number[];
  uv_index_max: number[];
  sunshine_duration: number[];
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  timezone_abbreviation: string;
  utc_offset_seconds: number;
  hourly: OpenMeteoHourlyResponse;
  daily: OpenMeteoDailyResponse;
  hourly_units: Record<string, string>;
  daily_units: Record<string, string>;
  generation_time_ms: number;
}

/**
 * Default provider configuration
 */
const DEFAULT_CONFIG: WeatherProviderConfig = {
  apiUrl: 'https://api.open-meteo.com/v1/forecast',
  timeoutMs: 15000,
  retryConfig: {
    maxRetries: 3,
    delayMs: 1000,
    backoffMultiplier: 2
  },
  models: ['ukmo', 'ukvp'] // UK Met Office models
};

/**
 * OpenMeteoProvider - Fetches weather data from Open-Meteo API
 * Features:
 * - 72+ hour hourly forecast
 * - 16-day daily forecast
 * - UK Met Office models (UKMO/UKVP)
 * - Automatic retry with exponential backoff
 * - Comprehensive error handling
 */
export class OpenMeteoProvider {
  private config: WeatherProviderConfig;

  constructor(config?: Partial<WeatherProviderConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
  }

  /**
   * Fetch weather forecast for a location
   * @param location - Location coordinates and information
   * @returns Complete forecast data
   * @throws ApiError if fetch fails
   */
  async fetchForecast(location: Location): Promise<ForecastData> {
    const { latitude, longitude } = location;

    // Validate coordinates
    this.validateCoordinates(latitude, longitude);

    try {
      const response = await this.fetchWithRetry(
        this.buildRequestUrl(latitude, longitude)
      );

      const data = await response.json() as OpenMeteoResponse;

      // Validate response
      this.validateResponse(data);

      // Parse and transform response
      return this.transformResponse(data);
    } catch (error) {
      throw this.handleError(error, latitude, longitude);
    }
  }

  /**
   * Fetch sunrise/sunset data for a location
   * @param location - Location coordinates
   * @returns Astronomy data
   */
  async fetchAstronomy(location: Location): Promise<AstronomyData[]> {
    const { latitude, longitude } = location;

    this.validateCoordinates(latitude, longitude);

    try {
      const url = new URL(this.config.apiUrl);
      url.searchParams.append('latitude', latitude.toString());
      url.searchParams.append('longitude', longitude.toString());
      url.searchParams.append('daily', 'sunrise,sunset');
      url.searchParams.append('timezone', 'auto');
      url.searchParams.append('forecast_days', '7');

      const response = await this.fetchWithRetry(url.toString());
      const data = await response.json() as OpenMeteoResponse;

      return this.transformAstronomy(data);
    } catch (error) {
      throw this.handleError(error, latitude, longitude);
    }
  }

  /**
   * Check API health/status
   * @returns True if API is accessible
   */
  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.apiUrl}?latitude=0&longitude=0`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Build Open-Meteo API request URL
   */
  private buildRequestUrl(latitude: number, longitude: number): string {
    const url = new URL(this.config.apiUrl);

    // Core parameters
    url.searchParams.append('latitude', latitude.toString());
    url.searchParams.append('longitude', longitude.toString());
    url.searchParams.append('timezone', 'auto');

    // Use UK Met Office models if available
    if (this.config.models?.includes('ukmo')) {
      url.searchParams.append('models', 'ukmo,ukvp');
    }

    // Hourly data parameters (UK/Ireland focused)
    const hourlyParams = [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'precipitation_probability',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'pressure_msl',
      'uv_index',
      'sunshine_duration',
      'visibility',
      'dew_point_2m',
      'apparent_temperature',
      'precipitation_duration',
      'evapotranspiration',
      'cloud_cover',
      'cloud_cover_low',
      'cloud_cover_mid',
      'cloud_cover_high',
      'shortwave_radiation',
      'direct_radiation',
      'diffuse_radiation'
    ];
    url.searchParams.append('hourly', hourlyParams.join(','));

    // Daily data parameters
    const dailyParams = [
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'precipitation_sum',
      'precipitation_max',
      'precipitation_probability_max',
      'weather_code',
      'wind_speed_10m_max',
      'wind_direction_10m_dominant',
      'uv_index_max',
      'sunshine_duration'
    ];
    url.searchParams.append('daily', dailyParams.join(','));

    // Forecast length: 7 days for daily, hourly extends as available
    url.searchParams.append('forecast_days', '7');

    return url.toString();
  }

  /**
   * Fetch with automatic retry and exponential backoff
   */
  private async fetchWithRetry(
    url: string,
    attempt: number = 0
  ): Promise<Response> {
    const { maxRetries = 3, delayMs = 1000, backoffMultiplier = 2 } =
      this.config.retryConfig || {};

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': '@weather-apps/weather-api'
        }
      });

      clearTimeout(timeoutId);

      // Retry on server errors
      if (response.status >= 500 && attempt < maxRetries) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt);
        await this.sleep(delay);
        return this.fetchWithRetry(url, attempt + 1);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      // Retry on network errors
      if (attempt < maxRetries && this.isRetryableError(error)) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt);
        await this.sleep(delay);
        return this.fetchWithRetry(url, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Transform Open-Meteo response to ForecastData
   */
  private transformResponse(data: OpenMeteoResponse): ForecastData {
    const hourly = this.transformHourly(data.hourly);
    const daily = this.transformDaily(data.daily);
    const astronomy = this.transformAstronomyFromDaily(data.daily);

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      elevation: data.elevation,
      timezone: data.timezone,
      utcOffsetSeconds: data.utc_offset_seconds,
      hourly,
      daily,
      astronomy,
      generatedAt: new Date().toISOString(),
      validityPeriodHours: 72
    };
  }

  /**
   * Transform hourly data from API response
   */
  private transformHourly(hourly: OpenMeteoHourlyResponse): HourlyWeatherData[] {
    const results: HourlyWeatherData[] = [];

    for (let i = 0; i < hourly.time.length; i++) {
      const data: HourlyWeatherData = {
        time: hourly.time[i] ?? '',
        temperature: hourly.temperature_2m[i] ?? 0,
        humidity: hourly.relative_humidity_2m[i] ?? 0,
        precipitation: hourly.precipitation[i] ?? 0,
        precipitationProbability: hourly.precipitation_probability?.[i] ?? 0,
        windSpeed: hourly.wind_speed_10m[i] ?? 0,
        windDirection: hourly.wind_direction_10m[i] ?? 0,
        pressure: hourly.pressure_msl[i] ?? 0,
        uvIndex: hourly.uv_index[i] ?? 0,
        sunshineDuration: hourly.sunshine_duration[i] ?? 0,
        weatherCode: hourly.weather_code[i] ?? 0,
        visibility: hourly.visibility[i] ?? 0,
        relativeHumidity: hourly.relative_humidity_2m[i] ?? 0,
        dewPoint: hourly.dew_point_2m[i] ?? 0,
        apparentTemperature: hourly.apparent_temperature[i] ?? 0,
        precipitationDuration: hourly.precipitation_duration?.[i] ?? 0,
        evapotranspiration: hourly.evapotranspiration?.[i],
        cloudCover: hourly.cloud_cover?.[i],
        cloudCoverLow: hourly.cloud_cover_low?.[i],
        cloudCoverMid: hourly.cloud_cover_mid?.[i],
        cloudCoverHigh: hourly.cloud_cover_high?.[i],
        shortwaveRadiation: hourly.shortwave_radiation?.[i],
        directRadiation: hourly.direct_radiation?.[i],
        diffuseRadiation: hourly.diffuse_radiation?.[i]
      };
      results.push(data);
    }

    return results;
  }

  /**
   * Transform daily data from API response
   */
  private transformDaily(daily: OpenMeteoDailyResponse): DailyWeatherData[] {
    const results: DailyWeatherData[] = [];

    for (let i = 0; i < daily.time.length; i++) {
      const data: DailyWeatherData = {
        date: daily.time[i] ?? '',
        temperatureMax: daily.temperature_2m_max[i] ?? 0,
        temperatureMin: daily.temperature_2m_min[i] ?? 0,
        sunrise: (daily.sunrise[i]?.split('T')[1]) || '06:00',
        sunset: (daily.sunset[i]?.split('T')[1]) || '18:00',
        precipitation: daily.precipitation_sum[i] ?? 0,
        precipitationMax: daily.precipitation_max[i] ?? 0,
        precipitationProbability: daily.precipitation_probability_max?.[i] ?? 0,
        weatherCode: daily.weather_code[i] ?? 0,
        windSpeedMax: daily.wind_speed_10m_max[i] ?? 0,
        windDirection: daily.wind_direction_10m_dominant[i] ?? 0,
        uvIndexMax: daily.uv_index_max[i] ?? 0,
        sunshineDuration: daily.sunshine_duration[i] ?? 0
      };
      results.push(data);
    }

    return results;
  }

  /**
   * Transform astronomy data from daily forecast
   */
  private transformAstronomyFromDaily(daily: OpenMeteoDailyResponse): AstronomyData[] {
    return daily.time.map((date, i) => ({
      date: date ?? '',
      sunrise: (daily.sunrise[i]?.split('T')[1]) || '06:00',
      sunset: (daily.sunset[i]?.split('T')[1]) || '18:00'
    }));
  }

  /**
   * Transform astronomy response
   */
  private transformAstronomy(data: OpenMeteoResponse): AstronomyData[] {
    return this.transformAstronomyFromDaily(data.daily);
  }

  /**
   * Validate location coordinates
   */
  private validateCoordinates(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }
  }

  /**
   * Validate API response structure
   */
  private validateResponse(data: unknown): asserts data is OpenMeteoResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid API response: not an object');
    }

    const response = data as Record<string, unknown>;

    if (
      typeof response.latitude !== 'number' ||
      typeof response.longitude !== 'number'
    ) {
      throw new Error('Invalid API response: missing coordinates');
    }

    if (!response.hourly || typeof response.hourly !== 'object') {
      throw new Error('Invalid API response: missing hourly data');
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('econnrefused') ||
        message.includes('enotfound')
      );
    }
    return false;
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown, latitude: number, longitude: number): ApiError {
    let message = 'Unknown error occurred';
    let statusCode: number | undefined;

    if (error instanceof Error) {
      message = error.message;
      if (error.message.includes('HTTP')) {
        const match = error.message.match(/HTTP (\d+)/);
        if (match && match[1]) {
          statusCode = parseInt(match[1], 10);
        }
      }
    }

    return {
      code: statusCode === 429 ? 'RATE_LIMIT' : 'FETCH_ERROR',
      message: `Failed to fetch weather data: ${message}`,
      statusCode,
      originalError: error instanceof Error ? error : undefined,
      context: {
        latitude,
        longitude,
        provider: 'OpenMeteo'
      }
    };
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
