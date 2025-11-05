/**
 * WindowDetector - Find Optimal Time Windows
 *
 * Identifies continuous periods where weather conditions meet quality thresholds.
 * Used by all algorithm implementations to find when conditions are favorable.
 *
 * ALGORITHM:
 * 1. Filter hours meeting minimum score threshold
 * 2. Group into continuous windows (allowing configurable gaps)
 * 3. Calculate window statistics (avg, min, max, consistency)
 * 4. Filter by minimum duration
 * 5. Sort by average score (best first)
 */

import { ScoringResult, TimeWindow, WindowDetectionOptions } from '../types';

export class WindowDetector {
  /**
   * Find all qualifying time windows in hourly scored data
   */
  public findWindows(
    hourlyScores: ScoringResult[],
    options: WindowDetectionOptions
  ): TimeWindow[] {
    const {
      minDuration = 2,
      minScore = 50,
      maxGap = 1,
      requireContinuous = false,
    } = options;

    if (hourlyScores.length === 0) {
      return [];
    }

    // Step 1: Filter hours meeting score threshold
    const qualifyingHours = hourlyScores.filter(
      hour => hour.overallScore >= minScore && !hour.disqualified
    );

    if (qualifyingHours.length === 0) {
      return [];
    }

    // Step 2: Group into continuous windows
    const rawWindows = this.groupIntoWindows(
      qualifyingHours,
      hourlyScores,
      maxGap,
      requireContinuous
    );

    // Step 3: Calculate window statistics
    const windows = rawWindows.map(windowHours =>
      this.calculateWindowStats(windowHours)
    );

    // Step 4: Filter by minimum duration
    const validWindows = windows.filter(
      window => window.durationHours >= minDuration
    );

    // Step 5: Sort by average score (descending)
    validWindows.sort((a, b) => b.averageScore - a.averageScore);

    return validWindows;
  }

  /**
   * Group qualifying hours into continuous windows
   */
  private groupIntoWindows(
    qualifyingHours: ScoringResult[],
    allHours: ScoringResult[],
    maxGap: number,
    requireContinuous: boolean
  ): ScoringResult[][] {
    const windows: ScoringResult[][] = [];
    let currentWindow: ScoringResult[] = [];

    // Create a map for quick lookup of hour indices
    const hourIndexMap = new Map<string, number>();
    allHours.forEach((hour, index) => {
      hourIndexMap.set(hour.timestamp, index);
    });

    qualifyingHours.forEach((hour) => {
      if (currentWindow.length === 0) {
        // Start new window
        currentWindow.push(hour);
      } else {
        const lastHour = currentWindow[currentWindow.length - 1]!;
        const lastIndex = hourIndexMap.get(lastHour.timestamp)!;
        const currentIndex = hourIndexMap.get(hour.timestamp)!;
        const gap = currentIndex - lastIndex - 1;

        if (gap <= maxGap && !requireContinuous) {
          // Continue current window (gap is acceptable)
          // Fill in gap hours if needed
          for (let j = lastIndex + 1; j < currentIndex; j++) {
            currentWindow.push(allHours[j]!);
          }
          currentWindow.push(hour);
        } else if (gap === 0) {
          // Continuous - add to current window
          currentWindow.push(hour);
        } else {
          // Gap too large or continuous required - start new window
          if (currentWindow.length > 0) {
            windows.push(currentWindow);
          }
          currentWindow = [hour];
        }
      }
    });

    // Don't forget the last window
    if (currentWindow.length > 0) {
      windows.push(currentWindow);
    }

    return windows;
  }

  /**
   * Calculate statistics for a time window
   */
  private calculateWindowStats(hours: ScoringResult[]): TimeWindow {
    if (hours.length === 0) {
      throw new Error('Cannot calculate stats for empty window');
    }

    const scores = hours.map(h => h.overallScore);
    const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    // Calculate consistency (1 - normalized standard deviation)
    const stdDev = this.calculateStdDev(scores);
    const consistency = Math.max(0, 1 - (stdDev / 100));

    // Calculate confidence based on:
    // - Window length (longer = more confident)
    // - Score consistency (less variance = more confident)
    // - Absence of disqualified hours
    const disqualifiedCount = hours.filter(h => h.disqualified).length;
    const confidence = Math.max(0, Math.min(1,
      (hours.length / 6) * 0.3 + // length factor (up to 0.3)
      consistency * 0.5 + // consistency factor (up to 0.5)
      (1 - disqualifiedCount / hours.length) * 0.2 // quality factor (up to 0.2)
    ));

    // Calculate duration
    const startTime = new Date(hours[0]!.timestamp);
    const endTime = new Date(hours[hours.length - 1]!.timestamp);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    return {
      start: hours[0]!.timestamp,
      end: hours[hours.length - 1]!.timestamp,
      durationHours,
      averageScore,
      minScore,
      maxScore,
      hourlyScores: hours,
      consistency,
      confidence,
    };
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Merge overlapping or adjacent windows
   */
  public mergeWindows(windows: TimeWindow[]): TimeWindow[] {
    if (windows.length <= 1) return windows;

    const sorted = [...windows].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    const merged: TimeWindow[] = [];
    let current = sorted[0]!;

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i]!;
      const currentEnd = new Date(current.end).getTime();
      const nextStart = new Date(next.start).getTime();
      const gapHours = (nextStart - currentEnd) / (1000 * 60 * 60);

      if (gapHours <= 1) {
        // Merge windows
        const allHours = [...current.hourlyScores, ...next.hourlyScores];
        current = this.calculateWindowStats(allHours);
      } else {
        // No overlap - save current and move to next
        merged.push(current);
        current = next;
      }
    }

    merged.push(current);
    return merged;
  }

  /**
   * Find the single best window from a set
   */
  public findBestWindow(windows: TimeWindow[]): TimeWindow | null {
    if (windows.length === 0) return null;

    // Score windows by multiple factors
    const scored = windows.map(window => ({
      window,
      score: this.scoreWindow(window),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored[0]!.window;
  }

  /**
   * Score a window by multiple quality factors
   */
  private scoreWindow(window: TimeWindow): number {
    // Factors:
    // 1. Average score (50%)
    // 2. Duration (25%)
    // 3. Consistency (15%)
    // 4. Confidence (10%)

    const avgScoreFactor = window.averageScore * 0.5;
    const durationFactor = Math.min(window.durationHours / 6, 1) * 25; // max out at 6h
    const consistencyFactor = window.consistency * 15;
    const confidenceFactor = window.confidence * 10;

    return avgScoreFactor + durationFactor + consistencyFactor + confidenceFactor;
  }

  /**
   * Filter windows by time of day
   */
  public filterByTimeOfDay(
    windows: TimeWindow[],
    startHour: number,
    endHour: number
  ): TimeWindow[] {
    return windows.filter(window => {
      const startTime = new Date(window.start);
      const hour = startTime.getHours();

      if (startHour <= endHour) {
        return hour >= startHour && hour < endHour;
      } else {
        // Wraps around midnight
        return hour >= startHour || hour < endHour;
      }
    });
  }

  /**
   * Get summary statistics across all windows
   */
  public getWindowSummary(windows: TimeWindow[]): {
    totalWindows: number;
    totalDuration: number;
    averageScore: number;
    bestScore: number;
    averageDuration: number;
  } {
    if (windows.length === 0) {
      return {
        totalWindows: 0,
        totalDuration: 0,
        averageScore: 0,
        bestScore: 0,
        averageDuration: 0,
      };
    }

    const totalDuration = windows.reduce((sum, w) => sum + w.durationHours, 0);
    const averageScore = windows.reduce((sum, w) => sum + w.averageScore, 0) / windows.length;
    const bestScore = Math.max(...windows.map(w => w.averageScore));
    const averageDuration = totalDuration / windows.length;

    return {
      totalWindows: windows.length,
      totalDuration,
      averageScore,
      bestScore,
      averageDuration,
    };
  }
}
