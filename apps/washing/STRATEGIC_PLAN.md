# Strategic Plan: Weather-Decision App Family Architecture

**Document Version**: 1.0
**Created**: 2025-01-05
**Status**: Ready for Implementation
**Scope**: GetTheWashingOut + GetTheWoodburnerOn → Unified App Family

---

## Executive Summary

This plan transforms two standalone weather-decision apps (~15,300 combined lines of code) into a scalable, secure, and maintainable family of applications using modern monorepo architecture.

### Key Objectives
1. **Security First**: Migrate to serverless API proxy pattern (eliminate client-side API keys)
2. **Code Reuse**: Extract 60-70% of code into shared packages
3. **Scalability**: Enable rapid deployment of new apps (lawn mowing, golf, etc.)
4. **Performance**: Reduce bundle sizes by 50-80KB through optimization
5. **Maintainability**: Single source of truth for algorithms, UI, and infrastructure

### Business Impact
- **Development Speed**: New apps in 2-3 weeks (vs 8-12 weeks from scratch)
- **Cost Savings**: Shared infrastructure reduces per-app costs by 40%
- **Security**: Enterprise-grade API protection prevents abuse/theft
- **Quality**: Centralized testing ensures consistency across apps

---

## Part 1: Commonalities & Best Practices Analysis

### Current State Assessment

| Metric | WashingOut | WoodburnerOn |
|--------|------------|--------------|
| Lines of Code | ~8,500 | ~6,800 |
| Algorithm Sophistication | ⭐⭐⭐⭐⭐ (9 factors, VPD science) | ⭐⭐⭐ (5 factors) |
| Code Organization | ⭐⭐⭐ (monolithic) | ⭐⭐⭐⭐⭐ (modular) |
| API Security | ⚠️ **Client-side key** | ✅ Serverless proxy |
| Bundle Size | 996KB | 930KB (-7%) |
| Documentation | ⭐⭐⭐⭐⭐ (700+ line CLAUDE.md) | ⭐⭐⭐ (basic) |
| Test Coverage | ⭐⭐⭐⭐ (comprehensive) | ⭐⭐⭐ (good) |

### Shared Architecture Components

Both apps currently share:

**Frontend Stack**
- React 19.1.1 + TypeScript 5.8.3
- Vite 6.4.1 build system
- Tailwind CSS 3.4.18 (local build)
- Framer Motion 12.x for animations
- Jest + Testing Library for testing

**Backend Services**
- Open-Meteo API (UK Met Office weather data)
- Google Gemini AI 2.5 Flash Lite
- Nominatim geocoding (OpenStreetMap)
- IndexedDB caching (10min weather, 24hr location)

**Deployment**
- Vercel hosting (lhr1 region - London)
- Security headers + CSP
- PWA capabilities (service workers)
- Automatic deployments from git

### Best Practices: Where Each App Wins

#### 🔥 WoodburnerOn Wins

| Practice | Why It's Better |
|----------|----------------|
| **Algorithm Organization** | 6 modular files vs 1 monolithic file (1,879 lines) |
| **API Security** 🔴 | Serverless proxy hides API key from client |
| **Rate Limiting** | Implemented in proxy layer (20 req/min) |
| **Bundle Size** | 930KB vs 996KB (7% smaller) |
| **Service Separation** | Clear boundaries between concerns |

#### 🧺 WashingOut Wins

| Practice | Why It's Better |
|----------|----------------|
| **Algorithm Sophistication** | 9 weighted factors vs 5; VPD-driven science |
| **Wind Intelligence** | Full wind direction analysis + topographic shelter |
| **Coastal Database** | 220+ UK locations with distance data |
| **Algorithm Maturity** | Battle-tested with edge cases |
| **Documentation** | Comprehensive CLAUDE.md (700+ lines) |
| **Test Coverage** | More extensive edge case testing |

---

## Part 2: Unified Core Architecture

### Recommended Monorepo Structure

```
weather-decision-apps/                 (Turborepo monorepo)
├── packages/                          ⭐ SHARED CODE
│   ├── core-algorithm/               # Abstract algorithm engine
│   │   ├── src/
│   │   │   ├── engine/
│   │   │   │   ├── WeatherScorer.ts       (abstract base class)
│   │   │   │   ├── WindowDetector.ts      (optimal time windows)
│   │   │   │   ├── CoastalIntelligence.ts (UK coastal data)
│   │   │   │   └── WindAnalyzer.ts        (topographic analysis)
│   │   │   ├── normalization/
│   │   │   │   ├── temperature.ts
│   │   │   │   ├── humidity.ts
│   │   │   │   ├── wind.ts
│   │   │   │   └── pressure.ts
│   │   │   └── types/
│   │   │       └── algorithm.types.ts
│   │   └── tests/                         (90%+ coverage target)
│   │
│   ├── weather-api/                  # Weather data fetching
│   │   ├── src/
│   │   │   ├── providers/
│   │   │   │   ├── OpenMeteoProvider.ts
│   │   │   │   ├── MetOfficeProvider.ts   (future)
│   │   │   │   └── WeatherProvider.interface.ts
│   │   │   ├── cache/
│   │   │   │   └── SmartCache.ts          (multi-tier caching)
│   │   │   └── types/
│   │   │       └── weather.types.ts
│   │   └── tests/
│   │
│   ├── ai-services/                  # Secure AI integration
│   │   ├── src/
│   │   │   ├── SecureAIClient.ts          (proxy client)
│   │   │   ├── prompts/
│   │   │   │   ├── drying-advice.ts
│   │   │   │   ├── burning-advice.ts
│   │   │   │   ├── lawn-advice.ts
│   │   │   │   └── golf-advice.ts
│   │   │   └── types/
│   │   │       └── ai.types.ts
│   │   └── tests/
│   │
│   ├── geolocation/                  # Location services
│   │   ├── src/
│   │   │   ├── NominatimProvider.ts
│   │   │   ├── BrowserGeolocation.ts
│   │   │   ├── validation/
│   │   │   │   └── uk-ireland-validator.ts
│   │   │   └── types/
│   │   │       └── location.types.ts
│   │   └── tests/
│   │
│   ├── design-system/                # UI component library
│   │   ├── src/
│   │   │   ├── tokens/
│   │   │   │   ├── colors.ts
│   │   │   │   ├── spacing.ts
│   │   │   │   ├── typography.ts
│   │   │   │   └── animations.ts
│   │   │   ├── components/
│   │   │   │   ├── HeroDecision/
│   │   │   │   ├── LocationInput/
│   │   │   │   ├── ForecastTimeline/
│   │   │   │   ├── UnifiedDayCard/
│   │   │   │   ├── DryingQualityMeter/
│   │   │   │   ├── ErrorBoundary/
│   │   │   │   └── icons/
│   │   │   └── hooks/
│   │   │       ├── useHapticFeedback.ts
│   │   │       └── useGeolocation.ts
│   │   ├── .storybook/                    (component documentation)
│   │   └── tests/
│   │
│   ├── security/                     # Security utilities
│   │   ├── src/
│   │   │   ├── sanitization/
│   │   │   │   ├── inputSanitizer.ts
│   │   │   │   ├── coordinateValidator.ts
│   │   │   │   └── xssProtection.ts
│   │   │   ├── rate-limiting/
│   │   │   │   ├── InMemoryLimiter.ts
│   │   │   │   └── VercelKVLimiter.ts     (future)
│   │   │   └── types/
│   │   │       └── security.types.ts
│   │   └── tests/
│   │
│   └── monitoring/                   # Observability
│       ├── src/
│       │   ├── PerformanceMonitor.ts      (Core Web Vitals)
│       │   ├── ErrorReporter.ts           (Sentry integration)
│       │   └── AnalyticsTracker.ts
│       └── tests/
│
├── apps/                              ⭐ INDIVIDUAL APPS
│   ├── washing/                      # 🧺 GetTheWashingOut
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── algorithms/
│   │   │   │   └── DryingScorer.ts        (extends WeatherScorer)
│   │   │   ├── components/
│   │   │   │   └── washing-specific/
│   │   │   └── config/
│   │   │       └── drying-config.ts       (VPD weights, thresholds)
│   │   ├── api/                           (Vercel serverless)
│   │   │   └── gemini.ts                  (secure proxy)
│   │   ├── public/
│   │   ├── vite.config.ts
│   │   ├── vercel.json
│   │   └── package.json
│   │
│   ├── woodburner/                   # 🔥 GetTheWoodburnerOn
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── algorithms/
│   │   │   │   └── BurningScorer.ts       (extends WeatherScorer)
│   │   │   ├── components/
│   │   │   │   └── woodburner-specific/
│   │   │   └── config/
│   │   │       └── burning-config.ts      (temp delta weights)
│   │   ├── api/
│   │   │   └── gemini.ts
│   │   └── package.json
│   │
│   ├── lawn/                         # 🌱 GetTheGrassCut (NEW)
│   │   ├── src/
│   │   │   ├── algorithms/
│   │   │   │   └── MowingScorer.ts
│   │   │   │       # Factors: ground moisture, grass growth,
│   │   │   │       # soil firmness, dew point, precip history
│   │   │   └── config/
│   │   │       └── mowing-config.ts
│   │   │           # Optimal: dry soil, low dew, 48hr no rain
│   │   │           # Avoid: wet ground (rutting), heavy dew
│   │   └── package.json
│   │
│   └── golf/                         # ⛳ Get18HolesIn (NEW)
│       ├── src/
│       │   ├── algorithms/
│       │   │   └── GolfScorer.ts
│       │   │       # Factors: wind speed/direction, precipitation,
│       │   │       # visibility, lightning risk, temp comfort
│       │   └── config/
│       │       └── golf-config.ts
│       │           # Optimal: 10-20km/h wind, dry, 15-25°C
│       │           # Warnings: lightning, >40km/h wind
│       └── package.json
│
├── infra/                            ⚙️ SHARED INFRASTRUCTURE
│   ├── vercel-config/
│   │   ├── base-config.json              (security headers, CSP)
│   │   └── app-configs/
│   │       ├── washing.json
│   │       └── woodburner.json
│   ├── sentry-config/
│   └── analytics-config/
│
├── turbo.json                        # Build orchestration
├── package.json                      # Workspace root
├── tsconfig.base.json                # Shared TypeScript config
└── README.md
```

### Code Reuse Metrics

| Component | Lines of Code | Apps Sharing |
|-----------|---------------|--------------|
| Weather API | ~650 | All apps |
| Geolocation | ~645 | All apps |
| Core Algorithm Engine | ~800 | All apps |
| AI Services | ~335 | All apps |
| Design System | ~1,200 | All apps |
| Security | ~400 | All apps |
| **Total Shared** | **~4,030** | **All apps** |

**Per-App Unique Code**: ~2,000-3,000 lines
**Code Reuse**: 60-70% shared across family

---

## Part 3: Core Algorithm Abstraction

### Abstract Base Class Pattern

The key to reusability is an abstract `WeatherScorer` class that each app extends:

```typescript
// packages/core-algorithm/src/engine/WeatherScorer.ts

export abstract class WeatherScorer {
  constructor(protected config: AlgorithmConfig) {}

  /**
   * Core scoring function - each app implements its own logic
   * @returns score 0-100
   */
  abstract scoreHour(data: HourlyWeatherData): ScoringResult;

  /**
   * Decision thresholds - each app defines its own
   */
  abstract getDecisionThresholds(): DecisionThresholds;

  /**
   * SHARED: Window detection logic - reused across all apps
   */
  findOptimalWindows(
    hourlyScores: ScoringResult[],
    options: WindowOptions
  ): TimeWindow[] {
    // Find continuous periods >= threshold
    // Filter by minimum duration, time-of-day preferences
    // Rank by quality × duration × lifestyle fit
    return windows;
  }

  /**
   * SHARED: Location modifier logic
   */
  applyLocationModifiers(
    score: number,
    location: LocationData,
    weatherData: HourlyWeatherData
  ): number {
    // Apply coastal intelligence
    // Apply topographic shelter analysis
    // Apply urban heat island effects
    return modifiedScore;
  }

  /**
   * SHARED: Generate recommendation from scores
   */
  generateRecommendation(
    hourlyScores: ScoringResult[],
    location: LocationData
  ): Recommendation {
    const windows = this.findOptimalWindows(hourlyScores, this.config.windows);
    const bestWindow = windows[0];
    const thresholds = this.getDecisionThresholds();

    if (bestWindow.averageScore >= thresholds.excellent) {
      return {
        status: 'EXCELLENT',
        timing: bestWindow.startTime,
        confidence: this.calculateConfidence(bestWindow),
      };
    }
    // ... more decision logic
  }
}
```

### App-Specific Implementations

#### Washing App: VPD-Driven Algorithm

```typescript
// apps/washing/src/algorithms/DryingScorer.ts

export class DryingScorer extends WeatherScorer {
  scoreHour(data: HourlyWeatherData): ScoringResult {
    // Check disqualifiers first
    if (data.dewPointSpread < 1.0) {
      return { totalScore: 0, disqualified: true, reason: 'Condensation risk' };
    }
    if (data.rainRisk > 0.2) {
      return { totalScore: 0, disqualified: true, reason: 'Rain expected' };
    }

    // Calculate weighted component scores
    const componentScores = {
      vpd: this.normalizeVPD(data.vapourPressureDeficit) * 0.30,        // 30%
      wind: this.normalizeWind(data.windSpeed) * 0.20,                  // 20%
      wetBulb: this.normalizeWetBulb(data.wetBulbTemperature) * 0.10,   // 10%
      sunshine: this.normalizeSunshine(data.sunshineDuration) * 0.09,   // 9%
      temp: this.normalizeTemp(data.temperature) * 0.08,                // 8%
      radiation: this.normalizeRadiation(data.shortwaveRadiation) * 0.08, // 8%
      evapotranspiration: this.normalizeET(data.evapotranspiration) * 0.05, // 5%
      windDir: this.normalizeWindDirection(data.windDirection) * 0.05,  // 5%
      dewSpread: this.normalizeDewSpread(data.dewPointSpread) * 0.05    // 5%
    };

    const totalScore = Object.values(componentScores).reduce((a, b) => a + b, 0);

    return {
      totalScore,
      componentBreakdown: componentScores,
      suitable: totalScore >= 50
    };
  }

  getDecisionThresholds(): DecisionThresholds {
    return {
      excellent: 70,  // GET THE WASHING OUT
      good: 50,       // ACCEPTABLE CONDITIONS
      poor: 0         // INDOOR DRYING ONLY
    };
  }
}
```

#### Woodburner App: Temperature Delta Algorithm

```typescript
// apps/woodburner/src/algorithms/BurningScorer.ts

export class BurningScorer extends WeatherScorer {
  scoreHour(data: HourlyWeatherData): ScoringResult {
    // Temperature differential is PRIMARY (50% weight)
    const deltaT = data.indoorTemp - data.outdoorTemp;
    const componentScores = {
      deltaT: this.normalizeDeltaT(deltaT) * 0.50,              // 50%
      pressure: this.normalizePressure(data.pressure) * 0.15,   // 15%
      humidity: this.normalizeHumidity(data.humidity) * 0.15,   // 15%
      wind: this.normalizeWind(data.windSpeed) * 0.10,          // 10%
      precip: this.normalizePrecip(data.precipitation) * 0.10   // 10%
    };

    const totalScore = Object.values(componentScores).reduce((a, b) => a + b, 0);

    // Critical warnings (independent of score)
    const warnings = this.checkCriticalWarnings(data);

    return {
      totalScore,
      componentBreakdown: componentScores,
      warnings,
      suitable: totalScore >= 60 && warnings.length === 0
    };
  }

  getDecisionThresholds(): DecisionThresholds {
    return {
      excellent: 75,  // FIRE UP THE STOVE
      good: 60,       // GOOD TO GO
      marginal: 45,   // PRE-WARM REQUIRED
      poor: 30,       // NOT RECOMMENDED
      avoid: 0        // DO NOT LIGHT
    };
  }

  private checkCriticalWarnings(data: HourlyWeatherData): Warning[] {
    const warnings: Warning[] = [];

    // Temperature inversion (chimney won't draw)
    if (data.temperature > data.temperaturePrevHour + 3) {
      warnings.push({
        type: 'INVERSION',
        severity: 'CRITICAL',
        message: 'Temperature inversion detected - chimney may not draw'
      });
    }

    // Summer chimney syndrome
    if (data.outdoorTemp > 20 && (data.indoorTemp - data.outdoorTemp) < 5) {
      warnings.push({
        type: 'SUMMER_SYNDROME',
        severity: 'HIGH',
        message: 'Insufficient temperature differential for proper draft'
      });
    }

    return warnings;
  }
}
```

#### NEW: Lawn Mowing App

```typescript
// apps/lawn/src/algorithms/MowingScorer.ts

export class MowingScorer extends WeatherScorer {
  scoreHour(data: HourlyWeatherData): ScoringResult {
    const componentScores = {
      // Ground moisture is PRIMARY (40% weight)
      moisture: this.normalizeGroundMoisture(
        data.soilMoisture_0_7cm,    // Top 7cm soil moisture
        data.precipitation48hr       // 48-hour rain history
      ) * 0.40,

      // Grass growth rate (20% - affects cut quality)
      growth: this.normalizeGrowthRate(
        data.temperature,
        data.soilTemperature,
        data.evapotranspiration
      ) * 0.20,

      // Dew presence (20% - clumping risk)
      dew: this.normalizeDew(
        data.dewPoint,
        data.temperature,
        data.relativeHumidity
      ) * 0.20,

      // Ground firmness (10% - rutting risk)
      firmness: this.normalizeFirmness(
        data.soilMoisture,
        data.precipitation7d
      ) * 0.10,

      // Mower comfort (10% - operator experience)
      comfort: this.normalizeComfort(
        data.temperature,
        data.uvIndex,
        data.windSpeed
      ) * 0.10
    };

    const totalScore = Object.values(componentScores).reduce((a, b) => a + b, 0);

    return {
      totalScore,
      componentBreakdown: componentScores,
      suitable: totalScore >= 55
    };
  }

  getDecisionThresholds(): DecisionThresholds {
    return {
      excellent: 75,  // PERFECT MOWING
      good: 55,       // GOOD CONDITIONS
      poor: 35,       // NOT IDEAL
      avoid: 0        // DO NOT MOW (damage risk)
    };
  }
}
```

---

## Part 4: Security, Efficiency & Performance

### A. Security Architecture (🔴 CRITICAL PRIORITY)

#### 1. API Key Security - Serverless Proxy Pattern

**Current State**:
- ❌ **WashingOut**: Client-side API key (VITE_GEMINI_API_KEY exposed in bundle)
- ✅ **WoodburnerOn**: Serverless proxy hides API key

**Target Architecture**:

```typescript
// packages/ai-services/src/SecureAIClient.ts

export class SecureAIClient {
  private proxyEndpoint: string;

  constructor(config: { proxyEndpoint: string }) {
    this.proxyEndpoint = config.proxyEndpoint;
  }

  async generateAdvice(params: AdviceParams): Promise<AdviceResponse> {
    // Client NEVER sees API key
    const response = await fetch(this.proxyEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (response.status === 429) {
      throw new RateLimitError('Too many requests - please wait');
    }

    return response.json();
  }
}
```

```typescript
// apps/*/api/gemini.ts (Vercel serverless function)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RateLimiter, InputValidator } from '@weather-apps/security';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const limiter = new RateLimiter({ maxRequests: 20, windowMs: 60000 });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Rate limiting by IP
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (!limiter.checkLimit(clientIP)) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: 60
    });
  }

  // 2. Input validation
  const validation = InputValidator.aiRequest(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // 3. Generate AI response
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent(validation.sanitizedPrompt);

    res.status(200).json({ advice: result.response.text() });
  } catch (error) {
    console.error('AI service error:', error);
    res.status(500).json({ error: 'AI service unavailable' });
  }
}
```

**Migration Priority**: 🔴 **CRITICAL** - Do this FIRST for WashingOut

#### 2. Rate Limiting - Distributed Architecture

**Current State**: In-memory rate limiting (resets on server restart)

**Target**: Vercel KV (Redis-based persistent storage)

```typescript
// packages/security/src/rate-limiting/VercelKVLimiter.ts

import { kv } from '@vercel/kv';

export class VercelKVLimiter {
  async checkLimit(
    identifier: string,
    maxRequests: number,
    windowSec: number
  ): Promise<boolean> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - (windowSec * 1000);

    // Sliding window algorithm
    await kv.zremrangebyscore(key, 0, windowStart);  // Remove old entries
    const requestCount = await kv.zcard(key);         // Count current requests

    if (requestCount >= maxRequests) {
      return false;  // Rate limited
    }

    await kv.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    await kv.expire(key, windowSec);  // Auto-cleanup

    return true;  // Allowed
  }
}
```

**Benefits**:
- ✅ Distributed (works across multiple Vercel instances)
- ✅ Persistent (survives deployments)
- ✅ Sliding window (more accurate than fixed windows)
- **Cost**: ~$0.003/10K requests (Vercel KV Hobby: $10/mo for 300MB)

#### 3. Input Validation & Sanitization

```typescript
// packages/security/src/validation/validator.ts

export class InputValidator {
  static locationInput(input: string): ValidationResult {
    // Length check
    if (input.length < 2 || input.length > 200) {
      return { valid: false, error: 'Invalid length' };
    }

    // XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i
    ];
    if (xssPatterns.some(p => p.test(input))) {
      return { valid: false, error: 'Invalid characters' };
    }

    // SQL injection patterns
    const sqlPatterns = [
      /(\bor\b|\band\b).*[=<>]/i,
      /--|;/,
      /\bexec\b/i,
      /\bunion\b.*\bselect\b/i
    ];
    if (sqlPatterns.some(p => p.test(input))) {
      return { valid: false, error: 'Invalid format' };
    }

    return { valid: true, sanitized: this.sanitize(input) };
  }

  private static sanitize(input: string): string {
    return input
      .replace(/<[^>]*>/g, '')                // Strip HTML
      .replace(/[^a-zA-Z0-9\s\-',.()]/g, '')  // Allow only safe chars
      .replace(/\s{2,}/g, ' ')                // Collapse whitespace
      .trim();
  }

  static coordinates(lat: number, lon: number): CoordinateValidation {
    if (isNaN(lat) || isNaN(lon)) return { valid: false };
    if (lat < -90 || lat > 90) return { valid: false };
    if (lon < -180 || lon > 180) return { valid: false };

    // Round to 6 decimal places (~10cm accuracy)
    return {
      valid: true,
      latitude: Math.round(lat * 1e6) / 1e6,
      longitude: Math.round(lon * 1e6) / 1e6
    };
  }
}
```

### B. Performance Optimizations

#### 1. Code Splitting - Aggressive Lazy Loading

```typescript
// apps/*/vite.config.ts (shared base config)

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core frameworks (loaded immediately)
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],

          // Shared packages (loaded on first interaction)
          'weather-services': [
            '@weather-apps/weather-api',
            '@weather-apps/geolocation'
          ],

          // AI features (loaded only when needed)
          'ai-features': [
            '@weather-apps/ai-services'
          ],

          // UI libraries (loaded progressively)
          'ui-animations': ['framer-motion'],
          'ui-components': ['@weather-apps/design-system']
        }
      }
    },
    chunkSizeWarningLimit: 600,  // Target: 600KB max chunk
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.debug']
      }
    }
  },

  // Modern browser targets only (smaller bundles)
  build: {
    target: 'es2020',
    cssTarget: 'chrome90'
  }
});
```

**Expected Savings**:
- Remove console.log: ~5-10KB
- ES2020 target (vs ES2015): ~15-20KB
- Better tree-shaking: ~30-50KB
- **Total**: 50-80KB reduction per app

#### 2. Caching Strategy - Multi-Tier with Stale-While-Revalidate

```typescript
// packages/weather-api/src/cache/SmartCache.ts

export class SmartCache {
  private indexedDB: IDBDatabase;
  private memoryCache: Map<string, CachedItem>;

  async get<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
    // Layer 1: Memory (instant)
    const memoryCached = this.memoryCache.get(key);
    if (memoryCached && memoryCached.expiresAt > Date.now()) {
      return memoryCached.data;
    }

    // Layer 2: IndexedDB (fast)
    const dbCached = await this.getFromIndexedDB(key);
    if (dbCached) {
      // Serve stale data immediately if within grace period
      if (dbCached.expiresAt + GRACE_PERIOD > Date.now()) {
        // Revalidate in background (don't block user)
        this.revalidateInBackground(key, fetcher, ttl);
        return dbCached.data;
      }
    }

    // Layer 3: Network (fallback)
    const freshData = await fetcher();
    await this.set(key, freshData, ttl);
    return freshData;
  }

  private async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    try {
      const freshData = await fetcher();
      await this.set(key, freshData, ttl);
    } catch (error) {
      // Silent fail - user already has stale data
      console.warn('Background revalidation failed', error);
    }
  }
}
```

**TTL Strategy**:
```typescript
const CACHE_CONFIG = {
  weather: {
    ttl: 10 * 60 * 1000,           // 10 minutes
    gracePeriod: 30 * 60 * 1000    // Serve stale up to 40 min total
  },
  location: {
    ttl: 24 * 60 * 60 * 1000,      // 24 hours
    gracePeriod: 7 * 24 * 60 * 60 * 1000  // Serve stale up to 8 days
  },
  aiAdvice: {
    ttl: 60 * 60 * 1000,           // 1 hour
    gracePeriod: 6 * 60 * 60 * 1000  // Serve stale up to 7 hours
  }
};
```

**Benefits**:
- Instant response for repeat visits (memory cache)
- Perceived performance (stale-while-revalidate)
- Reduced API costs (fewer network calls)

#### 3. Service Worker Strategy - Advanced Precaching

```typescript
// infra/service-worker-template.ts

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache all build assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Strategy 1: Weather API - Network first (fresh data priority)
registerRoute(
  ({ url }) => url.hostname === 'api.open-meteo.com',
  new NetworkFirst({
    cacheName: 'weather-data',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,              // Cache 50 locations
        maxAgeSeconds: 30 * 60       // 30 minutes max
      })
    ]
  })
);

// Strategy 2: AI API - Stale while revalidate (instant response)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/gemini'),
  new StaleWhileRevalidate({
    cacheName: 'ai-advice',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60       // 1 hour
      })
    ]
  })
);

// Strategy 3: Static assets - Cache first (immutable)
registerRoute(
  ({ request }) => request.destination === 'image' ||
                   request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60  // 30 days
      })
    ]
  })
);
```

**Expected Improvements**:
- First visit: 2.5s LCP → 1.8s LCP (30% faster)
- Repeat visit: 1.8s LCP → 0.4s LCP (78% faster)
- Offline mode: Full functionality for cached locations

#### 4. Database Optimization - Compression for Large Datasets

```typescript
// packages/weather-api/src/cache/CompressedCache.ts

import pako from 'pako';  // gzip compression library

export class CompressedCache {
  async set(key: string, data: any, ttl: number): Promise<void> {
    const json = JSON.stringify(data);

    // Only compress if >5KB
    if (json.length > 5000) {
      const compressed = pako.deflate(json);
      await this.db.put('cache', {
        key,
        data: compressed,
        compressed: true,
        expiresAt: Date.now() + ttl
      });
    } else {
      await this.db.put('cache', {
        key,
        data: json,
        compressed: false,
        expiresAt: Date.now() + ttl
      });
    }
  }

  async get(key: string): Promise<any> {
    const cached = await this.db.get('cache', key);
    if (!cached) return null;

    if (cached.compressed) {
      const decompressed = pako.inflate(cached.data, { to: 'string' });
      return JSON.parse(decompressed);
    }

    return JSON.parse(cached.data);
  }
}
```

**Benefits**:
- 72-hour forecast data: ~40KB → ~12KB (70% reduction)
- More data fits in IndexedDB quota (50MB typical)
- Faster cache reads (less data to parse)
- **Cost**: +8KB for pako library (acceptable trade-off)

### C. Cost Optimization

#### API Cost Analysis (per 1,000 users/day)

| API | Current Cost | Optimized Cost | Savings |
|-----|--------------|----------------|---------|
| Open-Meteo | Free tier (10K calls/day) | Free tier | $0 |
| Gemini AI | $0.50 (2 calls/user) | $0.25 (batching) | 50% |
| Nominatim | Free (OSM community) | Free | $0 |
| Vercel Hosting | $20/mo (Pro) | $20/mo (Pro, multiple apps) | $0 |
| Vercel KV | $10/mo (Hobby) | $10/mo (shared) | $0 |
| Sentry (future) | $26/mo (Team) | $26/mo (multi-project) | $0 |
| **Total/month** | **~$65** | **~$57** | **12%** |

**At 10K users/day**: ~$570/mo → **Cost per user: $0.057**

**Optimization Strategies**:
1. **AI Batching**: Combine 24h + 3-day advice into single call (already done in WashingOut)
2. **Aggressive Caching**: 1-hour AI cache reduces repeat calls by ~60%
3. **CDN for Static Assets**: Vercel Edge Network (included in Pro)
4. **Lazy Load AI**: Only load when user requests advice (save ~30% of AI calls)

---

## Part 5: Migration & Implementation Roadmap

### Overview Timeline

| Phase | Duration | Focus | Priority |
|-------|----------|-------|----------|
| **Phase 1** | Weeks 1-3 | Foundation + Security | 🔴 CRITICAL |
| **Phase 2** | Weeks 4-6 | Core Packages | 🟠 HIGH |
| **Phase 3** | Weeks 7-9 | App Migration | 🟡 MEDIUM |
| **Phase 4** | Weeks 10-12 | New Apps | 🟢 LOW |
| **Phase 5** | Weeks 13-14 | Polish + Launch | 🟢 LOW |

---

### Phase 1: Foundation (Weeks 1-3) - CRITICAL SECURITY

#### Week 1: Monorepo Setup & Shared Packages

**Goal**: Establish monorepo structure with Turborepo

**Tasks**:
1. Initialize Turborepo monorepo
2. Create package structure (8 shared packages)
3. Configure TypeScript base config
4. Set up ESLint/Prettier shared configs
5. Initialize Git with proper .gitignore
6. Create package templates with package.json stubs

**Commands**:
```bash
# Initialize monorepo
npx create-turbo@latest weather-decision-apps
cd weather-decision-apps

# Create package structure
mkdir -p packages/{core-algorithm,weather-api,ai-services,geolocation,design-system,security,monitoring}
mkdir -p apps/{washing,woodburner,lawn,golf}
mkdir -p infra/{vercel-config,sentry-config}

# Configure turbo.json for build orchestration
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false
    }
  }
}
EOF
```

**Deliverable**: Empty monorepo structure ready for code migration

#### Week 2: Security Package & API Migration (🔴 HIGHEST PRIORITY)

**Goal**: Secure API key architecture for both apps

**Step 1: Create Security Package**
```typescript
// packages/security/package.json
{
  "name": "@weather-apps/security",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    "./sanitization": "./dist/sanitization/index.js",
    "./rate-limiting": "./dist/rate-limiting/index.js"
  }
}
```

**Step 2: Migrate WashingOut to Serverless Proxy**
```bash
# Create Vercel function
mkdir -p apps/washing/api
cp apps/woodburner/api/gemini.ts apps/washing/api/gemini.ts

# Update client code
# REMOVE: const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
# ADD: import { SecureAIClient } from '@weather-apps/ai-services';
```

**Step 3: Deploy & Test**
```bash
# Deploy to Vercel
vercel --prod

# Test API key is NOT in bundle
npm run build
grep -r "AIzaSy" dist/  # Should return nothing ✅

# Test rate limiting
for i in {1..25}; do curl https://washingout.vercel.app/api/gemini; done
# 21st-25th should return 429 ✅
```

**Tasks**:
- [ ] Create @weather-apps/security package with tests
- [ ] Implement InMemoryLimiter with sliding window
- [ ] Create serverless function template for Gemini proxy
- [ ] Migrate WashingOut to serverless architecture
- [ ] Update environment variables in Vercel Dashboard
- [ ] Test API key is NOT exposed in client bundle
- [ ] Verify rate limiting works (20 req/min)
- [ ] Load test with 100 concurrent users

**Deliverable**: Both apps using secure serverless AI proxy

#### Week 3: Monitoring & Observability

**Goal**: Production-grade error tracking and performance monitoring

**Step 1: Integrate Sentry**
```bash
npm install --save-dev @sentry/react @sentry/vercel
```

```typescript
// packages/monitoring/src/ErrorReporter.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initializeErrorReporting(appName: string) {
  Sentry.init({
    dsn: process.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false
      })
    ],

    // Performance monitoring
    tracesSampleRate: 0.1,  // 10% of transactions

    // Session replay
    replaysSessionSampleRate: 0.1,  // 10% of sessions
    replaysOnErrorSampleRate: 1.0,  // 100% of errors

    // Release tracking
    release: `${appName}@${process.env.VERCEL_GIT_COMMIT_SHA}`,

    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      return event;
    }
  });
}
```

**Step 2: Enhanced Performance Monitoring**
```typescript
// packages/monitoring/src/PerformanceMonitor.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

export class PerformanceMonitor {
  initialize(appName: string) {
    // Core Web Vitals
    onCLS(metric => this.reportMetric('CLS', metric.value, appName));
    onFID(metric => this.reportMetric('FID', metric.value, appName));
    onLCP(metric => this.reportMetric('LCP', metric.value, appName));
    onFCP(metric => this.reportMetric('FCP', metric.value, appName));
    onTTFB(metric => this.reportMetric('TTFB', metric.value, appName));

    // Custom metrics
    this.trackBundleSize(appName);
    this.trackAPILatency(appName);
    this.trackCacheHitRate(appName);
  }

  private reportMetric(name: string, value: number, appName: string) {
    // Send to Sentry
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${name}: ${value}`,
      level: 'info'
    });

    // Console output in development
    if (import.meta.env.DEV) {
      const status = this.getMetricStatus(name, value);
      console.log(`📊 ${name}: ${value.toFixed(2)}ms - ${status}`);
    }
  }

  private getMetricStatus(name: string, value: number): string {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[name];
    if (!threshold) return 'UNKNOWN';

    if (value <= threshold.good) return '✅ GOOD';
    if (value <= threshold.poor) return '⚠️ NEEDS IMPROVEMENT';
    return '❌ POOR';
  }
}
```

**Tasks**:
- [ ] Set up Sentry account (Team plan: $26/mo)
- [ ] Create @weather-apps/monitoring package
- [ ] Integrate error boundaries with Sentry
- [ ] Add performance monitoring with web-vitals
- [ ] Set up alerts for critical errors (Sentry)
- [ ] Create dashboard for Core Web Vitals
- [ ] Test error reporting in production

**Deliverable**: Production monitoring with Sentry + performance tracking

---

### Phase 2: Core Packages (Weeks 4-6) - SHARED SERVICES

#### Week 4: Weather API & Geolocation Packages

**Goal**: Extract shared weather and location services

**Tasks**:
- [ ] Create @weather-apps/weather-api package
- [ ] Implement OpenMeteoProvider with caching
- [ ] Create @weather-apps/geolocation package
- [ ] Implement NominatimProvider with rate limiting
- [ ] Add browser geolocation support
- [ ] Write comprehensive tests (85%+ coverage)
- [ ] Document API interfaces with TSDoc comments
- [ ] Migrate both apps to use new packages

**Deliverable**: Shared weather and geolocation packages with tests

#### Week 5: Core Algorithm Package

**Goal**: Extract algorithm engine as reusable abstract class

**Tasks**:
- [ ] Create @weather-apps/core-algorithm package
- [ ] Implement WeatherScorer abstract class
- [ ] Extract coastal intelligence to CoastalIntelligence class
- [ ] Extract wind analysis to WindAnalyzer class
- [ ] Implement WindowDetector for optimal time windows
- [ ] Migrate washing algorithm weights to config
- [ ] Migrate woodburner algorithm weights to config
- [ ] Write extensive algorithm tests (90%+ coverage)
- [ ] Document algorithm decisions with comments

**Deliverable**: Reusable algorithm engine with >90% test coverage

#### Week 6: Design System Package

**Goal**: Unified UI library with Storybook

**Tasks**:
- [ ] Create @weather-apps/design-system package
- [ ] Set up Storybook for component documentation
- [ ] Extract design tokens (colors, spacing, typography)
- [ ] Create HeroDecision base component
- [ ] Create LocationInput component
- [ ] Create ForecastTimeline component
- [ ] Create UnifiedDayCard component
- [ ] Create DryingQualityMeter component
- [ ] Write component tests (80%+ coverage)
- [ ] Document component props and usage

**Deliverable**: Shared UI library with Storybook documentation

---

### Phase 3: App Migration (Weeks 7-9) - REFACTORING

#### Week 7-8: Migrate Both Apps to Monorepo

**Goal**: Move WashingOut and WoodburnerOn into monorepo structure

**Tasks**:
- [ ] Copy WashingOut to apps/washing/
- [ ] Copy WoodburnerOn to apps/woodburner/
- [ ] Update imports to use @weather-apps/* packages
- [ ] Remove duplicate code (replaced by shared packages)
- [ ] Update build configurations
- [ ] Update Vercel deployment configs
- [ ] Run full test suite for both apps
- [ ] Verify production deployments work

**Deliverable**: Both apps running from monorepo

#### Week 9: Performance Optimization

**Goal**: Apply performance improvements to both apps

**Tasks**:
- [ ] Implement aggressive code splitting
- [ ] Add compression to cache layer
- [ ] Optimize service worker strategies
- [ ] Remove console.log from production builds
- [ ] Upgrade to ES2020 targets
- [ ] Measure Core Web Vitals improvements
- [ ] Load test with 1,000 concurrent users

**Deliverable**: 50-80KB bundle size reduction per app

---

### Phase 4: New Apps (Weeks 10-12) - EXPANSION

#### Week 10-11: Lawn Mowing App

**Goal**: Build GetTheGrassCut using shared packages

**Algorithm Design**:
- Ground moisture (40%) - primary factor
- Grass growth rate (20%) - cut quality
- Dew presence (20%) - clumping risk
- Ground firmness (10%) - rutting risk
- Mower comfort (10%) - operator experience

**Tasks**:
- [ ] Create apps/lawn/ structure
- [ ] Implement MowingScorer algorithm
- [ ] Create lawn-specific config
- [ ] Build UI using design system
- [ ] Add lawn-specific AI prompts
- [ ] Write algorithm tests
- [ ] Deploy to Vercel
- [ ] Beta test with 10 users

**Deliverable**: Fully functional lawn mowing app

#### Week 12: Golf App

**Goal**: Build Get18HolesIn using shared packages

**Algorithm Design**:
- Wind speed/direction (30%) - playability
- Precipitation (25%) - course conditions
- Visibility (15%) - safety
- Lightning risk (15%) - safety
- Temperature comfort (15%) - enjoyment

**Tasks**:
- [ ] Create apps/golf/ structure
- [ ] Implement GolfScorer algorithm
- [ ] Create golf-specific config
- [ ] Build UI using design system
- [ ] Add golf-specific AI prompts
- [ ] Write algorithm tests
- [ ] Deploy to Vercel
- [ ] Beta test with 10 users

**Deliverable**: Fully functional golf app

---

### Phase 5: Polish & Launch (Weeks 13-14) - FINALIZATION

#### Week 13: Testing & Bug Fixes

**Tasks**:
- [ ] End-to-end testing across all 4 apps
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Mobile testing (iOS, Android)
- [ ] Performance testing (Core Web Vitals)
- [ ] Security audit (penetration testing)
- [ ] Fix critical bugs
- [ ] Optimize loading performance

**Deliverable**: Production-ready app family

#### Week 14: Documentation & Launch

**Tasks**:
- [ ] Update CLAUDE.md for monorepo
- [ ] Write API documentation
- [ ] Create architecture diagrams
- [ ] Write deployment guide
- [ ] Create marketing materials
- [ ] Launch all 4 apps
- [ ] Monitor error rates (Sentry)
- [ ] Monitor performance (Core Web Vitals)
- [ ] Collect user feedback

**Deliverable**: Launched app family with documentation

---

## Success Metrics

### Technical Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Bundle Size** | 996KB | 800KB | Vite build output |
| **Code Reuse** | 0% | 60-70% | Lines of shared code |
| **Test Coverage** | 75% | 85%+ | Jest coverage report |
| **LCP (First Visit)** | 2.5s | <1.8s | Core Web Vitals |
| **LCP (Repeat)** | 1.8s | <0.4s | Core Web Vitals |
| **API Key Exposure** | ❌ WashingOut | ✅ All apps | grep bundle for API keys |
| **Rate Limiting** | ⚠️ In-memory | ✅ Distributed | Vercel KV implementation |
| **Error Tracking** | ❌ None | ✅ Sentry | Sentry dashboard |

### Business Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Cost per User** | $0.065 | $0.057 | Monthly costs / daily users |
| **New App Time** | 8-12 weeks | 2-3 weeks | Project timeline |
| **Deployment Time** | 30 min | 5 min | Vercel deploy duration |
| **Shared Infrastructure Cost** | $65/mo | $57/mo | Vercel + API bills |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Breaking existing apps during migration** | MEDIUM | HIGH | Comprehensive test suite + staged rollout |
| **Vercel KV costs exceed budget** | LOW | MEDIUM | Start with in-memory, upgrade later |
| **Algorithm changes affect accuracy** | LOW | HIGH | Extensive testing + gradual rollout |
| **Monorepo complexity overhead** | MEDIUM | LOW | Clear documentation + Turborepo automation |
| **API quota exceeded** | LOW | MEDIUM | Aggressive caching + graceful degradation |
| **Security vulnerabilities** | LOW | CRITICAL | Security audit + penetration testing |

---

## Next Steps

### Immediate Actions (This Week)

1. **Review & Approve Plan**: Team review of strategic plan
2. **Initialize Monorepo**: Create Turborepo structure
3. **Create Security Package**: Priority #1 for WashingOut
4. **Set Up Monitoring**: Sentry account + integration

### Short-Term Actions (Next Month)

1. **Migrate WashingOut to Serverless Proxy** (🔴 CRITICAL)
2. **Extract Core Packages**: weather-api, geolocation, core-algorithm
3. **Move Apps to Monorepo**: Update imports and configs
4. **Deploy & Test**: Verify production functionality

### Long-Term Actions (3+ Months)

1. **Build New Apps**: Lawn mowing and golf apps
2. **Upgrade to Vercel KV**: Distributed rate limiting
3. **Add Advanced Features**: Push notifications, multi-day planning
4. **Expand Geographic Coverage**: EU, US, Australia

---

## Conclusion

This strategic plan transforms two standalone apps into a scalable, secure, and maintainable app family. By prioritizing security (serverless API proxy), code reuse (60-70% shared), and performance (50-80KB savings), we create a foundation for rapid expansion.

**Key Success Factors**:
1. ✅ Aggressive code sharing (60-70%)
2. ✅ Security-first architecture (serverless proxy)
3. ✅ Performance optimization (50-80KB savings)
4. ✅ Comprehensive testing (85%+ coverage)
5. ✅ Clear documentation (CLAUDE.md + Storybook)

**Timeline**: 14 weeks from start to launch of 4-app family

**Cost**: ~$57/mo operational cost at 10K users/day

**ROI**: New apps in 2-3 weeks (vs 8-12 weeks), 40% cost reduction per app

---

**Document Status**: Ready for Implementation
**Next Review**: After Phase 1 completion (Week 3)
**Maintainer**: steel + Claude Code
**Last Updated**: 2025-01-05
