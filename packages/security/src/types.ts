/**
 * Type definitions for security package
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: any;
}

export interface CoordinateValidation {
  valid: boolean;
  latitude?: number;
  longitude?: number;
  error?: string;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimiter {
  checkLimit(identifier: string): boolean;
  getRemainingRequests(identifier: string): number;
  reset(identifier: string): void;
}
