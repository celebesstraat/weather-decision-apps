/**
 * Type definitions for AI services
 */

export interface AIClientConfig {
  proxyEndpoint: string;
  timeout?: number;
}

export interface AIRequest {
  type: 'comprehensive-advice' | 'location-validation' | 'place-name';
  weatherData?: any;
  input?: string;
  latitude?: number;
  longitude?: number;
  maxTokens?: number;
}

export interface AIResponse {
  success: boolean;
  text?: string;
  type?: string;
  error?: string;
  isQuotaError?: boolean;
}

export interface AdviceParams {
  hourlyData: any[];
  dryingWindow?: any;
  currentTime: string;
  sunset?: string;
  forecastData?: any[];
}

export interface LocationValidationResult {
  isValid: boolean;
  isAbusive: boolean;
  suggestion: string | null;
  confidence: number;
  reason: string;
}

export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly isQuotaError: boolean = false
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class RateLimitError extends AIServiceError {
  constructor(message: string, public readonly retryAfter: number) {
    super(message, 429, false);
    this.name = 'RateLimitError';
  }
}
