/**
 * Temperature Normalization Functions
 *
 * Normalize temperature values to 0-100 scores based on use case.
 */

/**
 * Normalize temperature for drying applications
 *
 * Optimal: 15-25°C
 * Acceptable: 10-30°C
 * Poor: <5°C or >35°C
 */
export function normalizeDryingTemperature(tempC: number): number {
  const OPTIMAL_LOW = 15;
  const OPTIMAL_HIGH = 25;
  const MIN = 5;
  const MAX = 35;

  if (tempC < MIN) {
    return Math.max(0, (tempC / MIN) * 30);
  } else if (tempC <= OPTIMAL_LOW) {
    return 30 + ((tempC - MIN) / (OPTIMAL_LOW - MIN)) * 50;
  } else if (tempC <= OPTIMAL_HIGH) {
    return 80 + ((tempC - OPTIMAL_LOW) / (OPTIMAL_HIGH - OPTIMAL_LOW)) * 20;
  } else if (tempC <= MAX) {
    return 100 - ((tempC - OPTIMAL_HIGH) / (MAX - OPTIMAL_HIGH)) * 30;
  } else {
    return Math.max(0, 70 - (tempC - MAX) * 2);
  }
}

/**
 * Normalize temperature for burning applications (fires/woodburners)
 *
 * Lower is better (more need for heating)
 * Optimal: 0-10°C (ideal fire weather)
 * Poor: >20°C (too warm for fires)
 */
export function normalizeBurningTemperature(tempC: number): number {
  if (tempC <= 0) {
    return 100; // Freezing = perfect fire weather
  } else if (tempC <= 10) {
    return 90 - tempC * 1.5; // Gradually decline
  } else if (tempC <= 20) {
    return 75 - (tempC - 10) * 5; // Faster decline
  } else {
    return Math.max(0, 25 - (tempC - 20) * 2);
  }
}

/**
 * Normalize wet bulb temperature (evaporative cooling potential)
 *
 * Lower is better for drying (more evaporation potential)
 */
export function normalizeWetBulbTemperature(wetBulbC: number): number {
  const OPTIMAL = 5;
  const MAX = 25;

  if (wetBulbC <= OPTIMAL) {
    return 100;
  } else if (wetBulbC <= MAX) {
    return 100 - ((wetBulbC - OPTIMAL) / (MAX - OPTIMAL)) * 100;
  } else {
    return 0;
  }
}

/**
 * Normalize dew point spread (temperature - dew point)
 *
 * Larger spread = drier air = better drying
 * Critical: <1°C (condensation risk)
 * Good: >5°C (low humidity)
 */
export function normalizeDewPointSpread(spreadC: number): number {
  if (spreadC < 1) {
    return 0; // Critical condensation risk
  } else if (spreadC < 3) {
    return (spreadC - 1) * 25; // 0-50 score
  } else if (spreadC < 5) {
    return 50 + (spreadC - 3) * 25; // 50-100 score
  } else {
    return 100; // Excellent drying conditions
  }
}

/**
 * Generic temperature normalization with customizable parameters
 */
export function normalizeTemperature(
  tempC: number,
  config: {
    min: number;
    max: number;
    optimal?: number;
    optimalRange?: [number, number];
  }
): number {
  const { min, max, optimal, optimalRange } = config;

  if (optimalRange) {
    // Two-sided optimization (plateau in middle)
    const [optLow, optHigh] = optimalRange;

    if (tempC < min) {
      return 0;
    } else if (tempC < optLow) {
      return ((tempC - min) / (optLow - min)) * 100;
    } else if (tempC <= optHigh) {
      return 100;
    } else if (tempC <= max) {
      return 100 - ((tempC - optHigh) / (max - optHigh)) * 100;
    } else {
      return 0;
    }
  } else if (optimal !== undefined) {
    // Single optimal point
    if (tempC <= optimal) {
      return ((tempC - min) / (optimal - min)) * 100;
    } else {
      return 100 - ((tempC - optimal) / (max - optimal)) * 100;
    }
  } else {
    // Linear normalization
    if (tempC <= min) return 0;
    if (tempC >= max) return 100;
    return ((tempC - min) / (max - min)) * 100;
  }
}

/**
 * Temperature feels-like adjustment (wind chill / heat index)
 */
export function calculateFeelsLike(
  tempC: number,
  windSpeedKmh: number,
  humidity: number
): number {
  if (tempC <= 10 && windSpeedKmh > 5) {
    // Wind chill (simplified)
    const windChillC = 13.12 + 0.6215 * tempC - 11.37 * Math.pow(windSpeedKmh, 0.16) +
                       0.3965 * tempC * Math.pow(windSpeedKmh, 0.16);
    return windChillC;
  } else if (tempC >= 27 && humidity > 40) {
    // Heat index (simplified)
    const heatIndexC = tempC + 0.5555 * ((humidity / 100 * 6.112 * Math.exp(17.67 * tempC / (tempC + 243.5))) - 10);
    return heatIndexC;
  } else {
    return tempC;
  }
}
