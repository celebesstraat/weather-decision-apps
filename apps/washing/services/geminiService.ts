import type { ShortTermForecastItem } from "../types";
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

export const generateShortTermSummary = async (forecast: ShortTermForecastItem[]): Promise<string> => {
  try {
    // Note: This function is deprecated in favor of generateComprehensiveDryingAdvice
    // but kept for backward compatibility
    const forecastString = forecast
      .map(item => `${item.day}: ${item.condition}, ${item.washingStatus} for drying`)
      .join(' | ');

    const text = await aiClient.generateAdvice({
      forecastSummary: forecastString,
      maxTokens: 150
    } as any);

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