/**
 * Secure AI Client
 *
 * Client for calling serverless Gemini API proxy.
 * Never exposes API keys - all requests go through secure serverless function.
 *
 * @example
 * ```typescript
 * const client = new SecureAIClient({ proxyEndpoint: '/api/gemini' });
 *
 * const response = await client.generateAdvice({
 *   hourlyData,
 *   dryingWindow,
 *   currentTime,
 *   sunset
 * });
 * ```
 */

import type {
  AIClientConfig,
  AIRequest,
  AIResponse,
  AdviceParams,
  LocationValidationResult,
} from '../types';
import { AIServiceError, RateLimitError } from '../types';

export class SecureAIClient {
  private proxyEndpoint: string;
  private timeout: number;

  constructor(config: AIClientConfig) {
    this.proxyEndpoint = config.proxyEndpoint;
    this.timeout = config.timeout || 30000; // 30 second default
  }

  /**
   * Generate comprehensive drying/burning advice
   * @param params - Weather data and context
   * @returns AI-generated advice text
   */
  async generateAdvice(params: AdviceParams): Promise<string> {
    const response = await this.callProxy({
      type: 'comprehensive-advice',
      weatherData: params,
    });

    if (!response.success || !response.text) {
      throw new AIServiceError(
        response.error || 'Failed to generate advice',
        500,
        response.isQuotaError
      );
    }

    return response.text;
  }

  /**
   * Validate location input
   * @param input - User-provided location string
   * @returns Validation result with suggestions
   */
  async validateLocation(input: string): Promise<LocationValidationResult> {
    const response = await this.callProxy({
      type: 'location-validation',
      input,
      maxTokens: 500,
    });

    if (!response.success || !response.text) {
      throw new AIServiceError(
        response.error || 'Failed to validate location',
        500,
        response.isQuotaError
      );
    }

    try {
      return JSON.parse(response.text);
    } catch {
      // Fallback if JSON parsing fails
      return {
        isValid: true,
        isAbusive: false,
        suggestion: null,
        confidence: 50,
        reason: 'Unable to validate',
      };
    }
  }

  /**
   * Get place name from coordinates
   * @param latitude - Latitude
   * @param longitude - Longitude
   * @returns Place name
   */
  async getPlaceName(latitude: number, longitude: number): Promise<string> {
    const response = await this.callProxy({
      type: 'place-name',
      latitude,
      longitude,
      maxTokens: 100,
    });

    if (!response.success || !response.text) {
      throw new AIServiceError(
        response.error || 'Failed to get place name',
        500,
        response.isQuotaError
      );
    }

    return response.text.trim();
  }

  /**
   * Call AI with custom prompt (for app-specific use cases)
   * @param prompt - Custom prompt text
   * @param maxTokens - Maximum tokens in response
   * @returns AI-generated text
   */
  async callWithPrompt(prompt: string, maxTokens: number = 150): Promise<string> {
    const response = await this.callProxy({
      type: 'custom-prompt' as any,
      prompt,
      maxTokens,
    } as any);

    if (!response.success || !response.text) {
      throw new AIServiceError(
        response.error || 'Failed to generate response',
        500,
        response.isQuotaError
      );
    }

    return response.text;
  }

  /**
   * Call the serverless proxy
   * @param request - AI request payload
   * @returns AI response
   */
  private async callProxy(request: AIRequest): Promise<AIResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.proxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle rate limiting
      if (response.status === 429) {
        const data = await response.json();
        throw new RateLimitError(
          data.message || 'Rate limit exceeded',
          data.retryAfter || 60
        );
      }

      // Handle other errors
      if (!response.ok) {
        const data = await response.json();
        throw new AIServiceError(
          data.message || data.error || 'AI service error',
          response.status,
          data.isQuotaError || false
        );
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Re-throw our custom errors
      if (error instanceof AIServiceError || error instanceof RateLimitError) {
        throw error;
      }

      // Handle network errors
      if (error.name === 'AbortError') {
        throw new AIServiceError('Request timeout', 408);
      }

      throw new AIServiceError(
        error.message || 'Network error',
        500
      );
    }
  }

  /**
   * Check if error is a quota error (for graceful degradation)
   * @param error - Error object
   * @returns True if quota error
   */
  static isQuotaError(error: any): boolean {
    return error instanceof AIServiceError && error.isQuotaError;
  }

  /**
   * Check if error is a rate limit error
   * @param error - Error object
   * @returns True if rate limit error
   */
  static isRateLimitError(error: any): boolean {
    return error instanceof RateLimitError;
  }
}
