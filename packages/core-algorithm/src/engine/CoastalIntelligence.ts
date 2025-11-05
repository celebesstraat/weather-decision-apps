/**
 * CoastalIntelligence - Coastal Distance Adjustments
 *
 * Adjusts wind tolerance based on proximity to coast.
 * Coastal locations experience different wind patterns than inland areas.
 *
 * LOGIC:
 * - Coastal areas (<5km): Higher wind tolerance (frequent sea breezes)
 * - Near-coastal (5-20km): Moderate adjustment
 * - Inland (>20km): Standard wind assessment
 *
 * DATA SOURCE:
 * Can integrate with UK coastal distance data from GetTheWashingOut
 * (220+ locations with pre-calculated coastal distances)
 */

import { CoastalDataPoint } from '../types';

export class CoastalIntelligence {
  private coastalData: Map<string, CoastalDataPoint>;

  constructor() {
    this.coastalData = new Map();
  }

  /**
   * Load coastal distance data
   */
  public loadCoastalData(data: CoastalDataPoint[]): void {
    this.coastalData.clear();
    data.forEach(point => {
      const key = this.generateLocationKey(point.latitude, point.longitude);
      this.coastalData.set(key, point);
    });
  }

  /**
   * Get wind tolerance modifier based on coastal distance
   *
   * @param coastalDistance - Distance to nearest coast in km
   * @param windSpeed - Current wind speed in km/h
   * @returns Modifier value (-20 to +20) to adjust wind scoring
   */
  public getWindToleranceModifier(
    coastalDistance: number,
    windSpeed: number
  ): number {
    // Coastal zones with different wind characteristics
    if (coastalDistance <= 5) {
      // Very coastal: High wind tolerance
      // Sea breezes are normal and often beneficial
      return this.calculateCoastalModifier(windSpeed, 1.5);
    } else if (coastalDistance <= 20) {
      // Near-coastal: Moderate wind tolerance
      return this.calculateCoastalModifier(windSpeed, 1.2);
    } else if (coastalDistance <= 50) {
      // Inland transition zone: Slight adjustment
      return this.calculateCoastalModifier(windSpeed, 1.0);
    } else {
      // Fully inland: Standard wind assessment
      return 0;
    }
  }

  /**
   * Calculate the actual modifier value
   */
  private calculateCoastalModifier(windSpeed: number, tolerance: number): number {
    // Wind speed ranges (km/h)
    const LIGHT_WIND = 15;
    const MODERATE_WIND = 25;
    const STRONG_WIND = 40;

    if (windSpeed <= LIGHT_WIND) {
      // Light winds: Slight boost for coastal areas (more air movement)
      return 5 * tolerance;
    } else if (windSpeed <= MODERATE_WIND) {
      // Moderate winds: Optimal for coastal, still good for inland
      return 10 * tolerance;
    } else if (windSpeed <= STRONG_WIND) {
      // Strong winds: Coastal areas can handle better
      return 15 * tolerance;
    } else {
      // Very strong winds: Even coastal areas struggle
      // But still more tolerant than inland
      return Math.max(0, (20 - (windSpeed - STRONG_WIND) * 0.5) * tolerance);
    }
  }

  /**
   * Get coastal type adjustment
   */
  public getCoastalTypeModifier(coastType: 'exposed' | 'sheltered' | 'estuary'): number {
    switch (coastType) {
      case 'exposed':
        return -10; // Exposed coasts have harsher conditions
      case 'sheltered':
        return +10; // Sheltered bays/coves are ideal
      case 'estuary':
        return +5; // Estuaries have moderate shelter
      default:
        return 0;
    }
  }

  /**
   * Find nearest coastal data point
   */
  public findNearestCoastalPoint(
    latitude: number,
    longitude: number
  ): CoastalDataPoint | null {
    if (this.coastalData.size === 0) return null;

    let nearest: CoastalDataPoint | null = null;
    let minDistance = Infinity;

    this.coastalData.forEach(point => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        point.latitude,
        point.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = point;
      }
    });

    return nearest;
  }

  /**
   * Estimate coastal distance if not provided
   * This is a simplified estimation - actual coastal data is preferred
   */
  public estimateCoastalDistance(
    latitude: number,
    longitude: number
  ): number {
    // UK/Ireland coastline reference points (simplified)
    const coastalPoints = [
      { lat: 51.5074, lon: 0.1278 }, // London (Thames)
      { lat: 53.4084, lon: -2.9916 }, // Liverpool
      { lat: 55.9533, lon: -3.1883 }, // Edinburgh
      { lat: 51.4545, lon: -2.5879 }, // Bristol
      { lat: 53.4808, lon: -2.2426 }, // Manchester
      { lat: 54.5973, lon: -5.9301 }, // Belfast
      { lat: 53.3498, lon: -6.2603 }, // Dublin
    ];

    // Find minimum distance to any coastal reference point
    let minDistance = Infinity;
    coastalPoints.forEach(point => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        point.lat,
        point.lon
      );
      minDistance = Math.min(minDistance, distance);
    });

    return minDistance;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate location key for map lookup
   */
  private generateLocationKey(latitude: number, longitude: number): string {
    // Round to 2 decimal places for fuzzy matching
    return `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  }

  /**
   * Analyze coastal influence on weather patterns
   */
  public analyzeCoastalInfluence(
    coastalDistance: number,
    _windDirection: number
  ): {
    seaBreezeRisk: number; // 0-1
    landBreezeRisk: number; // 0-1
    temperatureModeration: number; // 0-1
  } {
    const isCoastal = coastalDistance < 20;

    // Simplified analysis - could be enhanced with actual wind direction
    // relative to nearest coast
    const seaBreezeRisk = isCoastal ? 0.3 : 0.0;
    const landBreezeRisk = isCoastal ? 0.2 : 0.0;
    const temperatureModeration = isCoastal ? 0.5 : 0.1;

    return {
      seaBreezeRisk,
      landBreezeRisk,
      temperatureModeration,
    };
  }
}
