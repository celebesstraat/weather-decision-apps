import { calculateDryingConditions } from './weatherService';
import type { WeatherDataPoint, LocationData, AstronomyData, DryingScore } from '../types';

describe('Drying Window Creation Logic', () => {
  // Mock location data for testing
  const mockLocation: LocationData = {
    latitude: 55.9533,
    longitude: -3.1883,
    name: 'Edinburgh',
    fullName: 'Edinburgh, Scotland, UK',
    country: 'United Kingdom',
    confidence: 95
  };

  // Mock astronomy data for testing (covers all test hours)
  const mockAstronomy: AstronomyData = {
    sunrise: '06:00',
    sunset: '20:00',
    sunriseDecimal: 6.0,
    sunsetDecimal: 20.0
  };

  // Helper to create weather data point with good default values
  const createWeatherPoint = (overrides: Partial<WeatherDataPoint> = {}): WeatherDataPoint => ({
    time: '12:00',
    temperature: 20,
    humidity: 40,
    dewPoint: 10,
    windSpeed: 10,
    cloudCover: 30,
    uvIndex: 5,
    rainChance: 0,
    rainfall: 0,
    ...overrides
  });

  // Helper to create a sequence of hours
  const createHourSequence = (count: number, startHour: number = 8, overrides: Partial<WeatherDataPoint> = []) => {
    return Array.from({ length: count }, (_, i) => {
      const hour = startHour + i;
      const baseOverrides = Array.isArray(overrides) ? overrides[i] || {} : overrides;
      return createWeatherPoint({
        time: `${hour.toString().padStart(2, '0')}:00`,
        ...baseOverrides
      });
    });
  };

  describe('Basic Drying Window Detection', () => {
    it('should create a drying window for exactly 2 continuous suitable hours', async () => {
      const hourlyData = createHourSequence(4, 8, [
        { humidity: 80, suitable: false }, // Hour 8 - unsuitable
        { humidity: 30 }, // Hour 9 - suitable
        { humidity: 30 }, // Hour 10 - suitable
        { humidity: 80 }, // Hour 11 - unsuitable
      ]);

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.recommendation.dryingWindow).toBeDefined();
      expect(result.recommendation.dryingWindow?.duration).toBe(2);
      expect(result.recommendation.dryingWindow?.startTime).toBe('09:00');
      expect(result.recommendation.dryingWindow?.endTime).toBe('10:00');
    });

    it('should create a drying window for 3+ continuous suitable hours', async () => {
      const hourlyData = createHourSequence(5, 8, [
        { humidity: 80 }, // Hour 8 - unsuitable
        { humidity: 30 }, // Hour 9 - suitable
        { humidity: 30 }, // Hour 10 - suitable  
        { humidity: 30 }, // Hour 11 - suitable
        { humidity: 80 }, // Hour 12 - unsuitable
      ]);

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.recommendation.dryingWindow).toBeDefined();
      expect(result.recommendation.dryingWindow?.duration).toBe(3);
      expect(result.recommendation.dryingWindow?.startTime).toBe('09:00');
      expect(result.recommendation.dryingWindow?.endTime).toBe('11:00');
    });

    it('should NOT create a drying window for single suitable hour', async () => {
      const hourlyData = createHourSequence(3, 8, [
        { humidity: 80 }, // Hour 8 - unsuitable
        { humidity: 30 }, // Hour 9 - suitable (isolated)
        { humidity: 80 }, // Hour 10 - unsuitable
      ]);

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.recommendation.dryingWindow).toBeUndefined();
      expect(result.recommendation.status).toBe('INDOOR_DRYING_ONLY');
    });
  });

  describe('Multiple Drying Windows', () => {
    it('should create multiple separate drying windows', async () => {
      const hourlyData = createHourSequence(8, 8, [
        { humidity: 30 }, // Hour 8 - suitable
        { humidity: 30 }, // Hour 9 - suitable (window 1: 8-9)
        { humidity: 80 }, // Hour 10 - unsuitable (gap)
        { humidity: 80 }, // Hour 11 - unsuitable (gap)
        { humidity: 30 }, // Hour 12 - suitable
        { humidity: 30 }, // Hour 13 - suitable
        { humidity: 30 }, // Hour 14 - suitable (window 2: 12-14)
        { humidity: 80 }, // Hour 15 - unsuitable
      ]);

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.recommendation.dryingWindow).toBeDefined(); // Best window
      expect(result.recommendation.alternativeWindows).toBeDefined();
      expect(result.recommendation.alternativeWindows).toHaveLength(1); // Second window
      
      // Should prioritize the longer/better window (12-14, 3 hours)
      expect(result.recommendation.dryingWindow?.duration).toBe(3);
      expect(result.recommendation.dryingWindow?.startTime).toBe('12:00');
      
      // Alternative should be the shorter window (8-9, 2 hours)
      expect(result.recommendation.alternativeWindows?.[0].duration).toBe(2);
      expect(result.recommendation.alternativeWindows?.[0].startTime).toBe('08:00');
    });

    it('should sort windows by average score (best first)', async () => {
      const hourlyData = createHourSequence(8, 8, [
        { humidity: 50 }, // Hour 8 - lower quality suitable
        { humidity: 50 }, // Hour 9 - lower quality suitable 
        { humidity: 80 }, // Hour 10 - unsuitable (gap)
        { humidity: 80 }, // Hour 11 - unsuitable (gap)
        { humidity: 20 }, // Hour 12 - higher quality suitable
        { humidity: 20 }, // Hour 13 - higher quality suitable
        { humidity: 20 }, // Hour 14 - higher quality suitable
        { humidity: 80 }, // Hour 15 - unsuitable
      ]);

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      // Should prioritize higher quality window even if same length
      expect(result.recommendation.dryingWindow?.startTime).toBe('12:00'); // Better quality window
      expect(result.recommendation.alternativeWindows?.[0].startTime).toBe('08:00'); // Lower quality window
      
      // Verify that quality scores are actually different
      const mainWindowScore = result.recommendation.dryingWindow?.averageScore || 0;
      const altWindowScore = result.recommendation.alternativeWindows?.[0].averageScore || 0;
      expect(mainWindowScore).toBeGreaterThan(altWindowScore);
    });
  });

  describe('Edge Cases in Window Detection', () => {
    it('should handle drying window at the very beginning of the day', async () => {
      const hourlyData = createHourSequence(4, 6, [
        { humidity: 30 }, // Hour 6 - suitable (first daylight hour)
        { humidity: 30 }, // Hour 7 - suitable
        { humidity: 80 }, // Hour 8 - unsuitable
        { humidity: 80 }, // Hour 9 - unsuitable
      ]);

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.recommendation.dryingWindow).toBeDefined();
      expect(result.recommendation.dryingWindow?.startTime).toBe('06:00');
      expect(result.recommendation.dryingWindow?.endTime).toBe('07:00');
      expect(result.recommendation.dryingWindow?.duration).toBe(2);
    });

    it('should handle drying window at the very end of the day', async () => {
      const hourlyData = createHourSequence(4, 17, [
        { humidity: 80 }, // Hour 17 - unsuitable
        { humidity: 80 }, // Hour 18 - unsuitable
        { humidity: 30 }, // Hour 19 - suitable
        { humidity: 30 }, // Hour 20 - suitable (last daylight hour)
      ]);

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.recommendation.dryingWindow).toBeDefined();
      expect(result.recommendation.dryingWindow?.startTime).toBe('19:00');
      expect(result.recommendation.dryingWindow?.endTime).toBe('20:00');
      expect(result.recommendation.dryingWindow?.duration).toBe(2);
    });

    it('should handle single window spanning entire day', async () => {
      const hourlyData = createHourSequence(12, 8, { humidity: 30 }); // All hours suitable

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.recommendation.dryingWindow).toBeDefined();
      expect(result.recommendation.dryingWindow?.startTime).toBe('08:00');
      expect(result.recommendation.dryingWindow?.endTime).toBe('19:00');
      expect(result.recommendation.dryingWindow?.duration).toBe(12);
      expect(result.recommendation.alternativeWindows).toHaveLength(0); // No alternatives
    });

    it('should handle windows with gaps of exactly 1 hour', async () => {
      const hourlyData = createHourSequence(5, 8, [
        { humidity: 30 }, // Hour 8 - suitable
        { humidity: 30 }, // Hour 9 - suitable
        { humidity: 80 }, // Hour 10 - unsuitable (1 hour gap)
        { humidity: 30 }, // Hour 11 - suitable  
        { humidity: 30 }, // Hour 12 - suitable
      ]);

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      // Should create two separate windows, not bridge the gap
      expect(result.recommendation.dryingWindow).toBeDefined();
      expect(result.recommendation.alternativeWindows).toHaveLength(1);
    });
  });

  describe('Window Quality Assessment', () => {
    it('should calculate average score correctly for drying windows', async () => {
      const hourlyData = [
        createWeatherPoint({ 
          time: '08:00',
          humidity: 0,    // Score: 100
          temperature: 30, // Score: 100  
          dewPoint: 10,   // 20°C spread = 100
          windSpeed: 15,  // Optimal = 100
          cloudCover: 0   // Score: 100
        }),
        createWeatherPoint({
          time: '09:00', 
          humidity: 50,   // Score: 50
          temperature: 17.5, // Score: 50
          dewPoint: 7.5,  // 10°C spread = 100
          windSpeed: 9,   // Score: 50
          cloudCover: 50  // Score: 50
        })
      ];

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.recommendation.dryingWindow).toBeDefined();
      // First hour: weighted score ≈ 100*0.3 + 100*0.2 + 100*0.15 + 100*0.3 + 100*0.05 = 100
      // Second hour: weighted score ≈ 50*0.3 + 50*0.2 + 100*0.15 + 50*0.3 + 50*0.05 = 62.5
      // Average: (100 + 62.5) / 2 = 81.25 ≈ 81
      expect(result.recommendation.dryingWindow?.averageScore).toBeCloseTo(81, 0);
    });

    it('should properly describe window quality', async () => {
      const hourlyData = createHourSequence(2, 8, { 
        humidity: 20, // Very good conditions
        temperature: 25,
        dewPoint: 10,
        windSpeed: 12,
        cloudCover: 20
      });

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.recommendation.dryingWindow).toBeDefined();
      expect(result.recommendation.dryingWindow?.description).toContain('drying conditions');
      expect(['Excellent drying conditions', 'Very good drying conditions', 'Good drying conditions'])
        .toContain(result.recommendation.dryingWindow?.description);
    });
  });

  describe('Complex Window Scenarios', () => {
    it('should handle alternating suitable/unsuitable hours correctly', async () => {
      const hourlyData = createHourSequence(8, 8, [
        { humidity: 30 }, // Hour 8 - suitable
        { humidity: 80 }, // Hour 9 - unsuitable
        { humidity: 30 }, // Hour 10 - suitable
        { humidity: 80 }, // Hour 11 - unsuitable
        { humidity: 30 }, // Hour 12 - suitable
        { humidity: 30 }, // Hour 13 - suitable (window: 12-13)
        { humidity: 80 }, // Hour 14 - unsuitable
        { humidity: 30 }, // Hour 15 - suitable
      ]);

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      // Should only create one 2-hour window (12-13)
      expect(result.recommendation.dryingWindow).toBeDefined();
      expect(result.recommendation.dryingWindow?.duration).toBe(2);
      expect(result.recommendation.dryingWindow?.startTime).toBe('12:00');
      expect(result.recommendation.alternativeWindows).toHaveLength(0); // No other 2+ hour windows
    });

    it('should handle very short suitable periods correctly', async () => {
      const hourlyData = Array.from({ length: 10 }, (_, i) => 
        createWeatherPoint({
          time: `${(8 + i).toString().padStart(2, '0')}:00`,
          humidity: i === 5 ? 30 : 80 // Only hour 13 is suitable
        })
      );

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      // Should not create any drying windows
      expect(result.recommendation.dryingWindow).toBeUndefined();
      expect(result.recommendation.status).toBe('INDOOR_DRYING_ONLY');
    });

    it('should handle maximum possible windows (up to 3 alternatives)', async () => {
      const hourlyData = createHourSequence(14, 6, [
        // Window 1: 6-7 (2 hours, score ~60)
        { humidity: 40 }, { humidity: 40 },
        { humidity: 80 }, // Gap
        
        // Window 2: 9-10 (2 hours, score ~70) 
        { humidity: 30 }, { humidity: 30 },
        { humidity: 80 }, // Gap
        
        // Window 3: 12-14 (3 hours, score ~80) - should be main window
        { humidity: 20 }, { humidity: 20 }, { humidity: 20 },
        { humidity: 80 }, // Gap
        
        // Window 4: 16-18 (3 hours, score ~50)
        { humidity: 50 }, { humidity: 50 }, { humidity: 50 },
        { humidity: 80 }, // End
      ]);

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.recommendation.dryingWindow).toBeDefined(); // Best window
      expect(result.recommendation.alternativeWindows).toHaveLength(2); // Up to 2 alternatives
      
      // Main window should be the best quality one
      expect(result.recommendation.dryingWindow?.startTime).toBe('12:00');
      expect(result.recommendation.dryingWindow?.duration).toBe(3);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle empty hourly data', async () => {
      const hourlyData: WeatherDataPoint[] = [];

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.recommendation.dryingWindow).toBeUndefined();
      expect(result.recommendation.status).toBe('INDOOR_DRYING_ONLY');
    });

    it('should handle all hours outside daylight', async () => {
      // Create astronomy data with very short daylight (no hours between 7.5 and 8.0)
      const restrictedAstronomy: AstronomyData = {
        sunrise: '07:30',
        sunset: '08:00',
        sunriseDecimal: 7.5,
        sunsetDecimal: 8.0
      };

      const hourlyData = createHourSequence(24, 0, { humidity: 30 }); // All good conditions

      const result = await calculateDryingConditions(hourlyData, mockLocation, restrictedAstronomy);
      
      expect(result.recommendation.dryingWindow).toBeUndefined();
      expect(result.recommendation.status).toBe('INDOOR_DRYING_ONLY');
    });

    it('should handle drying window exactly at 60% threshold', async () => {
      const hourlyData = createHourSequence(2, 8, {
        humidity: 40,     // Score: 60
        temperature: 17.5, // Score: 50
        dewPoint: 7.5,    // Score: 100 (10°C spread)
        windSpeed: 9,     // Score: 50
        cloudCover: 25    // Score: 75
        // Weighted: 60*0.3 + 50*0.2 + 100*0.15 + 50*0.3 + 75*0.05 = 61.75 ≈ 62 (≥60, suitable)
      });

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.recommendation.dryingWindow).toBeDefined();
      expect(result.recommendation.dryingWindow?.duration).toBe(2);
    });
  });
});