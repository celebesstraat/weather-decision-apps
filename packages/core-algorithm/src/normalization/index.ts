/**
 * Normalization Functions - Barrel Export
 *
 * Centralized export of all normalization utilities
 */

// Temperature
export {
  normalizeDryingTemperature,
  normalizeBurningTemperature,
  normalizeWetBulbTemperature,
  normalizeDewPointSpread,
  normalizeTemperature,
  calculateFeelsLike,
} from './temperature';

// Humidity
export {
  normalizeRelativeHumidity,
  normalizeVaporPressureDeficit,
  normalizeAbsoluteHumidity,
  normalizeDewPoint,
  normalizeHumidity,
  calculateVPD,
  calculateAbsoluteHumidity,
  calculateDewPoint,
  classifyHumidity,
} from './humidity';

// Wind
export {
  normalizeDryingWindSpeed,
  normalizeBurningWindSpeed,
  normalizeWindSpeed,
  normalizeWindDirection,
  normalizeWindGusts,
  calculateWindChill,
  calculateEffectiveWindSpeed,
  beaufortScale,
  convertWindSpeed,
  getCompassBearing,
} from './wind';

// Pressure
export {
  normalizePressure,
  normalizePressureTrend,
  calculatePressureTrend,
  adjustPressureForElevation,
  classifyPressure,
  predictWeatherStability,
  convertPressure,
  calculateAltimeterSetting,
} from './pressure';

// Radiation
export {
  normalizeShortwaveRadiation,
  normalizeSunshineDuration,
  normalizeUVIndex,
  normalizeCloudCover,
  normalizeEvapotranspiration,
  calculateClearSkyIndex,
  estimateClearSkyRadiation,
  calculatePAR,
  classifySunshine,
  calculateDayLength,
  estimateSunrise,
} from './radiation';
