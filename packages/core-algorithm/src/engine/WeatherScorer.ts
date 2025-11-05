/**
 * WeatherScorer - Abstract Base Class
 *
 * This is the CORE of the shared algorithm architecture.
 * Extend this class to create domain-specific scorers (drying, burning, etc.).
 *
 * RESPONSIBILITIES:
 * - Define scoring interface (abstract methods)
 * - Provide shared window detection logic
 * - Apply location-based modifiers (coastal, wind, topographic)
 * - Generate final recommendations
 *
 * EXTENSION PATTERN:
 * 1. Extend this class
 * 2. Implement scoreHour() with your component weights
 * 3. Implement getDecisionThresholds() for your use case
 * 4. Optionally override applyLocationModifiers() for custom logic
 *
 * @example
 * ```typescript
 * class DryingScorer extends WeatherScorer {
 *   protected scoreHour(data: HourlyWeatherData): ScoringResult {
 *     const vpd = this.scoreVaporPressureDeficit(data);
 *     const wind = this.scoreWind(data);
 *     const sunshine = this.scoreSunshine(data);
 *     // ... combine with weights
 *   }
 * }
 * ```
 */

import {
  HourlyWeatherData,
  Location,
  ScoringResult,
  DecisionThresholds,
  AlgorithmConfig,
  Recommendation,
  TimeWindow,
  WindowDetectionOptions,
  IWeatherScorer,
  ComponentScores,
} from '../types';
import { WindowDetector } from './WindowDetector';
import { CoastalIntelligence } from './CoastalIntelligence';
import { WindAnalyzer } from './WindAnalyzer';

export abstract class WeatherScorer implements IWeatherScorer {
  protected config: AlgorithmConfig;
  protected windowDetector: WindowDetector;
  protected coastalIntelligence: CoastalIntelligence;
  protected windAnalyzer: WindAnalyzer;

  constructor(config: AlgorithmConfig) {
    this.config = config;
    this.windowDetector = new WindowDetector();
    this.coastalIntelligence = new CoastalIntelligence();
    this.windAnalyzer = new WindAnalyzer();

    this.validateConfig(config);
  }

  /**
   * Validate algorithm configuration
   */
  private validateConfig(config: AlgorithmConfig): void {
    // Check weights sum to 1.0 (with tolerance for floating point)
    const weightSum = Object.values(config.weights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(weightSum - 1.0) > 0.01) {
      throw new Error(
        `Algorithm weights must sum to 1.0, got ${weightSum}. ` +
        `Weights: ${JSON.stringify(config.weights)}`
      );
    }

    // Validate thresholds are in order
    const { excellent, acceptable, poor } = config.thresholds;
    if (excellent <= acceptable || acceptable <= poor) {
      throw new Error(
        `Thresholds must be in descending order: excellent > acceptable > poor. ` +
        `Got: excellent=${excellent}, acceptable=${acceptable}, poor=${poor}`
      );
    }

    // Validate min window duration
    if (config.thresholds.minWindowDuration < 1) {
      throw new Error('Minimum window duration must be at least 1 hour');
    }
  }

  /**
   * ABSTRACT: Score a single hour of weather data
   *
   * Implementations must:
   * 1. Calculate component scores (0-100 each)
   * 2. Apply weights from config
   * 3. Check disqualification rules
   * 4. Return complete ScoringResult
   */
  abstract scoreHour(data: HourlyWeatherData, location: Location): ScoringResult;

  /**
   * ABSTRACT: Get decision thresholds
   *
   * Define what scores mean "excellent", "acceptable", "poor" for your domain
   */
  abstract getDecisionThresholds(): DecisionThresholds;

  /**
   * Get algorithm configuration
   */
  public getConfig(): AlgorithmConfig {
    return this.config;
  }

  /**
   * SHARED: Find optimal time windows in scored data
   *
   * This is the same for all algorithms - we're finding continuous periods
   * where conditions meet a certain threshold.
   */
  public findOptimalWindows(
    hourlyScores: ScoringResult[],
    options?: WindowDetectionOptions
  ): TimeWindow[] {
    const thresholds = this.getDecisionThresholds();

    const defaultOptions: WindowDetectionOptions = {
      minDuration: this.config.thresholds.minWindowDuration,
      minScore: thresholds.acceptable,
      maxGap: 1, // allow 1-hour gaps
      requireContinuous: false,
    };

    return this.windowDetector.findWindows(
      hourlyScores,
      { ...defaultOptions, ...options }
    );
  }

  /**
   * SHARED: Apply location-based modifiers to a score
   *
   * Adjusts raw score based on:
   * - Coastal distance (wind tolerance)
   * - Wind direction and shelter
   * - Urban vs rural exposure
   *
   * Override this if you need custom location logic.
   */
  public applyLocationModifiers(
    score: number,
    location: Location,
    weatherData: HourlyWeatherData
  ): number {
    let modifiedScore = score;
    const modifiers: { [key: string]: number } = {};

    // Coastal intelligence (if enabled)
    if (this.config.features.coastalIntelligence && location.coastalDistance !== undefined) {
      const coastalModifier = this.coastalIntelligence.getWindToleranceModifier(
        location.coastalDistance,
        weatherData.windSpeed
      );
      modifiers.coastal = coastalModifier;
      modifiedScore *= 1 + (coastalModifier / 100);
    }

    // Wind analysis (if enabled)
    if (this.config.features.windAnalysis) {
      const windAnalysis = this.windAnalyzer.analyzeWind(
        weatherData.windSpeed,
        weatherData.windDirection,
        location
      );
      modifiers.wind = windAnalysis.score - 50; // convert to modifier (-50 to +50)
      modifiedScore *= 1 + (modifiers.wind / 100);
    }

    // Topographic adjustments (if enabled)
    if (this.config.features.topographicAdjustments && location.shelterFactor !== undefined) {
      const topoModifier = (location.shelterFactor - 0.5) * 20; // -10 to +10
      modifiers.topographic = topoModifier;
      modifiedScore *= 1 + (topoModifier / 100);
    }

    // Clamp to 0-100 range
    return Math.max(0, Math.min(100, modifiedScore));
  }

  /**
   * SHARED: Generate final recommendation from hourly scores
   *
   * Combines all data into a user-facing recommendation with:
   * - Decision category (excellent/acceptable/poor)
   * - Best time windows
   * - Current conditions
   * - Warnings and tips
   */
  public generateRecommendation(
    hourlyScores: ScoringResult[],
    location: Location
  ): Recommendation {
    if (hourlyScores.length === 0) {
      throw new Error('Cannot generate recommendation from empty hourly scores');
    }

    const thresholds = this.getDecisionThresholds();
    const currentHour = hourlyScores[0]!;
    const optimalWindows = this.findOptimalWindows(hourlyScores);

    // Find best window
    const bestWindow = optimalWindows.length > 0
      ? optimalWindows.reduce((best, window) =>
          window.averageScore > best.averageScore ? window : best
        )
      : null;

    // Determine decision category
    const currentScore = currentHour.overallScore;
    let decision: 'excellent' | 'acceptable' | 'poor';
    let label: string;

    if (currentScore >= thresholds.excellent) {
      decision = 'excellent';
      label = thresholds.labels.excellent;
    } else if (currentScore >= thresholds.acceptable) {
      decision = 'acceptable';
      label = thresholds.labels.acceptable;
    } else {
      decision = 'poor';
      label = thresholds.labels.poor;
    }

    // Calculate confidence based on:
    // 1. Score consistency across windows
    // 2. Number of optimal windows
    // 3. Weather certainty metrics
    const confidence = this.calculateConfidence(hourlyScores, optimalWindows);

    // Generate summary
    const summary = this.generateSummary(decision, currentScore, bestWindow, optimalWindows);

    // Collect warnings
    const warnings = this.collectWarnings(hourlyScores, location);

    // Generate tips
    const tips = this.generateTips(decision, bestWindow, optimalWindows);

    // Calculate validity period (typically until next forecast update)
    const validUntil = new Date(
      new Date(currentHour.timestamp).getTime() + 10 * 60 * 1000 // 10 minutes
    ).toISOString();

    return {
      decision,
      label,
      confidence,
      currentScore,
      currentHour,
      optimalWindows,
      bestWindow,
      summary,
      warnings,
      tips,
      hourlyScores,
      location,
      generatedAt: new Date().toISOString(),
      validUntil,
    };
  }

  /**
   * Calculate recommendation confidence (0-1)
   */
  protected calculateConfidence(
    hourlyScores: ScoringResult[],
    optimalWindows: TimeWindow[]
  ): number {
    let confidence = 0.5; // baseline

    // Boost confidence if we have multiple optimal windows
    if (optimalWindows.length > 0) {
      confidence += Math.min(optimalWindows.length * 0.1, 0.3);
    }

    // Boost confidence if scores are consistent
    const scores = hourlyScores.map(h => h.overallScore);
    const stdDev = this.calculateStdDev(scores);
    const consistencyBonus = Math.max(0, (20 - stdDev) / 20) * 0.2;
    confidence += consistencyBonus;

    // Reduce confidence if many hours are disqualified
    const disqualifiedCount = hourlyScores.filter(h => h.disqualified).length;
    const disqualificationPenalty = (disqualifiedCount / hourlyScores.length) * 0.2;
    confidence -= disqualificationPenalty;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate human-readable summary
   */
  protected generateSummary(
    decision: 'excellent' | 'acceptable' | 'poor',
    currentScore: number,
    bestWindow: TimeWindow | null,
    allWindows: TimeWindow[]
  ): string {
    const parts: string[] = [];

    parts.push(`Current conditions score: ${currentScore.toFixed(0)}/100 (${decision}).`);

    if (bestWindow) {
      const startTime = new Date(bestWindow.start).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const endTime = new Date(bestWindow.end).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
      parts.push(
        `Best window: ${startTime}-${endTime} (${bestWindow.durationHours.toFixed(1)}h, ` +
        `avg score ${bestWindow.averageScore.toFixed(0)}).`
      );
    }

    if (allWindows.length > 1) {
      parts.push(`${allWindows.length} optimal windows found in next 72 hours.`);
    } else if (allWindows.length === 0) {
      parts.push('No optimal windows found in next 72 hours.');
    }

    return parts.join(' ');
  }

  /**
   * Collect warnings from scored data
   */
  protected collectWarnings(hourlyScores: ScoringResult[], _location: Location): string[] {
    const warnings: string[] = [];

    // Check for common disqualification reasons
    const allReasons = hourlyScores.flatMap(h => h.disqualificationReasons);
    const uniqueReasons = [...new Set(allReasons)];

    if (uniqueReasons.includes('Rain detected')) {
      warnings.push('Rain expected in forecast period');
    }
    if (uniqueReasons.includes('High condensation risk')) {
      warnings.push('High humidity may affect conditions');
    }

    // Check for extreme conditions
    const maxWind = Math.max(...hourlyScores.map(h => h.weatherData.windSpeed));
    if (maxWind > 40) {
      warnings.push(`Strong winds expected (up to ${maxWind.toFixed(0)} km/h)`);
    }

    return warnings;
  }

  /**
   * Generate tips for the user
   */
  protected generateTips(
    decision: 'excellent' | 'acceptable' | 'poor',
    bestWindow: TimeWindow | null,
    allWindows: TimeWindow[]
  ): string[] {
    const tips: string[] = [];

    if (decision === 'poor' && bestWindow) {
      tips.push(`Wait until ${new Date(bestWindow.start).toLocaleTimeString('en-GB')} for better conditions`);
    }

    if (allWindows.length > 1) {
      tips.push('Multiple good windows available - choose based on your schedule');
    }

    if (bestWindow && bestWindow.durationHours < 3) {
      tips.push('Window is short - be ready to act quickly');
    }

    return tips;
  }

  /**
   * Calculate standard deviation
   */
  protected calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Helper: Check disqualification rules
   */
  protected checkDisqualification(data: HourlyWeatherData): {
    disqualified: boolean;
    reasons: string[];
    penalty: number;
  } {
    const reasons: string[] = [];
    let penalty = 0;
    let hardDisqualification = false;

    for (const rule of this.config.disqualificationRules) {
      if (rule.condition(data)) {
        reasons.push(rule.reason);

        if (rule.severity === 'hard') {
          hardDisqualification = true;
        } else {
          penalty += rule.penalty || 0;
        }
      }
    }

    return {
      disqualified: hardDisqualification,
      reasons,
      penalty,
    };
  }

  /**
   * Helper: Apply component weights to scores
   */
  protected applyWeights(componentScores: ComponentScores): number {
    let weightedSum = 0;

    for (const [component, score] of Object.entries(componentScores)) {
      const weight = this.config.weights[component];
      if (weight === undefined) {
        console.warn(`No weight defined for component: ${component}`);
        continue;
      }
      weightedSum += score * weight;
    }

    return weightedSum;
  }

  /**
   * Helper: Normalize a value to 0-100 scale
   */
  protected normalize(
    value: number,
    min: number,
    max: number,
    optimal?: number
  ): number {
    if (value <= min) return 0;
    if (value >= max) return 100;

    if (optimal !== undefined) {
      // Two-sided normalization around an optimal point
      if (value <= optimal) {
        return ((value - min) / (optimal - min)) * 100;
      } else {
        return 100 - ((value - optimal) / (max - optimal)) * 100;
      }
    } else {
      // Linear normalization
      return ((value - min) / (max - min)) * 100;
    }
  }
}
