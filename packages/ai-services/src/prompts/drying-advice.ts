/**
 * Prompt generator for laundry drying advice (GetTheWashingOut)
 */

import type { AdviceParams } from '../types';

export function generateDryingAdvicePrompt(params: AdviceParams): string {
  const { hourlyData, dryingWindow, currentTime, sunset, forecastData } = params;

  const hourlyDataString = hourlyData
    .map(
      (h: any) =>
        `${h.time}: score ${Math.round(h.dryingScore)} (${h.temperature}°C, ${h.humidity}% humidity, ${h.rainChance}% rain, ${h.windSpeed}km/h wind, UV ${h.uvIndex})`
    )
    .join(' | ');

  const dryingWindowInfo = dryingWindow
    ? `${dryingWindow.startTime} - ${dryingWindow.endTime} (Quality Score: ${Math.round(dryingWindow.averageScore)}/100)`
    : 'No optimal drying window identified';

  const forecastString = forecastData
    ? forecastData
        .map((item: any) => `${item.day}: ${item.condition}, ${item.washingStatus} for drying`)
        .join(' | ')
    : '';

  return `Translate DRYcast scores into friendly laundry advice for the NEXT 24 HOURS.

CURRENT TIME: ${currentTime}
SUNSET: ${sunset || 'N/A'}
BEST WINDOW: ${dryingWindowInfo}

HOURLY DATA (DRYcast scores with weather context):
${hourlyDataString}

${forecastString ? `3-DAY FORECAST: ${forecastString}` : ''}

SCORE GUIDE: 0-49=RED (poor), 50-69=AMBER (marginal), 70-100=GREEN (good)

Write 2-3 casual sentences:
- Base decision on DRYcast scores but explain using weather factors (temp, humidity, rain, wind)
- If scores are RED: Say outdoor drying isn't recommended, explain why
- If scores are AMBER: Say conditions are marginal, mention best window
- If scores are GREEN: Recommend outdoor drying, mention optimal window
- Use "next 24 hours", "tomorrow morning/afternoon" - NEVER "today"
- DO NOT mention score numbers - only weather factors

ADVICE:`;
}
