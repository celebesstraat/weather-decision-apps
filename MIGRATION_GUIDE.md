# Migration Guide: Moving Apps to Monorepo Architecture

**Status**: Phase 3 - ~75% Complete
**Last Updated**: 2025-11-05
**Estimated Time Remaining**: 2-3 hours

---

## ✅ What's Already Done (Phases 1-2)

### Phase 1: Foundation (COMPLETE)
- ✅ Monorepo structure created with Turborepo
- ✅ TypeScript configuration fixed (removed `allowImportingTsExtensions`)
- ✅ 7 shared packages created (~9,725 lines of code)
- ✅ All packages build successfully

### Phase 2: Core Packages (COMPLETE)
- ✅ @weather-apps/security - Rate limiting, input validation
- ✅ @weather-apps/ai-services - Secure Gemini proxy client
- ✅ @weather-apps/monitoring - Performance & error tracking
- ✅ @weather-apps/weather-api - Open-Meteo integration
- ✅ @weather-apps/geolocation - Geocoding & location services
- ✅ @weather-apps/core-algorithm - **Abstract WeatherScorer base class**
- ✅ @weather-apps/design-system - UI components & design tokens

### Phase 3: Algorithm Implementations (COMPLETE)
- ✅ **DryingScorer** created for GetTheWashingOut
  - Location: `apps/washing/algorithms/DryingScorer.ts`
  - 9-factor VPD-driven algorithm (VPD 30%, Wind 20%, etc.)
  - Complete configuration in `drying-config.ts`
  - Documentation in `algorithms/README.md`

- ✅ **BurningScorer** created for GetTheWoodburnerOn
  - Location: `apps/woodburner/algorithms/BurningScorer.ts`
  - 5-factor temperature differential algorithm (ΔT 50%, Pressure 15%, etc.)
  - Complete configuration in `burning-config.ts`
  - Documentation in `algorithms/README.md`

---

## 🚧 What's Remaining (Phase 3 - Integration)

### Step 1: Update Imports in GetTheWashingOut

**Files that need import updates** (9 files):

1. **App.tsx**
   ```typescript
   // OLD:
   import { getWashingRecommendation } from './services/weatherService';
   import { cacheService } from './services/cacheService';

   // NEW:
   import { dryingScorer } from './algorithms';
   import { SmartCache } from '@weather-apps/weather-api';
   ```

2. **components/ForecastTimeline.tsx**
   ```typescript
   // OLD:
   import { generateComprehensiveDryingAdvice } from '../services/geminiService';

   // NEW:
   import { SecureAIClient } from '@weather-apps/ai-services';
   ```

3. **components/LocationInput.tsx**
   ```typescript
   // OLD:
   import { getPlacenameFromCoords, validateLocationInput } from '../services/geminiService';

   // NEW:
   import { SecureAIClient } from '@weather-apps/ai-services';
   ```

4. **components/ErrorDisplay.tsx**
   ```typescript
   // OLD:
   import { diagnoseWeatherService } from '../services/weatherService';

   // NEW:
   // This function may need to be recreated or moved to a utility
   ```

5. **components/TimelineCard.tsx**, **UnifiedDayCard.tsx**, **TodayCompactPanel.tsx**
   ```typescript
   // OLD:
   import { getWeatherIconWithColor } from '../services/weatherIconService';

   // NEW:
   // This service can stay as-is (it's UI-specific logic)
   ```

### Step 2: Update Imports in GetTheWoodburnerOn

**Similar pattern** - update imports to use:
- `@weather-apps/weather-api` for weather data
- `@weather-apps/ai-services` for AI summaries
- `@weather-apps/geolocation` for geocoding
- `./algorithms` for the BurningScorer

### Step 3: Remove Duplicate Services

**Can be safely deleted** (now in shared packages):
- `services/weatherAPIService.ts` → Use `@weather-apps/weather-api`
- `services/cacheService.ts` → Use `SmartCache` from weather-api
- `services/geoLocationService.ts` → Use `@weather-apps/geolocation`
- Most of `services/geminiService.ts` → Use `@weather-apps/ai-services`

**Keep as-is** (app-specific):
- `services/weatherIconService.ts` - UI-specific icon logic
- `services/weatherService.ts` - Can keep as fallback during migration

### Step 4: Update Data Conversion

The shared packages use standardized `HourlyWeatherData` interface. You'll need adapter functions:

```typescript
// apps/washing/utils/dataConverters.ts
import type { HourlyWeatherData } from '@weather-apps/core-algorithm';
import type { HourlyForecast } from '../types';

export function convertToWeatherData(hour: HourlyForecast): HourlyWeatherData {
  return {
    temperature: hour.temperature,
    humidity: hour.humidity,
    windSpeed: hour.windSpeed,
    windDirection: hour.windDirection,
    precipitation: hour.precipitation,
    uvIndex: hour.uvIndex,
    pressure: hour.pressure,
    // ... map all required fields
  };
}
```

### Step 5: Test Builds

After updating imports:

```bash
# Test washing app build
cd apps/washing
npm run build

# Test woodburner app build
cd apps/woodburner
npm run build

# Test full monorepo build
cd ../..
npm run build
```

---

## 📋 Detailed Migration Checklist

### GetTheWashingOut Migration

- [ ] Create `utils/dataConverters.ts` for format conversion
- [ ] Update `App.tsx` imports and use `dryingScorer`
- [ ] Update `components/ForecastTimeline.tsx` to use `SecureAIClient`
- [ ] Update `components/LocationInput.tsx` to use `SecureAIClient`
- [ ] Update `components/ErrorDisplay.tsx` (recreate diagnose function)
- [ ] Test weather data fetching works
- [ ] Test algorithm scoring works
- [ ] Test AI advice generation works
- [ ] Test location search works
- [ ] Remove old service files:
  - [ ] `services/weatherAPIService.ts`
  - [ ] `services/cacheService.ts`
  - [ ] `services/geoLocationService.ts`
  - [ ] `services/geminiService.ts`
  - [ ] Keep `services/weatherIconService.ts`
- [ ] Run `npm run build` and verify success
- [ ] Test in browser (npm run dev)
- [ ] Deploy to Vercel preview

### GetTheWoodburnerOn Migration

- [ ] Same steps as above but using `BurningScorer`
- [ ] Include `BurningContext` for indoor temperature
- [ ] Test critical warnings display correctly
- [ ] Remove duplicate services
- [ ] Build and test

---

## 🎯 Expected Benefits After Migration

### Code Reuse
- **Before**: ~15,300 lines total (8,500 + 6,800)
- **After**: ~9,725 shared + ~2,500 per app = ~14,725 total
- **Savings**: ~575 lines removed, 60-70% code sharing

### Bundle Size
- **Before**: 996KB (washing), 930KB (woodburner)
- **After**: Target <800KB per app (shared chunks)
- **Savings**: ~50-80KB per app

### Development Speed
- **New app from scratch**: 8-12 weeks
- **New app with shared packages**: 2-3 weeks
- **Speedup**: 4-6x faster

### Maintenance
- **Before**: Fix bug twice (once per app)
- **After**: Fix once in shared package, benefits both
- **Effort**: 50% reduction

---

## 🔧 Quick Reference: Import Mappings

| Old Import | New Import | Package |
|------------|------------|---------|
| `./services/weatherAPIService` | `@weather-apps/weather-api` | weather-api |
| `./services/cacheService` | `@weather-apps/weather-api` (SmartCache) | weather-api |
| `./services/geoLocationService` | `@weather-apps/geolocation` | geolocation |
| `./services/geminiService` | `@weather-apps/ai-services` | ai-services |
| `./services/weatherService` | `./algorithms` (DryingScorer) | app-specific |
| N/A (new) | `@weather-apps/core-algorithm` | core-algorithm |
| N/A (new) | `@weather-apps/security` | security |
| N/A (new) | `@weather-apps/monitoring` | monitoring |
| N/A (new) | `@weather-apps/design-system` | design-system |

---

## 🚀 Next Session Action Plan

1. **Start with GetTheWashingOut** (simpler, more mature)
2. **Create data converters first** - ensures compatibility
3. **Update one component at a time** - test incrementally
4. **Keep old services temporarily** - fallback if needed
5. **Test thoroughly** before removing old code
6. **Deploy preview** to Vercel
7. **Repeat for GetTheWoodburnerOn**

**Estimated Time**: 1-2 hours per app = 2-3 hours total

---

## 📊 Progress Tracking

| Phase | Status | Progress | Time Spent |
|-------|--------|----------|------------|
| Phase 1: Foundation | ✅ Complete | 100% | ~30 min |
| Phase 2: Core Packages | ✅ Complete | 100% | ~2 hours |
| Phase 3: Algorithms | ✅ Complete | 100% | ~1 hour |
| Phase 3: Integration | 🚧 Pending | 0% | Not started |
| Phase 4: Testing | ⏳ Pending | 0% | Not started |
| **TOTAL** | **75% Done** | **75%** | **~3.5 hours** |

---

## 💡 Tips for Success

1. **Don't rush** - Test after each change
2. **Use TypeScript** - Let it guide you to missing imports
3. **Keep git clean** - Commit after each successful step
4. **Test in browser** - Don't rely only on builds
5. **Check bundle sizes** - Ensure code splitting works
6. **Monitor performance** - Use the monitoring package

---

## 🆘 Troubleshooting

### "Cannot find module '@weather-apps/...'"
- Run `npm install` in monorepo root
- Verify packages built: `npm run build`
- Check tsconfig.json paths are correct

### "Type errors after migration"
- Create data converter functions
- Verify interface compatibility
- Use `any` temporarily if stuck (fix later)

### "App builds but doesn't work"
- Check browser console for errors
- Verify API endpoints still work
- Check environment variables set correctly

### "Bundle size increased"
- Verify code splitting config in vite.config.ts
- Check for duplicate dependencies
- Use bundle analyzer

---

**Next Step**: Start with import updates in GetTheWashingOut App.tsx

**Goal**: Have both apps running from monorepo with 60-70% code sharing! 🎉
