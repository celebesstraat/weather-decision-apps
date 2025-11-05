/**
 * Coastal Intelligence Module
 *
 * Provides sophisticated coastal distance calculations and marine influence analysis
 * for the UK and Ireland using real geographic data and intelligent interpolation.
 *
 * Features:
 * - Direct lookup for 220+ known UK locations
 * - Geographic interpolation for unknown locations
 * - 5-tier coastal classification system
 * - Exponential distance decay modeling
 * - Graduated coastal modifiers for weather factors
 */

import { ALGORITHM_CONFIG } from './config';

// Import coastal distances database
import ukCoastalDistances from '../../data/uk-coastal-distances.json';

/**
 * UK city coordinates for interpolation
 * Subset of major cities with known coordinates
 */
const UK_CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
    "London": { lat: 51.5074, lon: -0.1278 },
    "Manchester": { lat: 53.4808, lon: -2.2426 },
    "Birmingham": { lat: 52.4862, lon: -1.8904 },
    "Edinburgh": { lat: 55.9533, lon: -3.1883 },
    "Glasgow": { lat: 55.8642, lon: -4.2518 },
    "Liverpool": { lat: 53.4084, lon: -2.9916 },
    "Bristol": { lat: 51.4545, lon: -2.5879 },
    "Cardiff": { lat: 51.4816, lon: -3.1791 },
    "Belfast": { lat: 54.5973, lon: -5.9301 },
    "Aberdeen": { lat: 57.1497, lon: -2.0943 },
    "Brighton": { lat: 50.8225, lon: -0.1372 },
    "Newcastle": { lat: 54.9783, lon: -1.6178 },
    "Exeter": { lat: 50.7184, lon: -3.5339 },
    "Plymouth": { lat: 50.3755, lon: -4.1427 },
    "Portsmouth": { lat: 50.8198, lon: -1.0880 },
    "Southampton": { lat: 50.9097, lon: -1.4044 },
    "York": { lat: 53.9600, lon: -1.0873 },
    "Cambridge": { lat: 52.2053, lon: 0.1218 },
    "Norwich": { lat: 52.6309, lon: 1.2974 },
    "Inverness": { lat: 57.4778, lon: -4.2247 },
    "Dundee": { lat: 56.4620, lon: -2.9707 },
    "Perth": { lat: 56.3960, lon: -3.4370 },
    "Stirling": { lat: 56.1165, lon: -3.9369 },
    "Swansea": { lat: 51.6214, lon: -3.9436 },
    "Dublin": { lat: 53.3498, lon: -6.2603 },
    "Cork": { lat: 51.8969, lon: -8.4863 },
    "Galway": { lat: 53.2707, lon: -9.0568 },
    "Hull": { lat: 53.7457, lon: -0.3367 },
    "Blackpool": { lat: 53.8175, lon: -3.0357 },
    "Kirkwall": { lat: 58.9810, lon: -2.9540 }
};

/**
 * Haversine distance calculation between two points
 */
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

/**
 * Find nearest cities from lookup table for interpolation
 */
const findNearestCities = (lat: number, lon: number, count: number = 3): Array<{name: string, distance: number, coastalDistance: number}> => {
    const cities = Object.keys(UK_CITY_COORDINATES).map(cityName => {
        const coords = UK_CITY_COORDINATES[cityName as keyof typeof UK_CITY_COORDINATES];
        const distance = haversineDistance(lat, lon, coords.lat, coords.lon);
        const coastalDistance = ukCoastalDistances[cityName as keyof typeof ukCoastalDistances];

        return {
            name: cityName,
            distance,
            coastalDistance
        };
    }).filter(city => city.coastalDistance !== undefined);

    return cities.sort((a, b) => a.distance - b.distance).slice(0, count);
};

/**
 * Apply corrections for UK's complex geography
 */
const applyUKGeographyCorrections = (lat: number, lon: number, baseDistance: number): number => {
    // Scotland: Much more complex coastline
    if (lat > 55) {
        return baseDistance * 0.6; // Coastal influence extends further
    }

    // Wales: Mountainous interior
    if (lon < -3 && lat > 51.3 && lat < 53.5) {
        if (lon < -3.5) return baseDistance * 0.8; // West Wales
        return baseDistance * 1.2; // Mid Wales mountains
    }

    // Southwest England: Peninsula effect
    if (lat < 51.2 && lon < -2) {
        return baseDistance * 0.7;
    }

    // East Anglia: Relatively inland despite coastal position
    if (lat > 52 && lat < 53 && lon > 0) {
        return baseDistance * 1.3;
    }

    // Peak District / Pennines: Inland hills
    if (lat > 53 && lat < 54.5 && lon > -2.5 && lon < -1) {
        return baseDistance * 1.4;
    }

    return baseDistance;
};

/**
 * Fallback estimation using UK geographic boundaries
 */
const estimateCoastalDistanceFromBoundaries = (latitude: number, longitude: number): number => {
    const UK_BOUNDS = {
        north: 60.8,    // Shetland
        south: 49.9,    // Scilly Isles
        east: 1.8,      // Norfolk
        west: -8.2      // Northern Ireland
    };

    const latFactor = 111; // km per degree latitude
    const lonFactor = 69;  // km per degree longitude at UK latitudes

    // Distance to each edge
    const distToNorth = (UK_BOUNDS.north - latitude) * latFactor;
    const distToSouth = (latitude - UK_BOUNDS.south) * latFactor;
    const distToEast = (UK_BOUNDS.east - longitude) * lonFactor;
    const distToWest = (longitude - UK_BOUNDS.west) * lonFactor;

    // Minimum distance to any edge is rough coastal distance
    const minEdgeDistance = Math.min(distToNorth, distToSouth, distToEast, distToWest);

    // Apply UK geography corrections
    return applyUKGeographyCorrections(latitude, longitude, minEdgeDistance);
};

/**
 * Enhanced coastal distance calculation using comprehensive lookup table
 * and intelligent geographic interpolation for unknown locations
 */
export const calculateCoastalDistance = (latitude: number, longitude: number, locationName?: string): number => {
    // 1. Direct lookup first (exact match)
    if (locationName && ukCoastalDistances[locationName as keyof typeof ukCoastalDistances] !== undefined) {
        return ukCoastalDistances[locationName as keyof typeof ukCoastalDistances];
    }

    // 2. Geographic interpolation from nearest known cities
    const nearestCities = findNearestCities(latitude, longitude, 3);

    if (nearestCities.length === 0) {
        // Fallback to UK boundary estimation
        return estimateCoastalDistanceFromBoundaries(latitude, longitude);
    }

    // Distance-weighted interpolation
    let weightedDistance = 0;
    let totalWeight = 0;

    nearestCities.forEach(city => {
        const weight = 1 / (city.distance + 1); // Closer cities have higher weight
        weightedDistance += city.coastalDistance * weight;
        totalWeight += weight;
    });

    return Math.max(0, weightedDistance / totalWeight);
};

/**
 * 5-tier coastal classification system
 */
export type CoastalClassification = 'STRONGLY_COASTAL' | 'COASTAL' | 'TRANSITIONAL' | 'WEAKLY_INLAND' | 'STRONGLY_INLAND';

export const getCoastalClassification = (distanceToCoast_km: number): CoastalClassification => {
    const { STRONGLY_COASTAL_DISTANCE, COASTAL_DISTANCE, SOMEWHAT_INLAND_DISTANCE, INLAND_DISTANCE } = ALGORITHM_CONFIG.COASTAL;

    if (distanceToCoast_km < STRONGLY_COASTAL_DISTANCE) return "STRONGLY_COASTAL";
    if (distanceToCoast_km < COASTAL_DISTANCE) return "COASTAL";
    if (distanceToCoast_km < SOMEWHAT_INLAND_DISTANCE) return "TRANSITIONAL";
    if (distanceToCoast_km < INLAND_DISTANCE) return "WEAKLY_INLAND";
    return "STRONGLY_INLAND";
};

/**
 * Enhanced coastal influence calculation (0-1 scale) using real distances
 */
export const calculateCoastalInfluence = (latitude: number, longitude: number, locationName?: string): number => {
    const coastalDistance = calculateCoastalDistance(latitude, longitude, locationName);

    // Apply exponential distance decay: coastal influence diminishes over 20km inland
    const coastalInfluence = Math.max(0, Math.exp(-coastalDistance / 15));

    return coastalInfluence;
};

/**
 * Graduated coastal modifiers based on 5-tier classification system
 * Applied to humidity, wind direction effects, and temperature moderation
 */
export const COASTAL_MODIFIERS = {
    STRONGLY_COASTAL: {
        humidityPenalty: 1.15,       // 15% more humid due to marine moisture
        windOffshoreBonus: 1.20,     // 20% bonus for dry offshore winds
        windOnshoreePenalty: 0.85,   // 15% penalty for moist onshore winds
        temperatureModeration: 0.95, // 5% less temperature variation (marine effect)
        description: "Strong marine influence"
    },
    COASTAL: {
        humidityPenalty: 1.10,       // 10% more humid
        windOffshoreBonus: 1.15,     // 15% offshore bonus
        windOnshoreePenalty: 0.90,   // 10% onshore penalty
        temperatureModeration: 0.97, // 3% temperature moderation
        description: "Clear marine influence"
    },
    TRANSITIONAL: {
        humidityPenalty: 1.05,       // 5% more humid
        windOffshoreBonus: 1.08,     // 8% offshore bonus
        windOnshoreePenalty: 0.95,   // 5% onshore penalty
        temperatureModeration: 0.99, // 1% temperature moderation
        description: "Mixed marine/continental conditions"
    },
    WEAKLY_INLAND: {
        humidityPenalty: 1.02,       // 2% more humid (residual marine influence)
        windOffshoreBonus: 1.03,     // 3% offshore bonus
        windOnshoreePenalty: 0.98,   // 2% onshore penalty
        temperatureModeration: 1.01, // 1% enhanced temperature extremes
        description: "Slight continental advantage"
    },
    STRONGLY_INLAND: {
        humidityPenalty: 1.0,        // No humidity penalty
        windOffshoreBonus: 1.0,      // No directional wind effects
        windOnshoreePenalty: 1.0,    // No directional wind effects
        temperatureModeration: 1.03, // 3% better temperature extremes for drying
        description: "Full continental drying advantage"
    }
} as const;

/**
 * Calculate bearing from one point to another (for wind direction analysis)
 */
export const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360; // Normalize to 0-360
};

/**
 * Check if location is considered coastal (convenience function)
 */
export const isCoastal = (latitude: number, longitude: number, locationName?: string): boolean => {
    return calculateCoastalInfluence(latitude, longitude, locationName) > 0.3; // >30% coastal influence
};

/**
 * Get comprehensive coastal analysis for a location
 */
export interface CoastalAnalysis {
    distance: number;
    classification: CoastalClassification;
    influence: number;
    modifiers: typeof COASTAL_MODIFIERS[CoastalClassification];
    isCoastal: boolean;
}

export const analyzeCoastalConditions = (
    latitude: number,
    longitude: number,
    locationName?: string
): CoastalAnalysis => {
    const distance = calculateCoastalDistance(latitude, longitude, locationName);
    const classification = getCoastalClassification(distance);
    const influence = calculateCoastalInfluence(latitude, longitude, locationName);
    const modifiers = COASTAL_MODIFIERS[classification];
    const coastal = influence > 0.3;

    return {
        distance,
        classification,
        influence,
        modifiers,
        isCoastal: coastal
    };
};
