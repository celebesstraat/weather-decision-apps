/**
 * Browser Geolocation API provider
 * Requests user permission to access current device location
 */

import type {
  Coordinates,
  GeocodingResult,
  GeolocationPosition,
  GeolocationError,
} from '../types';

/**
 * BrowserGeolocation class for requesting user location
 */
export class BrowserGeolocation {
  private readonly geolocationAPI = navigator.geolocation;
  private isSupported = !!this.geolocationAPI;

  /**
   * Check if geolocation is supported in the browser
   */
  isGeolocationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Request user location from the browser
   * @returns GeocodingResult with current coordinates
   */
  async getCurrentLocation(): Promise<GeocodingResult> {
    if (!this.isSupported) {
      return {
        success: false,
        error: 'Geolocation is not supported in this browser',
      };
    }

    return new Promise((resolve) => {
      this.geolocationAPI.getCurrentPosition(
        (position: GeolocationPosition) => {
          const coordinates: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          resolve({
            success: true,
            location: {
              name: 'Current Location',
              coordinates,
              confidence: this.calculateAccuracy(position.coords.accuracy),
            },
            details: {
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: position.timestamp,
            },
          });
        },
        (error: GeolocationError) => {
          const errorMessage = this.getErrorMessage(error);
          resolve({
            success: false,
            error: errorMessage,
            details: {
              code: error.code,
            },
          });
        },
        {
          enableHighAccuracy: false,
          timeout: 10000, // 10 seconds
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  /**
   * Request user location with high accuracy
   * Takes longer but provides better precision
   * @returns GeocodingResult with current coordinates
   */
  async getCurrentLocationHighAccuracy(): Promise<GeocodingResult> {
    if (!this.isSupported) {
      return {
        success: false,
        error: 'Geolocation is not supported in this browser',
      };
    }

    return new Promise((resolve) => {
      this.geolocationAPI.getCurrentPosition(
        (position: GeolocationPosition) => {
          const coordinates: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          resolve({
            success: true,
            location: {
              name: 'Current Location',
              coordinates,
              confidence: this.calculateAccuracy(position.coords.accuracy),
            },
            details: {
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: position.timestamp,
              highAccuracy: true,
            },
          });
        },
        (error: GeolocationError) => {
          const errorMessage = this.getErrorMessage(error);
          resolve({
            success: false,
            error: errorMessage,
            details: {
              code: error.code,
            },
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 30000, // 30 seconds
          maximumAge: 0, // Force fresh data
        }
      );
    });
  }

  /**
   * Watch user location for continuous updates
   * @param onLocation - Callback for location updates
   * @param onError - Callback for errors
   * @returns Watch ID for cleanup
   */
  watchLocation(
    onLocation: (coordinates: Coordinates) => void,
    onError: (error: string) => void
  ): number {
    if (!this.isSupported) {
      onError('Geolocation is not supported in this browser');
      return 0;
    }

    return this.geolocationAPI.watchPosition(
      (position: GeolocationPosition) => {
        const coordinates: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        onLocation(coordinates);
      },
      (error: GeolocationError) => {
        const errorMessage = this.getErrorMessage(error);
        onError(errorMessage);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  /**
   * Stop watching location
   * @param watchId - Watch ID returned from watchLocation
   */
  clearWatch(watchId: number): void {
    if (this.isSupported && watchId > 0) {
      this.geolocationAPI.clearWatch(watchId);
    }
  }

  /**
   * Check current geolocation permission status
   * Returns 'prompt', 'granted', or 'denied'
   */
  async checkPermissionStatus(): Promise<'prompt' | 'granted' | 'denied'> {
    if (!('permissions' in navigator)) {
      return 'prompt'; // Cannot check, assume prompt needed
    }

    try {
      const result = await navigator.permissions.query({
        name: 'geolocation',
      });
      switch (result.state) {
        case 'granted':
          return 'granted';
        case 'denied':
          return 'denied';
        case 'prompt':
        default:
          return 'prompt';
      }
    } catch {
      return 'prompt'; // Assume prompt if check fails
    }
  }

  /**
   * Convert geolocation error code to human-readable message
   */
  private getErrorMessage(error: GeolocationError): string {
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        return 'Location permission denied. Please enable geolocation in your browser settings.';
      case 2: // POSITION_UNAVAILABLE
        return 'Your location could not be determined. Please check your connection or allow geolocation access.';
      case 3: // TIMEOUT
        return 'Location request timed out. Please try again.';
      default:
        return error.message || 'Failed to get location';
    }
  }

  /**
   * Calculate confidence score based on accuracy
   * Lower accuracy value = higher confidence
   */
  private calculateAccuracy(accuracy?: number): number {
    if (!accuracy) {
      return 0.5;
    }

    // Convert meters to confidence score (0-1)
    // < 10m: 1.0, 100m: 0.9, 1000m: 0.5, > 10000m: 0.1
    if (accuracy < 10) return 1.0;
    if (accuracy < 50) return 0.95;
    if (accuracy < 100) return 0.9;
    if (accuracy < 500) return 0.7;
    if (accuracy < 1000) return 0.5;
    if (accuracy < 5000) return 0.3;
    return 0.1;
  }
}
