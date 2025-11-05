/**
 * Woodburner App Algorithms - Barrel Export
 *
 * Centralized export of all burning algorithm components
 */

export { BurningScorer, burningScorer } from './BurningScorer';
export type { BurningContext } from './BurningScorer';
export {
  BURNING_ALGORITHM_CONFIG,
  BURNING_WEIGHTS,
  BURNING_THRESHOLDS,
  BURNING_DISQUALIFICATION_RULES,
  TEMPERATURE_DIFFERENTIAL_RANGES,
  PRESSURE_RANGES,
  HUMIDITY_RANGES,
  WIND_RANGES,
  PRECIPITATION_RANGES,
  INDOOR_TEMP_PROFILES,
  getIndoorTemp,
} from './burning-config';
export { default as burningConfig } from './burning-config';
