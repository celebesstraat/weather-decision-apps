/**
 * Data Converters - Bridge between app-specific types and shared package types
 *
 * Purpose: Convert between the old GetTheWashingOut types and the new
 * standardized types in @weather-apps/core-algorithm
 */

import type { HourlyWeatherData, Location } from '@weather-apps/core-algorithm';
import type { HourlyForecast, LocationData } from '../types';

/**
 * Convert app-specific HourlyForecast to standardized HourlyWeatherData
 */
export function convertToWeatherData(hour: HourlyForecast): HourlyWeatherData {
  return {
    time: hour.time,
    temperature: hour.temperature,
    humidity: hour.humidity,
    dewPoint: hour.dewPoint,
    windSpeed: hour.windSpeed,
    windDirection: hour.windDirection || 0,
    pressure: hour.surfacePressure || 1013.25, // default sea level pressure
    cloudCover: hour.cloudCover,
    precipitation: hour.rainfall,
    precipitationProbability: hour.rainChance,
    uvIndex: hour.uvIndex,
    visibility: 10, // default visibility in km (not tracked in old format)

    // Advanced metrics (Phase 1-3 parameters)
    vaporPressureDeficit: hour.vapourPressureDeficit,
    wetBulbTemperature: hour.wetBulbTemperature,
    sunshineDuration: hour.sunshineDuration,
    shortwaveRadiation: hour.shortwaveRadiation,
    evapotranspiration: hour.evapotranspiration,
  };
}

/**
 * Convert array of HourlyForecast to HourlyWeatherData[]
 */
export function convertHourlyData(hourlyData: HourlyForecast[]): HourlyWeatherData[] {
  return hourlyData.map(convertToWeatherData);
}

/**
 * Convert app-specific LocationData to standardized Location
 */
export function convertToLocation(locationData: LocationData): Location {
  return {
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    name: locationData.name,
    country: locationData.country,
    timezone: 'Europe/London', // default for UK/Ireland

    // Geographic context (these may need to be populated from other sources)
    elevation: undefined, // not tracked in old format
    urbanDensity: 'suburban', // default assumption
    shelterFactor: 0.5, // neutral default
    windExposure: 'medium', // default assumption
  };
}

/**
 * Convert shared package types back to app-specific types (reverse conversion)
 * Used when displaying results from the new scorer
 */
export function convertFromWeatherData(data: HourlyWeatherData): HourlyForecast {
  return {
    time: data.time,
    temperature: data.temperature,
    humidity: data.humidity,
    windSpeed: data.windSpeed,
    rainChance: data.precipitationProbability,
    uvIndex: data.uvIndex,
    dewPoint: data.dewPoint,
    cloudCover: data.cloudCover,
    rainfall: data.precipitation,

    // Phase 1-3 parameters
    vapourPressureDeficit: data.vaporPressureDeficit,
    surfacePressure: data.pressure,
    shortwaveRadiation: data.shortwaveRadiation,
    wetBulbTemperature: data.wetBulbTemperature,
    evapotranspiration: data.evapotranspiration,
    sunshineDuration: data.sunshineDuration,
    windDirection: data.windDirection,
  };
}

/**
 * Extract location details from various formats
 * Useful for handling both old and new location formats
 */
export function extractLocationInfo(location: string | LocationData): {
  name: string;
  latitude?: number;
  longitude?: number;
} {
  if (typeof location === 'string') {
    return { name: location };
  }

  return {
    name: location.fullName || location.name,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}
