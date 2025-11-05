# @weather-apps/geolocation

Comprehensive geolocation services for weather decision apps. Provides geocoding (forward and reverse), browser geolocation access, and UK/Ireland geographic validation.

## Features

- **Nominatim Geocoding**: Search locations by name and reverse geocode coordinates to place names
- **Browser Geolocation**: Request user permission and access device location
- **UK/Ireland Validation**: Ensure coordinates are within supported UK/Ireland geographic bounds
- **Smart Caching**: 24-hour cache with automatic expiry for API results
- **Rate Limiting**: Compliant with Nominatim's 1 request/second rate limit
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install @weather-apps/geolocation
```

## Usage

### Nominatim Provider (Geocoding)

#### Search for a location by name

```typescript
import { NominatimProvider } from '@weather-apps/geolocation';

const provider = new NominatimProvider();

const result = await provider.searchLocation('London, UK');

if (result.success) {
  console.log(result.location);
  // {
  //   name: 'London',
  //   coordinates: { latitude: 51.5074, longitude: -0.1278 },
  //   displayName: 'London, England, United Kingdom',
  //   country: 'United Kingdom',
  //   confidence: 0.95
  // }
} else {
  console.error(result.error);
}
```

#### Reverse geocode coordinates to place name

```typescript
const coordinates = { latitude: 51.5074, longitude: -0.1278 };

const result = await provider.reverseGeocode(coordinates);

if (result.success) {
  console.log(result.location.displayName); // 'London, England, United Kingdom'
}
```

#### Cache management

```typescript
provider.cleanExpiredCache(); // Remove expired entries
provider.getCacheSize(); // Get current cache size
provider.clearCache(); // Clear entire cache
```

### Browser Geolocation

#### Get current location

```typescript
import { BrowserGeolocation } from '@weather-apps/geolocation';

const geolocation = new BrowserGeolocation();

// Check if geolocation is supported
if (geolocation.isGeolocationSupported()) {
  const result = await geolocation.getCurrentLocation();

  if (result.success) {
    console.log(result.location.coordinates);
    // { latitude: 51.5074, longitude: -0.1278 }
  } else {
    console.error(result.error); // 'Location permission denied...'
  }
}
```

#### Get location with high accuracy

```typescript
const result = await geolocation.getCurrentLocationHighAccuracy();

if (result.success) {
  console.log(result.details);
  // {
  //   accuracy: 20.5,
  //   altitude: 45.2,
  //   timestamp: 1234567890
  // }
}
```

#### Watch location for continuous updates

```typescript
const watchId = geolocation.watchLocation(
  (coordinates) => {
    console.log('Location updated:', coordinates);
  },
  (error) => {
    console.error('Watch error:', error);
  }
);

// Stop watching
geolocation.clearWatch(watchId);
```

#### Check permission status

```typescript
const status = await geolocation.checkPermissionStatus();
// Returns: 'granted' | 'denied' | 'prompt'

if (status === 'denied') {
  console.log('User has denied location access');
}
```

### UK/Ireland Validator

#### Validate coordinates

```typescript
import { UKIrelandValidator } from '@weather-apps/geolocation';

const validator = new UKIrelandValidator();

const result = validator.validateCoordinates({
  latitude: 51.5074,
  longitude: -0.1278,
});

if (result.withinBounds) {
  console.log('Location is in UK/Ireland');
} else {
  console.log(result.error);
  // 'Location is outside UK/Ireland bounds'
  console.log(result.warnings);
  // ['Nearest region: Republic of Ireland (500km away)', ...]
}
```

#### Quick check

```typescript
const isValid = validator.isWithinUKIreland({
  latitude: 51.5074,
  longitude: -0.1278,
});
```

#### Get supported regions

```typescript
const regions = validator.getSupportedRegions();
// ['England', 'Scotland', 'Wales', 'Northern Ireland', 'Republic of Ireland']
```

## Supported Regions

- **England**: 50.0°N - 55.8°N
- **Scotland**: 55.0°N - 60.8°N
- **Wales**: 51.4°N - 53.4°N
- **Northern Ireland**: 54.0°N - 55.3°N
- **Republic of Ireland**: 51.4°N - 55.4°N

## Rate Limiting

The Nominatim provider respects OpenStreetMap's 1 request per second rate limit. Requests are automatically delayed if needed.

## Caching

- **Cache Duration**: 24 hours
- **Cache Key**: Combination of query and coordinates
- **Auto-Expiry**: Expired entries are removed automatically
- **Manual Control**: Use `cleanExpiredCache()` or `clearCache()`

## Error Handling

All providers return a `GeocodingResult` object with comprehensive error information:

```typescript
interface GeocodingResult {
  success: boolean;
  location?: Location;
  error?: string;
  details?: Record<string, unknown>;
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Search query cannot be empty` | Empty search string | Provide non-empty query |
| `No location found for: X` | Location doesn't exist | Try a different search term |
| `Low confidence match` | Ambiguous location | Be more specific (add region/country) |
| `Location permission denied` | Browser geolocation blocked | Enable in browser settings |
| `Location is outside UK/Ireland bounds` | Coordinates out of range | Use coordinates within UK/Ireland |

## TypeScript Types

```typescript
import type {
  Coordinates,
  Location,
  GeocodingResult,
  ValidationResult,
} from '@weather-apps/geolocation';

const coords: Coordinates = {
  latitude: 51.5074,
  longitude: -0.1278,
};

const location: Location = {
  name: 'London',
  coordinates: coords,
  displayName: 'London, England, United Kingdom',
  country: 'United Kingdom',
  confidence: 0.95,
};
```

## Performance

- Nominatim searches are cached for 24 hours, avoiding redundant API calls
- Browser geolocation caches results with configurable age (5 minutes by default)
- Rate limiting ensures compliance without blocking user requests
- All network operations use native Fetch API (no external dependencies)

## Browser Support

- **Geolocation API**: Chrome 5+, Firefox 3.5+, Safari 5+, Edge 12+ (requires HTTPS or localhost)
- **Fetch API**: Chrome 42+, Firefox 39+, Safari 10.1+, Edge 14+
- **Permissions API**: Chrome 43+, Firefox 46+, Safari 16+

## API Keys

This package uses:
- **Nominatim (OpenStreetMap)**: Free, no API key required
- **Browser Geolocation**: Native browser API, no key required

## License

MIT
