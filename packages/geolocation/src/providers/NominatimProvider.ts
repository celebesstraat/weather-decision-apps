/**
 * Nominatim (OpenStreetMap) geocoding provider
 * Rate limit: 1 request per second
 * Cache: 24 hours
 */

import type {
  Location,
  GeocodingResult,
  Coordinates,
  NominatimResponse,
  RateLimitState,
  CachedLocation,
} from '../types';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = '@weather-apps/geolocation (weather-decision-apps)';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MIN_CONFIDENCE = 0.5; // Minimum importance score for results

/**
 * NominatimProvider class for geocoding and reverse geocoding
 */
export class NominatimProvider {
  private rateLimitState: RateLimitState = {
    lastRequestTime: 0,
    requestCount: 0,
    resetTime: Date.now(),
  };

  private cache: Map<string, CachedLocation> = new Map();

  /**
   * Search for a location by name
   * @param query - Location name to search
   * @returns GeocodingResult with location data
   */
  async searchLocation(query: string): Promise<GeocodingResult> {
    if (!query || query.trim().length === 0) {
      return {
        success: false,
        error: 'Search query cannot be empty',
      };
    }

    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { success: true, location: cached };
    }

    try {
      await this.enforceRateLimit();

      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '1',
      });

      const response = await fetch(
        `${NOMINATIM_BASE_URL}/search?${params.toString()}`,
        {
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Nominatim API error: ${response.status} ${response.statusText}`,
        };
      }

      const results = (await response.json()) as NominatimResponse[];

      if (!results || results.length === 0) {
        return {
          success: false,
          error: `No location found for: ${query}`,
        };
      }

      const result = results[0]!;

      // Check minimum confidence threshold
      if (result.importance && result.importance < MIN_CONFIDENCE) {
        return {
          success: false,
          error: `Low confidence match for: ${query}. Please be more specific.`,
          details: {
            confidence: result.importance,
            suggestion: result.display_name,
          },
        };
      }

      const location = this.parseNominatimResponse(result);
      this.saveToCache(cacheKey, location);

      return {
        success: true,
        location,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Nominatim search failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Reverse geocode coordinates to place name
   * @param coordinates - Coordinates to reverse geocode
   * @returns GeocodingResult with location name
   */
  async reverseGeocode(coordinates: Coordinates): Promise<GeocodingResult> {
    const { latitude, longitude } = coordinates;

    // Validate coordinates
    if (!this.isValidCoordinates(latitude, longitude)) {
      return {
        success: false,
        error: 'Invalid coordinates provided',
      };
    }

    const cacheKey = `reverse:${latitude.toFixed(6)}:${longitude.toFixed(6)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { success: true, location: cached };
    }

    try {
      await this.enforceRateLimit();

      const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        format: 'json',
      });

      const response = await fetch(
        `${NOMINATIM_BASE_URL}/reverse?${params.toString()}`,
        {
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Nominatim API error: ${response.status} ${response.statusText}`,
        };
      }

      const result = (await response.json()) as NominatimResponse;

      const location = this.parseNominatimResponse(result);
      this.saveToCache(cacheKey, location);

      return {
        success: true,
        location,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Nominatim reverse geocoding failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Parse Nominatim API response to Location object
   * @param response - Raw Nominatim response
   * @returns Location object
   */
  private parseNominatimResponse(response: NominatimResponse): Location {
    const coordinates: Coordinates = {
      latitude: parseFloat(response.lat),
      longitude: parseFloat(response.lon),
    };

    // Extract country and region from address
    const address = response.address || {};
    const country = address.country || undefined;
    const region = address.state || address.province || undefined;

    // Extract location name (city, town, or general name)
    const name =
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      response.display_name.split(',')[0] ||
      response.display_name;

    return {
      name,
      coordinates,
      displayName: response.display_name,
      country,
      region,
      confidence: response.importance || 0.5,
    };
  }

  /**
   * Enforce rate limiting (1 request per second)
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.rateLimitState.lastRequestTime;

    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      const delayNeeded = RATE_LIMIT_DELAY - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, delayNeeded));
    }

    this.rateLimitState.lastRequestTime = Date.now();
  }

  /**
   * Validate latitude and longitude ranges
   */
  private isValidCoordinates(latitude: number, longitude: number): boolean {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  /**
   * Get location from cache if not expired
   */
  private getFromCache(key: string): Location | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const isExpired = cached.expiresAt < Date.now();
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.location;
  }

  /**
   * Save location to cache with TTL
   */
  private saveToCache(key: string, location: Location): void {
    this.cache.set(key, {
      location,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_TTL,
    });
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size (for monitoring)
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Clean expired entries from cache
   */
  cleanExpiredCache(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (cached.expiresAt < now) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}
