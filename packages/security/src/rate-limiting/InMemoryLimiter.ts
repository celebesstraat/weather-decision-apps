/**
 * In-Memory Rate Limiter
 *
 * Simple sliding window rate limiter that stores state in memory.
 * Note: Resets on server restart (cold start). For production at scale,
 * consider upgrading to VercelKVLimiter for persistent storage.
 *
 * @example
 * ```typescript
 * const limiter = new InMemoryLimiter({ maxRequests: 20, windowMs: 60000 });
 *
 * if (!limiter.checkLimit(clientIP)) {
 *   return res.status(429).json({ error: 'Rate limit exceeded' });
 * }
 * ```
 */

import type { RateLimitConfig, RateLimitEntry, RateLimiter } from '../types';

export class InMemoryLimiter implements RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if identifier is within rate limit
   * @param identifier - Usually IP address or user ID
   * @returns true if allowed, false if rate limited
   */
  checkLimit(identifier: string): boolean {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // Clean up expired entries
    if (entry && entry.resetTime < now) {
      this.store.delete(identifier);
    }

    const current = this.store.get(identifier);

    if (!current) {
      // First request in window
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (current.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return false;
    }

    // Increment counter
    current.count++;
    return true;
  }

  /**
   * Get remaining requests for identifier
   * @param identifier - Usually IP address or user ID
   * @returns Number of remaining requests in current window
   */
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || entry.resetTime < now) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - entry.count);
  }

  /**
   * Reset rate limit for identifier (useful for testing)
   * @param identifier - Usually IP address or user ID
   */
  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  /**
   * Clear all rate limit entries (useful for testing)
   */
  resetAll(): void {
    this.store.clear();
  }

  /**
   * Get seconds until rate limit window resets for identifier
   * @param identifier - Usually IP address or user ID
   * @returns Seconds until reset, or 0 if not rate limited
   */
  getSecondsUntilReset(identifier: string): number {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || entry.resetTime < now) {
      return 0;
    }

    return Math.ceil((entry.resetTime - now) / 1000);
  }
}
