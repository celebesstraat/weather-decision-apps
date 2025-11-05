/**
 * FlameCast Algorithm Configuration
 *
 * Woodburner ignition and performance prediction for UK/Ireland climate
 * Based on chimney draft physics and atmospheric conditions
 */

// ============================================================================
// INDOOR TEMPERATURE PROFILES
// ============================================================================

/**
 * Default indoor temperature profiles for UK/Ireland homes
 * Based on typical heating patterns throughout the year
 *
 * User confirmed values:
 * - Winter baseline: Morning 15°C, Day 17°C, Evening 18°C, Night 15°C
 * - Spring/Autumn: +1°C from winter
 * - Summer: +2°C from winter
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
 *
 * @param hour - Hour of day (0-23)
 * @param season - Current season
 * @param userOverride - Optional user-specified indoor temperature
 * @returns Indoor temperature in °C
 */
export function getIndoorTemp(
  hour: number,
  season: 'winter' | 'spring' | 'summer' | 'autumn',
  userOverride?: number
): number {
  if (userOverride !== undefined) {
    return userOverride;
  }

  const profile = season === 'winter' ? INDOOR_TEMP_PROFILES.WINTER :
                  season === 'summer' ? INDOOR_TEMP_PROFILES.SUMMER :
                  INDOOR_TEMP_PROFILES.SPRING_AUTUMN;

  if (hour >= 6 && hour < 9) return profile.MORNING;
  if (hour >= 9 && hour < 17) return profile.DAY;
  if (hour >= 17 && hour < 23) return profile.EVENING;
  return profile.NIGHT;
}

// ============================================================================
// ALGORITHM WEIGHTS
// ============================================================================

/**
 * Component scoring weights for FlameCast algorithm
 *
 * Based on chimney draft physics research:
 * - Temperature differential is the dominant factor (stack effect)
 * - Atmospheric pressure and humidity have secondary influence
 * - Wind and precipitation affect performance but are less critical
 *
 * Must sum to 100
 */
export const FLAMECAST_WEIGHTS = {
  TEMPERATURE_DIFFERENTIAL: 50,  // ΔT = Indoor - Outdoor (stack effect)
  ATMOSPHERIC_PRESSURE: 15,      // Affects buoyancy and draft
  HUMIDITY: 15,                  // Affects ignition and condensation
  WIND_SPEED: 10,                // Affects smoke dispersal and draft
  PRECIPITATION: 10              // Cools chimney, increases moisture
} as const;

// Validate weights sum to 100
const totalWeight = Object.values(FLAMECAST_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
if (totalWeight !== 100) {
  throw new Error(`FlameCast weights must sum to 100, got ${totalWeight}`);
}

// ============================================================================
// DECISION THRESHOLDS
// ============================================================================

/**
 * Decision thresholds for FlameCast recommendations
 *
 * Score range: 0-100
 * - 75-100: EXCELLENT (easy ignition, strong draft)
 * - 60-74:  GOOD (standard procedure works)
 * - 45-59:  MARGINAL (pre-warm chimney, use dry kindling)
 * - 30-44:  POOR (not recommended)
 * - 0-29:   AVOID (backdraft/severe smoking risk)
 */
export const FLAMECAST_THRESHOLDS = {
  EXCELLENT: 75,
  GOOD: 60,
  MARGINAL: 45,
  POOR: 30
} as const;

/**
 * FlameCast recommendation status
 */
export type FlameCastStatus = 'EXCELLENT' | 'GOOD' | 'MARGINAL' | 'POOR' | 'AVOID';

/**
 * Get recommendation status from score
 */
export function getRecommendationStatus(score: number): FlameCastStatus {
  if (score >= FLAMECAST_THRESHOLDS.EXCELLENT) return 'EXCELLENT';
  if (score >= FLAMECAST_THRESHOLDS.GOOD) return 'GOOD';
  if (score >= FLAMECAST_THRESHOLDS.MARGINAL) return 'MARGINAL';
  if (score >= FLAMECAST_THRESHOLDS.POOR) return 'POOR';
  return 'AVOID';
}

// ============================================================================
// CRITICAL THRESHOLDS
// ============================================================================

/**
 * Critical thresholds for temperature differential
 * ΔT = Indoor temp - Outdoor temp
 */
export const TEMPERATURE_DIFFERENTIAL_THRESHOLDS = {
  INVERSION: 0,           // ΔT < 0 = CRITICAL (outside warmer than inside)
  SEVERE_BACKDRAFT: 2,    // ΔT < 2°C = Severe backdraft risk
  VERY_DIFFICULT: 5,      // ΔT < 5°C = Very difficult ignition
  MARGINAL: 10,           // ΔT < 10°C = Marginal conditions
  GOOD: 15                // ΔT >= 15°C = Excellent draft
} as const;

/**
 * Atmospheric pressure thresholds (in millibars)
 */
export const PRESSURE_THRESHOLDS = {
  STORM: 985,             // < 985 mb = Storm conditions
  DEEP_LOW: 995,          // < 995 mb = Deep low pressure
  LOW: 1005,              // < 1005 mb = Low pressure
  MODERATE: 1015,         // < 1015 mb = Moderate pressure
  HIGH: 1025              // >= 1025 mb = High pressure
} as const;

/**
 * Relative humidity thresholds (percentage)
 */
export const HUMIDITY_THRESHOLDS = {
  FOG: 95,                // > 95% = Fog/mist conditions
  VERY_DAMP: 85,          // > 85% = Very damp
  DAMP: 75,               // > 75% = Damp
  MODERATE: 65,           // > 65% = Moderate
  GOOD: 50,               // > 50% = Good
  OPTIMAL: 40             // 40-50% = Optimal range
} as const;

/**
 * Wind speed thresholds (km/h)
 * Assumes chimney cap is installed
 */
export const WIND_THRESHOLDS = {
  CALM: 3,                // < 3 km/h = Calm
  LIGHT: 10,              // < 10 km/h = Light breeze
  MODERATE: 25,           // < 25 km/h = Moderate (optimal)
  FRESH: 40,              // < 40 km/h = Fresh
  STRONG: 60              // < 60 km/h = Strong
  // >= 60 km/h = Gale conditions
} as const;

/**
 * Precipitation thresholds (mm/hour)
 */
export const PRECIPITATION_THRESHOLDS = {
  DRY: 0,                 // 0 mm = Dry
  LIGHT_DRIZZLE: 1,       // < 1 mm = Light drizzle
  LIGHT_RAIN: 3,          // < 3 mm = Light rain
  MODERATE_RAIN: 7        // < 7 mm = Moderate rain
  // >= 7 mm = Heavy rain
} as const;

// ============================================================================
// WARNING CONDITIONS
// ============================================================================

/**
 * Conditions that trigger critical warnings
 */
export const WARNING_CONDITIONS = {
  /**
   * Temperature inversion: Outside warmer than inside
   * CRITICAL - DO NOT LIGHT (severe backdraft risk)
   */
  TEMPERATURE_INVERSION: (outdoorTemp: number, indoorTemp: number) =>
    outdoorTemp > indoorTemp,

  /**
   * Summer chimney syndrome:
   * High pressure anticyclone + calm winds + marginal ΔT
   */
  SUMMER_CHIMNEY_SYNDROME: (
    season: string,
    pressure: number,
    windSpeed: number,
    deltaT: number
  ) => season === 'summer' && pressure > 1020 && windSpeed < 5 && deltaT < 5,

  /**
   * Cold chimney morning:
   * Early morning hours with marginal ΔT
   */
  COLD_CHIMNEY_MORNING: (hour: number, deltaT: number) =>
    hour >= 6 && hour < 9 && deltaT < 8,

  /**
   * Very damp conditions:
   * High humidity + marginal ΔT
   */
  VERY_DAMP_CONDITIONS: (humidity: number, deltaT: number) =>
    humidity > 85 && deltaT < 10,

  /**
   * Fog/mist present:
   * Very high humidity (poor visibility)
   */
  FOG_CONDITIONS: (humidity: number) => humidity > 95
} as const;

// ============================================================================
// DISPLAY MESSAGES
// ============================================================================

/**
 * User-facing messages for each recommendation status
 */
export const STATUS_MESSAGES = {
  EXCELLENT: {
    title: "Perfect for lighting!",
    subtitle: "Easy ignition, strong draft expected",
    icon: "🔥",
    color: "green"
  },
  GOOD: {
    title: "Light normally",
    subtitle: "Standard ignition procedure should work",
    icon: "✓",
    color: "lightgreen"
  },
  MARGINAL: {
    title: "Take precautions",
    subtitle: "Pre-warm chimney, use dry kindling",
    icon: "⚠",
    color: "amber"
  },
  POOR: {
    title: "Not recommended",
    subtitle: "Difficult ignition, expect smoking",
    icon: "✗",
    color: "orange"
  },
  AVOID: {
    title: "Do NOT light",
    subtitle: "Backdraft or severe smoking risk",
    icon: "✗✗",
    color: "red"
  }
} as const;

/**
 * Warning messages for critical conditions
 */
export const WARNING_MESSAGES = {
  TEMPERATURE_INVERSION: "SEVERE BACKDRAFT RISK: Outside temperature exceeds indoor temperature. Do not light stove.",
  SUMMER_CHIMNEY_SYNDROME: "Summer chimney syndrome likely. Pre-warm chimney essential before attempting ignition.",
  COLD_CHIMNEY_MORNING: "Cold chimney from overnight cooling. Use newspaper torch to pre-warm flue before lighting.",
  VERY_DAMP_CONDITIONS: "Very damp conditions. Use only dry kindling (<15% moisture content).",
  FOG_CONDITIONS: "Fog/mist present. Expect difficult ignition and poor smoke dispersion."
} as const;
