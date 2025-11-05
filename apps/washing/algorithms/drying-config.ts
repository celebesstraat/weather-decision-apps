/**
 * Drying Algorithm Configuration
 *
 * DryCast algorithm configuration for laundry drying recommendations.
 * All weights, thresholds, and disqualification rules centralized here.
 *
 * Physics-based weighting optimized for UK/Ireland climates.
 */

import { AlgorithmConfig, DisqualificationRule, HourlyWeatherData } from '@weather-apps/core-algorithm';

/**
 * Component weights for drying algorithm (must sum to 1.0)
 *
 * Based on meteorological research and field testing:
 * - VPD is the #1 predictor of evaporation rate
 * - Wind speed accelerates evaporation exponentially
 * - Wet bulb temperature captures evaporative cooling
 * - Solar radiation provides energy for evaporation
 */
export const DRYING_WEIGHTS = {
  vaporPressureDeficit: 0.30, // 30% - Direct drying potential (most important)
  windSpeed: 0.20,             // 20% - Evaporation acceleration
  wetBulbTemperature: 0.10,    // 10% - Evaporative cooling potential
  sunshineDuration: 0.09,      // 9%  - Actual sun exposure
  temperature: 0.08,           // 8%  - Warmth factor
  shortwaveRadiation: 0.08,    // 8%  - Solar energy
  evapotranspiration: 0.05,    // 5%  - Real evaporation rates
  windDirection: 0.05,         // 5%  - Shelter/exposure logic
  dewPointSpread: 0.05,        // 5%  - Condensation risk
} as const;

/**
 * Decision thresholds for laundry drying
 *
 * YES (70-100): Excellent drying - hang washing with confidence
 * MAYBE (50-69): Marginal but acceptable - watch the weather
 * NO (0-49): Poor drying - indoor drying recommended
 */
export const DRYING_THRESHOLDS = {
  excellent: 70,           // "Get The Washing Out" (YES)
  acceptable: 50,          // "Keep Your Eye on It" (MAYBE)
  poor: 0,                 // "Indoor Drying Only" (NO)
  minWindowDuration: 2,    // Minimum 2-hour continuous window

  labels: {
    excellent: 'YES',      // Green light
    acceptable: 'MAYBE',   // Amber light
    poor: 'NO',            // Red light
  },
} as const;

/**
 * Disqualification rules for unsuitable conditions
 *
 * Hard rules immediately set score to 0.
 * Soft rules apply penalties to the score.
 */
export const DRYING_DISQUALIFICATION_RULES: DisqualificationRule[] = [
  {
    name: 'Rain detected',
    condition: (data: HourlyWeatherData) => data.precipitation > 0,
    reason: 'Rain detected',
    severity: 'hard',
  },
  {
    name: 'High rain risk',
    condition: (data: HourlyWeatherData) => {
      const rainRisk = (data.precipitationProbability / 100) * data.precipitation;
      return rainRisk > 0.2; // 40% × 0.5mm = 0.2, 20% × 1.0mm = 0.2
    },
    reason: 'High rain risk',
    severity: 'hard',
  },
  {
    name: 'Condensation risk',
    condition: (data: HourlyWeatherData) => {
      const dewPointSpread = data.temperature - data.dewPoint;
      return dewPointSpread < 1; // Less than 1°C spread
    },
    reason: 'High condensation risk',
    severity: 'hard',
  },
  {
    name: 'Very high humidity',
    condition: (data: HourlyWeatherData) => {
      return data.humidity > 95 && !data.vaporPressureDeficit;
    },
    reason: 'Extremely high humidity',
    severity: 'soft',
    penalty: 30, // -30 points
  },
  {
    name: 'Extreme wind',
    condition: (data: HourlyWeatherData) => data.windSpeed > 50,
    reason: 'Unsafe wind speeds',
    severity: 'soft',
    penalty: 20, // -20 points (washing may blow away)
  },
];

/**
 * Vapor Pressure Deficit (VPD) ranges for drying
 *
 * VPD is the difference between actual and saturated vapor pressure.
 * Higher VPD = air can hold more moisture = better drying.
 */
export const VPD_RANGES = {
  excellent: 1.5,  // kPa - excellent drying (air is dry and "thirsty")
  good: 0.5,       // kPa - good drying conditions
  poor: 0.2,       // kPa - below this, drying is very slow
} as const;

/**
 * Wind speed ranges for drying (km/h)
 */
export const WIND_RANGES = {
  optimal: { min: 5, max: 25 },  // Sweet spot for drying
  calm: 1,                        // Below this = too still
  extreme: 50,                    // Above this = washing may blow away
} as const;

/**
 * Temperature ranges for drying (°C)
 */
export const TEMPERATURE_RANGES = {
  optimal: 20,          // Ideal drying temperature
  minAcceptable: 5,     // Below this = very slow drying
  freezing: 0,          // Below this = ice formation risk
} as const;

/**
 * Solar radiation ranges (W/m²)
 */
export const RADIATION_RANGES = {
  excellent: 600,  // Strong direct sun
  good: 300,       // Partial sun
  poor: 50,        // Overcast/shade
} as const;

/**
 * Evapotranspiration ranges (mm/day)
 *
 * ET0 is reference evapotranspiration - a direct measure of
 * how much water evaporates from a reference surface.
 */
export const EVAPOTRANSPIRATION_RANGES = {
  excellent: 6,  // High evaporation rate
  good: 3,       // Moderate evaporation
  poor: 1,       // Low evaporation
} as const;

/**
 * Complete algorithm configuration for drying scorer
 */
export const DRYING_ALGORITHM_CONFIG: AlgorithmConfig = {
  name: 'DryCast Laundry Drying Algorithm',
  version: '3.0.0',

  weights: DRYING_WEIGHTS,
  thresholds: DRYING_THRESHOLDS,
  disqualificationRules: DRYING_DISQUALIFICATION_RULES,

  features: {
    coastalIntelligence: true,     // UK coastal distance adjustments
    windAnalysis: true,             // Directional wind intelligence
    topographicAdjustments: true,   // Urban/rural shelter factors
    temporalWeighting: true,        // Time of day matters (daylight only)
  },
};

/**
 * Validate that weights sum to 1.0
 */
const totalWeight = Object.values(DRYING_WEIGHTS).reduce((sum, w) => sum + w, 0);
if (Math.abs(totalWeight - 1.0) > 0.001) {
  console.warn(
    `⚠️  Drying weights sum to ${totalWeight.toFixed(3)}, expected 1.0. ` +
    `Scores may be inaccurate.`
  );
}

/**
 * Export individual constants for granular access
 */
export {
  DRYING_ALGORITHM_CONFIG as default,
};
