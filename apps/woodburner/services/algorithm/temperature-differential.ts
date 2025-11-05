/**
 * Temperature Differential Calculation and Scoring
 *
 * The stack effect (temperature differential between indoor and outdoor air)
 * is the PRIMARY driver of chimney draft performance, accounting for ~50% of
 * the FlameCast score.
 *
 * Physics: ΔP = H × (ρₒ - ρᵢ) × g
 * Where greater ΔT = greater density difference = stronger draft
 */

import {
  getIndoorTemp,
  TEMPERATURE_DIFFERENTIAL_THRESHOLDS,
  WARNING_CONDITIONS
} from './woodburner-config';

/**
 * Get current season based on month
 * UK/Ireland meteorological seasons
 */
export function getCurrentSeason(month: number): 'winter' | 'spring' | 'summer' | 'autumn' {
  if (month === 12 || month === 1 || month === 2) return 'winter';
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  return 'autumn'; // 9-11
}

/**
 * Calculate temperature differential (ΔT)
 *
 * @param outdoorTemp - Outdoor temperature in °C
 * @param hour - Hour of day (0-23)
 * @param season - Current season
 * @param userIndoorTemp - Optional user override for indoor temperature
 * @returns Temperature differential (Indoor - Outdoor) in °C
 */
export function calculateTemperatureDifferential(
  outdoorTemp: number,
  hour: number,
  season: 'winter' | 'spring' | 'summer' | 'autumn',
  userIndoorTemp?: number
): number {
  const indoorTemp = getIndoorTemp(hour, season, userIndoorTemp);
  return indoorTemp - outdoorTemp;
}

/**
 * Score temperature differential for FlameCast algorithm
 *
 * Scoring curve based on chimney draft physics:
 * - ΔT < 0°C (inversion):   0 points (CRITICAL - impossible)
 * - ΔT 0-2°C:              10 points (severe backdraft risk)
 * - ΔT 2-5°C:              30 points (very difficult)
 * - ΔT 5-10°C:             60 points (marginal)
 * - ΔT 10-15°C:            80 points (good)
 * - ΔT >= 15°C:           100 points (excellent)
 *
 * @param deltaT - Temperature differential in °C
 * @returns Score from 0-100
 */
export function scoreTemperatureDifferential(deltaT: number): number {
  const { INVERSION, SEVERE_BACKDRAFT, VERY_DIFFICULT, MARGINAL, GOOD } =
    TEMPERATURE_DIFFERENTIAL_THRESHOLDS;

  // Temperature inversion - CRITICAL
  if (deltaT < INVERSION) {
    return 0;
  }

  // Severe backdraft risk
  if (deltaT < SEVERE_BACKDRAFT) {
    // Linear interpolation: 0°C = 0 points, 2°C = 10 points
    return (deltaT / SEVERE_BACKDRAFT) * 10;
  }

  // Very difficult conditions
  if (deltaT < VERY_DIFFICULT) {
    // Linear interpolation: 2°C = 10 points, 5°C = 30 points
    const range = VERY_DIFFICULT - SEVERE_BACKDRAFT;
    const offset = deltaT - SEVERE_BACKDRAFT;
    return 10 + (offset / range) * 20;
  }

  // Marginal conditions
  if (deltaT < MARGINAL) {
    // Linear interpolation: 5°C = 30 points, 10°C = 60 points
    const range = MARGINAL - VERY_DIFFICULT;
    const offset = deltaT - VERY_DIFFICULT;
    return 30 + (offset / range) * 30;
  }

  // Good conditions
  if (deltaT < GOOD) {
    // Linear interpolation: 10°C = 60 points, 15°C = 80 points
    const range = GOOD - MARGINAL;
    const offset = deltaT - MARGINAL;
    return 60 + (offset / range) * 20;
  }

  // Excellent conditions (≥15°C)
  // Asymptotic approach to 100 using logarithmic curve
  // At ΔT = 15°C: score = 80
  // At ΔT = 20°C: score ≈ 92
  // At ΔT = 30°C: score ≈ 98
  const excessDelta = deltaT - GOOD;
  const bonusScore = 20 * (1 - Math.exp(-excessDelta / 10));
  return Math.min(100, 80 + bonusScore);
}

/**
 * Check for critical temperature-related warnings
 *
 * @param outdoorTemp - Outdoor temperature in °C
 * @param indoorTemp - Indoor temperature in °C
 * @param deltaT - Temperature differential in °C
 * @param season - Current season
 * @param pressure - Atmospheric pressure in mb
 * @param windSpeed - Wind speed in km/h
 * @param hour - Hour of day (0-23)
 * @returns Array of warning messages
 */
export function checkTemperatureWarnings(
  outdoorTemp: number,
  indoorTemp: number,
  deltaT: number,
  season: 'winter' | 'spring' | 'summer' | 'autumn',
  pressure: number,
  windSpeed: number,
  hour: number
): string[] {
  const warnings: string[] = [];

  // Temperature inversion (CRITICAL)
  if (WARNING_CONDITIONS.TEMPERATURE_INVERSION(outdoorTemp, indoorTemp)) {
    warnings.push('TEMPERATURE_INVERSION');
  }

  // Summer chimney syndrome
  if (WARNING_CONDITIONS.SUMMER_CHIMNEY_SYNDROME(season, pressure, windSpeed, deltaT)) {
    warnings.push('SUMMER_CHIMNEY_SYNDROME');
  }

  // Cold chimney morning
  if (WARNING_CONDITIONS.COLD_CHIMNEY_MORNING(hour, deltaT)) {
    warnings.push('COLD_CHIMNEY_MORNING');
  }

  return warnings;
}

/**
 * Get detailed temperature differential analysis
 *
 * @param outdoorTemp - Outdoor temperature in °C
 * @param hour - Hour of day (0-23)
 * @param season - Current season
 * @param userIndoorTemp - Optional user override for indoor temperature
 * @returns Detailed analysis object
 */
export function analyzeTemperatureDifferential(
  outdoorTemp: number,
  hour: number,
  season: 'winter' | 'spring' | 'summer' | 'autumn',
  userIndoorTemp?: number
) {
  const indoorTemp = getIndoorTemp(hour, season, userIndoorTemp);
  const deltaT = calculateTemperatureDifferential(outdoorTemp, hour, season, userIndoorTemp);
  const score = scoreTemperatureDifferential(deltaT);

  let quality: 'excellent' | 'good' | 'marginal' | 'poor' | 'critical';
  let recommendation: string;

  const { INVERSION, SEVERE_BACKDRAFT, VERY_DIFFICULT, MARGINAL, GOOD } =
    TEMPERATURE_DIFFERENTIAL_THRESHOLDS;

  if (deltaT < INVERSION) {
    quality = 'critical';
    recommendation = 'DO NOT LIGHT - Temperature inversion (outside warmer than inside)';
  } else if (deltaT < SEVERE_BACKDRAFT) {
    quality = 'critical';
    recommendation = 'DO NOT LIGHT - Severe backdraft risk';
  } else if (deltaT < VERY_DIFFICULT) {
    quality = 'poor';
    recommendation = 'Very difficult ignition expected - not recommended';
  } else if (deltaT < MARGINAL) {
    quality = 'marginal';
    recommendation = 'Marginal draft - pre-warm chimney essential';
  } else if (deltaT < GOOD) {
    quality = 'good';
    recommendation = 'Good draft expected with standard procedure';
  } else {
    quality = 'excellent';
    recommendation = 'Excellent draft - easy ignition expected';
  }

  return {
    indoorTemp,
    outdoorTemp,
    deltaT,
    score,
    quality,
    recommendation,
    isInversion: deltaT < 0
  };
}
