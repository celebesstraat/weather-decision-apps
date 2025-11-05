# @weather-apps/core-algorithm

**Abstract weather algorithm engine for decision-making applications**

This package provides the foundational architecture for building weather-based decision apps. It implements a flexible, extensible scoring system that converts meteorological data into actionable recommendations.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Extending WeatherScorer](#extending-weatherscorer)
- [Core Components](#core-components)
- [Normalization Functions](#normalization-functions)
- [Examples](#examples)
- [API Reference](#api-reference)

---

## Overview

The core algorithm engine provides:

1. **Abstract WeatherScorer** - Base class for custom algorithms
2. **Window Detection** - Find optimal time periods in weather data
3. **Location Intelligence** - Coastal/topographic adjustments
4. **Normalization Utilities** - Convert raw data to 0-100 scores
5. **Type Safety** - Comprehensive TypeScript definitions

### Use Cases

- **Laundry Drying** (GetTheWashingOut) - When to hang washing outside
- **Wood Burning** (WoodburnerOn) - When to light the fire
- **Outdoor Activities** - Sports, gardening, construction, etc.
- **Comfort Assessment** - Indoor/outdoor comfort ratings
- **Custom Applications** - Any weather-based decision logic

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Your Custom Scorer                      │
│  (extends WeatherScorer)                        │
│                                                 │
│  • Define component weights                     │
│  • Implement scoreHour()                        │
│  • Set decision thresholds                      │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│         WeatherScorer (Abstract)                │
│                                                 │
│  SHARED IMPLEMENTATIONS:                        │
│  • findOptimalWindows()                         │
│  • applyLocationModifiers()                     │
│  • generateRecommendation()                     │
└─────────────────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   ┌──────────┐ ┌─────────────┐ ┌────────────┐
   │  Window  │ │  Coastal    │ │    Wind    │
   │ Detector │ │Intelligence │ │  Analyzer  │
   └──────────┘ └─────────────┘ └────────────┘
         │             │             │
         └─────────────┼─────────────┘
                       ▼
         ┌─────────────────────────┐
         │  Normalization Utils    │
         │  • temperature          │
         │  • humidity             │
         │  • wind                 │
         │  • pressure             │
         │  • radiation            │
         └─────────────────────────┘
```

---

## Quick Start

### Installation

```bash
npm install @weather-apps/core-algorithm
```

### Basic Usage

```typescript
import {
  WeatherScorer,
  AlgorithmConfig,
  HourlyWeatherData,
  Location,
  ScoringResult,
} from '@weather-apps/core-algorithm';

// 1. Define your algorithm configuration
const config: AlgorithmConfig = {
  name: 'MyWeatherScorer',
  version: '1.0.0',

  // Component weights (MUST sum to 1.0)
  weights: {
    temperature: 0.3,
    humidity: 0.3,
    wind: 0.2,
    sunshine: 0.2,
  },

  // Decision thresholds
  thresholds: {
    excellent: 70,  // 70-100
    acceptable: 50, // 50-69
    poor: 0,        // 0-49
    minWindowDuration: 2,
    labels: {
      excellent: 'EXCELLENT',
      acceptable: 'OKAY',
      poor: 'POOR',
    },
  },

  // Disqualification rules
  disqualificationRules: [
    {
      name: 'rain',
      condition: (data) => data.precipitation > 0,
      reason: 'Rain detected',
      severity: 'hard',
    },
  ],

  // Feature flags
  features: {
    coastalIntelligence: true,
    windAnalysis: true,
    topographicAdjustments: true,
    temporalWeighting: false,
  },
};

// 2. Extend WeatherScorer
class MyScorer extends WeatherScorer {
  constructor() {
    super(config);
  }

  // REQUIRED: Implement scoring logic
  scoreHour(data: HourlyWeatherData, location: Location): ScoringResult {
    // Check disqualification rules first
    const disqualCheck = this.checkDisqualification(data);

    // Calculate component scores (0-100 each)
    const tempScore = this.normalizeTemperature(data.temperature, 0, 30, 20);
    const humidityScore = 100 - data.humidity; // Inverted
    const windScore = this.normalizeWindSpeed(data.windSpeed, 5, 40);
    const sunshineScore = data.sunshineDuration ? data.sunshineDuration * 100 : 0;

    const componentScores = {
      temperature: tempScore,
      humidity: humidityScore,
      wind: windScore,
      sunshine: sunshineScore,
    };

    // Apply weights
    let overallScore = this.applyWeights(componentScores);

    // Apply soft disqualification penalties
    overallScore -= disqualCheck.penalty;

    // Apply location modifiers
    overallScore = this.applyLocationModifiers(overallScore, location, data);

    // Hard disqualification sets score to 0
    if (disqualCheck.disqualified) {
      overallScore = 0;
    }

    return {
      timestamp: data.time,
      overallScore: Math.max(0, Math.min(100, overallScore)),
      componentScores,
      modifiers: {},
      disqualified: disqualCheck.disqualified,
      disqualificationReasons: disqualCheck.reasons,
      weatherData: data,
    };
  }

  // REQUIRED: Define decision thresholds
  getDecisionThresholds() {
    return this.config.thresholds;
  }

  // Helper to normalize wind speed
  private normalizeWindSpeed(speed: number, min: number, max: number): number {
    return this.normalize(speed, min, max);
  }
}

// 3. Use your scorer
const scorer = new MyScorer();
const hourlyData: HourlyWeatherData[] = [...]; // from weather API
const location: Location = {
  latitude: 51.5074,
  longitude: -0.1278,
  name: 'London',
  country: 'GB',
  timezone: 'Europe/London',
};

// Score all hours
const scoredHours = hourlyData.map(hour => scorer.scoreHour(hour, location));

// Find optimal windows
const windows = scorer.findOptimalWindows(scoredHours);

// Generate recommendation
const recommendation = scorer.generateRecommendation(scoredHours, location);

console.log(recommendation);
// {
//   decision: 'excellent',
//   label: 'EXCELLENT',
//   confidence: 0.85,
//   currentScore: 78,
//   bestWindow: { start: '2024-01-01T14:00:00Z', duration: 3.5, ... },
//   ...
// }
```

---

## Extending WeatherScorer

The `WeatherScorer` abstract class is designed for easy extension. Here's what you need to implement:

### Required Methods

#### 1. `scoreHour(data, location): ScoringResult`

Calculate a 0-100 score for a single hour of weather data.

**Steps:**
1. Check disqualification rules
2. Calculate component scores (0-100 each)
3. Apply component weights
4. Apply location modifiers
5. Return `ScoringResult`

**Example:**
```typescript
scoreHour(data: HourlyWeatherData, location: Location): ScoringResult {
  // 1. Check disqualification
  const disqualCheck = this.checkDisqualification(data);

  // 2. Component scores
  const vpd = normalizeVaporPressureDeficit(data.vaporPressureDeficit);
  const wind = normalizeDryingWindSpeed(data.windSpeed);
  const temp = normalizeDryingTemperature(data.temperature);

  const componentScores = { vpd, wind, temp };

  // 3. Apply weights
  let score = this.applyWeights(componentScores);

  // 4. Apply modifiers
  score = this.applyLocationModifiers(score, location, data);

  // 5. Return result
  return {
    timestamp: data.time,
    overallScore: disqualCheck.disqualified ? 0 : score,
    componentScores,
    modifiers: {},
    disqualified: disqualCheck.disqualified,
    disqualificationReasons: disqualCheck.reasons,
    weatherData: data,
  };
}
```

#### 2. `getDecisionThresholds(): DecisionThresholds`

Define what scores mean for your application.

**Example:**
```typescript
getDecisionThresholds() {
  return {
    excellent: 70,  // 70-100 = "YES"
    acceptable: 50, // 50-69 = "MAYBE"
    poor: 0,        // 0-49 = "NO"
    minWindowDuration: 2,
    labels: {
      excellent: 'YES',
      acceptable: 'MAYBE',
      poor: 'NO',
    },
  };
}
```

### Inherited Methods (Pre-built)

These methods are already implemented in `WeatherScorer`:

- **`findOptimalWindows(hourlyScores, options?)`** - Detect continuous good-condition periods
- **`applyLocationModifiers(score, location, data)`** - Adjust for coastal/wind/topographic factors
- **`generateRecommendation(hourlyScores, location)`** - Create user-facing recommendation
- **`applyWeights(componentScores)`** - Multiply scores by configured weights
- **`checkDisqualification(data)`** - Test against disqualification rules
- **`normalize(value, min, max, optimal?)`** - Basic 0-100 normalization

### Optional Overrides

You can override these for custom behavior:

```typescript
// Custom location logic
applyLocationModifiers(score: number, location: Location, data: HourlyWeatherData): number {
  let modified = super.applyLocationModifiers(score, location, data);

  // Add your custom adjustments
  if (location.urbanDensity === 'urban') {
    modified *= 0.9; // 10% penalty for urban areas
  }

  return modified;
}

// Custom confidence calculation
protected calculateConfidence(hourlyScores: ScoringResult[], windows: TimeWindow[]): number {
  // Your confidence logic
  return 0.85;
}
```

---

## Core Components

### WindowDetector

Finds continuous time periods where conditions meet quality thresholds.

```typescript
import { WindowDetector } from '@weather-apps/core-algorithm';

const detector = new WindowDetector();

const windows = detector.findWindows(scoredHours, {
  minDuration: 2,        // At least 2 hours
  minScore: 60,          // Average score >= 60
  maxGap: 1,             // Allow 1-hour gaps
  requireContinuous: false,
});

// Result: Array of TimeWindow objects
// [
//   {
//     start: '2024-01-01T14:00:00Z',
//     end: '2024-01-01T17:00:00Z',
//     durationHours: 3,
//     averageScore: 78,
//     minScore: 72,
//     maxScore: 85,
//     consistency: 0.92,
//     confidence: 0.88,
//     hourlyScores: [...]
//   }
// ]
```

**Methods:**
- `findWindows(scores, options)` - Detect all qualifying windows
- `mergeWindows(windows)` - Merge overlapping windows
- `findBestWindow(windows)` - Get single best window
- `filterByTimeOfDay(windows, startHour, endHour)` - Filter by time range

### CoastalIntelligence

Adjusts wind tolerance based on distance from coast.

```typescript
import { CoastalIntelligence } from '@weather-apps/core-algorithm';

const coastal = new CoastalIntelligence();

// Load coastal data (optional - can use estimation)
coastal.loadCoastalData(ukCoastalPoints);

// Get wind tolerance modifier
const modifier = coastal.getWindToleranceModifier(
  5,   // 5km from coast
  30   // 30 km/h wind
);
// Returns: +15 (coastal areas tolerate wind better)

// Estimate coastal distance
const distance = coastal.estimateCoastalDistance(51.5074, -0.1278);
// Returns: ~50km (London to coast)
```

### WindAnalyzer

Analyzes wind with topographic considerations.

```typescript
import { WindAnalyzer } from '@weather-apps/core-algorithm';

const analyzer = new WindAnalyzer();

const analysis = analyzer.analyzeWind(
  25,                      // 25 km/h
  225,                     // SW (prevailing)
  {
    latitude: 51.5,
    longitude: -0.1,
    name: 'London',
    country: 'GB',
    timezone: 'Europe/London',
    urbanDensity: 'urban',
    elevation: 20,
  }
);

// Result:
// {
//   effectiveSpeed: 17.5,      // Reduced by shelter
//   shelterFactor: 0.7,        // Urban = high shelter
//   directionFactor: 1.0,      // Aligned with prevailing
//   gustPotential: 0.45,       // Moderate gust risk
//   score: 85                  // Overall wind score
// }
```

---

## Normalization Functions

Convert raw weather data to 0-100 scores. All functions follow the pattern:
- **0-30**: Poor conditions
- **30-60**: Marginal conditions
- **60-80**: Good conditions
- **80-100**: Excellent conditions

### Temperature

```typescript
import {
  normalizeDryingTemperature,
  normalizeBurningTemperature,
  normalizeWetBulbTemperature,
  normalizeDewPointSpread,
} from '@weather-apps/core-algorithm';

// Drying (optimal: 15-25°C)
const dryingScore = normalizeDryingTemperature(20); // 90

// Burning (lower is better)
const burningScore = normalizeBurningTemperature(5); // 92

// Wet bulb (evaporative cooling)
const wetBulbScore = normalizeWetBulbTemperature(12); // 65

// Dew point spread (condensation risk)
const spreadScore = normalizeDewPointSpread(4.5); // 87
```

### Humidity

```typescript
import {
  normalizeRelativeHumidity,
  normalizeVaporPressureDeficit,
  calculateVPD,
} from '@weather-apps/core-algorithm';

// Relative humidity (inverted for drying)
const rhScore = normalizeRelativeHumidity(45, true); // 87

// Vapor Pressure Deficit
const vpdScore = normalizeVaporPressureDeficit(2.5); // 82

// Calculate VPD from temp and RH
const vpd = calculateVPD(20, 60); // 0.94 kPa
```

### Wind

```typescript
import {
  normalizeDryingWindSpeed,
  normalizeBurningWindSpeed,
  beaufortScale,
  calculateWindChill,
} from '@weather-apps/core-algorithm';

// Drying (optimal: 15-25 km/h)
const dryingWind = normalizeDryingWindSpeed(20); // 94

// Burning (optimal: 5-15 km/h)
const burningWind = normalizeBurningWindSpeed(10); // 100

// Beaufort classification
const beaufort = beaufortScale(30);
// { force: 4, description: 'Moderate breeze', ... }

// Wind chill
const feelsLike = calculateWindChill(5, 25); // 0.8°C
```

### Pressure

```typescript
import {
  normalizePressure,
  normalizePressureTrend,
  classifyPressure,
} from '@weather-apps/core-algorithm';

// Absolute pressure
const pressureScore = normalizePressure(1025); // 91 (high = good)

// Pressure trend
const trendScore = normalizePressureTrend(1.5); // 90 (rising = good)

// Classification
const classification = classifyPressure(1025);
// { category: 'High', weatherTendency: 'Settled, dry weather' }
```

### Radiation

```typescript
import {
  normalizeShortwaveRadiation,
  normalizeSunshineDuration,
  normalizeUVIndex,
} from '@weather-apps/core-algorithm';

// Solar radiation
const radiationScore = normalizeShortwaveRadiation(650); // 100

// Sunshine duration
const sunshineScore = normalizeSunshineDuration(8, 12); // 67

// UV index
const uvScore = normalizeUVIndex(6); // 90
```

---

## Examples

### Example 1: Drying Algorithm (GetTheWashingOut)

```typescript
import {
  WeatherScorer,
  AlgorithmConfig,
  normalizeVaporPressureDeficit,
  normalizeDryingWindSpeed,
  normalizeDryingTemperature,
  normalizeSunshineDuration,
} from '@weather-apps/core-algorithm';

const dryingConfig: AlgorithmConfig = {
  name: 'DryCast',
  version: '2.0.0',
  weights: {
    vaporPressureDeficit: 0.30,
    windSpeed: 0.20,
    temperature: 0.15,
    sunshine: 0.15,
    humidity: 0.10,
    radiation: 0.10,
  },
  thresholds: {
    excellent: 70,
    acceptable: 50,
    poor: 0,
    minWindowDuration: 2,
    labels: {
      excellent: 'YES - Hang it out!',
      acceptable: 'MAYBE - Risky',
      poor: 'NO - Keep it inside',
    },
  },
  disqualificationRules: [
    {
      name: 'rain',
      condition: (d) => d.precipitation > 0,
      reason: 'Rain detected',
      severity: 'hard',
    },
    {
      name: 'condensation',
      condition: (d) => (d.temperature - d.dewPoint) < 1,
      reason: 'High condensation risk',
      severity: 'hard',
    },
  ],
  features: {
    coastalIntelligence: true,
    windAnalysis: true,
    topographicAdjustments: true,
    temporalWeighting: false,
  },
};

class DryingScorer extends WeatherScorer {
  constructor() {
    super(dryingConfig);
  }

  scoreHour(data: HourlyWeatherData, location: Location): ScoringResult {
    const disqualCheck = this.checkDisqualification(data);

    const componentScores = {
      vaporPressureDeficit: normalizeVaporPressureDeficit(data.vaporPressureDeficit || 0),
      windSpeed: normalizeDryingWindSpeed(data.windSpeed),
      temperature: normalizeDryingTemperature(data.temperature),
      sunshine: normalizeSunshineDuration(data.sunshineDuration || 0),
      humidity: 100 - data.humidity,
      radiation: (data.shortwaveRadiation || 0) / 10,
    };

    let score = this.applyWeights(componentScores);
    score = this.applyLocationModifiers(score, location, data);

    return {
      timestamp: data.time,
      overallScore: disqualCheck.disqualified ? 0 : score,
      componentScores,
      modifiers: {},
      disqualified: disqualCheck.disqualified,
      disqualificationReasons: disqualCheck.reasons,
      weatherData: data,
    };
  }

  getDecisionThresholds() {
    return this.config.thresholds;
  }
}
```

### Example 2: Burning Algorithm (WoodburnerOn)

```typescript
import {
  WeatherScorer,
  AlgorithmConfig,
  normalizeBurningTemperature,
  normalizeBurningWindSpeed,
  normalizePressure,
} from '@weather-apps/core-algorithm';

const burningConfig: AlgorithmConfig = {
  name: 'BurnCast',
  version: '1.0.0',
  weights: {
    temperature: 0.40,
    wind: 0.25,
    pressure: 0.20,
    humidity: 0.15,
  },
  thresholds: {
    excellent: 75,
    acceptable: 60,
    poor: 0,
    minWindowDuration: 3,
    labels: {
      excellent: 'YES - Perfect fire weather',
      acceptable: 'MAYBE - Light if needed',
      poor: 'NO - Too warm',
    },
  },
  disqualificationRules: [
    {
      name: 'tooWarm',
      condition: (d) => d.temperature > 18,
      reason: 'Too warm for fires',
      severity: 'hard',
    },
    {
      name: 'strongWinds',
      condition: (d) => d.windSpeed > 35,
      reason: 'Dangerous wind speeds',
      severity: 'hard',
    },
  ],
  features: {
    coastalIntelligence: false,
    windAnalysis: true,
    topographicAdjustments: false,
    temporalWeighting: true, // Evening/morning better
  },
};

class BurningScorer extends WeatherScorer {
  constructor() {
    super(burningConfig);
  }

  scoreHour(data: HourlyWeatherData, location: Location): ScoringResult {
    const disqualCheck = this.checkDisqualification(data);

    const componentScores = {
      temperature: normalizeBurningTemperature(data.temperature),
      wind: normalizeBurningWindSpeed(data.windSpeed),
      pressure: normalizePressure(data.pressure),
      humidity: data.humidity, // Higher humidity = better (less dry = safer)
    };

    let score = this.applyWeights(componentScores);

    // Temporal weighting (evening boost)
    const hour = new Date(data.time).getHours();
    if (hour >= 17 && hour <= 22) {
      score *= 1.1; // 10% boost for evening hours
    }

    return {
      timestamp: data.time,
      overallScore: disqualCheck.disqualified ? 0 : Math.min(100, score),
      componentScores,
      modifiers: { temporal: hour >= 17 && hour <= 22 ? 10 : 0 },
      disqualified: disqualCheck.disqualified,
      disqualificationReasons: disqualCheck.reasons,
      weatherData: data,
    };
  }

  getDecisionThresholds() {
    return this.config.thresholds;
  }
}
```

---

## API Reference

### Types

See `src/types.ts` for complete definitions. Key interfaces:

- **`HourlyWeatherData`** - Weather data for one hour
- **`Location`** - Geographic location with context
- **`ScoringResult`** - Scored hour with breakdown
- **`TimeWindow`** - Continuous period of good conditions
- **`Recommendation`** - Final user-facing output
- **`AlgorithmConfig`** - Complete algorithm configuration

### WeatherScorer Methods

#### Abstract (Must Implement)

- `scoreHour(data, location): ScoringResult`
- `getDecisionThresholds(): DecisionThresholds`

#### Concrete (Pre-built)

- `findOptimalWindows(scores, options?): TimeWindow[]`
- `applyLocationModifiers(score, location, data): number`
- `generateRecommendation(scores, location): Recommendation`
- `getConfig(): AlgorithmConfig`

#### Protected Helpers

- `applyWeights(componentScores): number`
- `checkDisqualification(data): { disqualified, reasons, penalty }`
- `normalize(value, min, max, optimal?): number`
- `calculateStdDev(values): number`

---

## Best Practices

### 1. Weight Configuration

Weights MUST sum to 1.0:

```typescript
weights: {
  componentA: 0.30,  // 30%
  componentB: 0.25,  // 25%
  componentC: 0.25,  // 25%
  componentD: 0.20,  // 20%
  // Total: 1.00 ✓
}
```

### 2. Disqualification Rules

Use "hard" severity sparingly - only for conditions that absolutely prevent the activity:

```typescript
disqualificationRules: [
  {
    name: 'rain',
    condition: (d) => d.precipitation > 0,
    reason: 'Rain detected',
    severity: 'hard', // Score becomes 0
  },
  {
    name: 'highHumidity',
    condition: (d) => d.humidity > 90,
    reason: 'Very high humidity',
    severity: 'soft', // Penalty applied
    penalty: 20,
  },
]
```

### 3. Component Scores

Always return 0-100 for each component:

```typescript
const componentScores = {
  temperature: Math.max(0, Math.min(100, tempScore)),
  wind: Math.max(0, Math.min(100, windScore)),
  // ...
};
```

### 4. Testing

Test your scorer with edge cases:

```typescript
// Test extreme conditions
const freezing = scorer.scoreHour({ temperature: -10, ... }, location);
const heatwave = scorer.scoreHour({ temperature: 40, ... }, location);
const hurricane = scorer.scoreHour({ windSpeed: 150, ... }, location);

// Verify weights sum to 1.0
const config = scorer.getConfig();
const weightSum = Object.values(config.weights).reduce((sum, w) => sum + w, 0);
expect(Math.abs(weightSum - 1.0)).toBeLessThan(0.01);
```

---

## Contributing

Contributions welcome! Please:

1. Follow existing patterns in `WeatherScorer`
2. Add comprehensive JSDoc comments
3. Include unit tests for normalization functions
4. Update this README with new features

---

## License

MIT

---

## Support

For issues, questions, or suggestions:
- GitHub Issues: https://github.com/steel/weather-decision-apps
- Email: steel@example.com

---

**Built with TypeScript 5.8+ • Tested with Jest • Production-ready**
