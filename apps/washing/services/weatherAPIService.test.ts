import { fetchWeatherData } from './weatherAPIService';
import type { HourlyForecast } from '../types';

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock AbortController
const mockAbort = jest.fn();
global.AbortController = jest.fn(() => ({
  abort: mockAbort,
  signal: { aborted: false }
})) as any;

// Mock setTimeout/clearTimeout
global.setTimeout = jest.fn((callback, delay) => {
  // For timeout simulation, call callback immediately only when we want to test timeout
  // Return timer ID for other uses
  return 123; // Mock timer ID
}) as any;
global.clearTimeout = jest.fn();

describe('Weather API Service - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockAbort.mockClear();
  });

  const validCoordinates = { latitude: 55.9533, longitude: -3.1883 }; // Edinburgh

  const createValidOpenMeteoResponse = () => ({
    hourly: {
      time: ['2024-01-01T12:00', '2024-01-01T13:00', '2024-01-01T14:00'],
      temperature_2m: [15, 16, 17],
      relative_humidity_2m: [60, 65, 70],
      precipitation_probability: [10, 20, 30],
      precipitation: [0, 0, 0.1],
      wind_speed_10m: [8, 10, 12],
      uv_index: [3, 4, 5],
      dew_point_2m: [8, 9, 10],
      cloud_cover: [40, 50, 60]
    }
  });

  describe('Network Error Handling', () => {
    it('should handle network timeout correctly', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => {
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          reject(error);
        })
      );

      await expect(fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude))
        .rejects
        .toThrow('Weather API unavailable: The operation was aborted');
    });

    it('should handle network connection failure', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));

      await expect(fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude))
        .rejects
        .toThrow('Weather API unavailable: Failed to fetch');
    });

    it('should handle DNS resolution failure', async () => {
      mockFetch.mockRejectedValue(new Error('getaddrinfo ENOTFOUND api.open-meteo.com'));

      await expect(fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude))
        .rejects
        .toThrow('Weather API unavailable: getaddrinfo ENOTFOUND api.open-meteo.com');
    });
  });

  describe('HTTP Status Error Handling', () => {
    it('should handle 404 Not Found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude))
        .rejects
        .toThrow('Weather API unavailable: Open-Meteo API error: 404 Not Found');
    });

    it('should handle 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude))
        .rejects
        .toThrow('Weather API unavailable: Open-Meteo API error: 500 Internal Server Error');
    });

    it('should handle 429 Too Many Requests (Rate Limiting)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      await expect(fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude))
        .rejects
        .toThrow('Weather API unavailable: Open-Meteo API error: 429 Too Many Requests');
    });

    it('should handle 400 Bad Request', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      await expect(fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude))
        .rejects
        .toThrow('Weather API unavailable: Open-Meteo API error: 400 Bad Request');
    });
  });

  describe('Malformed Response Handling', () => {
    it('should handle invalid JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Unexpected token < in JSON at position 0'))
      });

      await expect(fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude))
        .rejects
        .toThrow('Weather API unavailable: Unexpected token < in JSON at position 0');
    });

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null)
      });

      await expect(fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude))
        .rejects
        .toThrow(); // Should throw when trying to access null.hourly
    });

    it('should handle response missing hourly data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      });

      await expect(fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude))
        .rejects
        .toThrow(); // Should throw when trying to access undefined.hourly
    });

    it('should handle response with missing required fields', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          hourly: {
            time: ['2024-01-01T12:00'],
            temperature_2m: [15]
            // Missing all other required fields
          }
        })
      });

      // Should not throw but should handle missing data gracefully
      const result = await fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude);
      expect(result).toHaveLength(1);
      expect(result[0].temperature).toBe(15);
      expect(result[0].humidity).toBe(0); // Should default to 0
      expect(result[0].windSpeed).toBe(0); // Should default to 0
    });

    it('should handle response with mismatched array lengths', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          hourly: {
            time: ['2024-01-01T12:00', '2024-01-01T13:00'],
            temperature_2m: [15], // Only 1 value for 2 time slots
            relative_humidity_2m: [60, 65],
            precipitation_probability: [10, 20],
            precipitation: [0, 0],
            wind_speed_10m: [8, 10],
            uv_index: [3, 4],
            dew_point_2m: [8, 9],
            cloud_cover: [40, 50]
          }
        })
      });

      const result = await fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude);
      expect(result).toHaveLength(2);
      expect(result[0].temperature).toBe(15);
      expect(result[1].temperature).toBe(0); // Should default when data missing
    });
  });

  describe('Data Validation and Sanitization', () => {
    it('should handle null values in weather data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          hourly: {
            time: ['2024-01-01T12:00'],
            temperature_2m: [null],
            relative_humidity_2m: [null],
            precipitation_probability: [null],
            precipitation: [null],
            wind_speed_10m: [null],
            uv_index: [null],
            dew_point_2m: [null],
            cloud_cover: [null]
          }
        })
      });

      const result = await fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude);
      expect(result).toHaveLength(1);
      expect(result[0].temperature).toBe(0);
      expect(result[0].humidity).toBe(0);
      expect(result[0].windSpeed).toBe(0);
      expect(result[0].rainChance).toBe(0);
      expect(result[0].uvIndex).toBe(0);
      expect(result[0].dewPoint).toBe(0);
      expect(result[0].cloudCover).toBe(0);
      expect(result[0].rainfall).toBe(0);
    });

    it('should handle extreme values in weather data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          hourly: {
            time: ['2024-01-01T12:00'],
            temperature_2m: [999],
            relative_humidity_2m: [150], // > 100%
            precipitation_probability: [250], // > 100%
            precipitation: [999],
            wind_speed_10m: [999],
            uv_index: [50],
            dew_point_2m: [999],
            cloud_cover: [150] // > 100%
          }
        })
      });

      const result = await fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude);
      expect(result).toHaveLength(1);
      expect(result[0].temperature).toBe(999); // Should preserve extreme but valid values
      expect(result[0].humidity).toBe(150); // API validation should be handled upstream
      expect(result[0].rainChance).toBe(250);
    });

    it('should handle negative values correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          hourly: {
            time: ['2024-01-01T12:00'],
            temperature_2m: [-20],
            relative_humidity_2m: [-10], // Invalid but test handling
            precipitation_probability: [-5],
            precipitation: [-1],
            wind_speed_10m: [-10],
            uv_index: [-1],
            dew_point_2m: [-25],
            cloud_cover: [-10]
          }
        })
      });

      const result = await fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude);
      expect(result).toHaveLength(1);
      expect(result[0].temperature).toBe(-20); // Valid subzero temperature
      expect(result[0].dewPoint).toBe(-25); // Valid subzero dew point
      // Other negative values handled as is (API validation should prevent invalid values)
    });
  });

  describe('Coordinate Validation', () => {
    it('should handle invalid latitude coordinates', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      await expect(fetchWeatherData(999, validCoordinates.longitude))
        .rejects
        .toThrow('Weather API unavailable: Open-Meteo API error: 400 Bad Request');
    });

    it('should handle invalid longitude coordinates', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      await expect(fetchWeatherData(validCoordinates.latitude, 999))
        .rejects
        .toThrow('Weather API unavailable: Open-Meteo API error: 400 Bad Request');
    });

    it('should handle edge case coordinates (poles, international date line)', async () => {
      // Test North Pole
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createValidOpenMeteoResponse())
      });
      
      const northPoleResult = await fetchWeatherData(90, 0);
      expect(northPoleResult).toHaveLength(3);

      // Test International Date Line
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createValidOpenMeteoResponse())
      });
      
      const dateLineResult = await fetchWeatherData(0, 180);
      expect(dateLineResult).toHaveLength(3);
    });
  });

  describe('Time Format Handling', () => {
    it('should handle various ISO time formats', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          hourly: {
            time: [
              '2024-01-01T12:00',           // Basic format
              '2024-01-01T13:00:00',        // With seconds
              '2024-01-01T14:00:00Z',       // With timezone
              '2024-01-01T15:00:00.000Z'    // With milliseconds
            ],
            temperature_2m: [15, 16, 17, 18],
            relative_humidity_2m: [60, 65, 70, 75],
            precipitation_probability: [10, 20, 30, 40],
            precipitation: [0, 0, 0, 0],
            wind_speed_10m: [8, 9, 10, 11],
            uv_index: [3, 4, 5, 6],
            dew_point_2m: [8, 9, 10, 11],
            cloud_cover: [40, 45, 50, 55]
          }
        })
      });

      const result = await fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude);
      expect(result).toHaveLength(4);
      expect(result.map(r => r.time)).toEqual(['12:00', '13:00', '14:00', '15:00']);
    });

    it('should handle invalid time formats', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          hourly: {
            time: ['invalid-time'],
            temperature_2m: [15],
            relative_humidity_2m: [60],
            precipitation_probability: [10],
            precipitation: [0],
            wind_speed_10m: [8],
            uv_index: [3],
            dew_point_2m: [8],
            cloud_cover: [40]
          }
        })
      });

      // Should not throw but may produce unusual time strings
      const result = await fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude);
      expect(result).toHaveLength(1);
      expect(typeof result[0].time).toBe('string');
    });
  });

  describe('Successful API Response Handling', () => {
    it('should correctly transform valid Open-Meteo response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createValidOpenMeteoResponse())
      });

      const result = await fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        time: '12:00',
        temperature: 15,
        humidity: 60,
        windSpeed: 8.0,
        rainChance: 10,
        uvIndex: 3.0,
        dewPoint: 8,
        cloudCover: 40,
        rainfall: 0.0
      });
    });

    it('should properly round numerical values', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          hourly: {
            time: ['2024-01-01T12:00'],
            temperature_2m: [15.67],
            relative_humidity_2m: [60.89],
            precipitation_probability: [10.23],
            precipitation: [0.567],
            wind_speed_10m: [8.456],
            uv_index: [3.789],
            dew_point_2m: [8.234],
            cloud_cover: [40.678]
          }
        })
      });

      const result = await fetchWeatherData(validCoordinates.latitude, validCoordinates.longitude);
      
      expect(result[0].temperature).toBe(16); // Math.round(15.67)
      expect(result[0].humidity).toBe(61); // Math.round(60.89)
      expect(result[0].windSpeed).toBe(8.5); // Math.round(8.456 * 10) / 10
      expect(result[0].uvIndex).toBe(3.8); // Math.round(3.789 * 10) / 10
      expect(result[0].rainfall).toBe(0.57); // Math.round(0.567 * 100) / 100
    });
  });
});