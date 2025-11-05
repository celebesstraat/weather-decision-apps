# Weather Decision Apps Monorepo

**AI Assistant Guide** - Monorepo architecture and shared infrastructure

## What This Is

A **production-ready monorepo** containing a family of weather-based decision PWAs for UK/Ireland residents. Built for 60-70% code reuse via shared packages, enabling new apps in 2-3 weeks instead of 8-12 weeks.

**Status**: 2 apps deployed, 7 shared packages, Phase 3 (~75% complete)
**Repository**: [github.com/celebesstraat/weather-decision-apps](https://github.com/celebesstraat/weather-decision-apps)

---

## Architecture at a Glance

```
weather-decision-apps/
├── apps/                          # 4 applications
│   ├── washing/                   # GetTheWashingOut (✅ production)
│   ├── woodburner/                # GetTheWoodburnerOn (✅ production)
│   ├── lawn/                      # GetTheGrassCut (🚧 planned)
│   └── golf/                      # Get18HolesIn (🚧 planned)
│
├── packages/                      # 7 shared packages (~9,725 LOC)
│   ├── core-algorithm/            # Abstract WeatherScorer base class
│   ├── weather-api/               # Open-Meteo provider + smart caching
│   ├── ai-services/               # Secure Gemini proxy (zero key exposure)
│   ├── geolocation/               # Nominatim geocoding + validation
│   ├── design-system/             # UI components + design tokens
│   ├── security/                  # Rate limiting + input validation
│   └── monitoring/                # Performance tracking + Core Web Vitals
│
├── turbo.json                     # Turborepo build orchestration
├── tsconfig.base.json             # TypeScript workspace paths
└── package.json                   # npm workspaces root
```

---

## Shared Packages (The Magic)

### @weather-apps/core-algorithm
**Purpose**: Abstract weather scoring engine for rapid app development

**Key Pattern** (extend this for new apps):
```typescript
import { WeatherScorer, ScoringResult } from '@weather-apps/core-algorithm';

export class MyCustomScorer extends WeatherScorer {
  scoreHour(data: HourlyData, location: Location): ScoringResult {
    // Your scoring logic here
    const score = this.normalizeTemperature(data.temperature) * 0.5
                + this.normalizeHumidity(data.humidity) * 0.3
                + this.normalizeWind(data.windSpeed) * 0.2;

    return { score, factors: {...}, recommendation: '...' };
  }

  getDecisionThresholds() {
    return { excellent: 70, good: 50 };
  }
}
```

**Includes**:
- `WindowDetector`: Finds optimal 2+ hour weather windows
- `CoastalIntelligence`: Wind tolerance by coastal proximity (220+ UK locations)
- `WindAnalyzer`: Topographic shelter analysis
- Normalization functions for all weather parameters

**Impact**: 60-70% code reuse, new apps in 2-3 weeks

---

### @weather-apps/weather-api
**Purpose**: Weather data with multi-tier caching (Memory → IndexedDB → Network)

**Usage**:
```typescript
import { OpenMeteoProvider } from '@weather-apps/weather-api';

const provider = new OpenMeteoProvider();
const forecast = await provider.getForecast(51.5074, -0.1278); // London
```

**Features**:
- UK Met Office models (UKMO/UKVP for 0-2 days)
- 72-hour hourly forecasts
- 30+ meteorological parameters
- Stale-while-revalidate pattern
- Cache TTL: Memory (5 min), IndexedDB (24 hrs)

---

### @weather-apps/ai-services
**Purpose**: Secure AI via serverless proxy (API keys never in client bundles)

**Architecture**:
- **Client**: `SecureAIClient` (12KB proxy wrapper)
- **Server**: `/api/gemini.ts` serverless function per app
- **Result**: 58% bundle reduction (996KB → 412KB), zero key exposure

**Usage**:
```typescript
import { SecureAIClient } from '@weather-apps/ai-services';

const client = new SecureAIClient();
const advice = await client.generateAdvice(weatherData, location);
```

**Verification**: `grep -r "AIzaSy" dist/` must return 0 results ✅

---

### @weather-apps/geolocation
**Purpose**: Location resolution and validation

**Providers**:
- `NominatimProvider`: Forward/reverse geocoding (OSM)
- `BrowserGeolocation`: Device GPS
- `UKIrelandValidator`: Geographic bounds checking

**Features**: 24-hour caching, confidence scoring, 1 req/sec rate limit compliance

---

### @weather-apps/design-system
**Purpose**: Shared UI components and design tokens

**Includes**:
- Design tokens (colors, spacing, typography, animations)
- React components (Button, Card, Badge, LoadingSpinner, ErrorBoundary)
- Custom hooks (useHapticFeedback, useMediaQuery, useBreakpoint)
- Tailwind-compatible colors

**Usage** (always use tokens, never hardcode):
```typescript
import { Button, colors, spacing } from '@weather-apps/design-system';

// ✅ Good
<div style={{ color: colors.primary[500], padding: spacing.lg }}>

// ❌ Bad
<div style={{ color: '#3B82F6', padding: '24px' }}>
```

---

### @weather-apps/security
**Purpose**: Rate limiting and input validation

**Components**:
- `InMemoryLimiter`: Sliding window rate limiting
- `InputValidator`: XSS/SQL injection prevention
- Coordinate bounds validation

---

### @weather-apps/monitoring
**Purpose**: Performance tracking

**Features**:
- Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
- Sentry integration ready
- Custom metrics tracking

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 19.1.1 + TypeScript 5.8.3 | UI + type safety |
| **Build** | Turborepo 2.3.0 + Vite 6.4.1 | Monorepo orchestration + bundling |
| **Styling** | Tailwind CSS 3.4.18 | Utility-first CSS (local build) |
| **Animation** | Framer Motion 12.x | Spring animations |
| **AI** | Gemini 2.5 Flash Lite | Natural language summaries |
| **Deployment** | Vercel (lhr1 region) | Production hosting |
| **Testing** | Jest 30.2.0 + Testing Library | Unit + component tests |

**Note**: `@google/genai` pinned to 1.15.0 (v1.16+ has browser bugs), server-side only

---

## Development Workflow

### Setup
```bash
npm install           # Install all workspaces
npm run build         # Build all packages
npx tsc --noEmit      # Type check
```

### Running Apps
```bash
npm run dev:washing       # http://localhost:5000
npm run dev:woodburner    # http://localhost:5001
```

### Building
```bash
npm run build:washing     # Build washing app
npm run build:woodburner  # Build woodburner app

# Build all packages (no apps)
npx turbo run build --filter='@weather-apps/*'
```

### Testing
```bash
npm test                  # All tests
npm test -- --coverage    # With coverage
```

---

## Creating a New Weather App

**Time**: 2-3 weeks (infrastructure ready)

**Steps**:

1. **Create app directory**: `apps/my-app/`

2. **Extend WeatherScorer** (see `@weather-apps/core-algorithm` example above)

3. **Configure Vercel**:
   - Copy `vercel.json` from existing app
   - Create `/api/gemini.ts` serverless function
   - Set `VITE_GEMINI_API_KEY` in Vercel dashboard

4. **Update root `package.json`**:
   ```json
   "scripts": {
     "dev:my-app": "npm run dev --workspace=apps/my-app",
     "build:my-app": "npm run build --workspace=apps/my-app"
   }
   ```

5. **Implement UI** using `@weather-apps/design-system` components

**What's Provided**:
- Weather data fetching (OpenMeteoProvider)
- AI summaries (SecureAIClient)
- Location resolution (NominatimProvider)
- Caching (SmartCache)
- UI components (design-system)
- Algorithm utilities (normalization, window detection, coastal intelligence)

**What You Build**:
- Scoring logic (extend WeatherScorer)
- App-specific UI components
- Decision thresholds

---

## Deployment

### Automatic (via GitHub)
```bash
git push origin main  # Auto-deploys both apps to Vercel
```

### Manual (via Vercel CLI)
```bash
cd apps/washing
vercel --prod
```

### Environment Variables
Set in Vercel dashboard for each app:
```
VITE_GEMINI_API_KEY=your-google-gemini-api-key
```

**Security**: This variable only used server-side in `/api/gemini.ts`. Verify:
```bash
npm run build:washing
grep -r "AIzaSy" apps/washing/dist/  # Must return 0 results
```

---

## Key Architectural Decisions

### 1. Abstract Algorithm Engine (WeatherScorer)
**Why**: Enable rapid development of new weather apps
**Impact**: 2-3 weeks for new apps vs 8-12 weeks from scratch

### 2. Serverless AI Proxy
**Why**: Security (API key protection) + performance (bundle size)
**Impact**: 58% bundle reduction, zero key exposure

### 3. Multi-Tier Caching
**Why**: Optimize for speed, persistence, freshness
**Impact**: Sub-second load times for repeat visits

### 4. Monorepo with Independent Deployments
**Why**: Share code, deploy independently
**Impact**: CI/CD simplicity + deployment flexibility

### 5. UK Met Office Models
**Why**: Most accurate for UK/Ireland target users
**Impact**: Better predictions, improved trust

---

## Common Tasks

### Tuning Algorithm Weights
**Location**: `apps/{app}/algorithms/{app}-config.ts`

```typescript
// Edit weights here (must sum to 1.0)
export const CONFIG = {
  weights: {
    factor1: 0.30,  // ← Edit
    factor2: 0.20,  // ← Edit
    // ...
  },
  thresholds: {
    excellent: 70,  // ← Edit decision thresholds
    acceptable: 50
  }
};
```

**Don't modify**: `WeatherScorer` base class (affects all apps)

### Adding UI Components
```typescript
// ✅ Use design system tokens
import { colors, spacing } from '@weather-apps/design-system';

// ✅ Lazy load non-critical components
const MyComponent = lazy(() => import('./components/MyComponent'));

// ✅ Test mobile (44px minimum touch targets)
```

### Modifying Weather Data
**Location**: `packages/weather-api/src/providers/OpenMeteoProvider.ts`

1. Update `HOURLY_PARAMS` array
2. Update `HourlyData` TypeScript interface
3. Update response mapping in `mapHourlyData()`

### Debugging
```bash
# TypeScript errors
npx tsc --noEmit

# Turborepo cache issues
npx turbo clean && npm run build

# Import resolution issues
# Check tsconfig.base.json paths configuration
```

---

## Performance Metrics

**Bundle Sizes**:
- GetTheWashingOut: 412KB (down from 996KB pre-monorepo)
- GetTheWoodburnerOn: 443KB

**Build Performance**:
- Full build: ~5 seconds
- Incremental: <1 second (with Turbo cache)
- Cache hit rate: 86%

**Targets**:
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1

---

## Security Architecture

### API Key Protection
- Client: API key completely removed from bundles
- Server: API key in Vercel environment variables only
- Proxy: All AI requests via `/api/gemini` serverless function
- Verification: `grep -r "AIzaSy" dist/` returns 0 results ✅

### Rate Limiting
- AI calls: 20 requests/minute per IP (server-side)
- Location search: 1 request/second (Nominatim compliance)

### Content Security Policy
Strict allowlist in `vercel.json`:
- `connect-src`: Only Open-Meteo + Nominatim APIs
- `script-src`: 'self' only (no inline scripts)

---

## Code Quality Standards

**TypeScript Strict Mode** (`tsconfig.base.json`):
- All flags enabled (noUnusedLocals, noUncheckedIndexedAccess, etc.)
- No `any` types allowed

**Design Patterns**:
- Template Method (WeatherScorer)
- Proxy (SecureAIClient)
- Multi-Tier Caching (Memory → IndexedDB → Network)
- Stale-While-Revalidate

---

## Documentation

**Monorepo-level**:
- `README.md` - Quick start
- `MONOREPO_COMPLETE.md` - Detailed completion summary
- `PHASE_3_COMPLETE.md` - AI migration details
- `MIGRATION_GUIDE.md` - Step-by-step migration
- `DEPLOYMENT_READY.md` - Production deployment guide

**App-level**:
- `apps/{app}/claude.md` - App-specific guide
- `apps/{app}/README.md` - Public-facing description

**Package-level**:
- `packages/{package}/README.md` - API reference with examples

---

## Current Status & Roadmap

### Completed (75%)
- ✅ Monorepo infrastructure (Turborepo, npm workspaces)
- ✅ 7 shared packages created and production-ready
- ✅ AI migration (both apps use SecureAIClient)
- ✅ 2 apps deployed and working

### In Progress (30% remaining)
- 🚧 Complete service migration to shared packages
- 🚧 Test coverage (0% → target 85%+)
- 🚧 Full algorithm integration (DryingScorer, BurningScorer)

### Planned
- ⏳ New apps (lawn, golf)
- ⏳ Storybook for design system
- ⏳ Enhanced monitoring (Sentry)
- ⏳ Dark mode support

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| TypeScript errors | `npx tsc --noEmit` to see details |
| Build fails locally | `npx turbo clean && npm run build` |
| Import resolution error | Check `tsconfig.base.json` paths |
| Vercel deployment fails | Verify `vercel.json` buildCommand includes Turbo filter |
| API keys in bundle | Check imports - `@google/genai` only in `/api/gemini.ts` |

---

## Contributing

Before committing:
1. **Type check**: `npx tsc --noEmit` (must pass)
2. **Test**: `npm test` (must pass)
3. **Mobile-first**: Test in DevTools responsive mode
4. **Use tokens**: Import from design-system, no hardcoded values
5. **Document**: Add JSDoc comments for complex logic

---

**Last Updated**: 2025-11-05
**Monorepo Status**: Phase 3 (75% complete), production-ready
**Maintainer**: steel + Claude Code
