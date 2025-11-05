/**
 * Serverless Gemini API Proxy
 *
 * This Vercel Edge Function acts as a secure proxy to the Google Gemini API,
 * keeping the API key server-side and adding rate limiting + input validation.
 *
 * Security features:
 * - API key never exposed to client
 * - Rate limiting: 20 requests per minute per IP
 * - Input validation and sanitization
 * - CORS headers for same-origin only
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// In-memory rate limiter (resets on cold start - acceptable for MVP)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20;

/**
 * Rate limiting middleware
 */
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries
  if (entry && entry.resetTime < now) {
    rateLimitStore.delete(identifier);
  }

  const current = rateLimitStore.get(identifier);

  if (!current) {
    // First request in window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Rate limit exceeded
    return false;
  }

  // Increment counter
  current.count++;
  return true;
}

/**
 * Input validation and sanitization
 */
function validateInput(body: any): { valid: boolean; error?: string; sanitized?: any } {
  if (!body) {
    return { valid: false, error: 'Request body is required' };
  }

  const { type, weatherData, location, maxTokens, prompt } = body;

  // Validate type
  const validTypes = ['comprehensive-advice', 'location-validation', 'place-name', 'custom-prompt'];
  if (!type || !validTypes.includes(type)) {
    return { valid: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` };
  }

  // Type-specific validation
  if (type === 'custom-prompt') {
    if (!prompt || typeof prompt !== 'string') {
      return { valid: false, error: 'Prompt is required and must be a string for custom-prompt' };
    }
    if (prompt.length > 10000) {
      return { valid: false, error: 'Prompt must be 10000 characters or less' };
    }
  }

  if (type === 'comprehensive-advice') {
    if (!weatherData) {
      return { valid: false, error: 'weatherData is required for comprehensive-advice' };
    }
    if (!weatherData.hourlyData || !Array.isArray(weatherData.hourlyData)) {
      return { valid: false, error: 'weatherData.hourlyData must be an array' };
    }
  }

  if (type === 'location-validation') {
    if (!body.input || typeof body.input !== 'string') {
      return { valid: false, error: 'input string is required for location-validation' };
    }
    if (body.input.length > 200) {
      return { valid: false, error: 'input must be 200 characters or less' };
    }
  }

  if (type === 'place-name') {
    if (!body.latitude || !body.longitude) {
      return { valid: false, error: 'latitude and longitude are required for place-name' };
    }
    if (isNaN(body.latitude) || isNaN(body.longitude)) {
      return { valid: false, error: 'latitude and longitude must be numbers' };
    }
  }

  // Validate maxTokens if provided
  if (maxTokens !== undefined) {
    if (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 8192) {
      return { valid: false, error: 'maxTokens must be between 1 and 8192' };
    }
  }

  return { valid: true, sanitized: body };
}

/**
 * Main handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  // CORS headers (same-origin only)
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:4173',
    'https://getthewashingout.vercel.app'
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate limiting by IP
  const clientIP = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                   req.headers['x-real-ip'] as string ||
                   'unknown';

  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again in a minute.',
      retryAfter: 60
    });
  }

  // Validate input
  const validation = validateInput(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation error',
      message: validation.error
    });
  }

  // Check API key
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('CRITICAL: VITE_GEMINI_API_KEY not set in environment');
    return res.status(500).json({
      error: 'Configuration error',
      message: 'AI service is not properly configured'
    });
  }

  try {
    // Initialize Gemini
    const genAI = new GoogleGenAI({ apiKey });

    // Generate prompt based on type
    const { type } = validation.sanitized;
    let promptText: string;

    if (type === 'custom-prompt') {
      promptText = validation.sanitized.prompt;
    } else if (type === 'comprehensive-advice') {
      promptText = generateComprehensiveAdvicePrompt(validation.sanitized);
    } else if (type === 'location-validation') {
      promptText = generateLocationValidationPrompt(validation.sanitized.input);
    } else if (type === 'place-name') {
      promptText = generatePlaceNamePrompt(validation.sanitized.latitude, validation.sanitized.longitude);
    } else {
      return res.status(400).json({ error: 'Invalid request type' });
    }

    // Call Gemini API
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: promptText,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: validation.sanitized.maxTokens || 2048,
      }
    });

    const text = result.candidates[0].content.parts[0].text;

    // Return response
    return res.status(200).json({
      success: true,
      text,
      type
    });

  } catch (error: any) {
    console.error('Gemini API error:', error);

    // Handle quota errors gracefully
    if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'AI advice is temporarily unavailable due to high demand. Weather data is still available.',
        isQuotaError: true
      });
    }

    // Generic error
    return res.status(500).json({
      error: 'AI service error',
      message: 'Unable to generate advice at this time'
    });
  }
}

/**
 * Prompt generators
 */
function generateComprehensiveAdvicePrompt(data: any): string {
  const { weatherData } = data;

  // Handle different data formats
  if (weatherData?.hourlyData && weatherData?.currentTime) {
    // Format for generateTodayDryingAdvice / generateComprehensiveDryingAdvice
    const { hourlyData, dryingWindow, currentTime, sunset, forecastData } = weatherData;

    const hourlyDataString = hourlyData.map((h: any) =>
      `${h.time}: score ${Math.round(h.dryingScore)} (${h.temperature}°C, ${h.humidity}% humidity, ${h.rainChance}% rain, ${h.windSpeed}km/h wind, UV ${h.uvIndex})`
    ).join(' | ');

    const dryingWindowInfo = dryingWindow
      ? `${dryingWindow.startTime} - ${dryingWindow.endTime} (Quality Score: ${Math.round(dryingWindow.averageScore)}/100)`
      : 'No optimal drying window identified';

    const forecastString = forecastData
      ? forecastData.map((item: any) => `${item.day}: ${item.condition}, ${item.washingStatus} for drying`).join(' | ')
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
  } else if (weatherData?.forecastSummary) {
    // Format for generateShortTermSummary (deprecated)
    return `Based on the following forecast, provide practical drying advice (2 sentences):

${weatherData.forecastSummary}

Write casually like texting a friend. Highlight best and worst days.`;
  } else {
    // Generic format
    return `You are a helpful UK weather assistant for laundry drying decisions.

WEATHER DATA:
${JSON.stringify(weatherData, null, 2)}

Provide concise, practical drying advice in 2-3 sentences. Focus on when to hang washing out and what conditions to watch for.`;
  }
}

function generateLocationValidationPrompt(input: string): string {
  return `You are a location validation assistant for a UK/Ireland weather app.

User input: "${input}"

Tasks:
1. Is this a valid UK or Ireland location name?
2. If there's a typo, suggest the correct spelling
3. If it's abusive/spam, flag it
4. If it's ambiguous, suggest the most likely location

Respond in JSON format:
{
  "isValid": true/false,
  "isAbusive": true/false,
  "suggestion": "corrected location name or null",
  "confidence": 0-100,
  "reason": "brief explanation"
}

IMPORTANT: Return ONLY valid JSON, no additional text.`;
}

function generatePlaceNamePrompt(latitude: number, longitude: number): string {
  return `You are a reverse geocoding assistant.

Coordinates: ${latitude}, ${longitude}

Return the most specific place name for these coordinates in the UK/Ireland.
Priority: Town/Village > County > Region

Respond with ONLY the place name, nothing else.
Example: "Manchester" or "Bristol, Somerset" or "County Kerry"`;
}
