# Woodburner App Algorithms

Clean, modular implementation of the FlameCast woodburner ignition algorithm using the shared `@weather-apps/core-algorithm` package.

## Architecture

```
algorithms/
├── burning-config.ts    # Algorithm configuration (weights, thresholds, rules)
├── BurningScorer.ts     # Core scoring implementation
├── index.ts             # Barrel exports
└── README.md            # This file
```

## Usage

### Basic Scoring

```typescript
import { burningScorer } from './algorithms';

// Score a single hour with context
const result = burningScorer.scoreHour(weatherData, location, {
  indoorTemp: 18,  // Optional: user override
  month: 1,        // January
  hour: 19         // 7pm
});

console.log(`Score: ${result.overallScore}/100`);
console.log(`Disqualified: ${result.disqualified}`);
console.log(`Temperature Differential: ${result.modifiers.temperatureDifferential}°C`);
console.log(`Components:`, result.componentScores);
```

### Generate Recommendations

```typescript
import { burningScorer } from './algorithms';

// Score all 72 hours of forecast
const hourlyScores = weatherForecast.map((hour, index) =>
  burningScorer.scoreHour(hour, location, {
    month: currentMonth,
    hour: (currentHour + index) % 24
  })
);

// Find optimal windows and generate recommendation
const recommendation = burningScorer.generateRecommendation(hourlyScores, location);

console.log(`Decision: ${recommendation.label}`); // EXCELLENT, GOOD, or MARGINAL
console.log(`Confidence: ${(recommendation.confidence * 100).toFixed(0)}%`);
console.log(`Best window: ${recommendation.bestWindow?.start} to ${recommendation.bestWindow?.end}`);
console.log(`Warnings:`, recommendation.warnings);
```

### Find Burning Windows

```typescript
import { burningScorer } from './algorithms';

// Find all 2+ hour windows with score >= 60
const windows = burningScorer.findOptimalWindows(hourlyScores, {
  minDuration: 2,      // Minimum 2 hours
  minScore: 60,        // GOOD threshold
  maxGap: 1,           // Allow 1-hour gaps
  requireContinuous: false,
});

windows.forEach(window => {
  console.log(`${window.start} to ${window.end}: ${window.averageScore}/100`);
});
```

### Custom Indoor Temperature

```typescript
import { getIndoorTemp } from './algorithms';

// Use default profiles
const defaultTemp = getIndoorTemp(19, 1); // 7pm in January
console.log(`Default indoor temp: ${defaultTemp}°C`); // 18°C (winter evening)

// Override with user input
const result = burningScorer.scoreHour(weatherData, location, {
  indoorTemp: 20,  // User says their house is 20°C
  month: 1,
  hour: 19
});
```

## Algorithm Configuration

### Component Weights (sum to 1.0)

| Component | Weight | Description |
|-----------|--------|-------------|
| Temperature Differential | 50% | Stack effect (Indoor - Outdoor) - PRIMARY DRIVER |
| Atmospheric Pressure | 15% | Air density and buoyancy |
| Humidity | 15% | Ignition ease and condensation risk |
| Wind Speed | 10% | Smoke dispersal and draft (assumes chimney cap) |
| Precipitation | 10% | Chimney cooling and moisture |

### Decision Thresholds

- **EXCELLENT (75-100)**: Perfect for lighting - easy ignition, strong draft expected
- **GOOD (60-74)**: Light normally - standard procedure works
- **MARGINAL (45-59)**: Take precautions - pre-warm chimney, use dry kindling
- **POOR (30-44)**: Not recommended - difficult ignition, expect smoking
- **AVOID (0-29)**: Do NOT light - backdraft or severe smoking risk

### Disqualification Rules

**Hard Rules** (score → 0):
- Temperature inversion (outdoor > indoor) - **CRITICAL BACKDRAFT RISK**
- Extreme storm conditions (pressure < 980 mb)

**Soft Rules** (score penalties):
- Very low pressure (< 990 mb) → -30 points
- Heavy rain (> 5 mm/h) → -20 points
- Fog conditions (humidity > 95%) → -15 points

## Temperature Differential Physics

The stack effect is the primary driver of chimney draft:

```
ΔP ∝ H × (ρₒ - ρᵢ) × g
```

Where:
- ΔP = pressure difference (draft strength)
- H = chimney height
- ρₒ = outdoor air density
- ρᵢ = indoor air density
- g = gravitational acceleration

**Key principle**: Greater temperature difference → greater density difference → stronger draft

### Temperature Differential Ranges

| ΔT (Indoor - Outdoor) | Score | Draft Quality |
|----------------------|-------|---------------|
| < 0°C (inversion) | 0 | **CRITICAL** - Backdraft risk |
| 0-2°C | 10 | Severe backdraft risk |
| 2-5°C | 30 | Very difficult ignition |
| 5-10°C | 60 | Marginal - pre-warm chimney |
| 10-15°C | 80 | Good draft expected |
| ≥ 15°C | 100 | Excellent draft |

### Indoor Temperature Profiles

Default UK/Ireland home heating patterns:

**Winter (Dec-Feb)**:
- Morning (6am-9am): 15°C
- Day (9am-5pm): 17°C
- Evening (5pm-11pm): 18°C
- Night (11pm-6am): 15°C

**Spring/Autumn (Mar-May, Sep-Nov)**:
- +1°C from winter

**Summer (Jun-Aug)**:
- +2°C from winter

## Critical Warnings

### Temperature Inversion
**Condition**: Outside temperature exceeds indoor temperature (ΔT < 0)
**Risk**: SEVERE BACKDRAFT - smoke will enter room instead of venting
**Action**: DO NOT LIGHT under any circumstances

### Summer Chimney Syndrome
**Condition**: High pressure (>1020 mb) + calm winds (<5 km/h) + marginal ΔT (<5°C) in summer
**Risk**: Weak draft, difficult ignition
**Action**: Pre-warm chimney with newspaper torch before attempting ignition

### Cold Chimney Morning
**Condition**: Early morning (6am-9am) with marginal ΔT (<8°C)
**Risk**: Cold flue from overnight cooling
**Action**: Use newspaper torch to pre-warm flue before lighting

### Very Damp Conditions
**Condition**: High humidity (>85%) + marginal ΔT (<10°C)
**Risk**: Difficult ignition, condensation in flue
**Action**: Use only dry kindling (<15% moisture content)

### Fog Conditions
**Condition**: Very high humidity (>95%)
**Risk**: Poor visibility, difficult ignition, smoke retention
**Action**: Expect difficult ignition and poor smoke dispersion

## Extending the Algorithm

To modify the algorithm:

1. **Change weights**: Edit `burning-config.ts` → `BURNING_WEIGHTS`
2. **Adjust thresholds**: Edit `burning-config.ts` → `BURNING_THRESHOLDS`
3. **Add rules**: Edit `burning-config.ts` → `BURNING_DISQUALIFICATION_RULES`
4. **Custom scoring**: Override methods in `BurningScorer.ts`

Example: Adjust temperature differential scoring

```typescript
class CustomBurningScorer extends BurningScorer {
  protected scoreTemperatureDifferential(deltaT: number): number {
    // Your custom ΔT scoring logic
    const baseScore = super.scoreTemperatureDifferential(deltaT);
    return baseScore * 1.1; // Boost importance
  }
}
```

## Data Flow

```
Weather API Data
    ↓
HourlyWeatherData (typed)
    ↓
BurningScorer.scoreHour() + BurningContext
    ↓
ScoringResult (0-100 + components + ΔT)
    ↓
BurningScorer.findOptimalWindows()
    ↓
TimeWindow[] (2+ hour periods)
    ↓
BurningScorer.generateRecommendation()
    ↓
Recommendation (EXCELLENT/GOOD/MARGINAL)
```

## Features

- **Temperature Differential-Driven**: Stack effect is the #1 predictor of draft
- **Physics-Based**: Uses chimney draft physics (buoyancy, air density)
- **Seasonal Awareness**: Indoor temperature profiles by season and time of day
- **Critical Safety Warnings**: Temperature inversion, summer chimney syndrome
- **Transparent**: Full component scores and temperature differential exposed
- **Evening-Optimized**: Recognizes that most burning happens 5pm-11pm

## Testing

```bash
# Type check
npx tsc --noEmit algorithms/BurningScorer.ts

# Build
npm run build

# Unit tests (when implemented)
npm test algorithms/BurningScorer.test.ts
```

## Migration from Legacy woodburnerService.ts

The new algorithm can be integrated into the existing `services/woodburnerService.ts`:

**Old:**
```typescript
const flameCastScores = calculateFlameCastScores(
  weatherData.hourlyData,
  preferences
);
```

**New:**
```typescript
import { burningScorer } from './algorithms';

// Convert forecast to HourlyWeatherData format
const hourlyScores = weatherData.hourlyData.map((hour, index) =>
  burningScorer.scoreHour(
    convertToWeatherData(hour),
    location,
    {
      indoorTemp: preferences?.indoorTempOverride,
      month: new Date(hour.time).getMonth() + 1,
      hour: new Date(hour.time).getHours()
    }
  )
);

const recommendation = burningScorer.generateRecommendation(hourlyScores, location);
```

## Comparison with Washing App

| Feature | Washing (DryCast) | Woodburner (FlameCast) |
|---------|-------------------|------------------------|
| **Primary Factor** | Vapor Pressure Deficit (30%) | Temperature Differential (50%) |
| **Key Physics** | Evaporation rate | Stack effect (buoyancy) |
| **Secondary Factors** | Wind (20%), Wet bulb (10%) | Pressure (15%), Humidity (15%) |
| **Critical Warnings** | Rain, condensation | Temperature inversion, backdraft |
| **Location Dependency** | High (coastal intelligence) | Low (indoor activity) |
| **Time Sensitivity** | Daylight hours only | Evening hours preferred |
| **Threshold Labels** | YES/MAYBE/NO | EXCELLENT/GOOD/MARGINAL |

## References

- Base class: `@weather-apps/core-algorithm/src/engine/WeatherScorer.ts`
- Types: `@weather-apps/core-algorithm/src/types.ts`
- Legacy service: `services/woodburnerService.ts`
- Algorithm modules: `services/algorithm/temperature-differential.ts`, `services/algorithm/atmospheric-stability.ts`

## Future Enhancements

1. **Chimney Height Factor**: Adjust scoring based on chimney height (taller = stronger draft)
2. **Fuel Moisture Integration**: Account for wood moisture content if user provides data
3. **Historical Learning**: Learn user's actual indoor temperature patterns
4. **Stove Type Profiles**: Different scoring for wood stove vs open fireplace
5. **Air Quality Integration**: Consider local air quality restrictions on burning
