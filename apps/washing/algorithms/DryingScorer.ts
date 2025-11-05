/**
 * DryingScorer - Laundry Drying Algorithm Implementation
 *
 * Extends WeatherScorer to implement the DryCast algorithm for laundry drying.
 * Uses VPD-driven 9-factor scoring optimized for UK/Ireland climates.
 *
 * Key Features:
 * - Vapor Pressure Deficit (VPD) as primary drying indicator
 * - Coastal intelligence for wind/humidity modifiers
 * - Physics-based component scoring
 * - 2+ hour continuous window detection
 *
 * Usage:
 * ```typescript
 * const scorer = new DryingScorer();
 * const result = scorer.scoreHour(weatherData, location);
 * const recommendation = scorer.generateRecommendation(hourlyScores, location);
 * ```
 */

import {
  WeatherScorer,
  HourlyWeatherData,
  Location,
  ScoringResult,
  DecisionThresholds,
  ComponentScores,
  // Normalization functions
  normalizeVaporPressureDeficit,
  normalizeDryingTemperature,
  normalizeDewPointSpread,
  normalizeDryingWindSpeed,
  normalizeShortwaveRadiation,
  normalizeWetBulbTemperature,
  normalizeEvapotranspiration,
  normalizeSunshineDuration,
} from '@weather-apps/core-algorithm';

import { DRYING_ALGORITHM_CONFIG, VPD_RANGES, WIND_RANGES, TEMPERATURE_RANGES, RADIATION_RANGES, EVAPOTRANSPIRATION_RANGES } from './drying-config';

/**
 * DryingScorer - Implements DryCast laundry drying algorithm
 */
export class DryingScorer extends WeatherScorer {
  constructor() {
    super(DRYING_ALGORITHM_CONFIG);
  }

  /**
   * Score a single hour of weather data for drying conditions
   *
   * Implements the 9-factor VPD-driven DryCast algorithm:
   * 1. Vapor Pressure Deficit (30%) - Direct drying potential
   * 2. Wind Speed (20%) - Evaporation acceleration
   * 3. Wet Bulb Temperature (10%) - Evaporative cooling
   * 4. Sunshine Duration (9%) - Actual sun exposure
   * 5. Temperature (8%) - Warmth factor
   * 6. Shortwave Radiation (8%) - Solar energy
   * 7. Evapotranspiration (5%) - Real evaporation rates
   * 8. Wind Direction (5%) - Shelter/exposure (handled by base class modifiers)
   * 9. Dew Point Spread (5%) - Condensation risk
   */
  public scoreHour(data: HourlyWeatherData, location: Location): ScoringResult {
    // 1. Check disqualification rules first
    const disqualification = this.checkDisqualification(data);

    // If hard disqualified, return zero score
    if (disqualification.disqualified) {
      return {
        timestamp: data.time,
        overallScore: 0,
        componentScores: this.getZeroScores(),
        modifiers: {},
        disqualified: true,
        disqualificationReasons: disqualification.reasons,
        weatherData: data,
      };
    }

    // 2. Calculate component scores (0-100 each)
    const componentScores: ComponentScores = this.calculateComponentScores(data);

    // 3. Apply weights to get base score
    const baseScore = this.applyWeights(componentScores);

    // 4. Apply location modifiers (coastal, wind, topographic)
    const modifiedScore = this.applyLocationModifiers(baseScore, location, data);

    // 5. Apply soft disqualification penalties
    const finalScore = Math.max(0, modifiedScore - disqualification.penalty);

    // 6. Calculate modifiers for transparency
    const modifiers = this.calculateModifiers(baseScore, modifiedScore, location, data);

    return {
      timestamp: data.time,
      overallScore: Math.round(finalScore),
      componentScores,
      modifiers,
      disqualified: false,
      disqualificationReasons: disqualification.reasons, // soft penalties
      weatherData: data,
    };
  }

  /**
   * Get decision thresholds for laundry drying
   */
  public getDecisionThresholds(): DecisionThresholds {
    return this.config.thresholds;
  }

  /**
   * Calculate individual component scores (0-100)
   */
  private calculateComponentScores(data: HourlyWeatherData): ComponentScores {
    const scores: ComponentScores = {};

    // 1. Vapor Pressure Deficit (VPD) - 30% weight
    // Most important factor - direct measure of air's "thirst" for moisture
    if (data.vaporPressureDeficit !== undefined) {
      scores.vaporPressureDeficit = this.scoreVaporPressureDeficit(data.vaporPressureDeficit);
    } else {
      // Fallback: estimate from relative humidity
      scores.vaporPressureDeficit = Math.max(0, 100 - data.humidity);
    }

    // 2. Wind Speed - 20% weight
    // Accelerates evaporation exponentially
    scores.windSpeed = this.scoreWindSpeed(data.windSpeed);

    // 3. Wet Bulb Temperature - 10% weight
    // More accurate than regular temperature for evaporative potential
    if (data.wetBulbTemperature !== undefined) {
      scores.wetBulbTemperature = this.scoreWetBulbTemperature(data.temperature, data.wetBulbTemperature);
    } else {
      // Fallback to regular temperature
      scores.wetBulbTemperature = this.scoreTemperature(data.temperature);
    }

    // 4. Sunshine Duration - 9% weight
    // Actual sun exposure (not just estimated from cloud cover)
    if (data.sunshineDuration !== undefined) {
      scores.sunshineDuration = this.scoreSunshineDuration(data.sunshineDuration);
    } else {
      // Fallback to shortwave radiation estimate
      scores.sunshineDuration = data.shortwaveRadiation
        ? this.scoreShortwaveRadiation(data.shortwaveRadiation)
        : 100 - data.cloudCover;
    }

    // 5. Temperature - 8% weight
    // Warmth helps, but wet bulb is more accurate
    scores.temperature = this.scoreTemperature(data.temperature);

    // 6. Shortwave Radiation - 8% weight
    // Real solar energy measurement
    if (data.shortwaveRadiation !== undefined) {
      scores.shortwaveRadiation = this.scoreShortwaveRadiation(data.shortwaveRadiation);
    } else {
      // Fallback to cloud cover estimate
      scores.shortwaveRadiation = 100 - data.cloudCover;
    }

    // 7. Evapotranspiration - 5% weight
    // Cross-validation with real evaporation rates
    if (data.evapotranspiration !== undefined) {
      scores.evapotranspiration = this.scoreEvapotranspiration(data.evapotranspiration);
    } else {
      // Fallback to average of VPD, temp, and wind
      scores.evapotranspiration = (
        scores.vaporPressureDeficit +
        scores.temperature +
        scores.windSpeed
      ) / 3;
    }

    // 8. Wind Direction - 5% weight
    // Handled by applyLocationModifiers() in base class
    // This is a placeholder score for the weight calculation
    scores.windDirection = 100; // Neutral - modified by location

    // 9. Dew Point Spread - 5% weight
    // Condensation risk indicator
    const dewPointSpread = data.temperature - data.dewPoint;
    scores.dewPointSpread = this.scoreDewPointSpread(dewPointSpread);

    return scores;
  }

  /**
   * Score Vapor Pressure Deficit (0-100)
   *
   * VPD is THE key metric for drying - it measures how much more
   * moisture the air can hold. Higher VPD = drier air = faster drying.
   *
   * Ranges (kPa):
   * - < 0.2: Very poor (saturated air)
   * - 0.5-1.5: Good drying
   * - > 1.5: Excellent (air is very "thirsty")
   */
  private scoreVaporPressureDeficit(vpd: number): number {
    if (vpd < VPD_RANGES.poor) {
      return 0; // Too humid for effective drying
    }

    // Use library's normalization function (has built-in ranges)
    return normalizeVaporPressureDeficit(vpd);
  }

  /**
   * Score Wind Speed (0-100)
   *
   * Wind accelerates evaporation by:
   * 1. Removing moisture-laden air from fabric surface
   * 2. Bringing fresh dry air to the fabric
   *
   * Too little = stagnant air, too much = washing blows away
   */
  private scoreWindSpeed(windSpeed: number): number {
    if (windSpeed <= WIND_RANGES.calm) {
      return 10; // Very calm, minimal drying
    }

    // Use library's normalization function (has built-in ranges)
    return normalizeDryingWindSpeed(windSpeed);
  }

  /**
   * Score Wet Bulb Temperature (0-100)
   *
   * Wet bulb temperature is the temperature a fabric surface reaches
   * when evaporating water. Larger difference from air temp = more
   * evaporative potential.
   */
  private scoreWetBulbTemperature(airTemp: number, wetBulb: number): number {
    // The library function expects just the wet bulb value directly
    // Lower wet bulb = more evaporative potential
    return normalizeWetBulbTemperature(wetBulb);
  }

  /**
   * Score Temperature (0-100)
   *
   * Warmer air can hold more moisture, but wet bulb is more accurate.
   * This is a secondary factor.
   */
  private scoreTemperature(temperature: number): number {
    if (temperature < TEMPERATURE_RANGES.freezing) {
      return 0; // Ice formation risk
    }

    // Use library's normalization function (has built-in ranges)
    return normalizeDryingTemperature(temperature);
  }

  /**
   * Score Shortwave Radiation (0-100)
   *
   * Direct solar energy measurement. Sun provides:
   * 1. Heat energy for evaporation
   * 2. UV helps break down water-fabric bonds
   */
  private scoreShortwaveRadiation(radiation: number): number {
    if (radiation < RADIATION_RANGES.poor) {
      return 0; // Night or very overcast
    }

    // Use library's normalization function (has built-in ranges)
    return normalizeShortwaveRadiation(radiation);
  }

  /**
   * Score Sunshine Duration (0-100)
   *
   * Actual sunshine time (not just estimated from cloud cover).
   * More accurate than cloud cover percentage.
   */
  private scoreSunshineDuration(duration: number): number {
    if (duration < 0.1) {
      return 0; // No meaningful sunshine
    }

    // Use library's normalization function (has built-in ranges)
    return normalizeSunshineDuration(duration);
  }

  /**
   * Score Evapotranspiration (0-100)
   *
   * ET0 is reference evapotranspiration - a standardized measure
   * of how much water evaporates from a reference surface.
   * This cross-validates our other metrics.
   */
  private scoreEvapotranspiration(et0: number): number {
    if (et0 < EVAPOTRANSPIRATION_RANGES.poor) {
      return 20; // Low evaporation = poor drying
    }

    // Use library's normalization function (has built-in ranges)
    return normalizeEvapotranspiration(et0);
  }

  /**
   * Score Dew Point Spread (0-100)
   *
   * Difference between temperature and dew point.
   * Small spread = high condensation risk.
   */
  private scoreDewPointSpread(spread: number): number {
    if (spread < 1) {
      return 0; // Condensation risk
    }

    // Use library's normalization function (has built-in ranges)
    return normalizeDewPointSpread(spread);
  }

  /**
   * Get zero scores for disqualified hours
   */
  private getZeroScores(): ComponentScores {
    return {
      vaporPressureDeficit: 0,
      windSpeed: 0,
      wetBulbTemperature: 0,
      sunshineDuration: 0,
      temperature: 0,
      shortwaveRadiation: 0,
      evapotranspiration: 0,
      windDirection: 0,
      dewPointSpread: 0,
    };
  }

  /**
   * Calculate modifiers for transparency
   */
  private calculateModifiers(
    baseScore: number,
    modifiedScore: number,
    location: Location,
    data: HourlyWeatherData
  ): { [key: string]: number } {
    const modifiers: { [key: string]: number } = {};

    // Calculate total modifier from base to modified
    if (baseScore > 0) {
      const totalModifier = ((modifiedScore - baseScore) / baseScore) * 100;
      modifiers.total = totalModifier;
    }

    // Coastal modifier (if applicable)
    if (location.coastalDistance !== undefined) {
      modifiers.coastal = this.coastalIntelligence.getWindToleranceModifier(
        location.coastalDistance,
        data.windSpeed
      );
    }

    return modifiers;
  }
}

/**
 * Export convenience instance
 */
export const dryingScorer = new DryingScorer();
