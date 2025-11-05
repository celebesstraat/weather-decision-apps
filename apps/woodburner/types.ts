
export enum RecommendationStatus {
    GET_THE_WASHING_OUT = "GET_THE_WASHING_OUT",
    ACCEPTABLE_CONDITIONS = "ACCEPTABLE_CONDITIONS",
    INDOOR_DRYING_ONLY = "INDOOR_DRYING_ONLY",
}


export enum WeatherCondition {
    // Clear conditions
    CLEAR_DAY = "Clear Day",
    CLEAR_NIGHT = "Clear Night",
    
    // Cloudy conditions
    PARTLY_CLOUDY_DAY = "Partly Cloudy Day",
    PARTLY_CLOUDY_NIGHT = "Partly Cloudy Night",
    CLOUDY = "Cloudy",
    OVERCAST = "Overcast",
    
    // Rain conditions
    LIGHT_RAIN = "Light Rain",
    RAIN = "Rain",
    HEAVY_RAIN = "Heavy Rain",
    SHOWERS = "Showers",
    
    // Storm conditions
    THUNDERSTORM = "Thunderstorm",
    SEVERE_THUNDERSTORM = "Severe Thunderstorm",
    
    // Snow conditions
    LIGHT_SNOW = "Light Snow",
    SNOW = "Snow",
    HEAVY_SNOW = "Heavy Snow",
    BLIZZARD = "Blizzard",
    SLEET = "Sleet",
    
    // Other conditions
    FOG = "Fog",
    MIST = "Mist",
    HAZE = "Haze",
    WINDY = "Windy",
    HOT = "Hot",
    COLD = "Cold",
    
}

export interface ShortTermForecastItem {
    day: string;
    condition: WeatherCondition;
    washingStatus: RecommendationStatus;
    temperature: {
        min: number;
        max: number;
    };
    humidity: {
        min: number;
        max: number;
    };
    dewPoint: {
        min: number;
        max: number;
    };
    dryingWindows?: DryingWindow[];  // All drying windows for the day
    primaryWindow?: DryingWindow;    // Best drying window for the day
}

export interface Favorite {
    id: string;
    name: string;
}

// New types for the proprietary algorithm
export interface HourlyForecast {
    time: string; // e.g., "10:00"
    temperature: number; // in Celsius
    humidity: number; // in %
    windSpeed: number; // in km/h
    rainChance: number; // in %
    uvIndex: number; // 0-11+
    dewPoint: number; // in Celsius
    cloudCover: number; // in % (0-100)
    rainfall: number; // in mm/hour
    
    // Phase 1: Critical Physics Parameters
    vapourPressureDeficit?: number; // in kPa - Direct drying potential
    surfacePressure?: number; // in hPa - Atmospheric pressure  
    shortwaveRadiation?: number; // in W/m² - Actual solar energy
    
    // Phase 2: Enhanced Accuracy Parameters (to be added)
    wetBulbTemperature?: number; // in Celsius - More accurate evaporative cooling
    evapotranspiration?: number; // in mm/day - Real evaporation rates
    
    // Phase 3: Wind Intelligence Parameters (to be added)
    sunshineDuration?: number; // in hours - Actual sun time
    windDirection?: number; // in degrees - Wind direction for shelter logic
}

export interface WeatherData {
    dailySummary: {
        condition: WeatherCondition;
        washingStatus: RecommendationStatus;
    };
    hourly: HourlyForecast[];
    hourlyScores: DryingScore[];  // Hourly drying quality scores for timeline
    recommendation: Recommendation;  // Full recommendation data including drying windows
    astronomy: {
        sunrise: string;  // Local time formatted as "HH:MM"
        sunset: string;   // Local time formatted as "HH:MM"
        sunriseDecimal: number;  // Decimal hours for positioning (e.g. 6.42 for 6:25)
        sunsetDecimal: number;   // Decimal hours for positioning (e.g. 20.05 for 20:03)
    };
}

// Types for real weather API integration
export interface LocationData {
    name: string;
    fullName: string;
    latitude: number;
    longitude: number;
    country: string;
    region?: string;
    confidence: number;
}

export interface WeatherAPIError {
    code: string;
    message: string;
    source: 'geocoding' | 'weather_api' | 'network' | 'validation';
    retryable: boolean;
}




export interface DryingScore {
    hour: number;
    time: string;
    totalScore: number;
    componentScores: {
        humidity: number;
        temperature: number;
        dewPointSpread: number;
        windSpeed: number;
        cloudCover: number;
        
        // Phase 1: New physics-based component scores
        vapourPressureDeficit?: number;
        surfacePressure?: number;
        shortwaveRadiation?: number;
        
        // Phase 2: Enhanced accuracy components (to be added)
        wetBulbTemperature?: number;
        evapotranspiration?: number;
        
        // Phase 3: Wind intelligence components (to be added)
        sunshineDuration?: number;
        windDirection?: number;
    };
    suitable: boolean; // score > threshold
}

export interface DryingWindow {
    startTime: string;
    endTime: string;
    duration: number; // hours
    averageScore: number;
    description: string;
}

export interface Recommendation {
    status: RecommendationStatus;
    timing: string;
    reason: string;
    timeWindow: string; // e.g., "10:00 - 17:00"
    dryingWindow?: DryingWindow;
    alternativeWindows?: DryingWindow[];
    weatherSource: string;
    lastUpdated: Date;
}

