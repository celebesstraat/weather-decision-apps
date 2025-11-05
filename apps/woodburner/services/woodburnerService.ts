/**
 * FlameCast Woodburner Service
 *
 * Main orchestration service for calculating woodburner ignition recommendations
 * based on weather conditions, chimney draft physics, and atmospheric stability.
 */

import type {
  HourlyForecast,
  FlameCastScore,
  FlameCastComponentScores,
  BurningWindow,
  WoodburnerRecommendation,
  WoodburnerPreferences,
  DailyFlameCastSummary
} from '../types-woodburner';

import { fetchWeatherData } from './weatherAPIService';
import { geocodeLocation } from './geoLocationService';

import {
  FLAMECAST_WEIGHTS,
  getRecommendationStatus,
  WARNING_MESSAGES,
  STATUS_MESSAGES,
  type FlameCastStatus
} from './algorithm/woodburner-config';

import {
  getCurrentSeason,
  calculateTemperatureDifferential,
  scoreTemperatureDifferential,
  checkTemperatureWarnings,
  analyzeTemperatureDifferential
} from './algorithm/temperature-differential';

import {
  scorePressure,
  scoreHumidity,
  scoreWindSpeed,
  scorePrecipitation,
  checkHumidityWarnings,
  analyzeAtmosphericStability
} from './algorithm/atmospheric-stability';

import {
  findLifestyleAwareBurningWindows,
  getTopBurningWindows,
  BURNING_LIFESTYLE
} from './algorithm/burning-windows';

// ============================================================================
// MAIN RECOMMENDATION FUNCTION
// ============================================================================

/**
 * Get woodburner ignition recommendation for a location
 *
 * @param location - Location name (e.g., "London", "Dublin")
 * @param indoorTemp - Optional indoor temperature override (°C)
 * @param preferences - Optional user preferences
 * @returns Complete woodburner recommendation
 */
export async function getWoodburnerRecommendation(
  location: string,
  indoorTemp?: number,
  preferences?: WoodburnerPreferences
): Promise<WoodburnerRecommendation> {
  try {
    // 1. Get coordinates from location
    const geocodeResult = await geocodeLocation(location);
    if (!geocodeResult) {
      throw new Error(`Could not find coordinates for location: ${location}`);
    }

    // 2. Fetch weather data (3-day forecast)
    const weatherData = await fetchWeatherData(geocodeResult.latitude, geocodeResult.longitude, 3);

    // 3. Apply indoor temperature override if provided
    const preferencesWithTemp: WoodburnerPreferences = {
      ...preferences,
      indoorTempOverride: indoorTemp ?? preferences?.indoorTempOverride
    };

    // 4. Calculate FlameCast scores for all hours
    const flameCastScores = calculateFlameCastScores(
      weatherData.hourlyData,
      preferencesWithTemp
    );

    // 4. Find best burning windows (lifestyle-aware)
    const burningWindows = findLifestyleAwareBurningWindows(flameCastScores, preferencesWithTemp);

    // 5. Get current hour recommendation
    const now = new Date();
    const currentHour = now.getHours();
    const currentScore = flameCastScores[0]; // First hour is current

    // 6. Determine timing recommendation
    const timingRec = determineTimingRecommendation(
      currentScore,
      flameCastScores,
      burningWindows,
      currentHour,
      preferences
    );

    // 7. Get all warnings
    const allWarnings = Array.from(
      new Set(flameCastScores.flatMap(score => score.warnings))
    );

    // 8. Generate daily summaries
    const dailyForecasts = generateDailyForecasts(flameCastScores, burningWindows);

    // 9. Build recommendation
    const recommendation: WoodburnerRecommendation = {
      status: currentScore.status,
      timing: timingRec.timing,
      reason: timingRec.reason,
      timeWindow: timingRec.timeWindow,
      burningWindow: burningWindows[0], // Best window
      alternativeWindows: burningWindows.slice(1, 3), // Next 2 windows
      warnings: allWarnings,
      weatherSource: 'Open-Meteo (UK Met Office)',
      lastUpdated: new Date(),
      location: location,

      currentConditions: {
        temperature: currentScore.outdoorTemp,
        indoorTemp: currentScore.indoorTemp,
        deltaT: currentScore.temperatureDifferential,
        pressure: weatherData.hourlyData[0].surfacePressure || 1013,
        humidity: weatherData.hourlyData[0].humidity,
        windSpeed: weatherData.hourlyData[0].windSpeed,
        precipitation: weatherData.hourlyData[0].rainfall
      },

      // Include full forecast data for UI
      hourlyScores: flameCastScores,
      dailyForecasts: dailyForecasts
    };

    return recommendation;
  } catch (error) {
    console.error('Error getting woodburner recommendation:', error);
    throw error;
  }
}

// ============================================================================
// FLAMECAST SCORING
// ============================================================================

/**
 * Calculate FlameCast scores for all hourly forecasts
 *
 * @param hourlyForecasts - Array of hourly weather forecasts
 * @param preferences - Optional user preferences
 * @returns Array of FlameCast scores
 */
function calculateFlameCastScores(
  hourlyForecasts: HourlyForecast[],
  preferences?: WoodburnerPreferences
): FlameCastScore[] {
  return hourlyForecasts.map((forecast, index) => {
    return scoreHourForBurning(forecast, index, preferences);
  });
}

/**
 * Score a single hour for woodburner burning conditions
 *
 * @param forecast - Hourly weather forecast
 * @param hourIndex - Hour index in forecast array
 * @param preferences - Optional user preferences
 * @returns FlameCast score for this hour
 */
function scoreHourForBurning(
  forecast: HourlyForecast,
  hourIndex: number,
  preferences?: WoodburnerPreferences
): FlameCastScore {
  // Parse time
  const forecastTime = new Date(forecast.time);
  const hour = forecastTime.getHours();
  const month = forecastTime.getMonth() + 1; // 0-indexed to 1-indexed
  const season = getCurrentSeason(month);

  // Get weather parameters
  const outdoorTemp = forecast.temperature;
  const pressure = forecast.surfacePressure || 1013; // Default to standard pressure
  const humidity = forecast.humidity;
  const windSpeed = forecast.windSpeed;
  const precipitation = forecast.rainfall;

  // Calculate temperature differential
  const deltaT = calculateTemperatureDifferential(
    outdoorTemp,
    hour,
    season,
    preferences?.indoorTempOverride
  );

  const indoorTemp = outdoorTemp + deltaT; // Indoor = Outdoor + ΔT
  const isInversion = deltaT < 0;

  // Calculate component scores
  const tempDiffScore = scoreTemperatureDifferential(deltaT);
  const pressureScore = scorePressure(pressure);
  const humidityScore = scoreHumidity(humidity);
  const windScore = scoreWindSpeed(windSpeed);
  const precipScore = scorePrecipitation(precipitation);

  const componentScores: FlameCastComponentScores = {
    temperatureDifferential: tempDiffScore,
    atmosphericPressure: pressureScore,
    humidity: humidityScore,
    windSpeed: windScore,
    precipitation: precipScore
  };

  // Calculate weighted total score
  const rawScore =
    (tempDiffScore * FLAMECAST_WEIGHTS.TEMPERATURE_DIFFERENTIAL +
      pressureScore * FLAMECAST_WEIGHTS.ATMOSPHERIC_PRESSURE +
      humidityScore * FLAMECAST_WEIGHTS.HUMIDITY +
      windScore * FLAMECAST_WEIGHTS.WIND_SPEED +
      precipScore * FLAMECAST_WEIGHTS.PRECIPITATION) / 100;

  // Round score BEFORE status determination to avoid edge case mismatches
  // (e.g., 59.7 rounds to 60 for display but classified as MARGINAL)
  const totalScore = Math.round(rawScore);

  // Get status based on rounded score
  const status = getRecommendationStatus(totalScore);

  // Check for warnings
  const tempWarnings = checkTemperatureWarnings(
    outdoorTemp,
    indoorTemp,
    deltaT,
    season,
    pressure,
    windSpeed,
    hour
  );

  const humidityWarnings = checkHumidityWarnings(humidity, deltaT);

  const warnings = [...tempWarnings, ...humidityWarnings];

  return {
    hour: hourIndex,
    time: forecast.time,
    totalScore, // Already rounded above
    componentScores,
    status,
    suitable: totalScore >= 60, // GOOD threshold
    indoorTemp,
    outdoorTemp,
    temperatureDifferential: deltaT,
    isInversion,
    warnings
  };
}

// ============================================================================
// BURNING WINDOW DETECTION
// ============================================================================

/**
 * Find continuous windows of good burning conditions
 *
 * A burning window is defined as:
 * - 2+ consecutive hours with score >= 60 (GOOD threshold)
 * - Preferably during evening hours (6pm-11pm)
 *
 * @param scores - Array of FlameCast scores
 * @param preferences - Optional user preferences
 * @returns Array of burning windows, sorted by quality
 */
function findBurningWindows(
  scores: FlameCastScore[],
  preferences?: WoodburnerPreferences
): BurningWindow[] {
  const windows: BurningWindow[] = [];
  const minScore = 60; // GOOD threshold
  const minDuration = 2; // Minimum 2 hours

  let windowStart: number | null = null;
  let windowScores: number[] = [];

  for (let i = 0; i < scores.length; i++) {
    const score = scores[i];

    if (score.totalScore >= minScore) {
      // Start or continue window
      if (windowStart === null) {
        windowStart = i;
        windowScores = [score.totalScore];
      } else {
        windowScores.push(score.totalScore);
      }
    } else {
      // End window if exists
      if (windowStart !== null && windowScores.length >= minDuration) {
        windows.push(createBurningWindow(scores, windowStart, i - 1, windowScores));
      }
      windowStart = null;
      windowScores = [];
    }
  }

  // Handle final window
  if (windowStart !== null && windowScores.length >= minDuration) {
    windows.push(createBurningWindow(scores, windowStart, scores.length - 1, windowScores));
  }

  // Sort windows by quality (average score descending)
  windows.sort((a, b) => b.averageScore - a.averageScore);

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
  if (averageScore >= 75) quality = 'excellent';
  else if (averageScore >= 60) quality = 'good';
  else quality = 'marginal';

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
// TIMING RECOMMENDATION
// ============================================================================

/**
 * Determine timing recommendation and reason
 */
function determineTimingRecommendation(
  currentScore: FlameCastScore,
  allScores: FlameCastScore[],
  windows: BurningWindow[],
  currentHour: number,
  preferences?: WoodburnerPreferences
): { timing: string; reason: string; timeWindow: string } {
  const now = currentScore;
  const bestWindow = windows[0];

  // If current conditions are excellent
  if (now.status === 'EXCELLENT') {
    return {
      timing: 'Now',
      reason: `Excellent conditions: ${now.temperatureDifferential.toFixed(1)}°C temperature differential, strong draft expected`,
      timeWindow: 'Current'
    };
  }

  // If current conditions are good
  if (now.status === 'GOOD') {
    return {
      timing: 'Now',
      reason: `Good conditions: ${now.temperatureDifferential.toFixed(1)}°C temperature differential`,
      timeWindow: 'Current'
    };
  }

  // If current conditions are marginal but improvable
  if (now.status === 'MARGINAL' && bestWindow) {
    const windowStart = new Date(bestWindow.startTime);
    const windowHour = windowStart.getHours();

    if (windowHour > currentHour && windowHour - currentHour <= 6) {
      return {
        timing: formatTimingFromHour(windowHour),
        reason: `Conditions will improve to ${bestWindow.quality} (score: ${bestWindow.averageScore})`,
        timeWindow: formatWindowTime(bestWindow)
      };
    }
  }

  // If conditions are poor
  if (now.status === 'POOR' || now.status === 'AVOID') {
    if (bestWindow) {
      const windowStart = new Date(bestWindow.startTime);
      const windowHour = windowStart.getHours();

      return {
        timing: formatTimingFromHour(windowHour),
        reason: `Current conditions not suitable. Best window: ${formatWindowTime(bestWindow)}`,
        timeWindow: formatWindowTime(bestWindow)
      };
    } else {
      return {
        timing: 'Not recommended in next 72 hours',
        reason: `${now.warnings.length > 0 ? WARNING_MESSAGES[now.warnings[0] as keyof typeof WARNING_MESSAGES] : 'Poor conditions throughout forecast period'}`,
        timeWindow: 'None'
      };
    }
  }

  // Default fallback
  return {
    timing: 'Now',
    reason: 'Current conditions acceptable',
    timeWindow: 'Current'
  };
}

/**
 * Format timing from hour (0-23) to human-readable string
 */
function formatTimingFromHour(hour: number): string {
  if (hour === new Date().getHours()) return 'Now';
  if (hour >= 6 && hour < 12) return 'This morning';
  if (hour >= 12 && hour < 17) return 'This afternoon';
  if (hour >= 17 && hour < 21) return 'This evening';
  if (hour >= 21 || hour < 6) return 'Tonight';
  return `${hour}:00`;
}

/**
 * Format burning window time range
 */
function formatWindowTime(window: BurningWindow): string {
  const start = new Date(window.startTime);
  const end = new Date(window.endTime);

  const formatHour = (date: Date) => {
    const h = date.getHours();
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}${ampm}`;
  };

  return `${formatHour(start)}-${formatHour(end)}`;
}

/**
 * Generate daily summaries from hourly FlameCast scores
 */
function generateDailyForecasts(
  flameCastScores: FlameCastScore[],
  burningWindows: BurningWindow[]
): DailyFlameCastSummary[] {
  const dailySummaries: DailyFlameCastSummary[] = [];
  const hoursPerDay = 24;

  // Group scores by day (assuming 72 hours = 3 days)
  for (let day = 0; day < 3; day++) {
    const startIdx = day * hoursPerDay;
    const endIdx = Math.min(startIdx + hoursPerDay, flameCastScores.length);
    const dayScores = flameCastScores.slice(startIdx, endIdx);

    if (dayScores.length === 0) continue;

    // Calculate day name
    const dateObj = new Date(dayScores[0].time);

    // Validate date
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date in flameCastScores:', dayScores[0].time);
      continue;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(dateObj);
    dayDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((dayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let dayName: string;
    if (diffDays === 0) dayName = 'Today';
    else if (diffDays === 1) dayName = 'Tomorrow';
    else dayName = dayDate.toLocaleDateString('en-GB', { weekday: 'long' });

    // Calculate statistics (LIFESTYLE-AWARE: only count practical burning hours)
    const lifestyleScores = dayScores.filter(s => {
      const hour = new Date(s.time).getHours();
      const isMorning = hour >= BURNING_LIFESTYLE.MORNING_START && hour < BURNING_LIFESTYLE.MORNING_END;
      const isEvening = hour >= BURNING_LIFESTYLE.EVENING_START && hour < BURNING_LIFESTYLE.EVENING_END;
      return isMorning || isEvening;
    });

    // Use lifestyle scores for daily rating (or fallback to all scores if none found)
    const scoresToRate = lifestyleScores.length > 0 ? lifestyleScores : dayScores;

    const avgScore = scoresToRate.reduce((sum, s) => sum + s.totalScore, 0) / scoresToRate.length;
    const peakScore = Math.max(...scoresToRate.map(s => s.totalScore));
    const peakHour = scoresToRate.find(s => s.totalScore === peakScore);
    const avgDeltaT = scoresToRate.reduce((sum, s) => sum + s.temperatureDifferential, 0) / scoresToRate.length;
    const avgTemp = scoresToRate.reduce((sum, s) => sum + s.outdoorTemp, 0) / scoresToRate.length;

    // Find best window for this day
    const dayStartTime = dayScores[0].time;
    const dayEndTime = dayScores[dayScores.length - 1].time;
    const bestWindow = burningWindows.find(w =>
      new Date(w.startTime) >= new Date(dayStartTime) &&
      new Date(w.startTime) < new Date(dayEndTime)
    );

    // Collect warnings
    const dayWarnings = Array.from(new Set(dayScores.flatMap(s => s.warnings)));

    // Determine overall status
    const status = getRecommendationStatus(avgScore);

    dailySummaries.push({
      date: dayDate.toISOString().split('T')[0],
      dayName,
      averageScore: Math.round(avgScore),
      peakScore: Math.round(peakScore),
      peakTime: peakHour ? new Date(peakHour.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '12:00',
      status,
      bestWindow,
      averageDeltaT: Math.round(avgDeltaT * 10) / 10,
      averageTemp: Math.round(avgTemp * 10) / 10,
      warnings: dayWarnings
    });
  }

  return dailySummaries;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  calculateFlameCastScores,
  scoreHourForBurning,
  findBurningWindows,
  analyzeTemperatureDifferential,
  analyzeAtmosphericStability
};
