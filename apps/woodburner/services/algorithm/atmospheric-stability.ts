/**
 * Atmospheric Stability Analysis for Woodburner Performance
 *
 * Scores atmospheric pressure, humidity, wind, and precipitation conditions
 * that affect chimney draft, ignition ease, and combustion quality.
 */

import {
  PRESSURE_THRESHOLDS,
  HUMIDITY_THRESHOLDS,
  WIND_THRESHOLDS,
  PRECIPITATION_THRESHOLDS,
  WARNING_CONDITIONS
} from './woodburner-config';

// ============================================================================
// ATMOSPHERIC PRESSURE SCORING (15% weight)
// ============================================================================

/**
 * Score atmospheric pressure
 *
 * High pressure improves draft (denser air, stable conditions)
 * Low pressure reduces draft (less dense air, unstable weather)
 *
 * Scoring:
 * - <985 mb:       20 points (storm conditions)
 * - 985-995 mb:    40 points (deep low)
 * - 995-1005 mb:   60 points (low pressure)
 * - 1005-1015 mb:  75 points (moderate)
 * - 1015-1025 mb:  90 points (high pressure)
 * - ≥1025 mb:     100 points (very high - excellent)
 *
 * @param pressure - Atmospheric pressure in millibars (mb/hPa)
 * @returns Score from 0-100
 */
export function scorePressure(pressure: number): number {
  const { STORM, DEEP_LOW, LOW, MODERATE, HIGH } = PRESSURE_THRESHOLDS;

  if (pressure < STORM) {
    // Storm conditions: 0-20 points (linear)
    // At 960 mb: ~0 points, at 985 mb: 20 points
    return Math.max(0, ((pressure - 960) / (STORM - 960)) * 20);
  }

  if (pressure < DEEP_LOW) {
    // Deep low: 20-40 points
    return 20 + ((pressure - STORM) / (DEEP_LOW - STORM)) * 20;
  }

  if (pressure < LOW) {
    // Low pressure: 40-60 points
    return 40 + ((pressure - DEEP_LOW) / (LOW - DEEP_LOW)) * 20;
  }

  if (pressure < MODERATE) {
    // Moderate pressure: 60-75 points
    return 60 + ((pressure - LOW) / (MODERATE - LOW)) * 15;
  }

  if (pressure < HIGH) {
    // High pressure: 75-90 points
    return 75 + ((pressure - MODERATE) / (HIGH - MODERATE)) * 15;
  }

  // Very high pressure: 90-100 points
  // Asymptotic approach to 100
  const excessPressure = pressure - HIGH;
  return Math.min(100, 90 + (excessPressure / 20) * 10);
}

// ============================================================================
// HUMIDITY SCORING (15% weight)
// ============================================================================

/**
 * Score relative humidity
 *
 * High humidity affects:
 * - Ignition difficulty (moisture in combustion air)
 * - Condensation risk in cold flue
 * - Smoke visibility and dispersion
 *
 * Scoring:
 * - >95%:    10 points (fog/mist - very difficult)
 * - 85-95%:  30 points (very damp)
 * - 75-85%:  50 points (damp)
 * - 65-75%:  70 points (moderate)
 * - 50-65%:  90 points (good)
 * - 40-50%: 100 points (optimal)
 * - <40%:    85 points (very dry - can be harsh)
 *
 * @param humidity - Relative humidity as percentage (0-100)
 * @returns Score from 0-100
 */
export function scoreHumidity(humidity: number): number {
  const { FOG, VERY_DAMP, DAMP, MODERATE, GOOD, OPTIMAL } = HUMIDITY_THRESHOLDS;

  if (humidity > FOG) {
    // Fog/mist: 0-10 points
    // At 100%: 0 points, at 95%: 10 points
    return Math.max(0, ((100 - humidity) / (100 - FOG)) * 10);
  }

  if (humidity > VERY_DAMP) {
    // Very damp: 10-30 points
    return 10 + ((FOG - humidity) / (FOG - VERY_DAMP)) * 20;
  }

  if (humidity > DAMP) {
    // Damp: 30-50 points
    return 30 + ((VERY_DAMP - humidity) / (VERY_DAMP - DAMP)) * 20;
  }

  if (humidity > MODERATE) {
    // Moderate: 50-70 points
    return 50 + ((DAMP - humidity) / (DAMP - MODERATE)) * 20;
  }

  if (humidity > GOOD) {
    // Good: 70-90 points
    return 70 + ((MODERATE - humidity) / (MODERATE - GOOD)) * 20;
  }

  if (humidity >= OPTIMAL) {
    // Optimal: 90-100 points
    return 90 + ((GOOD - humidity) / (GOOD - OPTIMAL)) * 10;
  }

  // Very dry (<40%): 85 points (comfortable but can be harsh on wood)
  // Slight penalty for extremely dry air
  return Math.max(75, 85 - (OPTIMAL - humidity) * 0.5);
}

// ============================================================================
// WIND SPEED SCORING (10% weight)
// ============================================================================

/**
 * Score wind speed for woodburner performance
 *
 * Assumes chimney cap is installed (standard UK practice)
 *
 * Wind effects:
 * - Calm (<3 km/h): Draft OK, but poor smoke dispersion
 * - Light (3-10 km/h): Generally beneficial
 * - Moderate (10-25 km/h): Optimal (enhances draft, good dispersal)
 * - Fresh (25-40 km/h): Good with proper cap
 * - Strong (40-60 km/h): Variable (can cause issues)
 * - Gale (≥60 km/h): Problematic (downdrafts, safety concerns)
 *
 * Scoring:
 * - <3 km/h:     70 points (calm - draft OK, dispersion poor)
 * - 3-10 km/h:   85 points (light - good)
 * - 10-25 km/h: 100 points (moderate - optimal)
 * - 25-40 km/h:  90 points (fresh - good with cap)
 * - 40-60 km/h:  60 points (strong - variable)
 * - ≥60 km/h:    30 points (gale - problematic)
 *
 * @param windSpeed - Wind speed in km/h
 * @returns Score from 0-100
 */
export function scoreWindSpeed(windSpeed: number): number {
  const { CALM, LIGHT, MODERATE, FRESH, STRONG } = WIND_THRESHOLDS;

  if (windSpeed < CALM) {
    // Calm: 60-70 points (linear)
    // At 0 km/h: 60 points, at 3 km/h: 70 points
    return 60 + (windSpeed / CALM) * 10;
  }

  if (windSpeed < LIGHT) {
    // Light: 70-85 points
    return 70 + ((windSpeed - CALM) / (LIGHT - CALM)) * 15;
  }

  if (windSpeed < MODERATE) {
    // Moderate: 85-100 points (optimal range)
    return 85 + ((windSpeed - LIGHT) / (MODERATE - LIGHT)) * 15;
  }

  if (windSpeed < FRESH) {
    // Fresh: 100-90 points (slight decrease)
    return 100 - ((windSpeed - MODERATE) / (FRESH - MODERATE)) * 10;
  }

  if (windSpeed < STRONG) {
    // Strong: 90-60 points (more variable)
    return 90 - ((windSpeed - FRESH) / (STRONG - FRESH)) * 30;
  }

  // Gale (≥60 km/h): 30-60 points (problematic)
  // Decreases further with increasing wind
  return Math.max(20, 60 - ((windSpeed - STRONG) / 20) * 30);
}

// ============================================================================
// PRECIPITATION SCORING (10% weight)
// ============================================================================

/**
 * Score precipitation
 *
 * Rain affects:
 * - Chimney temperature (cooling)
 * - Ambient humidity (increased)
 * - Fuel moisture (if stored outside)
 *
 * Scoring:
 * - 0 mm:       100 points (dry)
 * - 0-1 mm:      90 points (light drizzle)
 * - 1-3 mm:      70 points (light rain)
 * - 3-7 mm:      50 points (moderate rain)
 * - ≥7 mm:       30 points (heavy rain)
 *
 * @param precipitation - Precipitation in mm/hour
 * @returns Score from 0-100
 */
export function scorePrecipitation(precipitation: number): number {
  const { DRY, LIGHT_DRIZZLE, LIGHT_RAIN, MODERATE_RAIN } = PRECIPITATION_THRESHOLDS;

  if (precipitation === DRY) {
    return 100;
  }

  if (precipitation < LIGHT_DRIZZLE) {
    // Light drizzle: 90-100 points
    return 100 - (precipitation / LIGHT_DRIZZLE) * 10;
  }

  if (precipitation < LIGHT_RAIN) {
    // Light rain: 70-90 points
    return 90 - ((precipitation - LIGHT_DRIZZLE) / (LIGHT_RAIN - LIGHT_DRIZZLE)) * 20;
  }

  if (precipitation < MODERATE_RAIN) {
    // Moderate rain: 50-70 points
    return 70 - ((precipitation - LIGHT_RAIN) / (MODERATE_RAIN - LIGHT_RAIN)) * 20;
  }

  // Heavy rain (≥7 mm): 30-50 points
  // Diminishing penalty beyond 7mm
  return Math.max(20, 50 - ((precipitation - MODERATE_RAIN) / 10) * 20);
}

// ============================================================================
// HUMIDITY-RELATED WARNINGS
// ============================================================================

/**
 * Check for humidity-related warnings
 *
 * @param humidity - Relative humidity percentage
 * @param deltaT - Temperature differential in °C
 * @returns Array of warning message keys
 */
export function checkHumidityWarnings(humidity: number, deltaT: number): string[] {
  const warnings: string[] = [];

  // Very damp conditions
  if (WARNING_CONDITIONS.VERY_DAMP_CONDITIONS(humidity, deltaT)) {
    warnings.push('VERY_DAMP_CONDITIONS');
  }

  // Fog conditions
  if (WARNING_CONDITIONS.FOG_CONDITIONS(humidity)) {
    warnings.push('FOG_CONDITIONS');
  }

  return warnings;
}

// ============================================================================
// COMPREHENSIVE ATMOSPHERIC ANALYSIS
// ============================================================================

/**
 * Analyze all atmospheric stability factors
 *
 * @param pressure - Atmospheric pressure in mb
 * @param humidity - Relative humidity percentage
 * @param windSpeed - Wind speed in km/h
 * @param precipitation - Precipitation in mm/hour
 * @param deltaT - Temperature differential (for warnings)
 * @returns Comprehensive analysis object
 */
export function analyzeAtmosphericStability(
  pressure: number,
  humidity: number,
  windSpeed: number,
  precipitation: number,
  deltaT: number
) {
  const pressureScore = scorePressure(pressure);
  const humidityScore = scoreHumidity(humidity);
  const windScore = scoreWindSpeed(windSpeed);
  const precipitationScore = scorePrecipitation(precipitation);

  const humidityWarnings = checkHumidityWarnings(humidity, deltaT);

  // Determine quality descriptors
  let pressureQuality: string;
  if (pressure < PRESSURE_THRESHOLDS.DEEP_LOW) pressureQuality = 'very low';
  else if (pressure < PRESSURE_THRESHOLDS.LOW) pressureQuality = 'low';
  else if (pressure < PRESSURE_THRESHOLDS.MODERATE) pressureQuality = 'moderate';
  else if (pressure < PRESSURE_THRESHOLDS.HIGH) pressureQuality = 'high';
  else pressureQuality = 'very high';

  let humidityQuality: string;
  if (humidity > HUMIDITY_THRESHOLDS.FOG) humidityQuality = 'fog/mist';
  else if (humidity > HUMIDITY_THRESHOLDS.VERY_DAMP) humidityQuality = 'very damp';
  else if (humidity > HUMIDITY_THRESHOLDS.DAMP) humidityQuality = 'damp';
  else if (humidity > HUMIDITY_THRESHOLDS.MODERATE) humidityQuality = 'moderate';
  else if (humidity >= HUMIDITY_THRESHOLDS.OPTIMAL) humidityQuality = 'optimal';
  else humidityQuality = 'very dry';

  let windQuality: string;
  if (windSpeed < WIND_THRESHOLDS.CALM) windQuality = 'calm';
  else if (windSpeed < WIND_THRESHOLDS.LIGHT) windQuality = 'light';
  else if (windSpeed < WIND_THRESHOLDS.MODERATE) windQuality = 'moderate';
  else if (windSpeed < WIND_THRESHOLDS.FRESH) windQuality = 'fresh';
  else if (windSpeed < WIND_THRESHOLDS.STRONG) windQuality = 'strong';
  else windQuality = 'gale';

  return {
    pressure: {
      value: pressure,
      score: pressureScore,
      quality: pressureQuality
    },
    humidity: {
      value: humidity,
      score: humidityScore,
      quality: humidityQuality
    },
    wind: {
      value: windSpeed,
      score: windScore,
      quality: windQuality
    },
    precipitation: {
      value: precipitation,
      score: precipitationScore,
      isDry: precipitation === 0
    },
    warnings: humidityWarnings
  };
}
