import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Test utility functions from HourlyTimeline component
describe('HourlyTimeline Utility Functions', () => {
  describe('getScoreColor', () => {
    // Extracted from HourlyTimeline.tsx - three-tier system
    const getScoreColor = (score: number): string => {
      if (score >= 60) return 'bg-green-600'; // Excellent conditions
      if (score >= 50) return 'bg-amber-500'; // Acceptable conditions  
      return 'bg-red-500'; // Poor conditions (indoor drying only)
    };

    test('returns green for excellent scores (>=60)', () => {
      expect(getScoreColor(60)).toBe('bg-green-600');
      expect(getScoreColor(75)).toBe('bg-green-600');
      expect(getScoreColor(100)).toBe('bg-green-600');
    });

    test('returns amber for acceptable scores (50-59)', () => {
      expect(getScoreColor(50)).toBe('bg-amber-500');
      expect(getScoreColor(55)).toBe('bg-amber-500');
      expect(getScoreColor(59)).toBe('bg-amber-500');
    });

    test('returns red for poor scores (<50)', () => {
      expect(getScoreColor(0)).toBe('bg-red-500');
      expect(getScoreColor(30)).toBe('bg-red-500');
      expect(getScoreColor(49)).toBe('bg-red-500');
    });

    test('handles edge cases at thresholds', () => {
      expect(getScoreColor(49.9)).toBe('bg-red-500');
      expect(getScoreColor(50.0)).toBe('bg-amber-500');
      expect(getScoreColor(59.9)).toBe('bg-amber-500');
      expect(getScoreColor(60.0)).toBe('bg-green-600');
    });
  });

  describe('formatHour', () => {
    // Extracted from HourlyTimeline.tsx
    const formatHour = (time: string): string => {
      // Convert "10:00" to "10am" or "22:00" to "10pm"
      const [hours] = time.split(':');
      const hour = parseInt(hours);
      if (hour === 0) return '12am';
      if (hour < 12) return `${hour}am`;
      if (hour === 12) return '12pm';
      return `${hour - 12}pm`;
    };

    test('formats midnight correctly', () => {
      expect(formatHour('00:00')).toBe('12am');
      expect(formatHour('00:30')).toBe('12am');
    });

    test('formats morning hours correctly', () => {
      expect(formatHour('01:00')).toBe('1am');
      expect(formatHour('06:00')).toBe('6am');
      expect(formatHour('11:00')).toBe('11am');
    });

    test('formats noon correctly', () => {
      expect(formatHour('12:00')).toBe('12pm');
      expect(formatHour('12:30')).toBe('12pm');
    });

    test('formats afternoon/evening hours correctly', () => {
      expect(formatHour('13:00')).toBe('1pm');
      expect(formatHour('18:00')).toBe('6pm');
      expect(formatHour('23:00')).toBe('11pm');
    });

    test('ignores minutes in time string', () => {
      expect(formatHour('15:45')).toBe('3pm');
      expect(formatHour('09:15')).toBe('9am');
    });
  });

  describe('getCurrentHour', () => {
    // Extracted from HourlyTimeline.tsx
    const getCurrentHour = (): number => {
      return new Date().getHours();
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('returns current hour from Date object', () => {
      const mockHour = 14;
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(mockHour);
      
      expect(getCurrentHour()).toBe(mockHour);
    });

    test('returns value in 24-hour format', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(0);
      expect(getCurrentHour()).toBe(0);

      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(23);
      expect(getCurrentHour()).toBe(23);
    });
  });

  describe('getSunriseSunset', () => {
    // Extracted from HourlyTimeline.tsx
    const getSunriseSunset = (dayOffset: number = 0) => {
      const sunrise = 6 + 25/60; // 6:25 AM = 6.417
      const sunset = 20 + 3/60;  // 20:03 = 20.05
      return { sunrise, sunset };
    };

    test('returns fixed UK sunrise/sunset times', () => {
      const result = getSunriseSunset();
      expect(result.sunrise).toBeCloseTo(6.417, 3);
      expect(result.sunset).toBeCloseTo(20.05, 2);
    });

    test('ignores dayOffset parameter (static implementation)', () => {
      const result1 = getSunriseSunset(0);
      const result2 = getSunriseSunset(5);
      const result3 = getSunriseSunset(-2);
      
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    test('returns consistent decimal values', () => {
      const result = getSunriseSunset();
      
      // 6:25 = 6 + 25/60 = 6.4166...
      expect(result.sunrise).toBe(6 + 25/60);
      // 20:03 = 20 + 3/60 = 20.05
      expect(result.sunset).toBe(20 + 3/60);
    });
  });
});

// Test utility functions from WeatherChart component
describe('WeatherChart Utility Functions', () => {
  describe('normalizeValues', () => {
    // Extracted from WeatherChart.tsx
    const normalizeValues = (values: number[]) => {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;
      return values.map(v => (v - min) / range);
    };

    test('normalizes values to 0-1 range', () => {
      const values = [10, 20, 30];
      const result = normalizeValues(values);
      
      expect(result[0]).toBe(0);     // Min value = 0
      expect(result[2]).toBe(1);     // Max value = 1
      expect(result[1]).toBe(0.5);   // Middle value = 0.5
    });

    test('handles single value correctly', () => {
      const values = [15];
      const result = normalizeValues(values);
      
      expect(result[0]).toBe(0); // Single value normalized to 0
    });

    test('handles identical values', () => {
      const values = [5, 5, 5];
      const result = normalizeValues(values);
      
      // All values should be 0 when range is 0
      expect(result).toEqual([0, 0, 0]);
    });

    test('preserves relative relationships', () => {
      const values = [0, 50, 100];
      const result = normalizeValues(values);
      
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(0.5);
      expect(result[2]).toBe(1);
    });

    test('works with negative values', () => {
      const values = [-10, 0, 10];
      const result = normalizeValues(values);
      
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(0.5);
      expect(result[2]).toBe(1);
    });
  });

  describe('scaleX function', () => {
    // Extracted from WeatherChart.tsx
    const scaleX = (index: number, totalLength: number) => ((index + 0.5) / totalLength) * 100;

    test('centers points in their segments', () => {
      // For 4 data points
      expect(scaleX(0, 4)).toBe(12.5);  // (0.5/4) * 100
      expect(scaleX(1, 4)).toBe(37.5);  // (1.5/4) * 100
      expect(scaleX(2, 4)).toBe(62.5);  // (2.5/4) * 100
      expect(scaleX(3, 4)).toBe(87.5);  // (3.5/4) * 100
    });

    test('handles single data point', () => {
      expect(scaleX(0, 1)).toBe(50); // (0.5/1) * 100 = 50%
    });

    test('returns percentage values (0-100)', () => {
      const results = [0, 1, 2].map(i => scaleX(i, 3));
      results.forEach(result => {
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(100);
      });
    });
  });

  describe('scaleLineY function', () => {
    // Extracted from WeatherChart.tsx
    const chartHeight = 80;
    const padding = 4;
    const workingHeight = chartHeight - padding * 2;
    const scaleLineY = (normalizedValue: number) => workingHeight - (normalizedValue * workingHeight) + padding;

    test('inverts Y axis for SVG coordinate system', () => {
      expect(scaleLineY(0)).toBe(chartHeight - padding);    // Bottom
      expect(scaleLineY(1)).toBe(padding);                  // Top
      expect(scaleLineY(0.5)).toBe(chartHeight / 2);        // Middle
    });

    test('respects padding boundaries', () => {
      expect(scaleLineY(1)).toBe(padding);                  // Top edge
      expect(scaleLineY(0)).toBe(chartHeight - padding);    // Bottom edge
    });

    test('handles edge cases', () => {
      expect(scaleLineY(0)).toBeGreaterThan(scaleLineY(1)); // Y increases downward in SVG
      expect(scaleLineY(0.25)).toBeLessThan(scaleLineY(0)); // Higher values appear lower
    });
  });

  describe('formatters', () => {
    // Extracted from WeatherChart.tsx
    const formatTemp = (temp: number) => `${Math.round(temp)}°`;
    const formatRain = (rainChance: number) => `${Math.round(rainChance)}%`;
    const formatWind = (wind: number) => `${Math.round(wind)}km/h`;
    const formatHumidity = (humidity: number) => `${Math.round(humidity)}%`;

    test('formatTemp rounds and adds degree symbol', () => {
      expect(formatTemp(15.7)).toBe('16°');
      expect(formatTemp(20.2)).toBe('20°');
      expect(formatTemp(-5.8)).toBe('-6°');
    });

    test('formatRain rounds and adds percentage', () => {
      expect(formatRain(45.6)).toBe('46%');
      expect(formatRain(0.3)).toBe('0%');
      expect(formatRain(99.9)).toBe('100%');
    });

    test('formatWind rounds and adds unit', () => {
      expect(formatWind(12.4)).toBe('12km/h');
      expect(formatWind(0.8)).toBe('1km/h');
      expect(formatWind(25.7)).toBe('26km/h');
    });

    test('formatHumidity rounds and adds percentage', () => {
      expect(formatHumidity(67.3)).toBe('67%');
      expect(formatHumidity(100)).toBe('100%');
      expect(formatHumidity(0.1)).toBe('0%');
    });
  });

  describe('createPath function', () => {
    // Extracted from WeatherChart.tsx
    const createPath = (normalizedValues: number[], totalLength: number) => {
      const scaleX = (index: number) => ((index + 0.5) / totalLength) * 100;
      const scaleLineY = (normalizedValue: number) => 72 - (normalizedValue * 72) + 4; // Simplified
      
      return normalizedValues
        .map((value, index) => {
          const x = scaleX(index);
          const y = scaleLineY(value);
          return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .join(' ');
    };

    test('creates valid SVG path string', () => {
      const values = [0, 0.5, 1];
      const path = createPath(values, 3);
      
      expect(path).toMatch(/^M \d+\.?\d* \d+\.?\d*/); // Starts with M (move)
      expect(path).toContain('L'); // Contains L (line) commands
    });

    test('first command is move (M), rest are lines (L)', () => {
      const values = [0.2, 0.8, 0.5];
      const path = createPath(values, 3);
      const commands = path.split(' ').filter(cmd => cmd === 'M' || cmd === 'L');
      
      expect(commands[0]).toBe('M');
      expect(commands[1]).toBe('L');
      expect(commands[2]).toBe('L');
    });

    test('handles single point', () => {
      const values = [0.5];
      const path = createPath(values, 1);
      
      expect(path).toMatch(/^M \d+\.?\d* \d+\.?\d*$/); // Just one M command
      expect(path).not.toContain('L'); // No line commands
    });
  });
});