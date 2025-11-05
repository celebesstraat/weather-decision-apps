/**
 * BurningScorer - Woodburner Ignition Algorithm Implementation
 *
 * Extends WeatherScorer to implement the FlameCast algorithm for woodburner ignition.
 * Uses temperature differential as primary factor with atmospheric stability as secondary.
 *
 * Key Features:
 * - Temperature differential (ΔT = Indoor - Outdoor) as stack effect driver
 * - Atmospheric pressure for air density and buoyancy
 * - Humidity for ignition difficulty and condensation risk
 * - Physics-based component scoring for UK/Ireland chimney conditions
 *
 * Usage:
 * ```typescript
 * const scorer = new BurningScorer();
 * const result = scorer.scoreHour(weatherData, location, { indoorTemp: 18, month: 1 });
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
} from '@weather-apps/core-algorithm';

import {
  BURNING_ALGORITHM_CONFIG,
  TEMPERATURE_DIFFERENTIAL_RANGES,
  PRESSURE_RANGES,
  HUMIDITY_RANGES,
  WIND_RANGES,
  PRECIPITATION_RANGES,
  getIndoorTemp,
} from './burning-config';

/**
 * Extended context for burning conditions
 * Includes indoor temperature and month for seasonal adjustments
 */
export interface BurningContext {
  indoorTemp?: number;  // User override for indoor temperature
  month?: number;       // Month (1-12) for seasonal indoor temp profiles
  hour?: number;        // Hour (0-23) for time-of-day indoor temp profiles
}

/**
 * BurningScorer - Implements FlameCast woodburner algorithm
 */
export class BurningScorer extends WeatherScorer {
  constructor() {
    super(BURNING_ALGORITHM_CONFIG);
  }

  /**
   * Score a single hour of weather data for burning conditions
   *
   * Implements the 5-factor temperature differential-driven FlameCast algorithm:
   * 1. Temperature Differential (50%) - Stack effect (Indoor - Outdoor)
   * 2. Atmospheric Pressure (15%) - Air density and buoyancy
   * 3. Humidity (15%) - Ignition ease and condensation risk
   * 4. Wind Speed (10%) - Smoke dispersal and draft
   * 5. Precipitation (10%) - Chimney cooling and moisture
   *
   * @param data - Hourly weather data
   * @param location - Location information (not heavily used for indoor activity)
   * @param context - Burning-specific context (indoor temp, month, hour)
   */
  public scoreHour(
    data: HourlyWeatherData,
    location: Location,
    context?: BurningContext
  ): ScoringResult {
    // Determine indoor temperature and temperature differential
    const timestamp = new Date(data.time);
    const month = context?.month ?? timestamp.getMonth() + 1; // 0-indexed to 1-indexed
    const hour = context?.hour ?? timestamp.getHours();
    const indoorTemp = context?.indoorTemp ?? getIndoorTemp(hour, month);
    const outdoorTemp = data.temperature;
    const temperatureDifferential = indoorTemp - outdoorTemp;

    // 1. Check for critical temperature inversion FIRST
    if (temperatureDifferential < 0) {
      return {
        timestamp: data.time,
        overallScore: 0,
        componentScores: this.getZeroScores(),
        modifiers: { temperatureDifferential },
        disqualified: true,
        disqualificationReasons: ['Temperature inversion - SEVERE BACKDRAFT RISK'],
        weatherData: data,
      };
    }

    // 2. Check other disqualification rules
    const disqualification = this.checkDisqualification(data);

    // If hard disqualified, return zero score
    if (disqualification.disqualified) {
      return {
        timestamp: data.time,
        overallScore: 0,
        componentScores: this.getZeroScores(),
        modifiers: { temperatureDifferential },
        disqualified: true,
        disqualificationReasons: disqualification.reasons,
        weatherData: data,
      };
    }

    // 3. Calculate component scores (0-100 each)
    const componentScores: ComponentScores = this.calculateComponentScores(
      data,
      temperatureDifferential
    );

    // 4. Apply weights to get base score
    const baseScore = this.applyWeights(componentScores);

    // 5. Apply location modifiers (minimal for indoor activity)
    const modifiedScore = this.applyLocationModifiers(baseScore, location, data);

    // 6. Apply soft disqualification penalties
    const finalScore = Math.max(0, modifiedScore - disqualification.penalty);

    // 7. Calculate modifiers for transparency
    const modifiers = this.calculateModifiers(
      baseScore,
      modifiedScore,
      temperatureDifferential,
      indoorTemp,
      outdoorTemp
    );

    // 8. Check for warnings
    const warnings = this.collectHourlyWarnings(data, temperatureDifferential, month, hour);

    return {
      timestamp: data.time,
      overallScore: Math.round(finalScore),
      componentScores,
      modifiers,
      disqualified: false,
      disqualificationReasons: [...disqualification.reasons, ...warnings],
      weatherData: data,
    };
  }

  /**
   * Get decision thresholds for woodburner burning
   */
  public getDecisionThresholds(): DecisionThresholds {
    return this.config.thresholds;
  }

  /**
   * Calculate individual component scores (0-100)
   */
  private calculateComponentScores(
    data: HourlyWeatherData,
    temperatureDifferential: number
  ): ComponentScores {
    const scores: ComponentScores = {};

    // 1. Temperature Differential - 50% weight (MOST IMPORTANT)
    // Stack effect is the primary driver of chimney draft
    scores.temperatureDifferential = this.scoreTemperatureDifferential(temperatureDifferential);

    // 2. Atmospheric Pressure - 15% weight
    // Higher pressure = denser air = better draft
    scores.atmosphericPressure = this.scorePressure(data.pressure);

    // 3. Humidity - 15% weight
    // Lower humidity = easier ignition, less condensation
    scores.humidity = this.scoreHumidity(data.humidity);

    // 4. Wind Speed - 10% weight
    // Moderate wind helps smoke dispersal (assumes chimney cap)
    scores.windSpeed = this.scoreWindSpeed(data.windSpeed);

    // 5. Precipitation - 10% weight
    // Rain cools chimney and increases ambient humidity
    scores.precipitation = this.scorePrecipitation(data.precipitation);

    return scores;
  }

  /**
   * Score Temperature Differential (0-100)
   *
   * ΔT = Indoor - Outdoor temperature
   * The stack effect (buoyancy-driven draft) is proportional to ΔT.
   * Physics: ΔP ∝ H × (ρₒ - ρᵢ) × g, where ρ ∝ 1/T
   *
   * Scoring curve:
   * - ΔT < 0°C (inversion):   0 points (CRITICAL - backdraft)
   * - ΔT 0-2°C:              10 points (severe backdraft risk)
   * - ΔT 2-5°C:              30 points (very difficult)
   * - ΔT 5-10°C:             60 points (marginal)
   * - ΔT 10-15°C:            80 points (good)
   * - ΔT ≥ 15°C:            100 points (excellent)
   */
  private scoreTemperatureDifferential(deltaT: number): number {
    const { backdraft, veryDifficult, marginal, good, excellent } =
      TEMPERATURE_DIFFERENTIAL_RANGES;

    // Temperature inversion - CRITICAL (handled in scoreHour)
    if (deltaT < backdraft) {
      return 0;
    }

    // Severe backdraft risk (0-2°C)
    if (deltaT < veryDifficult) {
      return (deltaT / veryDifficult) * 10;
    }

    // Very difficult conditions (2-5°C)
    if (deltaT < marginal) {
      const range = marginal - veryDifficult;
      const offset = deltaT - veryDifficult;
      return 10 + (offset / range) * 20;
    }

    // Marginal conditions (5-10°C)
    if (deltaT < good) {
      const range = good - marginal;
      const offset = deltaT - marginal;
      return 30 + (offset / range) * 30;
    }

    // Good conditions (10-15°C)
    if (deltaT < excellent) {
      const range = excellent - good;
      const offset = deltaT - good;
      return 60 + (offset / range) * 20;
    }

    // Excellent conditions (≥15°C)
    // Asymptotic approach to 100
    const excessDelta = deltaT - excellent;
    const bonusScore = 20 * (1 - Math.exp(-excessDelta / 10));
    return Math.min(100, 80 + bonusScore);
  }

  /**
   * Score Atmospheric Pressure (0-100)
   *
   * High pressure = denser air = better buoyancy and draft.
   * Low pressure = less dense air = weaker draft.
   *
   * Ranges:
   * - <985 mb:       20 points (storm conditions)
   * - 985-995 mb:    40 points (deep low)
   * - 995-1005 mb:   60 points (low pressure)
   * - 1005-1015 mb:  75 points (moderate)
   * - 1015-1025 mb:  90 points (high pressure)
   * - ≥1025 mb:     100 points (very high - excellent)
   */
  private scorePressure(pressure: number): number {
    const { storm, low, moderate, good, excellent } = PRESSURE_RANGES;

    if (pressure < storm) {
      // Storm conditions: 0-20 points
      return Math.max(0, ((pressure - 960) / (storm - 960)) * 20);
    }

    if (pressure < low) {
      // Low pressure: 20-60 points
      return 20 + ((pressure - storm) / (low - storm)) * 40;
    }

    if (pressure < moderate) {
      // Moderate: 60-75 points
      return 60 + ((pressure - low) / (moderate - low)) * 15;
    }

    if (pressure < good) {
      // High: 75-90 points
      return 75 + ((pressure - moderate) / (good - moderate)) * 15;
    }

    if (pressure < excellent) {
      // Very high: 90-100 points
      return 90 + ((pressure - good) / (excellent - good)) * 10;
    }

    // Excellent (≥1025 mb)
    return 100;
  }

  /**
   * Score Humidity (0-100)
   *
   * High humidity:
   * - Makes ignition more difficult (moisture in air)
   * - Increases condensation risk in cold flue
   * - Reduces smoke visibility
   *
   * Ranges:
   * - >95%:    10 points (fog/mist - very difficult)
   * - 85-95%:  30 points (very damp)
   * - 75-85%:  50 points (damp)
   * - 65-75%:  70 points (moderate)
   * - 50-65%:  90 points (good)
   * - 40-50%: 100 points (optimal)
   * - <40%:    85 points (very dry)
   */
  private scoreHumidity(humidity: number): number {
    const { fog, veryDamp, damp, good, optimal } = HUMIDITY_RANGES;

    if (humidity > fog) {
      // Fog/mist: 0-10 points
      return Math.max(0, ((100 - humidity) / (100 - fog)) * 10);
    }

    if (humidity > veryDamp) {
      // Very damp: 10-30 points
      return 10 + ((fog - humidity) / (fog - veryDamp)) * 20;
    }

    if (humidity > damp) {
      // Damp: 30-50 points
      return 30 + ((veryDamp - humidity) / (veryDamp - damp)) * 20;
    }

    if (humidity > good) {
      // Moderate: 50-70 points
      return 50 + ((damp - humidity) / (damp - good)) * 20;
    }

    if (humidity > optimal.max) {
      // Good: 70-90 points
      return 70 + ((good - humidity) / (good - optimal.max)) * 20;
    }

    if (humidity >= optimal.min) {
      // Optimal: 90-100 points
      return 90 + ((optimal.max - humidity) / (optimal.max - optimal.min)) * 10;
    }

    // Very dry (<40%): slight penalty
    return Math.max(75, 85 - (optimal.min - humidity) * 0.5);
  }

  /**
   * Score Wind Speed (0-100)
   *
   * Assumes chimney cap is installed (standard UK practice).
   * Wind effects:
   * - Calm: Draft OK, but poor smoke dispersion
   * - Light-Moderate: Optimal (enhances draft, good dispersal)
   * - Fresh-Strong: Variable (can cause downdrafts)
   * - Gale: Problematic (safety concerns)
   *
   * Ranges:
   * - <3 km/h:     70 points (calm)
   * - 3-10 km/h:   85 points (light)
   * - 10-25 km/h: 100 points (moderate - optimal)
   * - 25-40 km/h:  90 points (fresh)
   * - 40-60 km/h:  60 points (strong)
   * - ≥60 km/h:    30 points (gale)
   */
  private scoreWindSpeed(windSpeed: number): number {
    const { calm, optimal, moderate, gale } = WIND_RANGES;

    if (windSpeed < calm) {
      // Calm: 60-70 points
      return 60 + (windSpeed / calm) * 10;
    }

    if (windSpeed < optimal.min) {
      // Light: 70-85 points
      return 70 + ((windSpeed - calm) / (optimal.min - calm)) * 15;
    }

    if (windSpeed <= optimal.max) {
      // Optimal: 85-100 points
      return 85 + ((windSpeed - optimal.min) / (optimal.max - optimal.min)) * 15;
    }

    if (windSpeed < moderate) {
      // Fresh: 100-90 points
      return 100 - ((windSpeed - optimal.max) / (moderate - optimal.max)) * 10;
    }

    if (windSpeed < gale) {
      // Strong: 90-60 points
      return 90 - ((windSpeed - moderate) / (gale - moderate)) * 30;
    }

    // Gale: 30-60 points
    return Math.max(20, 60 - ((windSpeed - gale) / 20) * 30);
  }

  /**
   * Score Precipitation (0-100)
   *
   * Rain affects:
   * - Chimney temperature (cooling)
   * - Ambient humidity (increased)
   * - Fuel moisture (if stored outside)
   *
   * Ranges:
   * - 0 mm:       100 points (dry)
   * - 0-1 mm:      90 points (light drizzle)
   * - 1-3 mm:      70 points (light rain)
   * - 3-7 mm:      50 points (moderate rain)
   * - ≥7 mm:       30 points (heavy rain)
   */
  private scorePrecipitation(precipitation: number): number {
    const { dry, lightDrizzle, lightRain, moderateRain } = PRECIPITATION_RANGES;

    if (precipitation === dry) {
      return 100;
    }

    if (precipitation < lightDrizzle) {
      // Light drizzle: 90-100 points
      return 100 - (precipitation / lightDrizzle) * 10;
    }

    if (precipitation < lightRain) {
      // Light rain: 70-90 points
      return 90 - ((precipitation - lightDrizzle) / (lightRain - lightDrizzle)) * 20;
    }

    if (precipitation < moderateRain) {
      // Moderate rain: 50-70 points
      return 70 - ((precipitation - lightRain) / (moderateRain - lightRain)) * 20;
    }

    // Heavy rain (≥7 mm): 30-50 points
    return Math.max(20, 50 - ((precipitation - moderateRain) / 10) * 20);
  }

  /**
   * Get zero scores for disqualified hours
   */
  private getZeroScores(): ComponentScores {
    return {
      temperatureDifferential: 0,
      atmosphericPressure: 0,
      humidity: 0,
      windSpeed: 0,
      precipitation: 0,
    };
  }

  /**
   * Calculate modifiers for transparency
   */
  private calculateModifiers(
    baseScore: number,
    modifiedScore: number,
    temperatureDifferential: number,
    indoorTemp: number,
    outdoorTemp: number
  ): { [key: string]: number } {
    const modifiers: { [key: string]: number } = {};

    // Temperature differential (for display purposes)
    modifiers.temperatureDifferential = temperatureDifferential;
    modifiers.indoorTemp = indoorTemp;
    modifiers.outdoorTemp = outdoorTemp;

    // Calculate total modifier from base to modified
    if (baseScore > 0) {
      const totalModifier = ((modifiedScore - baseScore) / baseScore) * 100;
      modifiers.total = totalModifier;
    }

    return modifiers;
  }

  /**
   * Collect warnings from weather conditions for a single hour
   */
  private collectHourlyWarnings(
    data: HourlyWeatherData,
    temperatureDifferential: number,
    month: number,
    hour: number
  ): string[] {
    const warnings: string[] = [];

    // Temperature inversion (already handled as hard disqualification)
    if (temperatureDifferential < 0) {
      warnings.push('TEMPERATURE_INVERSION');
    }

    // Summer chimney syndrome
    // (high pressure + calm winds + marginal ΔT in summer)
    const isSummer = month >= 6 && month <= 8;
    if (isSummer && data.pressure > 1020 && data.windSpeed < 5 && temperatureDifferential < 5) {
      warnings.push('SUMMER_CHIMNEY_SYNDROME');
    }

    // Cold chimney morning
    // (early morning with marginal ΔT)
    if (hour >= 6 && hour < 9 && temperatureDifferential < 8) {
      warnings.push('COLD_CHIMNEY_MORNING');
    }

    // Very damp conditions
    if (data.humidity > 85 && temperatureDifferential < 10) {
      warnings.push('VERY_DAMP_CONDITIONS');
    }

    // Fog conditions
    if (data.humidity > 95) {
      warnings.push('FOG_CONDITIONS');
    }

    return warnings;
  }

  /**
   * Override collectWarnings to include burning-specific warnings
   */
  protected collectWarnings(hourlyScores: ScoringResult[], _location: Location): string[] {
    const warnings: string[] = [];

    // Check for common disqualification reasons
    const allReasons = hourlyScores.flatMap(h => h.disqualificationReasons);
    const uniqueReasons = Array.from(new Set(allReasons));

    if (uniqueReasons.includes('TEMPERATURE_INVERSION')) {
      warnings.push('SEVERE BACKDRAFT RISK: Outside temperature exceeds indoor temperature. Do not light stove.');
    }
    if (uniqueReasons.includes('SUMMER_CHIMNEY_SYNDROME')) {
      warnings.push('Summer chimney syndrome likely. Pre-warm chimney essential before attempting ignition.');
    }
    if (uniqueReasons.includes('COLD_CHIMNEY_MORNING')) {
      warnings.push('Cold chimney from overnight cooling. Use newspaper torch to pre-warm flue before lighting.');
    }
    if (uniqueReasons.includes('VERY_DAMP_CONDITIONS')) {
      warnings.push('Very damp conditions. Use only dry kindling (<15% moisture content).');
    }
    if (uniqueReasons.includes('FOG_CONDITIONS')) {
      warnings.push('Fog/mist present. Expect difficult ignition and poor smoke dispersion.');
    }

    return warnings;
  }

  /**
   * Override generateTips to provide burning-specific tips
   */
  protected generateTips(
    decision: 'excellent' | 'acceptable' | 'poor',
    bestWindow: any | null,
    allWindows: any[]
  ): string[] {
    const tips: string[] = [];

    if (decision === 'excellent') {
      tips.push('Excellent draft conditions - standard ignition procedure will work');
    } else if (decision === 'acceptable') {
      tips.push('Good conditions - ensure chimney is clean and use dry kindling');
    } else if (decision === 'poor') {
      tips.push('Marginal conditions - pre-warm chimney with newspaper torch before lighting');
      tips.push('Use very dry kindling (<15% moisture) and fire starter blocks');
    }

    if (decision === 'poor' && bestWindow) {
      tips.push(`Wait until ${new Date(bestWindow.start).toLocaleTimeString('en-GB')} for better conditions`);
    }

    if (allWindows.length > 1) {
      tips.push('Multiple good windows available - choose based on your schedule');
    }

    return tips;
  }
}

/**
 * Export convenience instance
 */
export const burningScorer = new BurningScorer();
