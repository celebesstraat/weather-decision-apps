import { calculateDryingConditions } from './weatherService';
import type { HourlyForecast, LocationData } from '../types';

describe('Weather Scoring Algorithm - Edge Cases', () => {
  const mockLocation: LocationData = {
    latitude: 55.9533,
    longitude: -3.1883,
    name: 'Edinburgh',
    fullName: 'Edinburgh, Scotland, UK',
    country: 'United Kingdom',
    confidence: 95
  };

  const mockAstronomy = {
    sunrise: '07:30',
    sunset: '18:00',
    sunriseDecimal: 7.5,
    sunsetDecimal: 18.0
  };

  const createWeatherPoint = (overrides: Partial<HourlyForecast> = {}): HourlyForecast => ({
    time: '12:00',
    temperature: 15,
    humidity: 60,
    dewPoint: 10,
    windSpeed: 10,
    cloudCover: 50,
    uvIndex: 3,
    rainChance: 0,
    rainfall: 0,
    ...overrides
  });

  describe('Rain Probability Edge Cases', () => {
    it('should disqualify hours with exactly 25% rain chance', async () => {
      const hourlyData = [
        createWeatherPoint({ rainChance: 25, rainfall: 0 })
      ];

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.hourlyScores[0].suitable).toBe(false);
      expect(result.hourlyScores[0].totalScore).toBe(0);
    });

    it('should allow hours with 24% rain chance and disqualify 25%', async () => {
      const hourlyData = [
        createWeatherPoint({ rainChance: 24 }),
        createWeatherPoint({ rainChance: 25 })
      ];

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.hourlyScores[0].suitable).toBe(true);
      expect(result.hourlyScores[1].suitable).toBe(false);
    });

    it('should disqualify hours with actual rainfall even if rain chance is low', async () => {
      const hourlyData = [
        createWeatherPoint({ rainChance: 5, rainfall: 0.1 })
      ];

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.hourlyScores[0].suitable).toBe(false);
      expect(result.hourlyScores[0].totalScore).toBe(0);
    });
  });

  describe('Dew Point Spread Edge Cases', () => {
    it('should disqualify when temperature equals dew point (0°C spread)', async () => {
      const hourlyData = [
        createWeatherPoint({ temperature: 15, dewPoint: 15 })
      ];

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.hourlyScores[0].suitable).toBe(false);
      expect(result.hourlyScores[0].totalScore).toBe(0);
    });

    it('should disqualify when dew point spread is less than 1°C', async () => {
      const hourlyData = [
        createWeatherPoint({ temperature: 15, dewPoint: 14.1 })
      ];

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.hourlyScores[0].suitable).toBe(false);
      expect(result.hourlyScores[0].totalScore).toBe(0);
    });

    it('should allow dew point spread of exactly 1°C', async () => {
      const hourlyData = [
        createWeatherPoint({ 
          temperature: 20, 
          dewPoint: 19,
          humidity: 30, // Low humidity for good score
          windSpeed: 10 // Good wind
        })
      ];

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.hourlyScores[0].suitable).toBe(true);
    });

    it('should handle extreme dew point spread correctly', async () => {
      const hourlyData = [
        createWeatherPoint({ 
          temperature: 25, 
          dewPoint: 0, // 25°C spread
          humidity: 20,
          windSpeed: 10
        })
      ];

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      expect(result.hourlyScores[0].suitable).toBe(true);
      expect(result.hourlyScores[0].componentScores.dewPointSpread).toBeGreaterThan(100);
    });
  });

  describe('Daylight Hours Filtering', () => {
    it('should mark hours outside daylight as unsuitable', async () => {
      const hourlyData = Array.from({ length: 24 }, (_, i) =>
        createWeatherPoint({
          time: `${i.toString().padStart(2, '0')}:00`,
          temperature: 20,
          dewPoint: 10,
          humidity: 30,
          windSpeed: 10
        })
      );

      const result = await calculateDryingConditions(hourlyData, mockLocation, mockAstronomy);
      
      // Hours before 7:30 (7.5) should be unsuitable
      expect(result.hourlyScores[6].suitable).toBe(false);
      expect(result.hourlyScores[7].suitable).toBe(false);
      
      // Hours after 18:00 should be unsuitable
      expect(result.hourlyScores[18].suitable).toBe(false);
      expect(result.hourlyScores[19].suitable).toBe(false);
      
      // Hours within daylight should be evaluated normally
      expect(result.hourlyScores[12].suitable).toBe(true);
    });
  });
});
