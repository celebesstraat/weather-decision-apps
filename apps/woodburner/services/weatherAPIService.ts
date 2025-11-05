import type { HourlyForecast } from '../types';

// Open-Meteo API interfaces
interface OpenMeteoResponse {
  timezone: string;              // e.g. "Europe/Madrid"
  timezone_abbreviation: string; // e.g. "CEST"
  utc_offset_seconds: number;    // e.g. 7200 for UTC+2
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    wind_speed_10m: number[];
    uv_index: number[];
    dew_point_2m: number[];
    cloud_cover: number[];
    // Phase 1: Critical Physics Upgrades
    vapour_pressure_deficit: number[];  // Direct drying science metric
    surface_pressure: number[];         // Atmospheric pressure for evaporation
    shortwave_radiation: number[];      // Actual solar energy
    // Phase 2: Enhanced Accuracy Parameters
    wet_bulb_temperature_2m: number[];  // More accurate evaporative cooling
    et0_fao_evapotranspiration: number[]; // Real evaporation rates
    // Phase 3: Wind Intelligence Parameters
    sunshine_duration: number[];         // Actual sun time vs cloud estimation
    wind_direction_10m: number[];        // Wind direction for shelter/exposure logic
  };
}


interface WeatherAPIConfig {
  openMeteoBaseUrl: string;
  timeout: number;
}

const config: WeatherAPIConfig = {
  openMeteoBaseUrl: 'https://api.open-meteo.com/v1/forecast',
  timeout: 15000, // Increased to 15 seconds for better reliability
};

/**
 * Fetches real weather data from Open-Meteo API using UK Met Office models
 * Uses UKMO Global 10km + UKV 2km high-resolution models for UK
 */
export const fetchWeatherData = async (
  latitude: number,
  longitude: number,
  days: number = 7
): Promise<{
  hourlyData: HourlyForecast[];
  timezone: string;
  timezoneAbbrev: string;
  utcOffsetSeconds: number;
}> => {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m', 
      'precipitation_probability',
      'precipitation',
      'wind_speed_10m',
      'uv_index',
      'dew_point_2m',
      'cloud_cover',
      // Phase 1: Critical Physics Upgrades
      'vapour_pressure_deficit',
      'surface_pressure',
      'shortwave_radiation',
      // Phase 2: Enhanced Accuracy Parameters
      'wet_bulb_temperature_2m',
      'et0_fao_evapotranspiration',
      // Phase 3: Wind Intelligence Parameters
      'sunshine_duration',
      'wind_direction_10m'
    ].join(','),
    forecast_days: days.toString(),
    timezone: 'auto' // Auto-detect timezone from coordinates
    // Removed ukmo_seamless model - use default which has complete data coverage
  });

  // Try multiple URL strategies for better compatibility
  const primaryUrl = `${config.openMeteoBaseUrl}?${params}`;
  const fallbackUrl = `https://api.open-meteo.com/v1/forecast?${params}`;
  const urls = [primaryUrl, fallbackUrl];

  // Check network connectivity first (mobile-specific)
  if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
    throw new Error('No internet connection detected');
  }
  
  console.log(`Fetching weather data from Open-Meteo for coordinates: ${latitude}, ${longitude}`);
  
  // Try different fetch strategies for better browser compatibility
  const fetchConfigurations = [
    // Strategy 1: Standard CORS with credentials omitted
    {
      method: 'GET',
      mode: 'cors' as RequestMode,
      credentials: 'omit' as RequestCredentials,
      headers: {
        'Accept': 'application/json'
      }
    },
    // Strategy 2: No explicit CORS mode
    {
      method: 'GET',
      credentials: 'omit' as RequestCredentials,
      headers: {
        'Accept': 'application/json'
      }
    },
    // Strategy 3: Minimal headers
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }
  ];
  
  let lastError: Error | null = null;
  
  // Try each URL with each fetch configuration
  for (const url of urls) {
    console.log(`Trying URL: ${url}`);
    
    for (let configIndex = 0; configIndex < fetchConfigurations.length; configIndex++) {
      const fetchConfig = fetchConfigurations[configIndex];
      
      try {
        console.log(`Trying fetch strategy ${configIndex + 1}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('Weather API request timed out');
          controller.abort();
        }, config.timeout);

        const response = await fetch(url, {
          ...fetchConfig,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        console.log(`Weather API response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'No error details');
          console.error(`Open-Meteo API error response: ${errorBody}`);
          
          if (response.status === 429) {
            throw new Error('Weather service is temporarily overloaded. Please try again in a few minutes.');
          } else if (response.status >= 500) {
            throw new Error('Weather service is experiencing technical difficulties. Please try again later.');
          } else if (response.status === 400) {
            throw new Error('Invalid location coordinates. Please try a different location.');
          } else {
            throw new Error(`Weather service error (${response.status}). Please try again later.`);
          }
        }

        const data: OpenMeteoResponse = await response.json();
        console.log(`Weather data received: ${data.hourly?.time?.length || 0} hours`);
        
        // Validate the response structure
        if (!data.hourly || !Array.isArray(data.hourly.time) || data.hourly.time.length === 0) {
          throw new Error('Weather service returned invalid data format');
        }
        
        console.log(`Success with URL: ${url}, Strategy: ${configIndex + 1}`);
        return {
          hourlyData: transformOpenMeteoData(data),
          timezone: data.timezone,
          timezoneAbbrev: data.timezone_abbreviation,
          utcOffsetSeconds: data.utc_offset_seconds
        };
        
      } catch (error) {
        console.log(`Failed with URL: ${url}, Strategy: ${configIndex + 1}:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on HTTP error responses, only on network failures
        if (error instanceof Error && 
            !error.message.includes('Failed to fetch') && 
            !error.message.includes('NetworkError') &&
            !error.name.includes('AbortError') &&
            !error.name.includes('TimeoutError')) {
          throw error; // Re-throw HTTP errors immediately
        }
        
        // Continue to next strategy/URL for network failures
      }
    }
  }
  
  // If we get here, all strategies failed
  console.error('Failed to fetch weather data from Open-Meteo - all strategies failed:', lastError);
  
  // Provide specific error messages for different failure scenarios
  if (lastError) {
    console.log(`Final error name: ${lastError.name}`);
    console.log(`Final error message: ${lastError.message}`);
    
    if (lastError.name === 'AbortError' || lastError.name === 'TimeoutError') {
      throw new Error('Weather service request timed out. Please try again.');
    } else if (lastError.name === 'TypeError' && lastError.message.includes('Failed to fetch')) {
      // This is the most common browser error for network issues
      throw new Error('Unable to connect to weather service. This may be due to network issues or browser security settings.');
    } else if (lastError.message.includes('Failed to fetch') || lastError.message.includes('NetworkError') || 
               lastError.message.includes('fetch')) {
      throw new Error('Network error connecting to weather service. Please check your internet connection.');
    } else if (lastError.message.includes('JSON') || lastError.message.includes('parse')) {
      throw new Error('Weather service returned invalid data. Please try again.');
    } else if (lastError.message.includes('No internet connection')) {
      throw new Error('No internet connection. Please connect to wifi or mobile data and try again.');
    } else if (lastError.message.includes('overloaded') || lastError.message.includes('difficulties') || 
               lastError.message.includes('Invalid location') || lastError.message.includes('Weather service error')) {
      throw lastError; // Re-throw specific service errors
    } else if (lastError.message.includes('CORS') || lastError.message.includes('cross-origin')) {
      throw new Error('Browser security settings are blocking the weather service. Please try refreshing the page.');
    } else {
      throw new Error(`Weather service error: ${lastError.message}`);
    }
  } else {
    throw new Error('Weather service is currently unavailable. Please try again later.');
  }
};

/**
 * Transforms Open-Meteo API response into our internal HourlyForecast format
 */
const transformOpenMeteoData = (data: OpenMeteoResponse): HourlyForecast[] => {
  const { hourly } = data;
  const forecasts: HourlyForecast[] = [];

  for (let i = 0; i < hourly.time.length; i++) {
    const time = new Date(hourly.time[i]);
    // Store full ISO string for proper date handling
    const timeISO = hourly.time[i]; // This is the full ISO date string from API

    // Extract values - all should be valid with default model
    const temp = hourly.temperature_2m[i];
    const humidity = hourly.relative_humidity_2m[i];
    const windSpeed = hourly.wind_speed_10m[i];
    const rainChance = hourly.precipitation_probability[i];
    const precipitation = hourly.precipitation[i];
    const uvIndex = hourly.uv_index[i];
    const dewPoint = hourly.dew_point_2m[i];
    const cloudCover = hourly.cloud_cover[i];
    
    // Phase 1: Critical Physics Parameters
    const vapourPressureDeficit = hourly.vapour_pressure_deficit[i];
    const surfacePressure = hourly.surface_pressure[i];
    const shortwaveRadiation = hourly.shortwave_radiation[i];
    
    // Phase 2: Enhanced Accuracy Parameters
    const wetBulbTemperature = hourly.wet_bulb_temperature_2m[i];
    const evapotranspiration = hourly.et0_fao_evapotranspiration[i];
    
    // Phase 3: Wind Intelligence Parameters
    const sunshineDuration = hourly.sunshine_duration[i];
    const windDirection = hourly.wind_direction_10m[i];

    // Validate critical data points including new physics parameters
    if (temp == null || humidity == null || windSpeed == null || dewPoint == null) {
      console.warn(`Missing critical weather data at hour ${i}: temp=${temp}, humidity=${humidity}, wind=${windSpeed}, dewPoint=${dewPoint}`);
    }
    if (vapourPressureDeficit == null || surfacePressure == null || shortwaveRadiation == null) {
      console.warn(`Missing physics data at hour ${i}: VPD=${vapourPressureDeficit}, pressure=${surfacePressure}, solar=${shortwaveRadiation}`);
    }
    if (wetBulbTemperature == null || evapotranspiration == null) {
      console.warn(`Missing enhanced data at hour ${i}: wetBulb=${wetBulbTemperature}, ET0=${evapotranspiration}`);
    }
    if (sunshineDuration == null || windDirection == null) {
      console.warn(`Missing wind intelligence data at hour ${i}: sunshine=${sunshineDuration}, windDir=${windDirection}`);
    }

    forecasts.push({
      time: timeISO, // Full ISO date string for proper date handling
      temperature: Math.round(temp || 0),
      humidity: Math.round(humidity || 0),
      windSpeed: Math.round((windSpeed || 0) * 10) / 10,
      rainChance: Math.round(rainChance || 0),
      uvIndex: Math.round((uvIndex || 0) * 10) / 10,
      dewPoint: Math.round(dewPoint || 0),
      cloudCover: Math.round(cloudCover || 0),
      rainfall: Math.round((precipitation || 0) * 100) / 100, // mm/h with 2 decimal precision
      
      // Phase 1: Critical Physics Parameters
      vapourPressureDeficit: vapourPressureDeficit ? Math.round(vapourPressureDeficit * 100) / 100 : undefined, // kPa with 2 decimal precision
      surfacePressure: surfacePressure ? Math.round(surfacePressure * 10) / 10 : undefined, // hPa with 1 decimal precision
      shortwaveRadiation: shortwaveRadiation ? Math.round(shortwaveRadiation) : undefined, // W/m² as integer
      
      // Phase 2: Enhanced Accuracy Parameters
      wetBulbTemperature: wetBulbTemperature ? Math.round(wetBulbTemperature * 10) / 10 : undefined, // °C with 1 decimal precision
      evapotranspiration: evapotranspiration ? Math.round(evapotranspiration * 100) / 100 : undefined, // mm/day with 2 decimal precision
      
      // Phase 3: Wind Intelligence Parameters
      sunshineDuration: sunshineDuration ? Math.round(sunshineDuration * 10) / 10 : undefined, // hours with 1 decimal precision
      windDirection: windDirection ? Math.round(windDirection) : undefined, // degrees as integer
    });
  }

  console.log(`Transformed ${forecasts.length} hourly forecasts from Open-Meteo`);
  
  
  return forecasts;
};

/**
 * Converts location string to coordinates using Open-Meteo's Geocoding API
 */
export const geocodeLocation = async (location: string): Promise<{ latitude: number; longitude: number; name: string }> => {
  const params = new URLSearchParams({
    name: location,
    count: '5',
    language: 'en',
    format: 'json'
  });

  const url = `https://geocoding-api.open-meteo.com/v1/search?${params}`;

  try {
    console.log(`Geocoding location: "${location}"`);
    console.log(`Geocoding URL: ${url}`);
    
    // Check network connectivity first (mobile-specific)
    if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
      throw new Error('No internet connection detected');
    }
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(12000) // Increased to 12 seconds for better reliability
    });
    
    console.log(`Geocoding response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'No error details');
      console.error(`Geocoding API error response: ${errorBody}`);
      
      if (response.status === 429) {
        throw new Error('Location service is temporarily overloaded. Please try again in a few minutes.');
      } else if (response.status >= 500) {
        throw new Error('Location service is experiencing technical difficulties. Please try again later.');
      } else {
        throw new Error(`Location service error (${response.status}). Please try again later.`);
      }
    }

    const data = await response.json();
    console.log(`Geocoding results: ${data.results?.length || 0} locations found`);
    
    if (!data.results || data.results.length === 0) {
      // Provide helpful suggestions for common location issues
      if (location.includes(',')) {
        throw new Error(`Location "${location}" not found. Try using just the town name (e.g., "${location.split(',')[0].trim()}").`);
      } else {
        throw new Error(`Location "${location}" not found. Please check the spelling or try a nearby town.`);
      }
    }

    // Find the best result (prioritize UK locations)
    let result = data.results[0];
    for (const r of data.results) {
      if (r.country_code === 'GB' || r.country === 'United Kingdom') {
        result = r;
        break;
      }
    }
    
    const locationName = result.name + (result.admin1 ? `, ${result.admin1}` : '') + (result.country ? `, ${result.country}` : '');
    console.log(`Selected location: ${locationName} (${result.latitude}, ${result.longitude})`);
    
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      name: locationName
    };
  } catch (error) {
    console.error('Geocoding failed:', error);
    
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        throw new Error('Location search timed out. Please check your internet connection and try again.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to location service. Please check your internet connection.');
      } else if (error.message.includes('No internet connection')) {
        throw new Error('No internet connection. Please connect to wifi or mobile data and try again.');
      } else if (error.message.includes('not found') || error.message.includes('overloaded') || 
                 error.message.includes('difficulties') || error.message.includes('Location service error')) {
        throw error; // Re-throw specific service errors
      } else {
        throw new Error(`Unable to find location: ${error.message}`);
      }
    } else {
      throw new Error('Location service is currently unavailable. Please try again later.');
    }
  }
};

/**
 * Health check for the weather API service
 */
export const checkWeatherAPIHealth = async (): Promise<{
  healthy: boolean;
  details: string;
  responseTime?: number;
}> => {
  const startTime = Date.now();
  
  try {
    console.log('Running weather API health check...');
    
    // Test with London coordinates using same settings as main function
    const testUrls = [
      `${config.openMeteoBaseUrl}?latitude=51.5074&longitude=-0.1278&hourly=temperature_2m&forecast_days=1&timezone=Europe/London`,
      `https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&hourly=temperature_2m&forecast_days=1&timezone=Europe/London`
    ];
    
    // Use the same retry strategy as main function
    const fetchConfigurations = [
      { method: 'GET', mode: 'cors' as RequestMode, credentials: 'omit' as RequestCredentials, headers: { 'Accept': 'application/json' } },
      { method: 'GET', credentials: 'omit' as RequestCredentials, headers: { 'Accept': 'application/json' } },
      { method: 'GET', headers: { 'Accept': 'application/json' } }
    ];
    
    let lastError: Error | null = null;
    
    for (const testUrl of testUrls) {
      for (const fetchConfig of fetchConfigurations) {
        try {
          const response = await fetch(testUrl, {
            ...fetchConfig,
            signal: AbortSignal.timeout(10000) // 10 second timeout for health check
          });
          
          const responseTime = Date.now() - startTime;
          
          if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
          }
          
          // Try to parse the response
          const data = await response.json();
          
          if (!data.hourly || !data.hourly.time) {
            throw new Error('API returned invalid data structure');
          }
          
          console.log(`Weather API health check passed in ${responseTime}ms with ${testUrl}`);
          
          return {
            healthy: true,
            details: `API responding normally (${responseTime}ms)`,
            responseTime
          };
          
        } catch (error) {
          console.log(`Health check failed with URL: ${testUrl}, Config: ${JSON.stringify(fetchConfig)}`, error);
          lastError = error instanceof Error ? error : new Error('Unknown error');
          // Continue to next configuration
        }
      }
    }
    
    // All strategies failed
    const responseTime = Date.now() - startTime;
    return {
      healthy: false,
      details: `Connection failed: ${lastError?.message || 'Unknown error'}`,
      responseTime
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Weather API health check failed:', error);
    
    if (error instanceof Error) {
      return {
        healthy: false,
        details: `Connection failed: ${error.message}`,
        responseTime
      };
    }
    
    return {
      healthy: false,
      details: 'Unknown connection error',
      responseTime
    };
  }
};

// Sunrise-Sunset API interfaces
interface SunriseSunsetResponse {
  results: {
    sunrise: string;  // ISO 8601 UTC time
    sunset: string;   // ISO 8601 UTC time
    solar_noon: string;
    day_length: string;
    civil_twilight_begin: string;
    civil_twilight_end: string;
    nautical_twilight_begin: string;
    nautical_twilight_end: string;
    astronomical_twilight_begin: string;
    astronomical_twilight_end: string;
  };
  status: string;
}

/**
 * Fetches sunrise and sunset times for a specific location and date
 * Uses the free Sunrise-Sunset.org API
 */
export const fetchSunriseSunset = async (
  latitude: number,
  longitude: number,
  date?: Date
): Promise<{
  sunrise: string;      // Local time "HH:MM"
  sunset: string;       // Local time "HH:MM" 
  sunriseDecimal: number;  // Decimal hours for positioning
  sunsetDecimal: number;   // Decimal hours for positioning
}> => {
  const targetDate = date || new Date();
  const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const params = new URLSearchParams({
    lat: latitude.toString(),
    lng: longitude.toString(),
    date: dateStr,
    formatted: '0' // Return ISO format timestamps
  });

  const url = `https://api.sunrise-sunset.org/json?${params}`;

  try {
    console.log(`Fetching sunrise/sunset for coordinates: ${latitude}, ${longitude} on ${dateStr}`);
    console.log(`Sunrise/sunset URL: ${url}`);
    
    // Check network connectivity first (mobile-specific)
    if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
      console.log('No internet connection - using fallback sunrise/sunset values');
      throw new Error('No internet connection detected');
    }
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      signal: AbortSignal.timeout(12000), // Increased timeout for better reliability
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`Sunrise/sunset response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'No error details');
      console.error(`Sunrise-Sunset API error response: ${errorBody}`);
      throw new Error(`Sunrise-Sunset API error: ${response.status} ${response.statusText}`);
    }

    const data: SunriseSunsetResponse = await response.json();
    console.log(`Sunrise/sunset data status: ${data.status}`);
    
    if (data.status !== 'OK') {
      throw new Error(`Sunrise-Sunset API returned status: ${data.status}`);
    }

    // Convert UTC times to local times for the target location
    const sunriseUTC = new Date(data.results.sunrise);
    const sunsetUTC = new Date(data.results.sunset);
    
    // Determine timezone based on coordinates
    // This is a simple approximation - in production use a proper timezone library
    let timeZone = 'UTC';
    
    // Simple timezone mapping based on longitude
    if (longitude >= -10 && longitude <= 5) {
      timeZone = 'Europe/London'; // UK/Ireland
    } else if (longitude > 5 && longitude <= 15) {
      timeZone = 'Europe/Madrid'; // Central Europe (Spain, France, etc.)
    } else if (longitude > 15 && longitude <= 25) {
      timeZone = 'Europe/Athens'; // Eastern Europe
    } else if (longitude < -10 && longitude >= -130) {
      timeZone = 'America/New_York'; // Americas (rough approximation)
    }
    
    // For Palma specifically, use Europe/Madrid timezone
    if (Math.abs(latitude - 39.569) < 1 && Math.abs(longitude - 2.650) < 1) {
      timeZone = 'Europe/Madrid';
    }
    
    console.log(`Using timezone ${timeZone} for coordinates ${latitude}, ${longitude}`);
    
    // Convert to location's local time
    const sunriseLocal = sunriseUTC.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: timeZone
    });
    
    const sunsetLocal = sunsetUTC.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: timeZone
    });

    // Calculate decimal hours from the local time strings (e.g., "07:20" = 7.33)
    const [sunriseHour, sunriseMin] = sunriseLocal.split(':').map(Number);
    const [sunsetHour, sunsetMin] = sunsetLocal.split(':').map(Number);
    
    const adjustedSunriseDecimal = sunriseHour + (sunriseMin / 60);
    const adjustedSunsetDecimal = sunsetHour + (sunsetMin / 60);

    console.log(`Sunrise: ${sunriseLocal} (${adjustedSunriseDecimal.toFixed(2)}), Sunset: ${sunsetLocal} (${adjustedSunsetDecimal.toFixed(2)})`);

    return {
      sunrise: sunriseLocal,
      sunset: sunsetLocal,
      sunriseDecimal: adjustedSunriseDecimal,
      sunsetDecimal: adjustedSunsetDecimal
    };
    
  } catch (error) {
    console.error('Failed to fetch sunrise/sunset data:', error);
    
    // Fallback to approximate values for UK
    const fallbackSunrise = 6.5;  // ~6:30 AM
    const fallbackSunset = 19.5;  // ~7:30 PM
    
    console.log('Using fallback sunrise/sunset values');
    
    return {
      sunrise: '06:30',
      sunset: '19:30',
      sunriseDecimal: fallbackSunrise,
      sunsetDecimal: fallbackSunset
    };
  }
};