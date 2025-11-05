/**
 * Vercel Serverless Function - Gemini AI API Proxy
 *
 * Purpose: Secure proxy for Google Gemini API calls
 * Security: API key stored server-side only (never exposed to client)
 *
 * @endpoint POST /api/gemini
 * @body { prompt: string, model?: string, temperature?: number }
 * @returns { text: string } | { error: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Rate limiting configuration
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 20;

/**
 * Simple in-memory rate limiter
 * Note: For production with multiple serverless instances, use Redis or Vercel KV
 */
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Call Google Gemini API with server-side key
 */
async function callGeminiAPI(
  prompt: string,
  model: string = 'gemini-2.5-flash-lite',
  temperature: number = 0.4
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Server configuration error: API key not found');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature,
        maxOutputTokens: 1024,
        topP: 0.95,
        topK: 40
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);

    // Handle specific error codes
    if (response.status === 429) {
      throw new Error('API quota exceeded. Please try again later.');
    } else if (response.status === 403) {
      throw new Error('API key invalid or restricted.');
    } else if (response.status === 400) {
      throw new Error('Invalid request to AI service.');
    }

    throw new Error(`AI service error: ${response.status}`);
  }

  const data = await response.json();

  // Extract text from response
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }

  // Handle blocked content
  if (data.candidates && data.candidates[0]?.finishReason === 'SAFETY') {
    throw new Error('Content blocked by AI safety filters.');
  }

  throw new Error('Unexpected AI response format.');
}

/**
 * Main serverless function handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers - allows both GetTheWashingOut and GetTheWoodburnerOn
  const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:5173',
    'https://getthewashingout.vercel.app',
    'https://getthewoodburneron.vercel.app',
  ];

  const origin = req.headers.origin || '';
  // Allow configured origins or any *.vercel.app domain (for preview deployments)
  if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests.'
    });
  }

  try {
    // Rate limiting based on IP address
    const clientIP = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                     (req.headers['x-real-ip'] as string) ||
                     'unknown';

    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait before trying again.'
      });
    }

    // Validate request body
    const { prompt, model, temperature } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Prompt is required and must be a string.'
      });
    }

    if (prompt.length > 10000) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Prompt is too long (max 10000 characters).'
      });
    }

    // Validate optional parameters
    const validatedModel = model || 'gemini-2.5-flash-lite';
    const validatedTemperature = typeof temperature === 'number'
      ? Math.max(0, Math.min(1, temperature))
      : 0.4;

    // Call Gemini API
    const text = await callGeminiAPI(prompt, validatedModel, validatedTemperature);

    // Return success response
    return res.status(200).json({ text });

  } catch (error) {
    console.error('API handler error:', error);

    // Handle specific error messages
    if (error instanceof Error) {
      // Known error with user-friendly message
      if (error.message.includes('quota') ||
          error.message.includes('rate limit') ||
          error.message.includes('API key') ||
          error.message.includes('Content blocked')) {
        return res.status(429).json({
          error: 'Service unavailable',
          message: error.message
        });
      }

      // Server configuration error
      if (error.message.includes('configuration')) {
        return res.status(500).json({
          error: 'Server error',
          message: 'Service is temporarily unavailable. Please contact support.'
        });
      }
    }

    // Generic error response
    return res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
}

// Export config for Vercel
export const config = {
  maxDuration: 30, // 30 second timeout (Gemini usually responds in 1-3 seconds)
  memory: 256, // MB - sufficient for API proxy
};
