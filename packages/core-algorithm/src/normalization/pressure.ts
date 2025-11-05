/**
 * Pressure Normalization Functions
 *
 * Normalize atmospheric pressure and related parameters.
 */

/**
 * Normalize atmospheric pressure
 *
 * Standard: 1013.25 hPa
 * High pressure: >1020 hPa (typically stable/fair weather)
 * Low pressure: <1000 hPa (typically unsettled/poor weather)
 */
export function normalizePressure(pressureHpa: number): number {
  const STANDARD = 1013.25;
  const HIGH = 1030;
  const LOW = 990;

  if (pressureHpa >= HIGH) {
    return 100; // Very high pressure = excellent conditions
  } else if (pressureHpa >= STANDARD) {
    return 70 + ((pressureHpa - STANDARD) / (HIGH - STANDARD)) * 30;
  } else if (pressureHpa >= LOW) {
    return 30 + ((pressureHpa - LOW) / (STANDARD - LOW)) * 40;
  } else {
    return Math.max(0, 30 - ((LOW - pressureHpa) / 10) * 10);
  }
}

/**
 * Normalize pressure trend (change over time)
 *
 * Rising pressure = improving conditions
 * Falling pressure = deteriorating conditions
 *
 * @param trendHpaPerHour - Pressure change in hPa/hour
 */
export function normalizePressureTrend(trendHpaPerHour: number): number {
  if (trendHpaPerHour >= 2) {
    return 100; // Rapidly rising (excellent trend)
  } else if (trendHpaPerHour >= 0.5) {
    return 80 + (trendHpaPerHour - 0.5) * 13.3; // Rising
  } else if (trendHpaPerHour >= -0.5) {
    return 60 + trendHpaPerHour * 40; // Steady
  } else if (trendHpaPerHour >= -2) {
    return 40 + (trendHpaPerHour + 2) * 13.3; // Falling
  } else {
    return Math.max(0, 40 + (trendHpaPerHour + 2) * 20); // Rapidly falling
  }
}

/**
 * Calculate pressure trend from readings
 */
export function calculatePressureTrend(
  currentPressure: number,
  previousPressure: number,
  hoursApart: number
): number {
  return (currentPressure - previousPressure) / hoursApart;
}

/**
 * Adjust pressure for elevation (sea level conversion)
 *
 * Pressure decreases ~1 hPa per 8.3 meters of elevation
 */
export function adjustPressureForElevation(
  stationPressure: number,
  elevationMeters: number,
  temperatureC: number
): number {
  // Hypsometric formula (simplified)
  const seaLevelPressure =
    stationPressure * Math.pow(1 - (0.0065 * elevationMeters) / (temperatureC + 0.0065 * elevationMeters + 273.15), -5.257);

  return seaLevelPressure;
}

/**
 * Classify pressure system
 */
export function classifyPressure(pressureHpa: number): {
  category: string;
  description: string;
  weatherTendency: string;
} {
  if (pressureHpa < 980) {
    return {
      category: 'Very Low',
      description: 'Deep depression',
      weatherTendency: 'Stormy weather likely',
    };
  } else if (pressureHpa < 1000) {
    return {
      category: 'Low',
      description: 'Low pressure system',
      weatherTendency: 'Unsettled, rain likely',
    };
  } else if (pressureHpa < 1013) {
    return {
      category: 'Below Normal',
      description: 'Slightly low pressure',
      weatherTendency: 'Variable conditions',
    };
  } else if (pressureHpa < 1020) {
    return {
      category: 'Normal',
      description: 'Standard pressure',
      weatherTendency: 'Fair conditions',
    };
  } else if (pressureHpa < 1030) {
    return {
      category: 'High',
      description: 'High pressure system',
      weatherTendency: 'Settled, dry weather',
    };
  } else {
    return {
      category: 'Very High',
      description: 'Strong high pressure',
      weatherTendency: 'Very stable, clear skies',
    };
  }
}

/**
 * Predict weather stability from pressure
 *
 * Returns 0-100 score (100 = very stable)
 */
export function predictWeatherStability(
  currentPressure: number,
  trend: number
): number {
  const pressureScore = normalizePressure(currentPressure);
  const trendScore = normalizePressureTrend(trend);

  // Weight current pressure more heavily than trend
  return pressureScore * 0.7 + trendScore * 0.3;
}

/**
 * Convert pressure units
 */
export function convertPressure(
  pressure: number,
  from: 'hpa' | 'mbar' | 'inhg' | 'mmhg' | 'psi',
  to: 'hpa' | 'mbar' | 'inhg' | 'mmhg' | 'psi'
): number {
  // Convert to hPa first
  let hpa: number;
  switch (from) {
    case 'hpa':
    case 'mbar':
      hpa = pressure;
      break;
    case 'inhg':
      hpa = pressure * 33.86389;
      break;
    case 'mmhg':
      hpa = pressure * 1.33322;
      break;
    case 'psi':
      hpa = pressure * 68.94757;
      break;
  }

  // Convert from hPa to target unit
  switch (to) {
    case 'hpa':
    case 'mbar':
      return hpa;
    case 'inhg':
      return hpa / 33.86389;
    case 'mmhg':
      return hpa / 1.33322;
    case 'psi':
      return hpa / 68.94757;
  }
}

/**
 * Calculate altimeter setting (for aviation)
 */
export function calculateAltimeterSetting(
  stationPressure: number,
  elevationMeters: number,
  temperatureC: number
): number {
  // Standard lapse rate
  const stdTemp = 15 - 0.0065 * elevationMeters;
  const ratio = (temperatureC + 273.15) / (stdTemp + 273.15);

  const altimeter = stationPressure * Math.pow(1 + (elevationMeters / 145442.16) * ratio, 5.255);

  return altimeter;
}
