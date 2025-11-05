/**
 * WindAnalyzer - Topographic Wind Analysis
 *
 * Analyzes wind conditions considering:
 * - Topographic shelter (buildings, trees, hills)
 * - Urban vs rural exposure
 * - Wind direction relative to prevailing patterns
 * - Gust potential based on terrain
 *
 * APPLICATIONS:
 * - Drying: Wind accelerates evaporation but too much causes issues
 * - Burning: Wind affects chimney draft and smoke direction
 * - General: Wind is a key comfort/safety factor
 */

import { Location, WindAnalysis } from '../types';

export class WindAnalyzer {
  // Prevailing wind direction for UK/Ireland (southwest = 225°)
  private readonly PREVAILING_DIRECTION = 225;

  /**
   * Analyze wind conditions for a location
   */
  public analyzeWind(
    windSpeed: number,
    windDirection: number,
    location: Location
  ): WindAnalysis {
    // Calculate shelter factor
    const shelterFactor = this.calculateShelterFactor(location);

    // Calculate direction factor (how aligned with prevailing winds)
    const directionFactor = this.calculateDirectionFactor(windDirection);

    // Calculate gust potential
    const gustPotential = this.calculateGustPotential(
      windSpeed,
      location.urbanDensity || 'suburban',
      location.elevation || 0
    );

    // Calculate effective wind speed (adjusted for shelter)
    const effectiveSpeed = windSpeed * (1 - shelterFactor * 0.5);

    // Calculate overall wind score (0-100)
    const score = this.scoreWind(
      effectiveSpeed,
      shelterFactor,
      directionFactor,
      gustPotential
    );

    return {
      effectiveSpeed,
      shelterFactor,
      directionFactor,
      gustPotential,
      score,
    };
  }

  /**
   * Calculate shelter factor based on location characteristics
   */
  private calculateShelterFactor(location: Location): number {
    let factor = 0.5; // baseline (suburban)

    // Use provided shelter factor if available
    if (location.shelterFactor !== undefined) {
      factor = location.shelterFactor;
    } else if (location.urbanDensity) {
      // Estimate from urban density
      switch (location.urbanDensity) {
        case 'urban':
          factor = 0.7; // High shelter (buildings)
          break;
        case 'suburban':
          factor = 0.5; // Moderate shelter
          break;
        case 'rural':
          factor = 0.2; // Low shelter (exposed)
          break;
      }
    }

    // Adjust for wind exposure
    if (location.windExposure) {
      switch (location.windExposure) {
        case 'high':
          factor *= 0.5; // Reduce shelter
          break;
        case 'medium':
          factor *= 1.0; // No change
          break;
        case 'low':
          factor *= 1.5; // Increase shelter (capped at 1.0 below)
          break;
      }
    }

    // Adjust for elevation (higher = more exposed)
    if (location.elevation !== undefined) {
      const elevationFactor = Math.max(0, 1 - (location.elevation / 1000) * 0.3);
      factor *= elevationFactor;
    }

    return Math.max(0, Math.min(1, factor));
  }

  /**
   * Calculate direction factor (alignment with prevailing winds)
   */
  private calculateDirectionFactor(windDirection: number): number {
    // Calculate angular difference from prevailing direction
    let diff = Math.abs(windDirection - this.PREVAILING_DIRECTION);

    // Normalize to 0-180 range
    if (diff > 180) {
      diff = 360 - diff;
    }

    // Convert to 0-1 factor (0° diff = 1.0, 180° diff = 0.0)
    return 1 - (diff / 180);
  }

  /**
   * Calculate gust potential
   */
  private calculateGustPotential(
    windSpeed: number,
    urbanDensity: 'urban' | 'suburban' | 'rural',
    elevation: number
  ): number {
    let potential = 0;

    // Base gust potential from wind speed
    if (windSpeed < 15) {
      potential = 0.1;
    } else if (windSpeed < 25) {
      potential = 0.3;
    } else if (windSpeed < 40) {
      potential = 0.6;
    } else {
      potential = 0.9;
    }

    // Urban areas have turbulent gusts (building effects)
    if (urbanDensity === 'urban') {
      potential *= 1.3;
    } else if (urbanDensity === 'rural') {
      // Rural areas have steadier winds
      potential *= 0.8;
    }

    // Elevation increases gust potential
    const elevationFactor = 1 + (elevation / 1000) * 0.2;
    potential *= elevationFactor;

    return Math.max(0, Math.min(1, potential));
  }

  /**
   * Score wind conditions (0-100)
   *
   * Scoring philosophy:
   * - Light wind (5-15 km/h): Good (60-80)
   * - Moderate wind (15-25 km/h): Optimal (80-100)
   * - Strong wind (25-40 km/h): Acceptable (40-60)
   * - Very strong (>40 km/h): Poor (0-40)
   */
  private scoreWind(
    effectiveSpeed: number,
    shelterFactor: number,
    directionFactor: number,
    gustPotential: number
  ): number {
    let score = 50; // baseline

    // Score based on effective wind speed
    if (effectiveSpeed < 5) {
      // Too calm
      score = 30;
    } else if (effectiveSpeed < 15) {
      // Light wind - good
      score = 60 + (effectiveSpeed - 5) * 2;
    } else if (effectiveSpeed < 25) {
      // Moderate wind - optimal
      score = 80 + (effectiveSpeed - 15);
    } else if (effectiveSpeed < 40) {
      // Strong wind - declining
      score = 60 - (effectiveSpeed - 25);
    } else {
      // Very strong - poor
      score = Math.max(0, 40 - (effectiveSpeed - 40) * 2);
    }

    // Boost score for good shelter in strong winds
    if (effectiveSpeed > 25) {
      score += shelterFactor * 15;
    }

    // Slight boost for prevailing wind direction (more predictable)
    score += directionFactor * 5;

    // Penalty for high gust potential
    score -= gustPotential * 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Classify wind speed into categories
   */
  public classifyWindSpeed(speed: number): {
    category: string;
    description: string;
    beaufortScale: number;
  } {
    if (speed < 1) {
      return {
        category: 'Calm',
        description: 'Smoke rises vertically',
        beaufortScale: 0,
      };
    } else if (speed < 6) {
      return {
        category: 'Light air',
        description: 'Smoke drift indicates wind direction',
        beaufortScale: 1,
      };
    } else if (speed < 12) {
      return {
        category: 'Light breeze',
        description: 'Wind felt on face, leaves rustle',
        beaufortScale: 2,
      };
    } else if (speed < 20) {
      return {
        category: 'Gentle breeze',
        description: 'Leaves and small twigs move',
        beaufortScale: 3,
      };
    } else if (speed < 29) {
      return {
        category: 'Moderate breeze',
        description: 'Small branches move, raises dust',
        beaufortScale: 4,
      };
    } else if (speed < 39) {
      return {
        category: 'Fresh breeze',
        description: 'Small trees sway, wavelets on water',
        beaufortScale: 5,
      };
    } else if (speed < 50) {
      return {
        category: 'Strong breeze',
        description: 'Large branches move, umbrellas difficult',
        beaufortScale: 6,
      };
    } else if (speed < 62) {
      return {
        category: 'Near gale',
        description: 'Whole trees move, resistance when walking',
        beaufortScale: 7,
      };
    } else if (speed < 75) {
      return {
        category: 'Gale',
        description: 'Twigs break off trees, hard to walk',
        beaufortScale: 8,
      };
    } else {
      return {
        category: 'Strong gale',
        description: 'Slight structural damage, dangerous conditions',
        beaufortScale: 9,
      };
    }
  }

  /**
   * Get wind direction as compass point
   */
  public getWindDirectionCompass(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((degrees % 360) / 22.5)) % 16;
    return directions[index]!;
  }

  /**
   * Analyze wind consistency over time
   */
  public analyzeWindConsistency(
    windReadings: Array<{ speed: number; direction: number; time: string }>
  ): {
    speedVariability: number; // 0-1 (0=steady, 1=highly variable)
    directionStability: number; // 0-1 (0=shifting, 1=steady)
    gustiness: number; // 0-1
  } {
    if (windReadings.length < 2) {
      return { speedVariability: 0, directionStability: 1, gustiness: 0 };
    }

    // Calculate speed variability
    const speeds = windReadings.map(r => r.speed);
    const avgSpeed = speeds.reduce((sum, s) => sum + s, 0) / speeds.length;
    const speedStdDev = this.calculateStdDev(speeds);
    const speedVariability = Math.min(1, speedStdDev / avgSpeed);

    // Calculate direction stability (circular statistics needed for angles)
    const directions = windReadings.map(r => r.direction);
    const directionStability = this.calculateDirectionalStability(directions);

    // Estimate gustiness from speed variability
    const gustiness = Math.min(1, speedVariability * 1.5);

    return {
      speedVariability,
      directionStability,
      gustiness,
    };
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate directional stability (circular statistics)
   */
  private calculateDirectionalStability(directions: number[]): number {
    // Convert to radians and calculate mean direction using circular statistics
    const radians = directions.map(d => d * Math.PI / 180);
    const sinSum = radians.reduce((sum, r) => sum + Math.sin(r), 0);
    const cosSum = radians.reduce((sum, r) => sum + Math.cos(r), 0);

    // Mean resultant length (0-1, where 1 is perfectly consistent)
    const r = Math.sqrt(sinSum * sinSum + cosSum * cosSum) / directions.length;

    return r;
  }
}
