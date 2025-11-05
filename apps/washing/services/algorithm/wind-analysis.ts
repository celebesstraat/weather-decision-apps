/**
 * Wind Analysis Module
 *
 * Provides sophisticated wind direction and effectiveness analysis for drying calculations.
 *
 * Features:
 * - Onshore/offshore wind detection
 * - Urban shelter factor calculation
 * - Topographic wind effects
 * - Seasonal wind pattern adjustments
 * - Prevailing wind analysis for UK/Ireland
 * - Integration with coastal intelligence
 */

import type { CoastalClassification } from './coastal-intelligence';
import { calculateCoastalDistance, getCoastalClassification, calculateCoastalInfluence, COASTAL_MODIFIERS, calculateBearing } from './coastal-intelligence';
import type { LocationData } from '../../types';

/**
 * UK coast reference points for wind direction analysis
 */
const UK_COAST_POINTS = [
    { lat: 50.1, lon: -5.5, name: "Southwest" },      // Land's End area
    { lat: 50.8, lon: 0.3, name: "Southeast" },       // Dover area
    { lat: 52.9, lon: 1.3, name: "East" },            // Norfolk coast
    { lat: 54.8, lon: -3.0, name: "Northwest" },      // Lake District coast
    { lat: 55.0, lon: -1.4, name: "Northeast" },      // Northumberland
    { lat: 57.7, lon: -4.2, name: "Scottish West" },  // Scottish Highlands
    { lat: 58.6, lon: -3.1, name: "Scottish North" }  // Orkney area
];

/**
 * Haversine distance calculation (duplicated for module independence)
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
 * Find approximate direction to nearest coast for wind analysis
 */
const calculateDirectionToNearestCoast = (latitude: number, longitude: number): number => {
    let nearestCoast = UK_COAST_POINTS[0];
    let shortestDistance = haversineDistance(latitude, longitude, nearestCoast.lat, nearestCoast.lon);

    UK_COAST_POINTS.forEach(coast => {
        const distance = haversineDistance(latitude, longitude, coast.lat, coast.lon);
        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestCoast = coast;
        }
    });

    return calculateBearing(latitude, longitude, nearestCoast.lat, nearestCoast.lon);
};

/**
 * Enhanced wind direction analysis with onshore/offshore detection
 */
export const isWindOffshore = (latitude: number, longitude: number, windDirection: number): boolean => {
    // Get direction to nearest coast
    const directionToCoast = calculateDirectionToNearestCoast(latitude, longitude);

    // Wind is offshore if it's blowing away from the coast
    // Wind direction indicates where wind is coming FROM
    // So offshore wind comes from the coast direction
    const windFromCoast = (windDirection + 180) % 360; // Direction wind is blowing TO
    const angleDifference = Math.abs(windFromCoast - directionToCoast);

    // Allow 60-degree tolerance for offshore classification
    return angleDifference < 60 || angleDifference > 300;
};

/**
 * Calculates urban shelter factor based on location characteristics
 * Returns multiplier for wind effectiveness (0.7-1.3)
 */
export const calculateUrbanShelterFactor = (locationData: LocationData): number => {
    // Simple urban detection based on location name
    const locationName = locationData.fullName.toLowerCase();

    // Major cities (high shelter from buildings)
    const majorCities = ['london', 'birmingham', 'manchester', 'glasgow', 'edinburgh', 'liverpool', 'bristol'];
    if (majorCities.some(city => locationName.includes(city))) {
        return 0.75; // Reduced wind effectiveness due to buildings
    }

    // Towns and smaller cities (moderate shelter)
    const urbanKeywords = ['city', 'town', 'borough', 'district'];
    if (urbanKeywords.some(keyword => locationName.includes(keyword))) {
        return 0.85; // Slight reduction in wind effectiveness
    }

    // Rural areas (enhanced wind effectiveness)
    const ruralKeywords = ['village', 'countryside', 'farm', 'moor', 'dale', 'fell'];
    if (ruralKeywords.some(keyword => locationName.includes(keyword))) {
        return 1.2; // Enhanced wind effectiveness
    }

    // Default: no significant shelter effect
    return 1.0;
};

/**
 * Gets current season for wind pattern adjustments
 */
export const getCurrentSeason = (): 'winter' | 'spring' | 'summer' | 'autumn' => {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 12 || month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'autumn'; // Sept-Nov
};

/**
 * Enhanced wind direction analysis using 5-tier coastal classification
 * Returns adjustment factor for wind score based on onshore/offshore detection and coastal classification
 */
export const getWindDirectionFactor = (
    windDirection: number,
    latitude: number,
    longitude: number,
    locationName?: string
): number => {
    if (windDirection === undefined) return 1.0;

    // Get coastal distance and classification
    const coastalDistance = calculateCoastalDistance(latitude, longitude, locationName);
    const coastalClass = getCoastalClassification(coastalDistance);
    const modifiers = COASTAL_MODIFIERS[coastalClass];

    // Get seasonal effects
    const season = getCurrentSeason();

    // Determine if wind is onshore or offshore using enhanced detection
    const isOffshore = isWindOffshore(latitude, longitude, windDirection);

    // Base wind direction factor
    let windDirectionFactor = 1.0;

    // Apply coastal modifiers based on wind direction
    if (isOffshore) {
        // Offshore winds: dry continental air moving seaward
        windDirectionFactor = modifiers.windOffshoreBonus;
    } else {
        // Onshore winds: moist marine air moving inland
        windDirectionFactor = modifiers.windOnshoreePenalty;
    }

    // Apply seasonal adjustments for coastal effects
    let seasonalMultiplier = 1.0;
    const coastalInfluence = calculateCoastalInfluence(latitude, longitude, locationName);

    if (season === 'summer') {
        // Summer: stronger sea-land temperature contrasts enhance coastal effects
        seasonalMultiplier = 1.0 + (coastalInfluence * 0.25); // Up to +25% coastal effect
    } else if (season === 'winter') {
        // Winter: reduced coastal/inland distinction due to similar temperatures
        seasonalMultiplier = 1.0 + (coastalInfluence * 0.08); // Only +8% coastal effect
    } else {
        // Spring/Autumn: moderate seasonal effects
        seasonalMultiplier = 1.0 + (coastalInfluence * 0.15); // +15% coastal effect
    }

    // For strongly inland locations, add prevailing wind preferences
    if (coastalClass === 'STRONGLY_INLAND' || coastalClass === 'WEAKLY_INLAND') {
        const normalizedDir = ((windDirection % 360) + 360) % 360;

        // Westerly winds (225-315°): Prevailing dry winds for UK inland areas
        if (normalizedDir >= 225 && normalizedDir <= 315) {
            const westerlyBonus = coastalClass === 'STRONGLY_INLAND' ? 1.08 : 1.04;
            windDirectionFactor = Math.max(windDirectionFactor, westerlyBonus);
        }
        // Easterly winds (45-135°): Can bring continental moisture in winter
        else if (normalizedDir >= 45 && normalizedDir <= 135 && season === 'winter') {
            const easterlyPenalty = coastalClass === 'STRONGLY_INLAND' ? 0.95 : 0.97;
            windDirectionFactor = Math.min(windDirectionFactor, easterlyPenalty);
        }
    }

    // Apply seasonal multiplier
    return windDirectionFactor * seasonalMultiplier;
};

/**
 * Calculates topographic wind effects based on location
 * Returns multiplier for wind effectiveness (0.8-1.3)
 */
export const calculateTopographicWindEffect = (latitude: number, longitude: number): number => {
    // Basic topographic effects for UK regions
    // In production, this would use digital elevation models

    // Highland Scotland: Complex topography affects wind patterns
    if (latitude > 56.5) {
        // Highlands can both channel and block winds
        const highlandEffect = Math.sin((longitude + 4) * Math.PI) * 0.1 + 1.0;
        return Math.max(0.85, Math.min(1.25, highlandEffect));
    }

    // Welsh valleys: Can channel coastal moisture inland
    if (latitude > 51.5 && latitude < 53 && longitude < -3) {
        // Valley channeling reduces wind effectiveness for drying
        return 0.90;
    }

    // Lake District / Peak District: Hills can block or enhance
    if ((latitude > 54 && latitude < 54.8 && longitude > -3.5 && longitude < -2.5) ||
        (latitude > 53 && latitude < 53.5 && longitude > -2 && longitude < -1.5)) {
        // Upland areas: generally enhanced wind exposure
        return 1.15;
    }

    // River valleys (Thames, Severn): Can trap moisture
    if (
        (latitude > 51.3 && latitude < 51.7 && longitude > -1 && longitude < 0.5) ||  // Thames Valley
        (latitude > 51.5 && latitude < 52.2 && longitude > -2.5 && longitude < -2)    // Severn Valley
    ) {
        return 0.92; // Slight reduction due to moisture retention
    }

    // Default: no significant topographic effect
    return 1.0;
};

/**
 * Comprehensive wind analysis for a location
 */
export interface WindAnalysis {
    directionFactor: number;
    shelterFactor: number;
    topographicFactor: number;
    isOffshore: boolean;
    season: 'winter' | 'spring' | 'summer' | 'autumn';
    coastalClass: CoastalClassification;
    combinedEffectiveness: number;
}

export const analyzeWindConditions = (
    windDirection: number,
    latitude: number,
    longitude: number,
    locationData: LocationData
): WindAnalysis => {
    const directionFactor = getWindDirectionFactor(windDirection, latitude, longitude, locationData.name);
    const shelterFactor = calculateUrbanShelterFactor(locationData);
    const topographicFactor = calculateTopographicWindEffect(latitude, longitude);
    const isOffshore = isWindOffshore(latitude, longitude, windDirection);
    const season = getCurrentSeason();
    const coastalDistance = calculateCoastalDistance(latitude, longitude, locationData.name);
    const coastalClass = getCoastalClassification(coastalDistance);

    // Combined effectiveness multiplier
    const combinedEffectiveness = directionFactor * shelterFactor * topographicFactor;

    return {
        directionFactor,
        shelterFactor,
        topographicFactor,
        isOffshore,
        season,
        coastalClass,
        combinedEffectiveness
    };
};

/**
 * Get wind speed score (0-100) based on optimal drying range
 */
export const calculateWindSpeedScore = (windSpeed_kmh: number): number => {
    // Optimal wind speed range: 5-25 km/h
    const OPTIMAL_MIN = 5;
    const OPTIMAL_MAX = 25;
    const EXTREME_MAX = 50;

    if (windSpeed_kmh < OPTIMAL_MIN) {
        // Too calm - poor air circulation
        return (windSpeed_kmh / OPTIMAL_MIN) * 60; // 0-60 score
    } else if (windSpeed_kmh >= OPTIMAL_MIN && windSpeed_kmh <= OPTIMAL_MAX) {
        // Optimal range - excellent drying
        return 100;
    } else if (windSpeed_kmh > OPTIMAL_MAX && windSpeed_kmh <= EXTREME_MAX) {
        // Too windy - clothes may blow around, reduced effectiveness
        const excess = windSpeed_kmh - OPTIMAL_MAX;
        const range = EXTREME_MAX - OPTIMAL_MAX;
        return 100 - (excess / range) * 40; // 100 down to 60
    } else {
        // Extremely windy - poor for drying
        return 40; // Minimum score for extreme winds
    }
};
