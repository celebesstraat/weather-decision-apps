import type { ShortTermForecastItem } from "../types";
import type { WoodburnerRecommendation, FlameCastScore } from "../types-woodburner";
import { SecureAIClient } from '@weather-apps/ai-services';

/**
 * Secure Gemini Service using serverless proxy
 *
 * MIGRATED: Now uses shared @weather-apps/ai-services package
 * SECURITY: API key is stored server-side in Vercel environment variables.
 * All requests go through /api/gemini which handles rate limiting and validation.
 */

// Initialize shared AI client
const aiClient = new SecureAIClient({
  proxyEndpoint: '/api/gemini',
  timeout: 30000
});

const createPrompt = (forecast: ShortTermForecastItem[]): string => {
  const forecastString = forecast
    .map(item => `- ${item.day}: The weather will be ${item.condition}, making it a ${item.washingStatus} day for laundry.`)
    .join('\n');

  return `
    You are a straightforward weather advisor. Speak like a normal person giving practical advice - no cute language, no excessive enthusiasm, no childish expressions.
    
    Based on the following 72-hour weather forecast, provide a concise and practical plan for when to do the washing over the next few days.

    - Provide exactly 2 sentences.
    - First sentence: highlight the absolute best day(s) to get the washing out over the next 3 days.
    - Second sentence: mention the day(s) to absolutely avoid within this short timeframe.
    - Write like you're texting a friend - casual but informative.
    - No cute words, no "adorable" language, no excessive exclamation points.
    - Do not use markdown formatting.
    - Be direct and practical.

    Here is the 72-hour forecast:
    ${forecastString}
  `;
}

export const generateShortTermSummary = async (forecast: ShortTermForecastItem[]): Promise<string> => {
  try {
    const prompt = createPrompt(forecast);
    const text = await aiClient.callWithPrompt(prompt, 150);
    return text;
  } catch (error) {
    console.error("Error generating content from Gemini API:", error);

    if (SecureAIClient.isQuotaError(error)) {
      return "📊 Daily AI quota reached. Basic weather recommendations are still available above. The AI summary will return tomorrow when quotas reset.";
    }

    return "🤖 AI summary temporarily unavailable. Your weather recommendations above are still accurate and updated with the latest conditions.";
  }
};

export const validateLocationInput = async (userInput: string): Promise<string> => {
  try {
    const result = await aiClient.validateLocation(userInput);

    // Basic check to prevent overly long responses
    if (result.suggestion && result.suggestion.split(' ').length > 3) {
      if (import.meta.env.DEV) {
        console.warn(`Gemini validation returned an unexpectedly long string for input "${userInput}": "${result.suggestion}"`);
      }
      return "invalid";
    }

    // Return suggestion if valid, otherwise mark as invalid
    if (result.isAbusive || !result.isValid) {
      return "invalid";
    }

    return result.suggestion || userInput;

  } catch (error) {
    console.error("Error during location validation with Gemini API:", error);
    // If there's an API error, return the original input and let geocoding handle validation
    if (import.meta.env.DEV) {
      console.warn(`Gemini validation failed for "${userInput}", falling back to original input`);
    }
    return userInput;
  }
};

export const getPlacenameFromCoords = async (coords: { lat: number; lon: number }): Promise<string> => {
    try {
        const text = await aiClient.getPlaceName(coords.lat, coords.lon);

        // Clean up any markdown formatting or extra text
        const cleanedName = text.replace(/\*\*/g, '').replace(/^\"|\"$/g, '').trim();
        if (import.meta.env.DEV) {
          console.log(`Gemini AI identified location for coords (${coords.lat}, ${coords.lon}):`, cleanedName);
        }
        return cleanedName;
    } catch (error) {
        console.error("Error getting placename from coordinates:", error);
        return "Unknown Location";
    }
};

/**
 * Generate AI-powered drying advice for today's conditions
 * Analyzes hourly weather data and provides clear, actionable recommendations
 *
 * DEPRECATED: Use generateComprehensiveDryingAdvice instead for better performance
 */
export const generateTodayDryingAdvice = async (
  hourlyData: Array<{
    time: string;
    temperature: number;
    humidity: number;
    rainChance: number;
    windSpeed: number;
    uvIndex: number;
    dewPoint: number;
    dryingScore: number;
    suitable: boolean;
  }>,
  dryingWindow: { startTime: string; endTime: string; averageScore: number } | undefined,
  currentTime: string,
  sunset: string
): Promise<string> => {
  try {
    const relevantHours = hourlyData.slice(0, 24);

    const text = await aiClient.generateAdvice({
      hourlyData: relevantHours,
      dryingWindow,
      currentTime,
      sunset,
      maxTokens: 100
    } as any);

    if (import.meta.env.DEV) {
      console.log("Generated today's drying advice:", text);
    }
    return text;

  } catch (error) {
    console.error("Error generating today's drying advice:", error);

    if (SecureAIClient.isQuotaError(error)) {
      return "AI advice temporarily unavailable due to quota limits. Your weather recommendations above are still accurate.";
    }

    return ""; // Silent fail for other errors
  }
};

/**
 * Generate comprehensive drying advice combining 24h detail + 3-day outlook in ONE call
 * This replaces the need for separate generateTodayDryingAdvice + generateShortTermSummary calls
 */
export const generateComprehensiveDryingAdvice = async (
  hourlyData: Array<{
    time: string;
    temperature: number;
    humidity: number;
    rainChance: number;
    windSpeed: number;
    uvIndex: number;
    dewPoint: number;
    dryingScore: number;
    suitable: boolean;
  }>,
  dryingWindow: { startTime: string; endTime: string; averageScore: number } | undefined,
  forecastData: ShortTermForecastItem[],
  currentTime: string,
  sunset: string
): Promise<string> => {
  try {
    const relevantHours = hourlyData.slice(0, 24);

    const text = await aiClient.generateAdvice({
      hourlyData: relevantHours,
      dryingWindow,
      currentTime,
      sunset,
      forecastData,
      maxTokens: 120
    } as any);

    if (import.meta.env.DEV) {
      console.log("Generated comprehensive drying advice:", text);
    }
    return text;

  } catch (error) {
    console.error("Error generating comprehensive drying advice:", error);
    if (SecureAIClient.isQuotaError(error)) {
      return "📊 Daily AI quota reached. Basic weather recommendations are still available.";
    }
    return "🤖 AI advice temporarily unavailable. Weather data above is still accurate.";
  }
};

/**
 * Generate AI-powered woodburner advice for FlameCast
 * Analyzes burning conditions and provides clear, actionable recommendations
 */
export const generateWoodburnerAdvice = async (
  recommendation: WoodburnerRecommendation,
  flameCastScores: FlameCastScore[]
): Promise<string> => {
  try {
    const { currentConditions, status, burningWindow, warnings } = recommendation;

    // Get ACTUAL current hour's data (find the hour matching current time)
    const now = new Date();
    const currentHourScore = flameCastScores.find(score => {
      const scoreDate = new Date(score.time);
      return scoreDate.getHours() === now.getHours() &&
             scoreDate.getDate() === now.getDate();
    }) || flameCastScores[0];

    if (import.meta.env.DEV) {
      console.log("🔍 Finding current hour:", now.getHours());
      console.log("🔍 Current hour score found:", currentHourScore ? new Date(currentHourScore.time).getHours() : "NOT FOUND");
      console.log("🔍 ΔT from currentHourScore:", currentHourScore?.temperatureDifferential);
      console.log("🔍 Outdoor temp from currentHourScore:", currentHourScore?.outdoorTemp);
    }

    const currentScore = currentHourScore.totalScore;
    const currentStatus = currentHourScore.status;
    const currentOutdoorTemp = currentHourScore.outdoorTemp;
    const currentDeltaT = currentHourScore.temperatureDifferential;

    // Format window time
    const formatTime = (isoTime: string) => new Date(isoTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    const windowInfo = burningWindow ? `${formatTime(burningWindow.startTime)}-${formatTime(burningWindow.endTime)}` : 'None today';
    const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

    const prompt = `Woodburner expert advice for UK/Ireland. Two distinct sections:

**Today's Woodburning Conditions** (2 bullets): Brief overview, best window
**If you need to light your woodburner right now (${currentTime})** (3-4 bullets): Detailed, specific steps for THESE EXACT conditions

━━━ CURRENT CONDITIONS AT ${currentTime} ━━━
FlameCast: ${Math.round(currentScore)}/100 (${currentStatus})
ΔT: ${currentDeltaT.toFixed(1)}°C ← CRITICAL: Use this EXACT value in your advice. Pre-calculated.
Outdoor: ${currentOutdoorTemp}°C | Pressure: ${currentConditions.pressure}mb | Humidity: ${currentConditions.humidity}% | Wind: ${currentConditions.windSpeed}km/h
Best window today: ${windowInfo}
${warnings.length > 0 ? `Warnings: ${warnings.join(', ')}` : ''}

ΔT GUIDE: 15°C+=exceptional draft | 10-15°C=strong | 5-10°C=moderate | 2-5°C=weak | <2°C=very weak

RULES FOR BULLETS:
- First bullet: Brief status ("Draft is moderate with ΔT of X°C")
- Next 2-3 bullets: VERY specific actions for these exact conditions
- Reference actual values (ΔT, outdoor temp, humidity, pressure, wind)
- Technical details OK (kindling size, vent settings, fuel prep)
- Short bullets but information-dense
- No score numbers
- CRITICAL: NO ** markdown inside bullets. NO bold labels like "**Overview:**" or "**Draft:**"
- Write plain text only in bullets

GOOD EXAMPLE:
* Draft is moderate with ΔT of 8.0°C - chimney pulling but not strongly
* Use very dry kindling (<15% moisture) in small splits to generate immediate heat
* Open air vents fully initially to compensate for weaker natural draft

BAD EXAMPLE (DO NOT DO THIS):
* **Draft is moderate** with ΔT of 8.0°C - chimney pulling but not strongly
* **Overview:** Today's conditions are marginal
* **Use very dry kindling** (<15% moisture) in small splits`;

    // DEBUG: Log current conditions being sent to AI
    if (import.meta.env.DEV) {
      console.log("=== AI PROMPT DEBUG ===");
      console.log("Current hour:", now.getHours() + ":00");
      console.log("Current ΔT being sent:", currentDeltaT.toFixed(1), "°C");
      console.log("Indoor temp:", currentHourScore.indoorTemp, "°C");
      console.log("Outdoor temp:", currentOutdoorTemp, "°C");
      console.log("Current score:", currentScore, "Status:", currentStatus);
      console.log("======================");
    }

    const advice = await aiClient.callWithPrompt(prompt, 200);
    if (import.meta.env.DEV) {
      console.log("Generated woodburner advice:", advice);
    }
    return advice;

  } catch (error) {
    console.error("Error generating woodburner advice:", error);
    if (SecureAIClient.isQuotaError(error)) {
      return "📊 Daily AI quota reached. FlameCast recommendations above are still accurate.";
    }
    return ""; // Silent fail for other errors
  }
};