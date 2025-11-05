/**
 * Wind Normalization Functions
 *
 * Normalize wind-related parameters for different applications.
 */

/**
 * Normalize wind speed for drying applications
 *
 * Optimal: 15-25 km/h (good air movement without damage)
 * Too low: <5 km/h (stagnant air)
 * Too high: >40 km/h (items may blow away)
 */
export function normalizeDryingWindSpeed(speedKmh: number): number {
  if (speedKmh < 5) {
    return speedKmh * 10; // 0-50 score
  } else if (speedKmh < 15) {
    return 50 + (speedKmh - 5) * 3; // 50-80 score
  } else if (speedKmh <= 25) {
    return 80 + (speedKmh - 15) * 2; // 80-100 score
  } else if (speedKmh <= 40) {
    return 100 - (speedKmh - 25) * 3; // 100-55 score
  } else {
    return Math.max(0, 55 - (speedKmh - 40) * 2);
  }
}

/**
 * Normalize wind speed for burning applications
 *
 * Moderate wind helps chimney draft but too much is dangerous
 * Optimal: 5-15 km/h
 * Poor: >30 km/h (fire risk)
 */
export function normalizeBurningWindSpeed(speedKmh: number): number {
  if (speedKmh < 5) {
    return 60 + speedKmh * 4; // 60-80 score
  } else if (speedKmh <= 15) {
    return 80 + (speedKmh - 5) * 2; // 80-100 score
  } else if (speedKmh <= 25) {
    return 100 - (speedKmh - 15) * 4; // 100-60 score
  } else if (speedKmh <= 35) {
    return 60 - (speedKmh - 25) * 4; // 60-20 score
  } else {
    return Math.max(0, 20 - (speedKmh - 35) * 2);
  }
}

/**
 * Normalize wind speed with custom optimal range
 */
export function normalizeWindSpeed(
  speedKmh: number,
  optimalRange: [number, number],
  minAcceptable: number,
  maxAcceptable: number
): number {
  const [optMin, optMax] = optimalRange;

  if (speedKmh < minAcceptable) {
    return (speedKmh / minAcceptable) * 30;
  } else if (speedKmh < optMin) {
    return 30 + ((speedKmh - minAcceptable) / (optMin - minAcceptable)) * 50;
  } else if (speedKmh <= optMax) {
    return 80 + ((speedKmh - optMin) / (optMax - optMin)) * 20;
  } else if (speedKmh <= maxAcceptable) {
    return 100 - ((speedKmh - optMax) / (maxAcceptable - optMax)) * 100;
  } else {
    return Math.max(0, 0 - (speedKmh - maxAcceptable));
  }
}

/**
 * Calculate wind chill temperature
 */
export function calculateWindChill(tempC: number, windSpeedKmh: number): number {
  if (tempC > 10 || windSpeedKmh < 5) {
    return tempC; // Wind chill not applicable
  }

  const windChillC =
    13.12 +
    0.6215 * tempC -
    11.37 * Math.pow(windSpeedKmh, 0.16) +
    0.3965 * tempC * Math.pow(windSpeedKmh, 0.16);

  return windChillC;
}

/**
 * Normalize wind direction (coastal/prevailing considerations)
 *
 * @param direction - Wind direction in degrees
 * @param prevailingDirection - Expected prevailing wind (default: 225° SW for UK)
 * @returns Score 0-100 (100 = aligned with prevailing)
 */
export function normalizeWindDirection(
  direction: number,
  prevailingDirection = 225
): number {
  // Calculate angular difference
  let diff = Math.abs(direction - prevailingDirection);
  if (diff > 180) {
    diff = 360 - diff;
  }

  // Convert to score (0° diff = 100, 180° diff = 50)
  return 100 - (diff / 180) * 50;
}

/**
 * Normalize wind gust speed
 *
 * Gusts are problematic for most applications
 */
export function normalizeWindGusts(
  averageSpeed: number,
  gustSpeed: number,
  tolerance: 'low' | 'medium' | 'high' = 'medium'
): number {
  const gustRatio = gustSpeed / (averageSpeed || 1);

  // Tolerance thresholds
  const thresholds = {
    low: { acceptable: 1.3, poor: 1.6 },
    medium: { acceptable: 1.5, poor: 2.0 },
    high: { acceptable: 1.7, poor: 2.5 },
  };

  const { acceptable, poor } = thresholds[tolerance];

  if (gustRatio <= acceptable) {
    return 100;
  } else if (gustRatio <= poor) {
    return 100 - ((gustRatio - acceptable) / (poor - acceptable)) * 100;
  } else {
    return Math.max(0, 0 - ((gustRatio - poor) * 50));
  }
}

/**
 * Calculate effective wind speed with shelter factor
 */
export function calculateEffectiveWindSpeed(
  actualSpeed: number,
  shelterFactor: number // 0 (exposed) to 1 (sheltered)
): number {
  // Shelter reduces effective wind speed
  return actualSpeed * (1 - shelterFactor * 0.6);
}

/**
 * Classify wind speed using Beaufort scale
 */
export function beaufortScale(speedKmh: number): {
  force: number;
  description: string;
  landConditions: string;
} {
  if (speedKmh < 1) {
    return { force: 0, description: 'Calm', landConditions: 'Smoke rises vertically' };
  } else if (speedKmh < 6) {
    return { force: 1, description: 'Light air', landConditions: 'Smoke drift shows direction' };
  } else if (speedKmh < 12) {
    return { force: 2, description: 'Light breeze', landConditions: 'Wind felt on face' };
  } else if (speedKmh < 20) {
    return { force: 3, description: 'Gentle breeze', landConditions: 'Leaves in motion' };
  } else if (speedKmh < 29) {
    return { force: 4, description: 'Moderate breeze', landConditions: 'Dust and paper raised' };
  } else if (speedKmh < 39) {
    return { force: 5, description: 'Fresh breeze', landConditions: 'Small trees sway' };
  } else if (speedKmh < 50) {
    return { force: 6, description: 'Strong breeze', landConditions: 'Large branches move' };
  } else if (speedKmh < 62) {
    return { force: 7, description: 'Near gale', landConditions: 'Whole trees move' };
  } else if (speedKmh < 75) {
    return { force: 8, description: 'Gale', landConditions: 'Twigs break off' };
  } else if (speedKmh < 89) {
    return { force: 9, description: 'Strong gale', landConditions: 'Slight structural damage' };
  } else if (speedKmh < 103) {
    return { force: 10, description: 'Storm', landConditions: 'Trees uprooted' };
  } else if (speedKmh < 118) {
    return { force: 11, description: 'Violent storm', landConditions: 'Widespread damage' };
  } else {
    return { force: 12, description: 'Hurricane', landConditions: 'Devastating damage' };
  }
}

/**
 * Convert wind speed units
 */
export function convertWindSpeed(
  speed: number,
  from: 'kmh' | 'mph' | 'ms' | 'knots',
  to: 'kmh' | 'mph' | 'ms' | 'knots'
): number {
  // Convert to km/h first
  let kmh: number;
  switch (from) {
    case 'kmh':
      kmh = speed;
      break;
    case 'mph':
      kmh = speed * 1.60934;
      break;
    case 'ms':
      kmh = speed * 3.6;
      break;
    case 'knots':
      kmh = speed * 1.852;
      break;
  }

  // Convert from km/h to target unit
  switch (to) {
    case 'kmh':
      return kmh;
    case 'mph':
      return kmh / 1.60934;
    case 'ms':
      return kmh / 3.6;
    case 'knots':
      return kmh / 1.852;
  }
}

/**
 * Get wind direction as compass bearing
 */
export function getCompassBearing(degrees: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ];

  const index = Math.round(((degrees % 360) / 22.5)) % 16;
  return directions[index]!;
}
