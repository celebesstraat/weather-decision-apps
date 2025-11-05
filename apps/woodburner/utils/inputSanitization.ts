/**
 * Input Sanitization Utilities
 *
 * Security utilities for sanitizing and validating user inputs
 * Prevents XSS, SQL injection, command injection, and other common attacks
 */

/**
 * Sanitizes location input to prevent injection attacks
 * Allows: letters, numbers, spaces, hyphens, apostrophes, commas, periods
 * Blocks: HTML tags, special characters, scripts
 */
export const sanitizeLocationInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove any script-like content
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Allow only safe characters for location names
  // Letters (any language), numbers, spaces, hyphens, apostrophes, commas, periods, parentheses
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-',.()áéíóúàèìòùâêîôûäëïöüñçæøåÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÄËÏÖÜÑÇÆØÅ]/g, '');

  // Limit length to prevent buffer overflow attacks
  const MAX_LENGTH = 200;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  // Remove excessive whitespace (more than 2 consecutive spaces)
  sanitized = sanitized.replace(/\s{3,}/g, '  ');

  return sanitized;
};

/**
 * Validates that location input is safe and reasonable
 * Returns validation result with error message if invalid
 */
export const validateLocationInput = (input: string): { valid: boolean; error?: string } => {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Location is required' };
  }

  const sanitized = input.trim();

  // Check minimum length
  if (sanitized.length < 2) {
    return { valid: false, error: 'Location must be at least 2 characters' };
  }

  // Check maximum length
  if (sanitized.length > 200) {
    return { valid: false, error: 'Location name is too long (max 200 characters)' };
  }

  // Check for suspicious patterns (repeated special characters)
  if (/(.)\1{10,}/.test(sanitized)) {
    return { valid: false, error: 'Invalid location format' };
  }

  // Check for script injection attempts
  if (/<script|javascript:|on\w+\s*=/i.test(sanitized)) {
    return { valid: false, error: 'Invalid characters in location' };
  }

  // Check for SQL injection attempts
  if (/(\bor\b|\band\b).*[=<>]|--|;|\/\*|\*\/|xp_|sp_|exec\s*\(/i.test(sanitized)) {
    return { valid: false, error: 'Invalid location format' };
  }

  // Check for command injection attempts
  if (/[;&|`$(){}[\]\\]/.test(sanitized)) {
    return { valid: false, error: 'Invalid characters in location' };
  }

  return { valid: true };
};

/**
 * Sanitizes coordinate values
 * Ensures they are valid numbers within valid ranges
 */
export const sanitizeCoordinates = (lat: number, lon: number): { latitude: number; longitude: number } | null => {
  // Parse as floats
  const latitude = parseFloat(String(lat));
  const longitude = parseFloat(String(lon));

  // Validate they are actual numbers
  if (isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  // Validate ranges
  if (latitude < -90 || latitude > 90) {
    return null;
  }

  if (longitude < -180 || longitude > 180) {
    return null;
  }

  // Round to reasonable precision (6 decimal places = ~10cm accuracy)
  return {
    latitude: Math.round(latitude * 1000000) / 1000000,
    longitude: Math.round(longitude * 1000000) / 1000000,
  };
};

/**
 * Sanitizes API key input
 * Removes whitespace and validates format
 */
export const sanitizeApiKey = (apiKey: string): string => {
  if (!apiKey || typeof apiKey !== 'string') {
    return '';
  }

  // Remove all whitespace
  let sanitized = apiKey.replace(/\s/g, '');

  // Remove any control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Limit length (typical API keys are 20-100 characters)
  const MAX_LENGTH = 200;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
};

/**
 * Rate limiting helper to prevent abuse
 * Tracks requests per IP/session
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 20, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed
   * Returns true if allowed, false if rate limit exceeded
   */
  checkLimit(identifier: string = 'default'): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Remove old requests outside the time window
    const recentRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);

    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    // Cleanup old entries periodically
    if (this.requests.size > 1000) {
      this.cleanup();
    }

    return true;
  }

  /**
   * Reset limits for an identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Cleanup old entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const recentRequests = timestamps.filter(timestamp => now - timestamp < this.windowMs);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

// Export singleton instance
export const locationRateLimiter = new RateLimiter(20, 60000); // 20 requests per minute
