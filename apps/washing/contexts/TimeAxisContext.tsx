import React, { createContext, useContext, useMemo } from 'react';
import type { DryingScore, HourlyForecast } from '../types';

interface TimeAxisData {
  // Core time range data
  startHour: number;
  endHour: number;
  visibleHours: number[];
  totalHours: number;
  
  // Positioning calculations
  hourWidth: number;
  chartWidth: number;
  leftMargin: number;
  rightMargin: number;
  
  // Sunrise/sunset data
  sunrise: number; // decimal hour (e.g., 6.417 for 6:25)
  sunset: number;  // decimal hour (e.g., 20.05 for 20:03)
  sunriseTime: string; // formatted time "06:25"
  sunsetTime: string;  // formatted time "20:03"
  
  // Helper functions
  getHourPosition: (hour: number) => number; // Get X position for hour
  isHourVisible: (hour: number) => boolean;  // Check if hour is in range
  getResponsiveTimestamps: (screenSize: 'mobile' | 'tablet' | 'desktop') => number[];
}

interface TimeAxisProviderProps {
  children: React.ReactNode;
  hourlyScores: DryingScore[];
  hourlyData?: HourlyForecast[];
  astronomy?: {
    sunrise: string;
    sunset: string;
    sunriseDecimal: number;
    sunsetDecimal: number;
  };
  dayOffset?: number; // 0 = today, 1 = tomorrow, etc.
}

const TimeAxisContext = createContext<TimeAxisData | null>(null);

// UK sunrise/sunset calculator using astronomical formulas
const calculateUKSunriseSunset = (dayOffset: number = 0) => {
  const now = new Date();
  const date = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
  
  // UK average latitude: 54.5°N (covers from Cornwall 50.1°N to Shetland 60.8°N)
  const latitude = 54.5;
  const longitude = -2.0; // UK center longitude
  
  // Day of year calculation
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  // Solar declination angle
  const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
  
  // Hour angle calculation
  const latRad = latitude * Math.PI / 180;
  const declRad = declination * Math.PI / 180;
  
  const hourAngle = Math.acos(-Math.tan(latRad) * Math.tan(declRad));
  
  // Convert to hours (solar noon ± hour angle)
  const solarNoon = 12 - (longitude / 15); // Adjust for longitude
  const hourAngleHours = hourAngle * 180 / Math.PI / 15;
  
  const sunrise = solarNoon - hourAngleHours;
  const sunset = solarNoon + hourAngleHours;
  
  // Clamp to realistic bounds for UK
  const clampedSunrise = Math.max(4.5, Math.min(8.5, sunrise)); // 4:30 - 8:30
  const clampedSunset = Math.max(15.5, Math.min(21.5, sunset));  // 15:30 - 21:30
  
  return {
    sunrise: clampedSunrise,
    sunset: clampedSunset,
    sunriseTime: formatDecimalHour(clampedSunrise),
    sunsetTime: formatDecimalHour(clampedSunset)
  };
};

const formatDecimalHour = (decimalHour: number): string => {
  const hours = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const TimeAxisProvider: React.FC<TimeAxisProviderProps> = ({
  children,
  hourlyScores,
  hourlyData = [],
  astronomy,
  dayOffset = 0
}) => {
  const timeAxisData = useMemo((): TimeAxisData => {
    // Calculate or use provided sunrise/sunset
    const sunData = astronomy || calculateUKSunriseSunset(dayOffset);
    const sunrise = sunData.sunriseDecimal || sunData.sunrise;
    const sunset = sunData.sunsetDecimal || sunData.sunset;
    
    // Define visible hour range (daylight hours with some padding)
    const startHour = Math.max(6, Math.floor(sunrise) - 1);
    const endHour = Math.min(23, Math.ceil(sunset) + 1);
    const visibleHours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
    const totalHours = visibleHours.length;
    
    // Responsive layout calculations
    const baseHourWidth = 32; // Base width per hour in pixels
    const minChartWidth = 320;
    const maxChartWidth = 800;
    const chartWidth = Math.min(maxChartWidth, Math.max(minChartWidth, totalHours * baseHourWidth));
    const hourWidth = chartWidth / totalHours;
    
    // Margins for sunrise/sunset icons and labels
    const leftMargin = 80;  // Space for sunrise icon + time
    const rightMargin = 80; // Space for sunset icon + time
    
    return {
      startHour,
      endHour,
      visibleHours,
      totalHours,
      hourWidth,
      chartWidth,
      leftMargin,
      rightMargin,
      sunrise,
      sunset,
      sunriseTime: sunData.sunrise || sunData.sunriseTime,
      sunsetTime: sunData.sunset || sunData.sunsetTime,
      
      // Helper functions
      getHourPosition: (hour: number) => {
        const hourIndex = hour - startHour;
        return (hourIndex + 0.5) * hourWidth; // Center of hour slot
      },
      
      isHourVisible: (hour: number) => {
        return hour >= startHour && hour <= endHour;
      },
      
      getResponsiveTimestamps: (screenSize: 'mobile' | 'tablet' | 'desktop') => {
        if (screenSize === 'mobile' && totalHours > 8) {
          // Show every 2nd or 3rd hour on mobile to prevent crowding
          const step = totalHours > 12 ? 3 : 2;
          return visibleHours.filter((_, index) => index % step === 0);
        } else if (screenSize === 'tablet' && totalHours > 12) {
          // Show every 2nd hour on tablet for long days
          return visibleHours.filter((_, index) => index % 2 === 0);
        } else {
          // Show all hours on desktop or shorter days
          return visibleHours;
        }
      }
    };
  }, [hourlyScores, hourlyData, astronomy, dayOffset]);
  
  return (
    <TimeAxisContext.Provider value={timeAxisData}>
      {children}
    </TimeAxisContext.Provider>
  );
};

export const useTimeAxis = (): TimeAxisData => {
  const context = useContext(TimeAxisContext);
  if (!context) {
    throw new Error('useTimeAxis must be used within a TimeAxisProvider');
  }
  return context;
};