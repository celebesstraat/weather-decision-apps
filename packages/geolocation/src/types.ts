/**
 * Type definitions for geolocation services
 */

/**
 * Geographic coordinates (latitude, longitude)
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Location with metadata
 */
export interface Location {
  name: string;
  coordinates: Coordinates;
  displayName?: string;
  country?: string;
  region?: string;
  confidence?: number;
}

/**
 * Result from geocoding (forward or reverse)
 */
export interface GeocodingResult {
  success: boolean;
  location?: Location;
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * Nominatim-specific response
 */
export interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
  class?: string;
  type?: string;
  importance?: number;
  boundingbox?: string[];
}

/**
 * Cached location data
 */
export interface CachedLocation {
  location: Location;
  timestamp: number;
  expiresAt: number;
}

/**
 * Browser geolocation API position
 */
export interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  };
  timestamp: number;
}

/**
 * Browser geolocation API error
 */
export interface GeolocationError {
  code: number;
  message: string;
  PERMISSION_DENIED?: number;
  POSITION_UNAVAILABLE?: number;
  TIMEOUT?: number;
}

/**
 * Validation result for UK/Ireland bounds
 */
export interface ValidationResult {
  valid: boolean;
  withinBounds: boolean;
  coordinates?: Coordinates;
  error?: string;
  warnings?: string[];
}

/**
 * Rate limiting state
 */
export interface RateLimitState {
  lastRequestTime: number;
  requestCount: number;
  resetTime: number;
}
