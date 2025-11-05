# CLAUDE.md

**AI Assistant Guide** - Quick reference for understanding and working with this codebase

## What This Is

**GetTheWashingOut** is a React + TypeScript PWA that tells users when to hang their laundry outside. It combines real weather data from Open-Meteo API with a proprietary drying algorithm and Gemini AI summaries to provide actionable recommendations.

**Target Users**: UK residents who air-dry laundry outdoors
**Core Value**: Never bring in soggy washing or miss a perfect drying day again

## Architecture at a Glance

```
App.tsx (React 19 + hooks)
├── HeroDecision           → Giant YES/MAYBE/NO decision
├── LocationInput          → Text input + geolocation
├── ForecastTimeline       → Card-based 3-day timeline (lazy loaded)
└── AnimatedBackground     → Dynamic weather backdrop (lazy loaded)

Services Layer
├── weatherService.ts      → Core drying algorithm (1672 lines)
│   └── algorithm/
│       ├── config.ts             → Algorithm weights & thresholds
│       ├── coastal-intelligence.ts → Coastal wind modifiers
│       └── wind-analysis.ts       → Topographic shelter logic
├── weatherAPIService.ts   → Open-Meteo API integration (UK Met Office data)
├── geminiService.ts       → AI summaries (Gemini 2.5 Flash)
├── geoLocationService.ts  → Location → coordinates conversion
└── cacheService.ts        → Performance optimization

Data
└── uk-coastal-distances.json → 220+ UK locations with coastal distances

Utils
├── performanceMonitor.ts  → FPS, bundle size tracking
├── hapticFeedback.ts      → Mobile vibration
└── memoize.ts             → Function result caching
```

## The Drying Algorithm

**Input**: Hourly weather data (temperature, humidity, rain chance, wind speed, UV index, dew point)
**Output**: Drying score (0-100) + recommendation (YES/MAYBE/NO)

### Scoring Weights
```typescript
// From services/algorithm/config.ts
humidity: 40%        // Lower = better (most important)
rainChance: 25%      // >30% rain = unsuitable
windSpeed: 15%       // Optimal: 5-25 km/h
temperature: 10%     // Warmer = faster evaporation
uvIndex: 10%         // Sun helps drying
```

### Advanced Features
- **VPD Calculation**: Vapor Pressure Deficit (scientific drying metric)
- **Coastal Intelligence**: Wind modifiers based on distance from coast (220+ UK locations)
- **Topographic Shelter**: Urban areas vs. rural exposure adjustments
- **Window Detection**: Finds continuous 2+ hour optimal windows (score ≥60)

### Decision Thresholds
- **YES** (70-100): Excellent drying conditions
- **MAYBE** (50-69): Marginal but acceptable
- **NO** (0-49): Indoor drying recommended

## Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | React | 19.1.1 | UI framework |
| | TypeScript | 5.8.2 | Type safety |
| **Build** | Vite | 6.2.0 | Fast dev server + bundling |
| **Animation** | Framer Motion | 12.x | Professional spring animations |
| **AI** | @google/genai | 1.15.0 | Gemini AI (pinned - v1.16 has browser bugs) |
| **Testing** | Jest | 30.1.3 | Unit tests |
| **PWA** | Service Worker | - | Offline support, install prompt |

## Key Services

### weatherService.ts (1672 lines - modular refactor in progress)
**Purpose**: Core business logic for drying recommendations
**Main Functions**:
- `getWashingRecommendation(location)` - Main entry point
- `scoreHourForDrying(weatherData)` - Calculates drying score
- `findDryingWindows(hourlyScores)` - Identifies optimal time windows

**Status**: Working but being refactored into smaller modules (see REFACTORING-GUIDE.md)

### weatherAPIService.ts
**Purpose**: Real weather data from Open-Meteo
**Coverage**: Current conditions + 72-hour hourly forecast
**Data**: Temperature, humidity, dew point, wind speed/direction, rain probability, UV index, cloud cover

### geminiService.ts
**Purpose**: AI-powered natural language summaries
**Model**: Gemini 2.5 Flash (temperature: 0.4)
**Functions**:
- `generateComprehensiveDryingAdvice()` - 24h advice + 3-day outlook (single call)
- `validateLocationInput()` - Typo correction & abuse detection
- `getPlacenameFromCoords()` - Reverse geocoding

**Rate Limiting**: Graceful degradation when quota exceeded

## Development Workflow

### Setup
```bash
npm install
# Create .env.local with VITE_GEMINI_API_KEY=your_key_here
npm run dev  # Runs on http://localhost:5000
```

### Testing
```bash
npm test                                    # Run all tests
npm test -- weatherService.test.ts          # Specific file
npm test -- --coverage                      # Coverage report
```

### Key Commands
```bash
npm run build       # Production build (check dist/ size)
npm run preview     # Test production build locally
npx tsc --noEmit    # Type check without building
```

## Current State & Roadmap

### ✅ Completed
- Modern card-based UI with swipeable timeline (Oct 2025)
- Modular algorithm structure (config.ts, coastal-intelligence.ts, wind-analysis.ts)
- PWA features (install prompt, service worker, haptic feedback)
- Comprehensive test suite (Jest + Testing Library)
- Performance monitoring and caching

### 🚧 In Progress (see REFACTORING-GUIDE.md)
- **Priority 1**: Remove old UI code path (ShortTermForecast, HourlyTimeline, WeatherChart)
- **Priority 2**: Split weatherService.ts into smaller modules (scoring-engine.ts, window-detection.ts, timezone-utils.ts)

### 🔮 Future
- Accessibility audit (ARIA labels, keyboard navigation)
- Dark mode (tokens already defined in design/tokens.ts)
- Push notifications for weather changes
- A/B testing infrastructure

## Common Tasks

### Adding a New Component
1. Create in `components/` with TypeScript
2. Use tokens from `design/tokens.ts` for consistency
3. Add lazy loading in App.tsx if non-critical: `lazy(() => import('./components/Foo'))`
4. Test mobile responsiveness (touch targets ≥44px)

### Modifying the Algorithm
1. Adjust weights in `services/algorithm/config.ts` (don't touch weatherService.ts directly)
2. Run tests: `npm test -- weatherService.test.ts`
3. Verify score calculations still make sense for edge cases

### Debugging Weather Data Issues
1. Check Open-Meteo API response in browser DevTools
2. Verify `weatherAPIService.ts` is parsing correctly
3. Log drying scores in `weatherService.ts` to trace calculations
4. Check for coastal/wind modifiers if scores seem off

### Fixing Gemini AI Errors
**"API Key must be set"**: Ensure `@google/genai` is v1.15.0 (NOT v1.16.0)
```bash
npm install @google/genai@1.15.0
rm -rf node_modules/.vite
npm run dev
```

**Quota exceeded**: App degrades gracefully - weather data still works, AI summary shows quota message

## Environment Variables

```bash
# .env.local (NEVER commit this file)
VITE_GEMINI_API_KEY=your_gemini_api_key_here  # NOT VITE_VITE_* (common mistake)
```

## Project Vision

**Goal**: World-class weather app - fastest, leanest, most secure, most maintainable.

**Principles**:
- Mobile-first (UK users drying washing are on mobile)
- Performance obsessed (lazy loading, caching, PWA)
- Scientifically accurate (VPD, coastal intelligence, real weather data)
- Delightfully simple (YES/MAYBE/NO in <3 seconds)

**Inspiration**: Apple Weather (visual polish), Stripe (clarity), Linear (performance)

## Troubleshooting Quick Reference

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| UI looks old/outdated | Cached `dist/` folder | `rm -rf dist/ && npm run dev` |
| "API Key must be set" | Wrong @google/genai version | `npm install @google/genai@1.15.0` |
| Geolocation not working | Browser blocked permission | Check DevTools Console → Permissions |
| Weather data looks wrong | Open-Meteo API change | Check `weatherAPIService.ts` parsing |
| Tests failing | Outdated snapshots | `npm test -- -u` to update |
| Hard refresh not working | Service worker cache | DevTools → Application → Clear site data |

## File Quick Reference

**Read these first when starting work**:
- `App.tsx:29-110` - Main app logic and state management
- `services/weatherService.ts:600-1000` - Core drying algorithm
- `services/algorithm/config.ts` - Algorithm weights (easiest to tune)
- `types.ts` - TypeScript definitions (understand the data model)

**UI components**:
- `components/HeroDecision.tsx` - Giant YES/MAYBE/NO decision
- `components/ForecastTimeline.tsx` - Card-based 3-day view
- `components/TimelineCard.tsx` - Individual day cards
- `components/DryingQualityMeter.tsx` - Hourly visualization

**Critical services**:
- `services/weatherAPIService.ts` - Weather data fetching
- `services/geminiService.ts` - AI summaries
- `services/geoLocationService.ts` - Location handling

## Contributing

When working on this codebase:
1. **Check types**: Run `npx tsc --noEmit` before committing
2. **Test thoroughly**: `npm test` should pass
3. **Mobile-first**: Test on mobile viewport (DevTools responsive mode)
4. **Use tokens**: Import from `design/tokens.ts`, don't hardcode colors/spacing
5. **Document complexity**: Add comments for non-obvious algorithm logic

## Additional Documentation

- **REFACTORING-GUIDE.md** - Detailed refactoring plan (priorities, impact, execution)
- **UI-TRANSFORMATION-SUMMARY.md** - UI redesign rationale and components
- **README.md** - Public-facing project description
- **metadata.json** - App metadata for AI Studio

---

**Last Updated**: 2025-10-31
**Status**: Production-ready with ongoing refactoring
**Maintainer**: steel + Claude (Sonnet 4.5)