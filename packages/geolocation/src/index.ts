/**
 * @weather-apps/geolocation
 *
 * Comprehensive geolocation services for weather decision apps
 * Includes: Nominatim geocoding, browser geolocation, UK/Ireland validation
 */

// Types
export type {
  Coordinates,
  Location,
  GeocodingResult,
  NominatimResponse,
  CachedLocation,
  GeolocationPosition,
  GeolocationError,
  ValidationResult,
  RateLimitState,
} from './types';

// Providers
export { NominatimProvider } from './providers/NominatimProvider';
export { BrowserGeolocation } from './providers/BrowserGeolocation';

// Validation
export { UKIrelandValidator } from './validation/UKIrelandValidator';
