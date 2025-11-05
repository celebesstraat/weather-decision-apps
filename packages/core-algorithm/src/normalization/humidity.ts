/**
 * Humidity Normalization Functions
 *
 * Normalize humidity-related parameters to 0-100 scores.
 */

/**
 * Normalize relative humidity
 *
 * For drying: Lower is better
 * Optimal: 30-50%
 * Poor: >80% (slow drying)
 */
export function normalizeRelativeHumidity(rh: number, inverted = true): number {
  if (inverted) {
    // Lower humidity = higher score (drying applications)
    if (rh <= 30) {
      return 100;
    } else if (rh <= 50) {
      return 100 - ((rh - 30) / 20) * 20; // 100 to 80
    } else if (rh <= 70) {
      return 80 - ((rh - 50) / 20) * 40; // 80 to 40
    } else if (rh <= 90) {
      return 40 - ((rh - 70) / 20) * 40; // 40 to 0
    } else {
      return 0;
    }
  } else {
    // Higher humidity = higher score (comfort applications)
    if (rh < 30) {
      return (rh / 30) * 50;
    } else if (rh <= 60) {
      return 50 + ((rh - 30) / 30) * 50;
    } else {
      return Math.max(0, 100 - ((rh - 60) / 30) * 100);
    }
  }
}

/**
 * Normalize Vapor Pressure Deficit (VPD)
 *
 * VPD = Direct measure of drying potential
 * Higher VPD = drier air = better drying
 *
 * Typical ranges:
 * - Very low: <0.5 kPa (poor drying)
 * - Low: 0.5-1.0 kPa (slow drying)
 * - Moderate: 1.0-2.0 kPa (good drying)
 * - High: 2.0-3.0 kPa (excellent drying)
 * - Very high: >3.0 kPa (optimal drying)
 */
export function normalizeVaporPressureDeficit(vpdKpa: number): number {
  if (vpdKpa <= 0.5) {
    return vpdKpa * 20; // 0-10 score
  } else if (vpdKpa <= 1.0) {
    return 10 + (vpdKpa - 0.5) * 40; // 10-30 score
  } else if (vpdKpa <= 2.0) {
    return 30 + (vpdKpa - 1.0) * 40; // 30-70 score
  } else if (vpdKpa <= 3.0) {
    return 70 + (vpdKpa - 2.0) * 25; // 70-95 score
  } else {
    return Math.min(100, 95 + (vpdKpa - 3.0) * 2); // 95-100 score
  }
}

/**
 * Calculate VPD from temperature and relative humidity
 */
export function calculateVPD(tempC: number, relativeHumidity: number): number {
  // Saturation vapor pressure (kPa) using Magnus formula
  const es = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));

  // Actual vapor pressure (kPa)
  const ea = es * (relativeHumidity / 100);

  // Vapor pressure deficit
  const vpd = es - ea;

  return Math.max(0, vpd);
}

/**
 * Normalize absolute humidity (g/m³)
 *
 * Lower is better for drying
 */
export function normalizeAbsoluteHumidity(absHumidity: number): number {
  const MAX = 30; // g/m³ (very humid)
  

  return Math.max(0, 100 - (absHumidity / MAX) * 100);
}

/**
 * Calculate absolute humidity from temp and RH
 */
export function calculateAbsoluteHumidity(tempC: number, relativeHumidity: number): number {
  // Saturation vapor pressure (hPa)
  const es = 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));

  // Actual vapor pressure (hPa)
  const e = es * (relativeHumidity / 100);

  // Absolute humidity (g/m³)
  const absHumidity = (e * 216.7) / (tempC + 273.15);

  return absHumidity;
}

/**
 * Normalize dew point
 *
 * Lower dew point = drier air = better drying
 */
export function normalizeDewPoint(dewPointC: number): number {
  if (dewPointC <= 0) {
    return 100; // Very dry
  } else if (dewPointC <= 10) {
    return 100 - dewPointC * 2; // 100 to 80
  } else if (dewPointC <= 15) {
    return 80 - (dewPointC - 10) * 4; // 80 to 60
  } else if (dewPointC <= 20) {
    return 60 - (dewPointC - 15) * 8; // 60 to 20
  } else {
    return Math.max(0, 20 - (dewPointC - 20) * 2);
  }
}

/**
 * Calculate dew point from temperature and RH
 */
export function calculateDewPoint(tempC: number, relativeHumidity: number): number {
  const a = 17.27;
  const b = 237.7;

  const alpha = ((a * tempC) / (b + tempC)) + Math.log(relativeHumidity / 100);
  const dewPoint = (b * alpha) / (a - alpha);

  return dewPoint;
}

/**
 * Classify humidity level
 */
export function classifyHumidity(rh: number): {
  level: string;
  description: string;
  dryingPotential: 'excellent' | 'good' | 'moderate' | 'poor' | 'very-poor';
} {
  if (rh < 30) {
    return {
      level: 'Very dry',
      description: 'Excellent drying conditions',
      dryingPotential: 'excellent',
    };
  } else if (rh < 50) {
    return {
      level: 'Dry',
      description: 'Good drying conditions',
      dryingPotential: 'good',
    };
  } else if (rh < 70) {
    return {
      level: 'Moderate',
      description: 'Acceptable drying conditions',
      dryingPotential: 'moderate',
    };
  } else if (rh < 85) {
    return {
      level: 'Humid',
      description: 'Slow drying conditions',
      dryingPotential: 'poor',
    };
  } else {
    return {
      level: 'Very humid',
      description: 'Very poor drying conditions',
      dryingPotential: 'very-poor',
    };
  }
}

/**
 * Generic humidity normalization
 */
export function normalizeHumidity(
  value: number,
  type: 'relative' | 'absolute' | 'vpd' | 'dewpoint',
  inverted = true
): number {
  switch (type) {
    case 'relative':
      return normalizeRelativeHumidity(value, inverted);
    case 'absolute':
      return normalizeAbsoluteHumidity(value);
    case 'vpd':
      return normalizeVaporPressureDeficit(value);
    case 'dewpoint':
      return normalizeDewPoint(value);
    default:
      throw new Error(`Unknown humidity type: ${type}`);
  }
}
