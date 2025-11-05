export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number; // in meters
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  name: string;
  fullName: string;
  country: string;
  region?: string;
  confidence: number; // 0-100
}

export interface ReverseGeocodeResult {
  name: string;
  fullName: string;
  country: string;
  region?: string;
  postcode?: string;
  confidence: number;
}

/**
 * Gets the user's current location using browser geolocation API
 */
export const getCurrentLocation = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 300000 // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      options
    );
  });
};

/**
 * Geocodes UK postcodes using Nominatim (OpenStreetMap)
 */
const geocodeWithNominatim = async (postcode: string): Promise<GeocodeResult | null> => {
  const normalized = normalizeUKPostcode(postcode);
  
  // Try postcode-specific search first
  let url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&postalcode=${encodeURIComponent(normalized)}&limit=1`;
  
  try {
    let response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GetTheWashingOut/1.0'
      }
    });

    if (response.ok) {
      let data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          name: extractLocationName(result.display_name),
          fullName: result.display_name,
          country: 'United Kingdom',
          region: extractRegion(result.display_name),
          confidence: 90
        };
      }
    }
    
    // Fallback: general search with postcode as query
    url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&q=${encodeURIComponent(normalized)}&limit=1`;
    
    response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GetTheWashingOut/1.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          name: extractLocationName(result.display_name),
          fullName: result.display_name,
          country: 'United Kingdom',
          region: extractRegion(result.display_name),
          confidence: 80
        };
      }
    }
  } catch (error) {
    console.warn('Nominatim geocoding error:', error);
  }
  
  return null;
};

/**
 * Extracts the main location name from Nominatim display_name
 */
const extractLocationName = (displayName: string): string => {
  // Format is typically: "Postcode, Town, Region, Country"
  const parts = displayName.split(',').map(p => p.trim());
  
  // Skip the postcode (first part) and return the town/city
  if (parts.length > 1) {
    return parts[1];
  }
  
  return parts[0];
};

/**
 * Extracts the region from Nominatim display_name
 */
const extractRegion = (displayName: string): string => {
  const parts = displayName.split(',').map(p => p.trim());
  
  // Look for region indicators
  for (const part of parts) {
    if (part.includes('Scotland') || part.includes('Alba')) return 'Scotland';
    if (part.includes('England')) return 'England';
    if (part.includes('Wales') || part.includes('Cymru')) return 'Wales';
    if (part.includes('Northern Ireland')) return 'Northern Ireland';
  }
  
  // Return the third part if available (often county/region)
  if (parts.length > 2) {
    return parts[2];
  }
  
  return '';
};

/**
 * Converts a location string to coordinates using Open-Meteo Geocoding API
 */
export const geocodeLocation = async (location: string): Promise<GeocodeResult> => {
  const cleanLocation = location.trim();
  
  // Block coordinate input - only allow town names and postcodes
  const coordinatePattern = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;
  if (coordinatePattern.test(cleanLocation)) {
    throw new Error('Please enter a town name or UK postcode instead of coordinates');
  }
  
  const isPostcode = detectUKPostcode(cleanLocation);
  
  // Try Nominatim first for UK postcodes
  if (isPostcode) {
    try {
      const result = await geocodeWithNominatim(cleanLocation);
      if (result) {
        console.log(`Found postcode via Nominatim: ${result.name}, ${result.country} (${result.latitude}, ${result.longitude})`);
        return result;
      }
    } catch (error) {
      console.warn(`Nominatim geocoding failed for postcode "${cleanLocation}":`, error);
      // Continue to Open-Meteo fallback
    }
  }
  
  // Use Open-Meteo for regular locations and as fallback for postcodes
  const searchQueries = generateLocationSearchQueries(cleanLocation);
  
  for (const query of searchQueries) {
    try {
      const params = new URLSearchParams({
        name: query,
        count: '5',
        language: 'en',
        format: 'json'
      });

      const url = `https://geocoding-api.open-meteo.com/v1/search?${params}`;
      
      console.log(`Trying geocoding query: "${query}"`);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GetTheWashingOut/1.0'
        }
      });

      if (!response.ok) {
        console.warn(`Geocoding API error for "${query}": ${response.status}`);
        continue; // Try next query
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        // Find the best match, prioritizing UK locations
        const bestMatch = findBestLocationMatch(data.results, location);
        
        console.log(`Found location: ${bestMatch.name}, ${bestMatch.country} (${bestMatch.latitude}, ${bestMatch.longitude})`);

        const result: GeocodeResult = {
          latitude: bestMatch.latitude,
          longitude: bestMatch.longitude,
          name: bestMatch.name,
          fullName: formatLocationName(bestMatch),
          country: bestMatch.country || 'Unknown',
          region: bestMatch.admin1,
          confidence: calculateLocationConfidence(bestMatch, location)
        };

        // VALIDATE UK/IRELAND LOCATION - reject locations outside our supported region
        validateUKIrelandLocation(result);

        return result;
      }
    } catch (error) {
      console.warn(`Geocoding attempt failed for "${query}":`, error);
      continue; // Try next query
    }
  }
  
  // If all attempts failed
  const errorMsg = isPostcode 
    ? `Unable to find postcode "${location}". Please check the postcode format (e.g., "M1 1AA" or "m11aa")`
    : `Unable to find location "${location}". Try using just the town/city name (e.g., "Larbert" instead of "Larbert, UK")`;
  
  throw new Error(errorMsg);
};

/**
 * Converts coordinates to a location name using reverse geocoding
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> => {
  // VALIDATE UK/IRELAND COORDINATES FIRST - reject coordinates outside our supported region
  if (!isInUKOrIreland(latitude, longitude)) {
    throw new Error(
      `Coordinates (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°) are outside the UK/Ireland region. ` +
      `This app only supports UK and Ireland locations.`
    );
  }

  try {
    // Use Nominatim (OpenStreetMap) for reverse geocoding as it's free
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GetTheWashingOut/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.display_name) {
      throw new Error('Location not found');
    }

    const address = data.address || {};
    const name = address.city || address.town || address.village || address.hamlet || 'Unknown Location';
    const region = address.county || address.state || address.region;
    const country = address.country || 'Unknown Country';
    const postcode = address.postcode;

    return {
      name,
      fullName: data.display_name,
      country,
      region,
      postcode,
      confidence: data.importance ? Math.round(data.importance * 100) : 75
    };
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    
    // Fallback: provide basic location info
    return {
      name: 'Current Location',
      fullName: `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      country: isInUK(latitude, longitude) ? 'United Kingdom' : 'Unknown',
      confidence: 50
    };
  }
};

/**
 * Finds the best matching location from geocoding results
 */
const findBestLocationMatch = (results: any[], searchQuery: string): any => {
  const query = searchQuery.toLowerCase();
  
  // Prioritize UK locations
  const ukResults = results.filter(r => 
    r.country_code === 'GB' || 
    r.country === 'United Kingdom' ||
    r.country === 'England' ||
    r.country === 'Scotland' ||
    r.country === 'Wales' ||
    r.country === 'Northern Ireland'
  );
  
  if (ukResults.length > 0) {
    // Find exact name matches first
    const exactMatch = ukResults.find(r => r.name.toLowerCase() === query);
    if (exactMatch) return exactMatch;
    
    // Then partial matches
    const partialMatch = ukResults.find(r => 
      r.name.toLowerCase().includes(query) || query.includes(r.name.toLowerCase())
    );
    if (partialMatch) return partialMatch;
    
    // Return first UK result
    return ukResults[0];
  }
  
  // Fallback to first result if no UK locations found
  return results[0];
};

/**
 * Formats location name for display
 */
const formatLocationName = (location: any): string => {
  const parts = [location.name];
  
  if (location.admin1 && location.admin1 !== location.name) {
    parts.push(location.admin1);
  }
  
  if (location.country && location.country !== location.admin1) {
    parts.push(location.country);
  }
  
  return parts.join(', ');
};

/**
 * Calculates confidence score for location match
 */
const calculateLocationConfidence = (location: any, searchQuery: string): number => {
  const query = searchQuery.toLowerCase();
  const name = location.name.toLowerCase();
  
  // Exact match
  if (name === query) return 95;
  
  // Starts with query
  if (name.startsWith(query)) return 85;
  
  // Contains query
  if (name.includes(query)) return 75;
  
  // Query contains name
  if (query.includes(name)) return 70;
  
  // UK location bonus
  const isUK = location.country_code === 'GB' || 
               location.country === 'United Kingdom';
  
  return isUK ? 60 : 50;
};

// ============================================================================
// UK/IRELAND GEOGRAPHIC BOUNDARIES
// This app only supports locations within the UK and Ireland
// ============================================================================

/**
 * Checks if coordinates are within the UK or Ireland
 * UK + Ireland bounding box:
 * - Latitude: 49.5°N (Isles of Scilly) to 61.0°N (Shetland)
 * - Longitude: -10.5°W (Ireland west) to 2.0°E (East Anglia)
 */
const isInUKOrIreland = (latitude: number, longitude: number): boolean => {
  return latitude >= 49.5 && latitude <= 61.0 &&
         longitude >= -10.5 && longitude <= 2.0;
};

/**
 * Validates that a location result is within UK/Ireland boundaries
 * Throws error if location is outside supported region
 */
const validateUKIrelandLocation = (result: GeocodeResult): void => {
  if (!isInUKOrIreland(result.latitude, result.longitude)) {
    throw new Error(
      `Location "${result.name}" is outside the UK/Ireland region. ` +
      `This app only supports UK and Ireland locations.`
    );
  }

  // Also check country codes for additional safety
  const allowedCountries = [
    'United Kingdom', 'UK', 'GB',
    'England', 'Scotland', 'Wales', 'Northern Ireland',
    'Ireland', 'IE', 'Éire'
  ];

  const country = result.country.toLowerCase();
  const isAllowed = allowedCountries.some(c => country.includes(c.toLowerCase()));

  if (!isAllowed) {
    throw new Error(
      `Location "${result.fullName}" appears to be in ${result.country}. ` +
      `This app only supports UK and Ireland locations.`
    );
  }
};

/**
 * Validates coordinate values
 */
export const validateCoordinates = (latitude: number, longitude: number): boolean => {
  return latitude >= -90 && latitude <= 90 && 
         longitude >= -180 && longitude <= 180;
};

/**
 * UK Postcode validation and normalization utilities
 */
const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const UK_POSTCODE_COMPACT_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/i; // Compact format like FK53LZ
const UK_POSTCODE_PARTIAL_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?$/i;

/**
 * Validates if a string is a valid UK postcode (with or without space)
 */
const isValidUKPostcode = (postcode: string): boolean => {
  const cleaned = postcode.trim().toUpperCase();
  return UK_POSTCODE_REGEX.test(cleaned) || UK_POSTCODE_COMPACT_REGEX.test(cleaned);
};

/**
 * Normalizes a UK postcode to standard format (e.g., "fk53lz" -> "FK5 3LZ")
 */
const normalizeUKPostcode = (postcode: string): string => {
  const cleaned = postcode.trim().toUpperCase().replace(/\s+/g, '');
  
  // Handle full postcode - UK postcodes are 5-7 characters without spaces
  if (cleaned.length >= 5 && cleaned.length <= 7) {
    // Last 3 characters are always the inward code
    const inward = cleaned.slice(-3);
    const outward = cleaned.slice(0, -3);
    return `${outward} ${inward}`;
  }
  
  // If already has space or is partial, return as-is (but uppercase)
  return cleaned;
};

/**
 * Detects if a location string is likely a UK postcode
 */
const detectUKPostcode = (location: string): boolean => {
  const original = location.trim();
  const cleaned = original.toUpperCase().replace(/\s+/g, '');
  
  // Check for full postcode pattern (with space)
  if (UK_POSTCODE_REGEX.test(original)) return true;
  
  // Check for compact postcode pattern (no space)
  if (UK_POSTCODE_COMPACT_REGEX.test(cleaned)) return true;
  
  // Check for partial postcode (just outward code like "M1")
  if (UK_POSTCODE_PARTIAL_REGEX.test(cleaned) && cleaned.length >= 2 && cleaned.length <= 4) {
    return true;
  }
  
  // Additional heuristics: looks like postcode if it's short and has numbers and letters
  if (cleaned.length >= 5 && cleaned.length <= 8 && /\d/.test(cleaned) && /[A-Z]/.test(cleaned)) {
    // Check if it could be a valid postcode structure
    const hasLettersAtStart = /^[A-Z]{1,2}/.test(cleaned);
    const hasNumbersAndLetters = /\d.*[A-Z]/.test(cleaned) || /[A-Z].*\d/.test(cleaned);
    
    return hasLettersAtStart && hasNumbersAndLetters;
  }
  
  return false;
};

/**
 * Generates multiple search queries to improve geocoding success
 */
const generateLocationSearchQueries = (location: string): string[] => {
  const queries: string[] = [];
  const cleanLocation = location.trim();
  
  
  // Check if this looks like a UK postcode
  const isPostcode = detectUKPostcode(cleanLocation);
  
  if (isPostcode) {
    // Handle postcode-specific queries
    const normalized = normalizeUKPostcode(cleanLocation);
    
    // Add normalized postcode first
    queries.push(normalized);
    
    // Add original format if different
    if (normalized !== cleanLocation) {
      queries.push(cleanLocation);
    }
    
    // Add various formats for better geocoding success
    const cleaned = cleanLocation.trim().toUpperCase().replace(/\s+/g, '');
    if (cleaned !== normalized.replace(/\s+/g, '') && cleaned !== cleanLocation) {
      queries.push(cleaned);
    }
    
    // Add "UK" suffix variants for international geocoding services
    queries.push(`${normalized}, UK`);
    queries.push(`${normalized}, United Kingdom`);
    queries.push(`${normalized}, England`); // Most postcodes are in England
    
    return [...new Set(queries)].filter(q => q.length > 0);
  }
  
  // Add the original query first for non-postcode locations
  queries.push(cleanLocation);
  
  // Handle village/hamlet names by trying variations
  if (cleanLocation.toLowerCase().includes('village')) {
    const baseName = cleanLocation.replace(/\s*village\s*/gi, '').trim();
    if (baseName) {
      queries.push(baseName);
      queries.push(`${baseName}, UK`);
      queries.push(`${baseName}, Scotland`);
      queries.push(`${baseName}, England`);
    }
  }
  
  // Handle comma-separated locations (e.g., "Larbert, Scotland")
  if (cleanLocation.includes(',')) {
    const parts = cleanLocation.split(',').map(p => p.trim());
    
    // Try just the first part (city/town name)
    if (parts[0]) {
      queries.push(parts[0]);
    }
    
    // Try combinations
    if (parts.length >= 2) {
      queries.push(`${parts[0]}, ${parts[1]}`);
      queries.push(`${parts[0]} ${parts[1]}`);
    }
    
    // Try the last part (might be country/region)
    if (parts.length > 1 && parts[parts.length - 1]) {
      queries.push(parts[parts.length - 1]);
    }
  }
  
  // Add UK country variations for better international geocoding
  if (!cleanLocation.toLowerCase().includes('uk') && 
      !cleanLocation.toLowerCase().includes('united kingdom') &&
      !cleanLocation.toLowerCase().includes('scotland') &&
      !cleanLocation.toLowerCase().includes('england') &&
      !cleanLocation.toLowerCase().includes('wales')) {
    queries.push(`${cleanLocation}, UK`);
    queries.push(`${cleanLocation}, Scotland`);
    queries.push(`${cleanLocation}, England`);
  }
  
  // Handle "City, County/Region, Country" format
  const commonUKRegions = ['Scotland', 'England', 'Wales', 'Northern Ireland', 'UK', 'United Kingdom'];
  commonUKRegions.forEach(region => {
    if (cleanLocation.toLowerCase().includes(region.toLowerCase())) {
      // Try without the region
      const withoutRegion = cleanLocation.replace(new RegExp(`,?\s*${region}`, 'gi'), '').trim();
      if (withoutRegion && withoutRegion !== cleanLocation) {
        queries.push(withoutRegion);
      }
    }
  });
  
  // Remove duplicates while preserving order
  return [...new Set(queries)].filter(q => q.length > 0);
};

/**
 * Gets distance between two coordinates in kilometers
 */
export const getDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};
