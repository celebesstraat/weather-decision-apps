/**
 * @weather-apps/core-algorithm
 *
 * Abstract weather decision algorithm engine
 *
 * This package provides the foundational classes and utilities for building
 * weather-based decision applications. It implements a flexible scoring system
 * that can be extended for different use cases (drying, burning, comfort, etc.).
 *
 * KEY EXPORTS:
 * - WeatherScorer: Abstract base class for algorithm implementations
 * - WindowDetector: Find optimal time windows in scored data
 * - CoastalIntelligence: Coastal distance adjustments
 * - WindAnalyzer: Topographic wind analysis
 * - Normalization functions: Convert raw weather data to 0-100 scores
 * - Type definitions: Complete TypeScript interfaces
 *
 * USAGE:
 * ```typescript
 * import { WeatherScorer, AlgorithmConfig } from '@weather-apps/core-algorithm';
 *
 * class MyScorer extends WeatherScorer {
 *   scoreHour(data: HourlyWeatherData, location: Location): ScoringResult {
 *     // Your custom scoring logic
 *   }
 * }
 * ```
 *
 * @packageDocumentation
 */

// Core engine classes
export { WeatherScorer } from './engine/WeatherScorer';
export { WindowDetector } from './engine/WindowDetector';
export { CoastalIntelligence } from './engine/CoastalIntelligence';
export { WindAnalyzer } from './engine/WindAnalyzer';

// Type definitions
export type {
  // Core types
  HourlyWeatherData,
  Location,
  ScoringResult,
  ComponentScores,
  TimeWindow,
  Recommendation,

  // Configuration
  AlgorithmConfig,
  DecisionThresholds,
  DisqualificationRule,
  WindowDetectionOptions,
  NormalizationOptions,

  // Analysis results
  WindAnalysis,
  CoastalDataPoint,
  TemporalProfile,

  // Interfaces
  IWeatherScorer,

  // Metrics
  AlgorithmMetrics,
} from './types';

// Normalization functions (all utilities)
export * from './normalization';

// Version
export const VERSION = '1.0.0';
