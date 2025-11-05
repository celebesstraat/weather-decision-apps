/**
 * Core Algorithm Types
 *
 * Shared type definitions for weather algorithm engine.
 * These types form the contract between the abstract engine and concrete implementations.
 */

/**
 * Hourly weather data structure from weather API
 */
export interface HourlyWeatherData {
  time: string;
  temperature: number; // °C
  humidity: number; // %
  dewPoint: number; // °C
  windSpeed: number; // km/h
  windDirection: number; // degrees
  pressure: number; // hPa
  cloudCover: number; // %
  precipitation: number; // mm
  precipitationProbability: number; // %
  uvIndex: number; // 0-11+
  visibility: number; // km

  // Advanced metrics
  vaporPressureDeficit?: number; // kPa
  wetBulbTemperature?: number; // °C
  sunshineDuration?: number; // hours
  shortwaveRadiation?: number; // W/m²
  evapotranspiration?: number; // mm
}

/**
 * Location data with geographic context
 */
export interface Location {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
  timezone: string;

  // Geographic context
  coastalDistance?: number; // km from coast
  elevation?: number; // meters
  urbanDensity?: 'urban' | 'suburban' | 'rural';

  // Topographic features
  shelterFactor?: number; // 0-1 (0=exposed, 1=sheltered)
  windExposure?: 'high' | 'medium' | 'low';
}

/**
 * Individual component scores (0-100)
 */
export interface ComponentScores {
  [key: string]: number;
}

/**
 * Complete scoring result for a single hour
 */
export interface ScoringResult {
  timestamp: string;
  overallScore: number; // 0-100
  componentScores: ComponentScores;

  // Modifiers applied
  modifiers: {
    coastal?: number;
    wind?: number;
    topographic?: number;
    temporal?: number; // time of day adjustments
    [key: string]: number | undefined;
  };

  // Disqualification reasons (if score is 0)
  disqualified: boolean;
  disqualificationReasons: string[];

  // Raw weather data reference
  weatherData: HourlyWeatherData;
}

/**
 * Continuous time window with consistent conditions
 */
export interface TimeWindow {
  start: string; // ISO timestamp
  end: string; // ISO timestamp
  durationHours: number;
  averageScore: number;
  minScore: number;
  maxScore: number;
  hourlyScores: ScoringResult[];

  // Window quality indicators
  consistency: number; // 0-1 (standard deviation normalized)
  confidence: number; // 0-1 (based on weather certainty)
}

/**
 * Decision thresholds for categorizing results
 */
export interface DecisionThresholds {
  excellent: number; // e.g., 70-100
  acceptable: number; // e.g., 50-69
  poor: number; // e.g., 0-49

  // Minimum window duration in hours
  minWindowDuration: number;

  // Labels for each category
  labels: {
    excellent: string;
    acceptable: string;
    poor: string;
  };
}

/**
 * Algorithm configuration for a specific use case
 */
export interface AlgorithmConfig {
  name: string;
  version: string;

  // Component weights (must sum to 1.0)
  weights: {
    [componentName: string]: number;
  };

  // Decision thresholds
  thresholds: DecisionThresholds;

  // Disqualification rules
  disqualificationRules: DisqualificationRule[];

  // Feature flags
  features: {
    coastalIntelligence: boolean;
    windAnalysis: boolean;
    topographicAdjustments: boolean;
    temporalWeighting: boolean; // time of day matters
  };
}

/**
 * Rule for disqualifying an hour from consideration
 */
export interface DisqualificationRule {
  name: string;
  condition: (data: HourlyWeatherData) => boolean;
  reason: string;
  severity: 'hard' | 'soft'; // hard=score to 0, soft=penalty
  penalty?: number; // for soft rules
}

/**
 * Final recommendation output
 */
export interface Recommendation {
  decision: 'excellent' | 'acceptable' | 'poor';
  label: string; // e.g., "YES", "MAYBE", "NO"
  confidence: number; // 0-1

  // Current conditions
  currentScore: number;
  currentHour: ScoringResult;

  // Optimal windows
  optimalWindows: TimeWindow[];
  bestWindow: TimeWindow | null;

  // Additional context
  summary: string;
  warnings: string[];
  tips: string[];

  // Time-series data
  hourlyScores: ScoringResult[];

  // Metadata
  location: Location;
  generatedAt: string;
  validUntil: string;
}

/**
 * Normalization options for weather parameters
 */
export interface NormalizationOptions {
  min: number;
  max: number;
  optimal: number;
  curve?: 'linear' | 'exponential' | 'logarithmic' | 'sigmoid';
  invert?: boolean; // for parameters where lower is better
}

/**
 * Abstract scorer interface that all implementations must follow
 */
export interface IWeatherScorer {
  /**
   * Score a single hour of weather data
   */
  scoreHour(data: HourlyWeatherData, location: Location): ScoringResult;

  /**
   * Get decision thresholds for this algorithm
   */
  getDecisionThresholds(): DecisionThresholds;

  /**
   * Get algorithm configuration
   */
  getConfig(): AlgorithmConfig;

  /**
   * Find optimal time windows in hourly data
   */
  findOptimalWindows(
    hourlyScores: ScoringResult[],
    options?: WindowDetectionOptions
  ): TimeWindow[];

  /**
   * Generate final recommendation from scored data
   */
  generateRecommendation(
    hourlyScores: ScoringResult[],
    location: Location
  ): Recommendation;
}

/**
 * Options for window detection algorithm
 */
export interface WindowDetectionOptions {
  minDuration?: number; // minimum hours
  minScore?: number; // minimum average score
  maxGap?: number; // maximum gap between qualifying hours
  requireContinuous?: boolean; // must be continuous or can have small gaps
}

/**
 * Coastal intelligence data point
 */
export interface CoastalDataPoint {
  location: string;
  latitude: number;
  longitude: number;
  distanceToCoast: number; // km
  coastType?: 'exposed' | 'sheltered' | 'estuary';
}

/**
 * Wind analysis result
 */
export interface WindAnalysis {
  effectiveSpeed: number; // adjusted for shelter/exposure
  shelterFactor: number; // 0-1
  directionFactor: number; // 0-1 (based on prevailing winds)
  gustPotential: number; // 0-1 (based on topography)
  score: number; // 0-100
}

/**
 * Temporal weighting profile (time of day matters)
 */
export interface TemporalProfile {
  hour: number; // 0-23
  weight: number; // multiplier for that hour
  reason?: string; // why this hour is weighted differently
}

/**
 * Performance metrics for algorithm execution
 */
export interface AlgorithmMetrics {
  executionTimeMs: number;
  hoursProcessed: number;
  windowsDetected: number;
  cacheHits: number;
  cacheMisses: number;
}
