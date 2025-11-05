import React from 'react';
import { WeatherCondition } from '../types';
import {
    // Clear conditions
    WiDaySunny,
    WiNightClear,
    
    // Cloudy conditions  
    WiDayCloudy,
    WiNightAltCloudy,
    WiCloudy,
    WiCloudyGusts,
    
    // Rain conditions
    WiDayRain,
    WiRain,
    WiDayRainWind,
    WiShowers,
    
    // Storm conditions
    WiThunderstorm,
    WiDayThunderstorm,
    
    // Snow conditions
    WiSnow,
    WiSnowflakeCold,
    WiDaySnow,
    WiSnowWind,
    WiSleet,
    
    // Other conditions
    WiFog,
    WiDayFog,
    WiDayHaze,
    WiStrongWind,
    WiHot,
    WiThermometer
} from 'weather-icons-react';

export interface WeatherIconProps {
    size?: number;
    color?: string;
    className?: string;
}

// Icon mapping for all weather conditions
export const getWeatherIcon = (condition: WeatherCondition, props: WeatherIconProps = {}) => {
    const iconProps = {
        size: props.size || 32,
        color: props.color || 'currentColor',
        className: props.className || ''
    };

    switch (condition) {
        // Clear conditions
        case WeatherCondition.CLEAR_DAY:
        case WeatherCondition.CLEAR_DAY:
            return <WiDaySunny {...iconProps} />;
        case WeatherCondition.CLEAR_NIGHT:
            return <WiNightClear {...iconProps} />;
            
        // Cloudy conditions
        case WeatherCondition.PARTLY_CLOUDY_DAY:
            return <WiDayCloudy {...iconProps} />;
        case WeatherCondition.PARTLY_CLOUDY_NIGHT:
            return <WiNightAltCloudy {...iconProps} />;
        case WeatherCondition.CLOUDY:
            return <WiCloudy {...iconProps} />;
        case WeatherCondition.OVERCAST:
            return <WiCloudyGusts {...iconProps} />;
            
        // Rain conditions
        case WeatherCondition.LIGHT_RAIN:
            return <WiDayRain {...iconProps} />;
        case WeatherCondition.RAIN:
        case WeatherCondition.RAIN:
            return <WiRain {...iconProps} />;
        case WeatherCondition.HEAVY_RAIN:
            return <WiDayRainWind {...iconProps} />;
        case WeatherCondition.SHOWERS:
            return <WiShowers {...iconProps} />;
            
        // Storm conditions
        case WeatherCondition.THUNDERSTORM:
            return <WiThunderstorm {...iconProps} />;
        case WeatherCondition.SEVERE_THUNDERSTORM:
            return <WiDayThunderstorm {...iconProps} />;
            
        // Snow conditions
        case WeatherCondition.LIGHT_SNOW:
            return <WiDaySnow {...iconProps} />;
        case WeatherCondition.SNOW:
            return <WiSnow {...iconProps} />;
        case WeatherCondition.HEAVY_SNOW:
            return <WiSnowWind {...iconProps} />;
        case WeatherCondition.BLIZZARD:
            return <WiSnowWind {...iconProps} />;
        case WeatherCondition.SLEET:
            return <WiSleet {...iconProps} />;
            
        // Other conditions
        case WeatherCondition.FOG:
            return <WiFog {...iconProps} />;
        case WeatherCondition.MIST:
            return <WiDayFog {...iconProps} />;
        case WeatherCondition.HAZE:
            return <WiDayHaze {...iconProps} />;
        case WeatherCondition.WINDY:
            return <WiStrongWind {...iconProps} />;
        case WeatherCondition.HOT:
            return <WiHot {...iconProps} />;
        case WeatherCondition.COLD:
            return <WiSnowflakeCold {...iconProps} />;
            
        // Default fallback
        default:
            return <WiDaySunny {...iconProps} />;
    }
};

// Color mapping for different weather conditions
export const getWeatherColor = (condition: WeatherCondition): string => {
    switch (condition) {
        case WeatherCondition.CLEAR_DAY:
        case WeatherCondition.CLEAR_DAY:
            return 'text-yellow-500';
        case WeatherCondition.CLEAR_NIGHT:
            return 'text-blue-200';
        case WeatherCondition.PARTLY_CLOUDY_DAY:
            return 'text-yellow-400';
        case WeatherCondition.PARTLY_CLOUDY_NIGHT:
            return 'text-blue-300';
        case WeatherCondition.CLOUDY:
        case WeatherCondition.OVERCAST:
            return 'text-gray-500';
        case WeatherCondition.LIGHT_RAIN:
        case WeatherCondition.RAIN:
        case WeatherCondition.RAIN:
            return 'text-blue-500';
        case WeatherCondition.HEAVY_RAIN:
        case WeatherCondition.SHOWERS:
            return 'text-blue-600';
        case WeatherCondition.THUNDERSTORM:
        case WeatherCondition.SEVERE_THUNDERSTORM:
            return 'text-purple-600';
        case WeatherCondition.LIGHT_SNOW:
        case WeatherCondition.SNOW:
            return 'text-blue-100';
        case WeatherCondition.HEAVY_SNOW:
        case WeatherCondition.BLIZZARD:
            return 'text-blue-200';
        case WeatherCondition.SLEET:
            return 'text-slate-400';
        case WeatherCondition.FOG:
        case WeatherCondition.MIST:
            return 'text-gray-400';
        case WeatherCondition.HAZE:
            return 'text-yellow-300';
        case WeatherCondition.WINDY:
            return 'text-cyan-600';
        case WeatherCondition.HOT:
            return 'text-red-500';
        case WeatherCondition.COLD:
            return 'text-blue-300';
        default:
            return 'text-gray-500';
    }
};

// Get weather icon with automatic color
export const getWeatherIconWithColor = (condition: WeatherCondition, size?: number, additionalClasses?: string) => {
    const color = getWeatherColor(condition);
    const className = additionalClasses ? `${color} ${additionalClasses}` : color;
    
    return getWeatherIcon(condition, {
        size,
        className
    });
};