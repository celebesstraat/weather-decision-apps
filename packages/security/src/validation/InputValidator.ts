/**
 * Input Validator
 *
 * Validates and sanitizes user inputs to prevent security vulnerabilities
 * - XSS (Cross-Site Scripting) prevention
 * - SQL Injection prevention
 * - Length limits
 * - Type validation
 * - Coordinate bounds checking
 */

import type { ValidationResult, CoordinateValidation } from '../types';

export class InputValidator {
  /**
   * Validate location input string
   * @param input - User-provided location string
   * @returns Validation result with sanitized input
   */
  static locationInput(input: string): ValidationResult {
    // Length check
    if (input.length < 2 || input.length > 200) {
      return { valid: false, error: 'Location must be between 2 and 200 characters' };
    }

    // XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    if (xssPatterns.some(p => p.test(input))) {
      return { valid: false, error: 'Invalid characters detected' };
    }

    // SQL injection patterns
    const sqlPatterns = [
      /(\bor\b|\band\b).*[=<>]/i,
      /--|;/,
      /\bexec\b/i,
      /\bunion\b.*\bselect\b/i,
      /\bdrop\b.*\btable\b/i,
      /\binsert\b.*\binto\b/i,
    ];

    if (sqlPatterns.some(p => p.test(input))) {
      return { valid: false, error: 'Invalid input format' };
    }

    return { valid: true, sanitized: this.sanitize(input) };
  }

  /**
   * Sanitize string by removing potentially dangerous characters
   * @param input - Raw string input
   * @returns Sanitized string
   */
  private static sanitize(input: string): string {
    return (
      input
        .replace(/<[^>]*>/g, '') // Strip HTML tags
        .replace(/[^a-zA-Z0-9\s\-',.()]/g, '') // Allow only safe characters
        .replace(/\s{2,}/g, ' ') // Collapse whitespace
        .trim()
    );
  }

  /**
   * Validate geographic coordinates
   * @param lat - Latitude (-90 to 90)
   * @param lon - Longitude (-180 to 180)
   * @returns Validation result with rounded coordinates
   */
  static coordinates(lat: number, lon: number): CoordinateValidation {
    if (isNaN(lat) || isNaN(lon)) {
      return { valid: false, error: 'Coordinates must be numbers' };
    }

    if (lat < -90 || lat > 90) {
      return { valid: false, error: 'Latitude must be between -90 and 90' };
    }

    if (lon < -180 || lon > 180) {
      return { valid: false, error: 'Longitude must be between -180 and 180' };
    }

    // Round to 6 decimal places (~10cm accuracy, sufficient for weather)
    return {
      valid: true,
      latitude: Math.round(lat * 1e6) / 1e6,
      longitude: Math.round(lon * 1e6) / 1e6,
    };
  }

  /**
   * Validate AI request body
   * @param body - Request body object
   * @returns Validation result
   */
  static aiRequest(body: any): ValidationResult {
    if (!body) {
      return { valid: false, error: 'Request body is required' };
    }

    const { type, weatherData, input, latitude, longitude, maxTokens } = body;

    // Validate type
    const validTypes = ['comprehensive-advice', 'location-validation', 'place-name'];
    if (!type || !validTypes.includes(type)) {
      return {
        valid: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
      };
    }

    // Type-specific validation
    if (type === 'comprehensive-advice') {
      if (!weatherData) {
        return { valid: false, error: 'weatherData is required for comprehensive-advice' };
      }

      if (!weatherData.hourlyData || !Array.isArray(weatherData.hourlyData)) {
        return { valid: false, error: 'weatherData.hourlyData must be an array' };
      }
    }

    if (type === 'location-validation') {
      if (!input || typeof input !== 'string') {
        return { valid: false, error: 'input string is required for location-validation' };
      }

      if (input.length > 200) {
        return { valid: false, error: 'input must be 200 characters or less' };
      }

      // Check for XSS/SQL injection
      const locationValidation = this.locationInput(input);
      if (!locationValidation.valid) {
        return locationValidation;
      }
    }

    if (type === 'place-name') {
      if (latitude === undefined || longitude === undefined) {
        return { valid: false, error: 'latitude and longitude are required for place-name' };
      }

      const coordValidation = this.coordinates(latitude, longitude);
      if (!coordValidation.valid) {
        return { valid: false, error: coordValidation.error };
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
   * Validate email address (for future use with user accounts)
   * @param email - Email address
   * @returns Validation result
   */
  static email(email: string): ValidationResult {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email || !emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email address' };
    }

    if (email.length > 254) {
      return { valid: false, error: 'Email address too long' };
    }

    return { valid: true, sanitized: email.toLowerCase().trim() };
  }

  /**
   * Validate URL (for future use with webhooks/integrations)
   * @param url - URL string
   * @returns Validation result
   */
  static url(url: string): ValidationResult {
    try {
      const parsed = new URL(url);

      // Only allow http/https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed' };
      }

      // Block localhost/private IPs (SSRF prevention)
      const hostname = parsed.hostname.toLowerCase();
      const privatePatterns = [
        /^localhost$/i,
        /^127\.\d+\.\d+\.\d+$/,
        /^10\.\d+\.\d+\.\d+$/,
        /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
        /^192\.168\.\d+\.\d+$/,
      ];

      if (privatePatterns.some(p => p.test(hostname))) {
        return { valid: false, error: 'Private/localhost URLs are not allowed' };
      }

      return { valid: true, sanitized: parsed.toString() };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }
}
