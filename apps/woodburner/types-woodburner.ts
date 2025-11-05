/**
 * TypeScript Type Definitions for FlameCast Woodburner Algorithm
 */

import { FlameCastStatus } from './services/algorithm/woodburner-config';

// ============================================================================
// FLAMECAST SCORING TYPES
// ============================================================================

/**
 * Individual component scores for FlameCast algorithm
 */
export interface FlameCastComponentScores {
  temperatureDifferential: number;  // 0-100
  atmosphericPressure: number;      // 0-100
  humidity: number;                 // 0-100
  windSpeed: number;                // 0-100
  precipitation: number;            // 0-100
}

/**
 * Hourly FlameCast score with metadata
 */
export interface FlameCastScore {
  hour: number;                           // Hour index (0-71 for 3-day forecast)
  time: string;                           // ISO timestamp
  totalScore: number;                     // Weighted total (0-100)
  componentScores: FlameCastComponentScores;
  status: FlameCastStatus;                // EXCELLENT, GOOD, MARGINAL, POOR, AVOID
  suitable: boolean;                      // Quick check: score >= 60
  indoorTemp: number;                     // Calculated indoor temp (°C)
  outdoorTemp: number;                    // Outdoor temp (°C)
  temperatureDifferential: number;        // ΔT (°C)
  isInversion: boolean;                   // Critical warning flag
  warnings: string[];                     // Warning message keys
}

// ============================================================================
// BURNING WINDOW TYPES
// ============================================================================

/**
 * Continuous window of good burning conditions
 */
export interface BurningWindow {
  startTime: string;                      // ISO timestamp
  endTime: string;                        // ISO timestamp
  durationHours: number;                  // Window length in hours
  averageScore: number;                   // Average FlameCast score
  quality: 'excellent' | 'good' | 'marginal';
  peakScore: number;                      // Best score in window
  peakTime: string;                       // When peak occurs
}

// ============================================================================
// RECOMMENDATION TYPES
// ============================================================================

/**
 * Woodburner ignition recommendation
 */
export interface WoodburnerRecommendation {
  status: FlameCastStatus;
  timing: string;                         // "Now", "This evening", "Tonight", etc.
  reason: string;                         // Human-readable explanation
  timeWindow: string;                     // e.g., "6pm-11pm"
  burningWindow?: BurningWindow;          // Best window if available
  alternativeWindows?: BurningWindow[];   // Other good windows
  warnings: string[];                     // Critical warnings
  weatherSource: string;                  // Data source attribution
  lastUpdated: Date;
  location: string;

  // Current conditions summary
  currentConditions: {
    temperature: number;                  // Outdoor temp (°C)
    indoorTemp: number;                   // Indoor temp (°C)
    deltaT: number;                       // Temperature differential
    pressure: number;                     // Atmospheric pressure (mb)
    humidity: number;                     // Relative humidity (%)
    windSpeed: number;                    // Wind speed (km/h)
    precipitation: number;                // Precipitation (mm/h)
  };

  // Full forecast data for UI display
  hourlyScores: FlameCastScore[];         // All hourly scores (72 hours)
  dailyForecasts: DailyFlameCastSummary[]; // Daily summaries (3 days)

  // AI-generated advice (optional)
  aiAdvice?: {
    shortTerm: string;                    // Next 24 hours
    threeDayOutlook?: string;             // 3-day forecast
  };
}

/**
 * Daily summary of FlameCast conditions
 */
export interface DailyFlameCastSummary {
  date: string;                           // ISO date (YYYY-MM-DD)
  dayName: string;                        // "Today", "Tomorrow", "Wednesday"
  averageScore: number;                   // Average FlameCast score
  peakScore: number;                      // Best score of the day
  peakTime: string;                       // When peak occurs
  status: FlameCastStatus;                // Overall day status
  bestWindow?: BurningWindow;             // Best burning window this day
  averageDeltaT: number;                  // Average temp differential
  averageTemp: number;                    // Average outdoor temp
  warnings: string[];                     // Day-specific warnings
}

// ============================================================================
// WEATHER DATA TYPES (reused from main app)
// ============================================================================

/**
 * Hourly weather forecast data
 * Extended from main GetTheWashingOut types
 */
export interface HourlyForecast {
  time: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainChance: number;
  uvIndex: number;
  dewPoint: number;
  cloudCover: number;
  rainfall: number;

  // Extended Phase 1 parameters
  vapourPressureDeficit?: number;
  surfacePressure?: number;              // Required for FlameCast
  shortwaveRadiation?: number;

  // Extended Phase 2 parameters
  wetBulbTemperature?: number;
  et0FAOEvapotranspiration?: number;

  // Extended Phase 3 parameters
  sunshineDuration?: number;
  windDirection?: number;
}

/**
 * Complete weather response
 */
export interface WeatherResponse {
  location: string;
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: HourlyForecast[];
  current: HourlyForecast;
  lastUpdated: Date;
}

// ============================================================================
// USER PREFERENCES TYPES
// ============================================================================

/**
 * User preferences for woodburner algorithm
 */
export interface WoodburnerPreferences {
  /** User-specified indoor temperature override (°C) */
  indoorTempOverride?: number;

  /** Preferred burning times (for window detection) */
  preferredBurningTimes?: {
    start: number;                        // Hour (0-23)
    end: number;                          // Hour (0-23)
  };

  /** Chimney characteristics (future enhancement) */
  chimneyType?: 'internal' | 'external';
  chimneyHeight?: number;                 // Meters
  hasChimneyCap?: boolean;

  /** Notification preferences (future enhancement) */
  notifications?: {
    enabled: boolean;
    goodConditionsAlert: boolean;
    poorConditionsWarning: boolean;
  };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * FlameCast-specific error
 */
export interface FlameCastError {
  code: string;
  message: string;
  details?: unknown;
}

// ============================================================================
// ANALYTICS TYPES (for future enhancement)
// ============================================================================

/**
 * Actual burning outcome (user feedback)
 */
export interface BurningOutcome {
  timestamp: Date;
  predictedScore: number;
  predictedStatus: FlameCastStatus;
  actualDifficulty: 'easy' | 'moderate' | 'difficult' | 'failed';
  actualSmoke: 'none' | 'light' | 'moderate' | 'heavy';
  actualDraft: 'strong' | 'normal' | 'weak' | 'backdraft';
  userIndoorTemp?: number;
  notes?: string;
}
