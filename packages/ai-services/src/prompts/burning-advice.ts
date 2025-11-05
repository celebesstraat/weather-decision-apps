/**
 * Prompt generator for wood burner advice (GetTheWoodburnerOn)
 */

import type { AdviceParams } from '../types';

export function generateBurningAdvicePrompt(params: AdviceParams): string {
  const { hourlyData, dryingWindow, currentTime, forecastData } = params;

  const hourlyDataString = hourlyData
    .map(
      (h: any) =>
        `${h.time}: score ${Math.round(h.burningScore || h.dryingScore)} (${h.temperature}°C, ${h.pressure}mb, ${h.humidity}% humidity, ${h.windSpeed}km/h wind)`
    )
    .join(' | ');

  const bestWindowInfo = dryingWindow
    ? `${dryingWindow.startTime} - ${dryingWindow.endTime} (Quality Score: ${Math.round(dryingWindow.averageScore)}/100)`
    : 'No optimal burning window identified';

  const forecastString = forecastData
    ? forecastData
        .map((item: any) => `${item.day}: ${item.condition}, ${item.burningStatus || item.washingStatus} for burning`)
        .join(' | ')
    : '';

  return `Translate burning scores into friendly wood burner advice for the NEXT 24 HOURS.

CURRENT TIME: ${currentTime}
BEST WINDOW: ${bestWindowInfo}

HOURLY DATA (Burning scores with weather context):
${hourlyDataString}

${forecastString ? `3-DAY FORECAST: ${forecastString}` : ''}

SCORE GUIDE: 0-29=RED (avoid), 30-44=AMBER (pre-warm), 45-59=YELLOW (good), 60-74=GREEN (excellent), 75-100=DARK GREEN (perfect)

Write 2-3 casual sentences:
- Base decision on burning scores but explain using weather factors (temp differential, pressure, humidity, wind)
- Focus on chimney draft conditions (temperature differential is key)
- Mention if temperature inversion or summer chimney syndrome detected
- If scores are RED: Say burning isn't recommended, explain why (poor draft)
- If scores are AMBER: Say pre-warming required, mention challenges
- If scores are YELLOW/GREEN: Recommend burning, mention optimal window
- Use "next 24 hours", "tonight", "tomorrow evening" - NEVER "today"
- DO NOT mention score numbers - only weather factors and draft conditions

ADVICE:`;
}
