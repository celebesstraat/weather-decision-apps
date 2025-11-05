/**
 * DryCast Algorithm Configuration
 * All scoring weights, thresholds, and constants centralized for easy tuning
 */

export const ALGORITHM_CONFIG = {
  // Scoring weights (must sum to 100)
  WEIGHTS: {
    VAPOR_PRESSURE_DEFICIT: 30,
    WIND_SPEED: 20,
    WET_BULB_TEMPERATURE: 10,
    SUNSHINE_DURATION: 9,
    TEMPERATURE: 8,
    SHORTWAVE_RADIATION: 8,
    EVAPOTRANSPIRATION: 5,
    WIND_DIRECTION: 5,
    DEW_POINT_SPREAD: 5,
  } as const,

  // Quality thresholds (0-100 scale)
  THRESHOLDS: {
    PERFECT: 70,           // Score >= 70 = "Perfect" drying
    GOOD: 50,              // Score >= 50 = "OK" drying
    MIN_SUITABLE: 50,      // Minimum score to be considered suitable
    // Below 50 = "Poor" drying
  } as const,

  // Disqualification rules
  DISQUALIFIERS: {
    MIN_DEW_POINT_SPREAD: 1,     // °C - condensation risk if spread < 1
    MAX_RAIN_RISK: 0.2,           // Risk score threshold (probability × intensity)
    ANY_RAINFALL: true,           // Any detected rainfall disqualifies hour
  } as const,

  // Window detection
  WINDOWS: {
    MIN_CONTINUOUS_HOURS: 2,     // Minimum 2+ hour window required
    MIN_WINDOW_SCORE: 50,         // Minimum average score for window
  } as const,

  // Wind speed ranges (km/h)
  WIND: {
    OPTIMAL_MIN: 5,               // Below this = too still
    OPTIMAL_MAX: 25,              // Above this = too windy
    EXTREME_MAX: 50,              // Penalize heavily above this
  } as const,

  // Vapor Pressure Deficit ranges (kPa)
  VPD: {
    OPTIMAL_MIN: 0.5,             // Good drying conditions
    OPTIMAL_MAX: 2.5,             // Excellent drying
    POOR_THRESHOLD: 0.2,          // Below this = poor drying
  } as const,

  // Temperature ranges (°C)
  TEMPERATURE: {
    OPTIMAL: 20,                  // Ideal drying temperature
    MIN_ACCEPTABLE: 10,           // Cold but acceptable
    MAX_BONUS: 30,                // Max temp for bonus points
  } as const,

  // Coastal modifiers
  COASTAL: {
    STRONGLY_COASTAL_DISTANCE: 5,      // km from coast
    COASTAL_DISTANCE: 10,
    SOMEWHAT_INLAND_DISTANCE: 20,
    INLAND_DISTANCE: 40,
    // Distance > 40km = strongly inland
  } as const,

  // Window quality descriptions
  WINDOW_DESCRIPTIONS: {
    EXCELLENT: { min: 80, label: 'Excellent drying conditions' },
    VERY_GOOD: { min: 70, label: 'Very good drying conditions' },
    GOOD: { min: 60, label: 'Good drying conditions' },
    DECENT: { min: 55, label: 'Decent drying conditions' },
    ACCEPTABLE: { min: 50, label: 'Acceptable drying conditions' },
  } as const,
} as const;

// Type-safe access to config
export type AlgorithmConfig = typeof ALGORITHM_CONFIG;

// Validation: ensure weights sum to 100
const totalWeight = Object.values(ALGORITHM_CONFIG.WEIGHTS).reduce((sum, w) => sum + w, 0);
if (totalWeight !== 100) {
  console.warn(`⚠️  Algorithm weights sum to ${totalWeight}, expected 100. Scores may be inaccurate.`);
}
