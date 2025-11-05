/**
 * Radiation Normalization Functions
 *
 * Normalize solar radiation and sunshine-related parameters.
 */

/**
 * Normalize shortwave radiation (solar irradiance)
 *
 * Typical ranges:
 * - Night: 0 W/m²
 * - Overcast day: 100-300 W/m²
 * - Partly cloudy: 300-600 W/m²
 * - Clear sky: 600-1000 W/m²
 * - Peak summer: 1000+ W/m²
 */
export function normalizeShortwaveRadiation(radiationWm2: number): number {
  if (radiationWm2 <= 0) {
    return 0; // Night
  } else if (radiationWm2 <= 300) {
    return radiationWm2 / 3; // 0-100 score
  } else if (radiationWm2 <= 600) {
    return 100 + (radiationWm2 - 300) / 6; // 100-150 score (capped at 100 in return)
  } else {
    return 100; // Excellent sunshine
  }
}

/**
 * Normalize sunshine duration (hours per day)
 *
 * @param durationHours - Actual sunshine hours
 * @param maxPossible - Maximum possible for this location/date
 */
export function normalizeSunshineDuration(
  durationHours: number,
  maxPossible?: number
): number {
  if (maxPossible) {
    // Normalize as percentage of possible sunshine
    return Math.min(100, (durationHours / maxPossible) * 100);
  } else {
    // Assume 12 hours as typical maximum
    return Math.min(100, (durationHours / 12) * 100);
  }
}

/**
 * Normalize UV index
 *
 * 0-2: Low
 * 3-5: Moderate
 * 6-7: High
 * 8-10: Very High
 * 11+: Extreme
 */
export function normalizeUVIndex(uvIndex: number): number {
  if (uvIndex <= 2) {
    return uvIndex * 20; // 0-40 score (low UV)
  } else if (uvIndex <= 5) {
    return 40 + (uvIndex - 2) * 13.3; // 40-80 score
  } else if (uvIndex <= 7) {
    return 80 + (uvIndex - 5) * 10; // 80-100 score
  } else {
    return 100; // Maximum score (very strong sun)
  }
}

/**
 * Normalize cloud cover (inverted for sunshine)
 *
 * @param cloudCoverPercent - Cloud cover 0-100%
 * @param inverted - If true, less clouds = higher score (default)
 */
export function normalizeCloudCover(
  cloudCoverPercent: number,
  inverted = true
): number {
  if (inverted) {
    // Less clouds = better for drying/sunshine
    return 100 - cloudCoverPercent;
  } else {
    // More clouds = better (shade applications)
    return cloudCoverPercent;
  }
}

/**
 * Calculate clear sky index
 *
 * Ratio of actual radiation to theoretical clear sky radiation
 * Indicates how clear the sky actually is
 */
export function calculateClearSkyIndex(
  actualRadiation: number,
  clearSkyRadiation: number
): number {
  if (clearSkyRadiation === 0) return 0;
  return Math.min(1, actualRadiation / clearSkyRadiation);
}

/**
 * Estimate clear sky radiation for location and time
 *
 * Simplified model - for accurate calculations use solar position algorithms
 */
export function estimateClearSkyRadiation(
  latitude: number,
  dayOfYear: number,
  hourOfDay: number
): number {
  // Solar constant
  const SOLAR_CONSTANT = 1361; // W/m²

  // Solar declination (simplified)
  const declination = 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81)) * (Math.PI / 180));

  // Hour angle
  const hourAngle = (hourOfDay - 12) * 15; // degrees

  // Solar elevation angle
  const latRad = latitude * (Math.PI / 180);
  const declRad = declination * (Math.PI / 180);
  const hourRad = hourAngle * (Math.PI / 180);

  const sinElevation =
    Math.sin(latRad) * Math.sin(declRad) +
    Math.cos(latRad) * Math.cos(declRad) * Math.cos(hourRad);

  if (sinElevation <= 0) return 0; // Sun below horizon

  // Air mass (simplified)
  const airMass = 1 / sinElevation;

  // Atmospheric transmission (typical clear sky)
  const transmission = Math.pow(0.7, Math.pow(airMass, 0.678));

  // Clear sky radiation
  return SOLAR_CONSTANT * sinElevation * transmission;
}

/**
 * Normalize evapotranspiration (reference ET0)
 *
 * Higher ET0 = more evaporation potential = better drying
 *
 * Typical ranges:
 * - Low: 0-2 mm/day
 * - Moderate: 2-5 mm/day
 * - High: 5-8 mm/day
 * - Very high: >8 mm/day
 */
export function normalizeEvapotranspiration(et0mm: number): number {
  if (et0mm <= 2) {
    return et0mm * 25; // 0-50 score
  } else if (et0mm <= 5) {
    return 50 + (et0mm - 2) * 16.7; // 50-100 score
  } else {
    return 100; // Maximum (excellent evaporation)
  }
}

/**
 * Calculate photosynthetically active radiation (PAR)
 *
 * PAR is roughly 45-50% of solar radiation
 */
export function calculatePAR(solarRadiation: number): number {
  return solarRadiation * 0.475; // W/m²
}

/**
 * Classify sunshine conditions
 */
export function classifySunshine(radiationWm2: number): {
  category: string;
  description: string;
  dryingPotential: 'excellent' | 'good' | 'moderate' | 'poor';
} {
  if (radiationWm2 < 100) {
    return {
      category: 'Overcast/Night',
      description: 'Minimal solar radiation',
      dryingPotential: 'poor',
    };
  } else if (radiationWm2 < 300) {
    return {
      category: 'Mostly Cloudy',
      description: 'Weak sunshine',
      dryingPotential: 'moderate',
    };
  } else if (radiationWm2 < 600) {
    return {
      category: 'Partly Cloudy',
      description: 'Intermittent sunshine',
      dryingPotential: 'good',
    };
  } else {
    return {
      category: 'Sunny',
      description: 'Strong sunshine',
      dryingPotential: 'excellent',
    };
  }
}

/**
 * Calculate day length from sunrise/sunset
 */
export function calculateDayLength(sunrise: Date, sunset: Date): number {
  return (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60);
}

/**
 * Estimate sunrise time (simplified)
 */
export function estimateSunrise(
  latitude: number,
  dayOfYear: number,
  timezone: number
): Date {
  // Simplified calculation - use actual astronomy library for accuracy
  const declination = 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81)) * (Math.PI / 180));
  const latRad = latitude * (Math.PI / 180);
  const declRad = declination * (Math.PI / 180);

  const hourAngle = Math.acos(-Math.tan(latRad) * Math.tan(declRad)) * (180 / Math.PI);
  const sunriseHour = 12 - hourAngle / 15 - timezone;

  const date = new Date();
  date.setHours(Math.floor(sunriseHour));
  date.setMinutes((sunriseHour % 1) * 60);

  return date;
}
