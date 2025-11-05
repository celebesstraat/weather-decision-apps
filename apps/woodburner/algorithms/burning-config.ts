/**
 * Burning Algorithm Configuration
 *
 * FlameCast algorithm configuration for woodburner ignition recommendations.
 * All weights, thresholds, and disqualification rules centralized here.
 *
 * Physics-based weighting optimized for UK/Ireland chimney draft conditions.
 */

import { AlgorithmConfig, DisqualificationRule, HourlyWeatherData } from '@weather-apps/core-algorithm';

/**
 * Component weights for burning algorithm (must sum to 1.0)
 *
 * Based on chimney draft physics research:
 * - Temperature differential is the PRIMARY driver (stack effect)
 * - Atmospheric pressure affects air density and buoyancy
 * - Humidity impacts ignition difficulty and condensation
 * - Wind and precipitation have secondary effects
 */
export const BURNING_WEIGHTS = {
  temperatureDifferential: 0.50,  // 50% - Stack effect (most important)
  atmosphericPressure: 0.15,      // 15% - Air density and draft
  humidity: 0.15,                 // 15% - Ignition ease and condensation
  windSpeed: 0.10,                // 10% - Smoke dispersal and draft
  precipitation: 0.10,            // 10% - Chimney cooling and moisture
} as const;

/**
 * Decision thresholds for woodburner burning
 *
 * EXCELLENT (75-100): Easy ignition, strong draft expected
 * GOOD (60-74): Standard procedure works
 * MARGINAL (45-59): Pre-warm chimney, use dry kindling
 * POOR (30-44): Difficult ignition, expect smoking
 * AVOID (0-29): Backdraft or severe smoking risk
 */
export const BURNING_THRESHOLDS = {
  excellent: 75,           // Perfect for lighting
  acceptable: 60,          // Good conditions
  poor: 45,                // Marginal - take precautions
  minWindowDuration: 2,    // Minimum 2-hour continuous window

  labels: {
    excellent: 'EXCELLENT',  // 🔥 Perfect conditions
    acceptable: 'GOOD',      // ✓ Light normally
    poor: 'MARGINAL',        // ⚠ Pre-warm chimney
  },
} as const;

/**
 * Disqualification rules for unsuitable conditions
 *
 * Hard rules immediately set score to 0.
 * Soft rules apply penalties to the score.
 */
export const BURNING_DISQUALIFICATION_RULES: DisqualificationRule[] = [
  {
    name: 'Temperature inversion',
    condition: (data: HourlyWeatherData) => {
      // This will be checked by the BurningScorer with indoor temp context
      // For now, we can't check without indoor temp, so return false
      return false;
    },
    reason: 'Temperature inversion (outside warmer than inside)',
    severity: 'hard',
  },
  {
    name: 'Extreme storm conditions',
    condition: (data: HourlyWeatherData) => {
      return data.pressure < 980; // Severe storm
    },
    reason: 'Extreme storm conditions',
    severity: 'hard',
  },
  {
    name: 'Very low pressure',
    condition: (data: HourlyWeatherData) => {
      return data.pressure < 990;
    },
    reason: 'Very low atmospheric pressure',
    severity: 'soft',
    penalty: 30, // -30 points
  },
  {
    name: 'Heavy rain',
    condition: (data: HourlyWeatherData) => {
      return data.precipitation > 5;
    },
    reason: 'Heavy rain cooling chimney',
    severity: 'soft',
    penalty: 20, // -20 points
  },
  {
    name: 'Fog conditions',
    condition: (data: HourlyWeatherData) => {
      return data.humidity > 95;
    },
    reason: 'Fog/mist present',
    severity: 'soft',
    penalty: 15, // -15 points
  },
];

/**
 * Temperature differential ranges (°C)
 *
 * ΔT = Indoor temp - Outdoor temp
 * Higher ΔT = stronger draft due to stack effect
 */
export const TEMPERATURE_DIFFERENTIAL_RANGES = {
  excellent: 15,       // ≥15°C - Excellent draft
  good: 10,            // ≥10°C - Good draft
  marginal: 5,         // ≥5°C - Marginal conditions
  veryDifficult: 2,    // ≥2°C - Very difficult
  backdraft: 0,        // <0°C - Temperature inversion (CRITICAL)
} as const;

/**
 * Atmospheric pressure ranges (mb/hPa)
 */
export const PRESSURE_RANGES = {
  excellent: 1025,     // ≥1025 mb - Very high pressure (excellent)
  good: 1015,          // ≥1015 mb - High pressure
  moderate: 1005,      // ≥1005 mb - Moderate pressure
  low: 995,            // ≥995 mb - Low pressure
  storm: 985,          // <985 mb - Storm conditions
} as const;

/**
 * Relative humidity ranges (%)
 */
export const HUMIDITY_RANGES = {
  optimal: { min: 40, max: 50 },  // Sweet spot for combustion
  good: 65,                        // <65% - Good conditions
  damp: 75,                        // <75% - Damp
  veryDamp: 85,                    // <85% - Very damp
  fog: 95,                         // <95% - Fog/mist
} as const;

/**
 * Wind speed ranges (km/h)
 */
export const WIND_RANGES = {
  optimal: { min: 10, max: 25 },  // Sweet spot for draft and dispersal
  calm: 3,                         // Below this = poor dispersal
  moderate: 40,                    // Above this = variable conditions
  gale: 60,                        // Above this = problematic
} as const;

/**
 * Precipitation ranges (mm/hour)
 */
export const PRECIPITATION_RANGES = {
  dry: 0,              // Dry conditions
  lightDrizzle: 1,     // <1 mm - Light drizzle
  lightRain: 3,        // <3 mm - Light rain
  moderateRain: 7,     // <7 mm - Moderate rain
} as const;

/**
 * Indoor temperature profiles for UK/Ireland homes
 * Based on typical heating patterns throughout the year
 */
export const INDOOR_TEMP_PROFILES = {
  WINTER: {
    MORNING: 15,    // 6am-9am (heating just kicking in)
    DAY: 17,        // 9am-5pm (daytime heating)
    EVENING: 18,    // 5pm-11pm (peak heating for comfort)
    NIGHT: 15       // 11pm-6am (setback temperature)
  },
  SPRING_AUTUMN: {
    MORNING: 16,    // +1°C from winter
    DAY: 18,
    EVENING: 19,
    NIGHT: 16
  },
  SUMMER: {
    MORNING: 17,    // +2°C from winter
    DAY: 19,
    EVENING: 20,
    NIGHT: 17
  }
} as const;

/**
 * Get expected indoor temperature based on time of day and season
 */
export function getIndoorTemp(
  hour: number,
  month: number,
  userOverride?: number
): number {
  if (userOverride !== undefined) {
    return userOverride;
  }

  // Determine season from month
  let season: 'winter' | 'spring' | 'summer' | 'autumn';
  if (month === 12 || month === 1 || month === 2) season = 'winter';
  else if (month >= 3 && month <= 5) season = 'spring';
  else if (month >= 6 && month <= 8) season = 'summer';
  else season = 'autumn';

  const profile = season === 'winter' ? INDOOR_TEMP_PROFILES.WINTER :
                  season === 'summer' ? INDOOR_TEMP_PROFILES.SUMMER :
                  INDOOR_TEMP_PROFILES.SPRING_AUTUMN;

  if (hour >= 6 && hour < 9) return profile.MORNING;
  if (hour >= 9 && hour < 17) return profile.DAY;
  if (hour >= 17 && hour < 23) return profile.EVENING;
  return profile.NIGHT;
}

/**
 * Complete algorithm configuration for burning scorer
 */
export const BURNING_ALGORITHM_CONFIG: AlgorithmConfig = {
  name: 'FlameCast Woodburner Algorithm',
  version: '1.0.0',

  weights: BURNING_WEIGHTS,
  thresholds: BURNING_THRESHOLDS,
  disqualificationRules: BURNING_DISQUALIFICATION_RULES,

  features: {
    coastalIntelligence: false,      // Not relevant for woodburners
    windAnalysis: true,              // Wind affects smoke dispersal
    topographicAdjustments: false,   // Indoor activity - less relevant
    temporalWeighting: true,         // Evening hours are preferred
  },
};

/**
 * Validate that weights sum to 1.0
 */
const totalWeight = Object.values(BURNING_WEIGHTS).reduce((sum, w) => sum + w, 0);
if (Math.abs(totalWeight - 1.0) > 0.001) {
  console.warn(
    `⚠️  Burning weights sum to ${totalWeight.toFixed(3)}, expected 1.0. ` +
    `Scores may be inaccurate.`
  );
}

/**
 * Export individual constants for granular access
 */
export {
  BURNING_ALGORITHM_CONFIG as default,
};
