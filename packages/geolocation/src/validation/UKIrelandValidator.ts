/**
 * UK and Ireland geographic bounds validation
 * Ensures coordinates are within valid UK/Ireland regions
 */

import type { Coordinates, ValidationResult } from '../types';

/**
 * Geographic bounding boxes for UK and Ireland regions
 */
interface BoundingBox {
  name: string;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

/**
 * UKIrelandValidator class for geographic validation
 */
export class UKIrelandValidator {
  /**
   * Define UK and Ireland bounding boxes
   * Includes: England, Scotland, Wales, Northern Ireland, Republic of Ireland
   */
  private readonly boundingBoxes: BoundingBox[] = [
    {
      name: 'England',
      minLat: 50.0,
      maxLat: 55.8,
      minLon: -6.0,
      maxLon: 1.7,
    },
    {
      name: 'Scotland',
      minLat: 55.0,
      maxLat: 60.8,
      minLon: -7.5,
      maxLon: -0.5,
    },
    {
      name: 'Wales',
      minLat: 51.4,
      maxLat: 53.4,
      minLon: -5.5,
      maxLon: -2.6,
    },
    {
      name: 'Northern Ireland',
      minLat: 54.0,
      maxLat: 55.3,
      minLon: -8.2,
      maxLon: -5.3,
    },
    {
      name: 'Republic of Ireland',
      minLat: 51.4,
      maxLat: 55.4,
      minLon: -10.6,
      maxLon: -5.3,
    },
  ];

  /**
   * Validate coordinates are within UK/Ireland bounds
   * @param coordinates - Coordinates to validate
   * @returns ValidationResult with detailed information
   */
  validateCoordinates(coordinates: Coordinates): ValidationResult {
    const { latitude, longitude } = coordinates;

    // Basic coordinate validation
    if (!this.isValidCoordinate(latitude, longitude)) {
      return {
        valid: false,
        withinBounds: false,
        error: 'Invalid coordinates: latitude must be -90 to 90, longitude must be -180 to 180',
      };
    }

    // Check if within any UK/Ireland bounding box
    const region = this.findRegion(latitude, longitude);

    if (region) {
      return {
        valid: true,
        withinBounds: true,
        coordinates,
      };
    }

    // Provide helpful error message for out-of-bounds coordinates
    const nearbyRegion = this.findNearestRegion(latitude, longitude);
    const distance = this.calculateDistance(
      latitude,
      longitude,
      nearbyRegion.centerLat,
      nearbyRegion.centerLon
    );

    return {
      valid: false,
      withinBounds: false,
      coordinates,
      error: `Location is outside UK/Ireland bounds`,
      warnings: [
        `Nearest region: ${nearbyRegion.name} (${distance.toFixed(1)}km away)`,
        'Supported regions: England, Scotland, Wales, Northern Ireland, Republic of Ireland',
      ],
    };
  }

  /**
   * Check if a location is within UK/Ireland bounds
   * @param coordinates - Coordinates to check
   * @returns boolean indicating if within bounds
   */
  isWithinUKIreland(coordinates: Coordinates): boolean {
    const validation = this.validateCoordinates(coordinates);
    return validation.withinBounds;
  }

  /**
   * Get all supported regions
   */
  getSupportedRegions(): string[] {
    return this.boundingBoxes.map((box) => box.name);
  }

  /**
   * Find which region the coordinates are in
   */
  private findRegion(latitude: number, longitude: number): string | null {
    for (const box of this.boundingBoxes) {
      if (
        latitude >= box.minLat &&
        latitude <= box.maxLat &&
        longitude >= box.minLon &&
        longitude <= box.maxLon
      ) {
        return box.name;
      }
    }
    return null;
  }

  /**
   * Find the nearest region to given coordinates
   */
  private findNearestRegion(latitude: number, longitude: number): {
    name: string;
    centerLat: number;
    centerLon: number;
    distance: number;
  } {
    let nearest = {
      name: 'Unknown',
      centerLat: 0,
      centerLon: 0,
      distance: Infinity,
    };

    for (const box of this.boundingBoxes) {
      const centerLat = (box.minLat + box.maxLat) / 2;
      const centerLon = (box.minLon + box.maxLon) / 2;
      const distance = this.calculateDistance(
        latitude,
        longitude,
        centerLat,
        centerLon
      );

      if (distance < nearest.distance) {
        nearest = {
          name: box.name,
          centerLat,
          centerLon,
          distance,
        };
      }
    }

    return nearest;
  }

  /**
   * Validate coordinate ranges
   */
  private isValidCoordinate(latitude: number, longitude: number): boolean {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
