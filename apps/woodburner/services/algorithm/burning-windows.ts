/**
 * Lifestyle-Aware Burning Window Detection
 *
 * Intelligent window detection that aligns with real-world woodburner usage patterns.
 * Filters out impractical times (overnight) and prioritizes lifestyle-friendly windows.
 */

import type { FlameCastScore, BurningWindow, WoodburnerPreferences } from '../../types-woodburner';

// ============================================================================
// LIFESTYLE CONFIGURATION
// ============================================================================

/**
 * Prime burning hours aligned with typical household routines
 */
export const BURNING_LIFESTYLE = {
  // Morning burn: Heating up the house after overnight
  MORNING_START: 6,   // 06:00
  MORNING_END: 11,    // 11:00

  // Evening burn: Coming home from work, settling in for evening
  EVENING_START: 17,  // 17:00 (5pm)
  EVENING_END: 23,    // 23:00 (11pm)

  // Overnight: Nobody burns during these hours
  OVERNIGHT_START: 0,  // 00:00 (midnight)
  OVERNIGHT_END: 6,    // 06:00 (6am)
};

/**
 * Window quality thresholds
 */
const WINDOW_THRESHOLDS = {
  MIN_SCORE: 60,        // GOOD threshold
  MIN_DURATION: 2,      // Minimum 2 hours
  EXCELLENT_SCORE: 75,  // Excellent quality
};

// ============================================================================
// LIFESTYLE AWARENESS
// ============================================================================

/**
 * Check if an hour falls within practical burning times
 */
function isPracticalBurningTime(hour: number): boolean {
  const { MORNING_START, MORNING_END, EVENING_START, EVENING_END } = BURNING_LIFESTYLE;

  const isMorningWindow = hour >= MORNING_START && hour < MORNING_END;
  const isEveningWindow = hour >= EVENING_START && hour < EVENING_END;

  return isMorningWindow || isEveningWindow;
}

/**
 * Calculate lifestyle bonus for window timing
 * Prime hours (morning/evening) get higher scores
 */
function calculateLifestyleBonus(startHour: number, endHour: number): number {
  const { MORNING_START, MORNING_END, EVENING_START, EVENING_END } = BURNING_LIFESTYLE;

  // Morning window (06:00-11:00): +10 bonus
  if (startHour >= MORNING_START && endHour <= MORNING_END) {
    return 10;
  }

  // Evening window (17:00-23:00): +15 bonus (prime time)
  if (startHour >= EVENING_START && endHour <= EVENING_END) {
    return 15;
  }

  // Spans both morning and afternoon/evening: +5 bonus
  if (startHour >= MORNING_START && endHour >= EVENING_START) {
    return 5;
  }

  // Partial overlap with prime hours: +3 bonus
  const hasPartialOverlap =
    (startHour < MORNING_END && endHour > MORNING_START) ||
    (startHour < EVENING_END && endHour > EVENING_START);

  if (hasPartialOverlap) {
    return 3;
  }

  // Overnight or impractical hours: -20 penalty
  return -20;
}

// ============================================================================
// WINDOW DETECTION
// ============================================================================

/**
 * Find lifestyle-aware burning windows
 * Filters out overnight hours and prioritizes practical burning times
 */
export function findLifestyleAwareBurningWindows(
  scores: FlameCastScore[],
  preferences?: WoodburnerPreferences
): BurningWindow[] {
  const windows: BurningWindow[] = [];
  const { MIN_SCORE, MIN_DURATION } = WINDOW_THRESHOLDS;

  let windowStart: number | null = null;
  let windowScores: number[] = [];

  for (let i = 0; i < scores.length; i++) {
    const score = scores[i];
    const hour = new Date(score.time).getHours();

    // LIFESTYLE FILTER: Skip overnight hours entirely
    const isPractical = isPracticalBurningTime(hour);

    if (score.totalScore >= MIN_SCORE && isPractical) {
      // Start or continue window
      if (windowStart === null) {
        windowStart = i;
        windowScores = [score.totalScore];
      } else {
        windowScores.push(score.totalScore);
      }
    } else {
      // End window if exists
      if (windowStart !== null && windowScores.length >= MIN_DURATION) {
        windows.push(createBurningWindow(scores, windowStart, i - 1, windowScores));
      }
      windowStart = null;
      windowScores = [];
    }
  }

  // Handle final window
  if (windowStart !== null && windowScores.length >= MIN_DURATION) {
    windows.push(createBurningWindow(scores, windowStart, scores.length - 1, windowScores));
  }

  // SMART RANKING: Sort by lifestyle-adjusted score
  windows.sort((a, b) => {
    const aStartHour = new Date(a.startTime).getHours();
    const aEndHour = new Date(a.endTime).getHours();
    const bStartHour = new Date(b.startTime).getHours();
    const bEndHour = new Date(b.endTime).getHours();

    const aLifestyleBonus = calculateLifestyleBonus(aStartHour, aEndHour);
    const bLifestyleBonus = calculateLifestyleBonus(bStartHour, bEndHour);

    const aAdjustedScore = a.averageScore + aLifestyleBonus;
    const bAdjustedScore = b.averageScore + bLifestyleBonus;

    return bAdjustedScore - aAdjustedScore;
  });

  return windows;
}

/**
 * Create a BurningWindow object from score data
 */
function createBurningWindow(
  scores: FlameCastScore[],
  startIndex: number,
  endIndex: number,
  windowScores: number[]
): BurningWindow {
  const startScore = scores[startIndex];
  const endScore = scores[endIndex];

  const averageScore = windowScores.reduce((sum, s) => sum + s, 0) / windowScores.length;
  const peakScore = Math.max(...windowScores);
  const peakIndex = startIndex + windowScores.indexOf(peakScore);

  let quality: 'excellent' | 'good' | 'marginal';
  if (averageScore >= WINDOW_THRESHOLDS.EXCELLENT_SCORE) {
    quality = 'excellent';
  } else if (averageScore >= WINDOW_THRESHOLDS.MIN_SCORE) {
    quality = 'good';
  } else {
    quality = 'marginal';
  }

  return {
    startTime: startScore.time,
    endTime: endScore.time,
    durationHours: endIndex - startIndex + 1,
    averageScore: Math.round(averageScore),
    quality,
    peakScore,
    peakTime: scores[peakIndex].time
  };
}

// ============================================================================
// ALTERNATIVE WINDOWS
// ============================================================================

/**
 * Get top 3 lifestyle-friendly windows
 * Useful for showing alternatives to users
 */
export function getTopBurningWindows(
  scores: FlameCastScore[],
  maxWindows: number = 3,
  preferences?: WoodburnerPreferences
): BurningWindow[] {
  const allWindows = findLifestyleAwareBurningWindows(scores, preferences);
  return allWindows.slice(0, maxWindows);
}
