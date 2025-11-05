# Washing App Algorithms

Clean, modular implementation of the DryCast laundry drying algorithm using the shared `@weather-apps/core-algorithm` package.

## Architecture

```
algorithms/
├── drying-config.ts    # Algorithm configuration (weights, thresholds, rules)
├── DryingScorer.ts     # Core scoring implementation
├── index.ts            # Barrel exports
└── README.md           # This file
```

## Usage

### Basic Scoring

```typescript
import { dryingScorer } from './algorithms';

// Score a single hour
const result = dryingScorer.scoreHour(weatherData, location);
console.log(`Score: ${result.overallScore}/100`);
console.log(`Disqualified: ${result.disqualified}`);
console.log(`Components:`, result.componentScores);
```

### Generate Recommendations

```typescript
import { dryingScorer } from './algorithms';

// Score all 72 hours of forecast
const hourlyScores = weatherForecast.map(hour =>
  dryingScorer.scoreHour(hour, location)
);

// Find optimal windows and generate recommendation
const recommendation = dryingScorer.generateRecommendation(hourlyScores, location);

console.log(`Decision: ${recommendation.label}`); // YES, MAYBE, or NO
console.log(`Confidence: ${(recommendation.confidence * 100).toFixed(0)}%`);
console.log(`Best window: ${recommendation.bestWindow?.start} to ${recommendation.bestWindow?.end}`);
```

### Find Drying Windows

```typescript
import { dryingScorer } from './algorithms';

// Find all 2+ hour windows with score >= 50
const windows = dryingScorer.findOptimalWindows(hourlyScores, {
  minDuration: 2,      // Minimum 2 hours
  minScore: 50,        // Minimum score threshold
  maxGap: 1,           // Allow 1-hour gaps
  requireContinuous: false,
});

windows.forEach(window => {
  console.log(`${window.start} to ${window.end}: ${window.averageScore}/100`);
});
```

## Algorithm Configuration

### Component Weights (sum to 1.0)

| Component | Weight | Description |
|-----------|--------|-------------|
| Vapor Pressure Deficit | 30% | Air's "thirst" for moisture (most important) |
| Wind Speed | 20% | Evaporation acceleration |
| Wet Bulb Temperature | 10% | Evaporative cooling potential |
| Sunshine Duration | 9% | Actual sun exposure |
| Temperature | 8% | Warmth factor |
| Shortwave Radiation | 8% | Solar energy |
| Evapotranspiration | 5% | Real evaporation rates |
| Wind Direction | 5% | Shelter/exposure logic |
| Dew Point Spread | 5% | Condensation risk |

### Decision Thresholds

- **YES (70-100)**: Excellent drying - hang washing with confidence
- **MAYBE (50-69)**: Marginal but acceptable - watch the weather
- **NO (0-49)**: Poor drying - indoor drying recommended

### Disqualification Rules

**Hard Rules** (score → 0):
- Rain detected
- High rain risk (probability × intensity > 0.2)
- Condensation risk (dew point spread < 1°C)

**Soft Rules** (score penalties):
- Very high humidity (>95%) → -30 points
- Extreme wind (>50 km/h) → -20 points

## Extending the Algorithm

To modify the algorithm:

1. **Change weights**: Edit `drying-config.ts` → `DRYING_WEIGHTS`
2. **Adjust thresholds**: Edit `drying-config.ts` → `DRYING_THRESHOLDS`
3. **Add rules**: Edit `drying-config.ts` → `DRYING_DISQUALIFICATION_RULES`
4. **Custom scoring**: Override methods in `DryingScorer.ts`

Example: Add custom wind modifier

```typescript
class CustomDryingScorer extends DryingScorer {
  protected scoreWindSpeed(windSpeed: number): number {
    // Your custom wind scoring logic
    const baseScore = super.scoreWindSpeed(windSpeed);
    return baseScore * 1.2; // Boost wind importance
  }
}
```

## Data Flow

```
Weather API Data
    ↓
HourlyWeatherData (typed)
    ↓
DryingScorer.scoreHour()
    ↓
ScoringResult (0-100 + components)
    ↓
DryingScorer.findOptimalWindows()
    ↓
TimeWindow[] (2+ hour periods)
    ↓
DryingScorer.generateRecommendation()
    ↓
Recommendation (YES/MAYBE/NO)
```

## Features

- **VPD-Driven**: Vapor Pressure Deficit is the #1 predictor of drying
- **Coastal Intelligence**: Adjusts for distance from coast (220+ UK locations)
- **Wind Analysis**: Considers direction (onshore/offshore) and topography
- **Physics-Based**: Uses wet bulb temp, evapotranspiration, solar radiation
- **Transparent**: Full component scores and modifiers exposed

## Testing

```bash
# Type check
npx tsc --noEmit algorithms/DryingScorer.ts

# Build
npm run build

# Unit tests (when implemented)
npm test algorithms/DryingScorer.test.ts
```

## Migration from Legacy weatherService.ts

The new algorithm is a drop-in replacement for the scoring logic in `services/weatherService.ts`:

**Old:**
```typescript
const { recommendation, hourlyScores } = await calculateDryingConditions(
  hourlyForecast,
  locationData,
  astronomy
);
```

**New:**
```typescript
import { dryingScorer } from './algorithms';

// Convert forecast to HourlyWeatherData format
const hourlyScores = hourlyForecast.map(hour =>
  dryingScorer.scoreHour(convertToWeatherData(hour), location)
);

const recommendation = dryingScorer.generateRecommendation(hourlyScores, location);
```

## References

- Base class: `@weather-apps/core-algorithm/src/engine/WeatherScorer.ts`
- Normalization: `@weather-apps/core-algorithm/src/normalization/`
- Types: `@weather-apps/core-algorithm/src/types.ts`
