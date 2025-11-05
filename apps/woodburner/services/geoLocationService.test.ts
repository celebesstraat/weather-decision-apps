import { 
  getCurrentLocation, 
  geocodeLocation, 
  reverseGeocode, 
  validateCoordinates,
  getDistance,
  type LocationCoordinates,
  type GeocodeResult,
  type ReverseGeocodeResult
} from './geoLocationService';

// Mock fetch for API testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
};

// Ensure navigator exists first
if (typeof global.navigator === 'undefined') {
  global.navigator = {};
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  configurable: true
});

describe('Geolocation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockGeolocation.getCurrentPosition.mockClear();
  });

  describe('getCurrentLocation - Browser Geolocation', () => {
    it('should get current location successfully', async () => {
      const mockPosition = {
        coords: {
          latitude: 55.9533,
          longitude: -3.1883,
          accuracy: 10
        }
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const result = await getCurrentLocation();
      
      expect(result).toEqual({
        latitude: 55.9533,
        longitude: -3.1883,
        accuracy: 10
      });
      
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });

    it('should handle geolocation not supported', async () => {
      // Mock navigator.geolocation as undefined
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        configurable: true
      });

      await expect(getCurrentLocation()).rejects.toThrow('Geolocation is not supported by this browser');
      
      // Restore geolocation mock
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      });
    });

    it('should handle permission denied error', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      await expect(getCurrentLocation()).rejects.toThrow('Location access denied by user');
    });

    it('should handle position unavailable error', async () => {
      const mockError = {
        code: 2, // POSITION_UNAVAILABLE
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      await expect(getCurrentLocation()).rejects.toThrow('Location information unavailable');
    });

    it('should handle timeout error', async () => {
      const mockError = {
        code: 3, // TIMEOUT
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      await expect(getCurrentLocation()).rejects.toThrow('Location request timed out');
    });

    it('should handle unknown geolocation error', async () => {
      const mockError = {
        code: 999, // Unknown error
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      await expect(getCurrentLocation()).rejects.toThrow('Unable to get your location');
    });
  });

  describe('UK Postcode Geocoding', () => {
    const createValidNominatimResponse = (postcode: string, town: string) => ({
      lat: '55.9533',
      lon: '-3.1883',
      display_name: `${postcode}, ${town}, Scotland, United Kingdom`
    });

    const createValidOpenMeteoResponse = (name: string, country: string = 'United Kingdom') => ({
      results: [{
        name,
        country,
        country_code: 'GB',
        admin1: 'Scotland',
        latitude: 55.9533,
        longitude: -3.1883
      }]
    });

    it('should geocode valid UK postcode via Nominatim', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([createValidNominatimResponse('FK5 3LZ', 'Larbert')])
      });

      const result = await geocodeLocation('FK5 3LZ');
      
      expect(result.name).toBe('Larbert');
      expect(result.country).toBe('United Kingdom');
      expect(result.latitude).toBe(55.9533);
      expect(result.longitude).toBe(-3.1883);
      expect(result.confidence).toBe(90);
    });

    it('should normalize and geocode compact UK postcode', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([createValidNominatimResponse('FK5 3LZ', 'Larbert')])
      });

      const result = await geocodeLocation('fk53lz'); // Compact format
      
      expect(result.name).toBe('Larbert');
      expect(result.confidence).toBe(90);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('postalcode=FK5%203LZ'), // Should be normalized
        expect.any(Object)
      );
    });

    it('should handle postcode not found via Nominatim, fallback to general search', async () => {
      // First call (specific postcode search) fails
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

      // Second call (general search) succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([createValidNominatimResponse('FK5 3LZ', 'Larbert')])
      });

      const result = await geocodeLocation('FK5 3LZ');
      
      expect(result.confidence).toBe(80); // Lower confidence for fallback
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should fallback to Open-Meteo when Nominatim completely fails for postcode', async () => {
      // Nominatim calls fail
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

      // Open-Meteo succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createValidOpenMeteoResponse('Larbert'))
      });

      const result = await geocodeLocation('FK5 3LZ');
      
      expect(result.name).toBe('Larbert');
      expect(mockFetch).toHaveBeenCalledTimes(3); // 2 Nominatim + 1 Open-Meteo
    });

    it('should handle various UK postcode formats', async () => {
      const testPostcodes = [
        'M1 1AA',    // Standard format
        'm11aa',     // Compact lowercase
        'SW1A 1AA',  // Long postcode
        'B33 8TH',   // Standard
        'w1a0ax'     // Compact weird case
      ];

      for (const postcode of testPostcodes) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([createValidNominatimResponse(postcode.toUpperCase(), 'TestTown')])
        });

        const result = await geocodeLocation(postcode);
        expect(result.name).toBe('TestTown');
        expect(result.country).toBe('United Kingdom');
      }
    });

    it('should provide helpful error for invalid postcode', async () => {
      // All API calls fail
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      await expect(geocodeLocation('INVALID-POSTCODE'))
        .rejects
        .toThrow('Please check the postcode format');
    });
  });

  describe('Location Name Geocoding', () => {
    const createOpenMeteoResponse = (locations: any[]) => ({ results: locations });

    it('should geocode UK town names successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createOpenMeteoResponse([
          {
            name: 'Edinburgh',
            country: 'United Kingdom',
            country_code: 'GB',
            admin1: 'Scotland',
            latitude: 55.9533,
            longitude: -3.1883
          }
        ]))
      });

      const result = await geocodeLocation('Edinburgh');
      
      expect(result.name).toBe('Edinburgh');
      expect(result.country).toBe('United Kingdom');
      expect(result.region).toBe('Scotland');
      expect(result.fullName).toBe('Edinburgh, Scotland, United Kingdom');
    });

    it('should prioritize UK locations over international matches', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createOpenMeteoResponse([
          {
            name: 'Glasgow',
            country: 'United States',
            country_code: 'US',
            admin1: 'Kentucky',
            latitude: 37.0,
            longitude: -85.9
          },
          {
            name: 'Glasgow',
            country: 'United Kingdom',
            country_code: 'GB',
            admin1: 'Scotland',
            latitude: 55.8642,
            longitude: -4.2518
          }
        ]))
      });

      const result = await geocodeLocation('Glasgow');
      
      expect(result.name).toBe('Glasgow');
      expect(result.country).toBe('United Kingdom');
      expect(result.region).toBe('Scotland');
      expect(result.confidence).toBeGreaterThan(90);
    });

    it('should handle comma-separated location queries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createOpenMeteoResponse([
          {
            name: 'Larbert',
            country: 'United Kingdom',
            country_code: 'GB',
            admin1: 'Scotland',
            latitude: 55.9988,
            longitude: -3.8314
          }
        ]))
      });

      const result = await geocodeLocation('Larbert, Scotland, UK');
      
      expect(result.name).toBe('Larbert');
      expect(result.region).toBe('Scotland');
    });

    it('should reject direct coordinate input', async () => {
      await expect(geocodeLocation('55.9533, -3.1883'))
        .rejects
        .toThrow('Please enter a town name or UK postcode instead of coordinates');
      
      await expect(geocodeLocation('55.9533,-3.1883'))
        .rejects
        .toThrow('Please enter a town name or UK postcode instead of coordinates');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(geocodeLocation('Edinburgh'))
        .rejects
        .toThrow('Unable to find location "Edinburgh"');
    });

    it('should handle empty API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] })
      });

      await expect(geocodeLocation('NonexistentPlace'))
        .rejects
        .toThrow('Unable to find location "NonexistentPlace"');
    });

    it('should calculate confidence scores correctly', async () => {
      // Exact match
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createOpenMeteoResponse([
          { name: 'Edinburgh', country: 'United Kingdom', country_code: 'GB', admin1: 'Scotland', latitude: 55.9533, longitude: -3.1883 }
        ]))
      });

      let result = await geocodeLocation('Edinburgh');
      expect(result.confidence).toBe(95);

      // Partial match (starts with)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createOpenMeteoResponse([
          { name: 'Edinburgh Castle', country: 'United Kingdom', country_code: 'GB', admin1: 'Scotland', latitude: 55.9533, longitude: -3.1883 }
        ]))
      });

      result = await geocodeLocation('Edinburgh');
      expect(result.confidence).toBe(85);
    });
  });

  describe('Reverse Geocoding', () => {
    it('should reverse geocode UK coordinates successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          display_name: 'Edinburgh Castle, Castlehill, Old Town, City of Edinburgh, Scotland, EH1 2NG, United Kingdom',
          address: {
            city: 'Edinburgh',
            county: 'City of Edinburgh',
            state: 'Scotland',
            country: 'United Kingdom',
            postcode: 'EH1 2NG'
          },
          importance: 0.85
        })
      });

      const result = await reverseGeocode(55.9533, -3.1883);
      
      expect(result.name).toBe('Edinburgh');
      expect(result.country).toBe('United Kingdom');
      expect(result.region).toBe('City of Edinburgh');
      expect(result.postcode).toBe('EH1 2NG');
      expect(result.confidence).toBe(85);
    });

    it('should handle various address formats', async () => {
      // Test with town instead of city
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          display_name: 'Larbert, Falkirk, Scotland, FK5 3LZ, United Kingdom',
          address: {
            town: 'Larbert',
            county: 'Falkirk',
            state: 'Scotland',
            country: 'United Kingdom',
            postcode: 'FK5 3LZ'
          },
          importance: 0.75
        })
      });

      const result = await reverseGeocode(55.9988, -3.8314);
      
      expect(result.name).toBe('Larbert');
      expect(result.region).toBe('Falkirk');
      expect(result.postcode).toBe('FK5 3LZ');
    });

    it('should handle village/hamlet locations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          display_name: 'Small Village, Highland, Scotland, United Kingdom',
          address: {
            village: 'Small Village',
            county: 'Highland',
            state: 'Scotland',
            country: 'United Kingdom'
          },
          importance: 0.45
        })
      });

      const result = await reverseGeocode(57.5, -4.5);
      
      expect(result.name).toBe('Small Village');
      expect(result.region).toBe('Highland');
    });

    it('should handle API failures with fallback', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await reverseGeocode(55.9533, -3.1883);
      
      expect(result.name).toBe('Current Location');
      expect(result.fullName).toBe('Location at 55.9533, -3.1883');
      expect(result.country).toBe('United Kingdom');
      expect(result.confidence).toBe(50);
    });

    it('should detect UK coordinates correctly', async () => {
      // UK coordinates
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      let result = await reverseGeocode(55.9533, -3.1883); // Edinburgh
      expect(result.country).toBe('United Kingdom');

      result = await reverseGeocode(51.5074, -0.1278); // London
      expect(result.country).toBe('United Kingdom');

      // Non-UK coordinates
      result = await reverseGeocode(40.7128, -74.0060); // New York
      expect(result.country).toBe('Unknown');
    });
  });

  describe('Coordinate Validation', () => {
    it('should validate correct coordinates', () => {
      expect(validateCoordinates(55.9533, -3.1883)).toBe(true); // Edinburgh
      expect(validateCoordinates(0, 0)).toBe(true); // Equator/Prime Meridian
      expect(validateCoordinates(90, 180)).toBe(true); // North Pole, Date Line
      expect(validateCoordinates(-90, -180)).toBe(true); // South Pole, Date Line
    });

    it('should reject invalid coordinates', () => {
      expect(validateCoordinates(91, 0)).toBe(false); // Invalid latitude
      expect(validateCoordinates(-91, 0)).toBe(false); // Invalid latitude
      expect(validateCoordinates(0, 181)).toBe(false); // Invalid longitude
      expect(validateCoordinates(0, -181)).toBe(false); // Invalid longitude
      expect(validateCoordinates(NaN, 0)).toBe(false); // NaN values
      expect(validateCoordinates(0, NaN)).toBe(false); // NaN values
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate distance between two points correctly', () => {
      // Edinburgh to Glasgow (approximate)
      const edinburgh = { lat: 55.9533, lon: -3.1883 };
      const glasgow = { lat: 55.8642, lon: -4.2518 };
      
      const distance = getDistance(edinburgh.lat, edinburgh.lon, glasgow.lat, glasgow.lon);
      
      expect(distance).toBeCloseTo(67, 0); // ~67 km between Edinburgh and Glasgow
    });

    it('should handle identical coordinates', () => {
      const distance = getDistance(55.9533, -3.1883, 55.9533, -3.1883);
      expect(distance).toBeCloseTo(0, 2);
    });

    it('should handle antipodal points', () => {
      // Points on opposite sides of Earth
      const distance = getDistance(0, 0, 0, 180);
      expect(distance).toBeCloseTo(20015, 0); // ~20,015 km (half Earth's circumference)
    });

    it('should handle poles correctly', () => {
      const distance = getDistance(90, 0, -90, 0);
      expect(distance).toBeCloseTo(20015, 0); // Pole to pole
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle network timeouts', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        })
      );

      await expect(geocodeLocation('Edinburgh')).rejects.toThrow();
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Unexpected token'))
      });

      await expect(geocodeLocation('Edinburgh')).rejects.toThrow();
    });

    it('should handle empty location strings', async () => {
      await expect(geocodeLocation(''))
        .rejects
        .toThrow('Unable to find location ""');
    });

    it('should handle whitespace-only location strings', async () => {
      await expect(geocodeLocation('   '))
        .rejects
        .toThrow('Unable to find location "   "');
    });

    it('should handle very long location strings', async () => {
      const longLocation = 'A'.repeat(1000);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] })
      });

      await expect(geocodeLocation(longLocation))
        .rejects
        .toThrow(`Unable to find location "${longLocation}"`);
    });

    it('should handle special characters in location names', async () => {
      const specialLocation = 'Test-Location_123!@#$%^&*()[]{}|\\:";\'<>?,./ àáâãäåæçèéêë';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createOpenMeteoResponse([
          {
            name: 'Test Location',
            country: 'United Kingdom',
            country_code: 'GB',
            admin1: 'Scotland',
            latitude: 55.9533,
            longitude: -3.1883
          }
        ]))
      });

      const result = await geocodeLocation(specialLocation);
      expect(result.name).toBe('Test Location');
    });

    it('should handle partial UK postcode formats', async () => {
      const partialPostcodes = ['M1', 'SW1A', 'B33'];
      
      for (const postcode of partialPostcodes) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{
            lat: '55.9533',
            lon: '-3.1883',
            display_name: `${postcode} area, TestTown, England, United Kingdom`
          }])
        });

        const result = await geocodeLocation(postcode);
        expect(result.country).toBe('United Kingdom');
        expect(result.confidence).toBeGreaterThan(0);
      }
    });
  });

  describe('API Rate Limiting and Resilience', () => {
    it('should handle rate limiting (429 status)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429
      });

      await expect(geocodeLocation('Edinburgh')).rejects.toThrow();
    });

    it('should retry with different query formats when first attempt fails', async () => {
      // First query fails
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] })
      });

      // Second query succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createOpenMeteoResponse([
          {
            name: 'Larbert',
            country: 'United Kingdom',
            country_code: 'GB',
            admin1: 'Scotland',
            latitude: 55.9988,
            longitude: -3.8314
          }
        ]))
      });

      const result = await geocodeLocation('Larbert, Scotland, UK');
      expect(result.name).toBe('Larbert');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle service unavailable (503 status)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      });

      await expect(geocodeLocation('Edinburgh')).rejects.toThrow();
    });
  });
});

// Helper function for creating Open-Meteo response format
const createOpenMeteoResponse = (locations: any[]) => ({ results: locations });