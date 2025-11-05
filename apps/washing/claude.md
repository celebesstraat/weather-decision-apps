# GetTheWashingOut

**AI Assistant Guide** - Laundry drying PWA for UK/Ireland

## What This Is

A **production-deployed React PWA** that tells UK/Ireland residents when to hang laundry outside. Combines Open-Meteo weather data with a proprietary DryCast algorithm and Gemini AI summaries for instant YES/MAYBE/NO recommendations.

**Live**: [getthewashingout.vercel.app](https://getthewashingout.vercel.app)
**Status**: Production-ready, deployed on Vercel (lhr1)
**Bundle**: 412KB (58% reduction from 996KB via monorepo migration)

---

## Architecture at a Glance

```
App.tsx (React 19)
├── HeroDecision          → Giant YES/MAYBE/NO display
├── LocationInput         → Geolocation + text search
├── ForecastTimeline      → 3-day swipeable timeline (lazy)
└── AnimatedBackground    → Dynamic weather backdrop (lazy)

Services (Legacy - being migrated to monorepo packages)
├── weatherService.ts               → DryCast scoring algorithm
│   └── algorithm/
│       ├── config.ts               → Weights & thresholds
│       ├── coastal-intelligence.ts → Coastal wind modifiers
│       └── wind-analysis.ts        → Topographic shelter
├── weatherAPIService.ts            → Open-Meteo integration (legacy)
├── geminiService.ts                → AI proxy client (legacy)
├── geoLocationService.ts           → Geocoding (legacy)
└── cacheService.ts                 → IndexedDB caching (legacy)

Monorepo Integration (using shared packages)
├── @weather-apps/ai-services       → SecureAIClient (✅ integrated)
└── (Other packages pending migration - see ../claude.md)

Serverless (Vercel Edge)
└── api/gemini.ts                   → Secure AI proxy (no API keys in bundle)
```

**Migration Note**: This app is ~30% migrated to shared monorepo packages. See [../../claude.md](../../claude.md) for package details.

---

## The DryCast Algorithm

**Purpose**: Scientific drying score (0-100) based on meteorological data

### Scoring Weights ([services/algorithm/config.ts](services/algorithm/config.ts))
```typescript
Vapor Pressure Deficit: 30%  // Direct drying potential (most important)
Wind Speed:             20%  // Evaporation acceleration
Wet Bulb Temperature:   10%  // Evaporative cooling indicator
Sunshine Duration:       9%  // Actual sun exposure
Temperature:             8%  // Warmth factor
Shortwave Radiation:     8%  // Solar energy
Evapotranspiration:      5%  // Real evaporation rates
Wind Direction:          5%  // Shelter logic
Dew Point Spread:        5%  // Condensation risk
```

### Advanced Features
- **Coastal Intelligence**: Wind tolerance adjusted by distance from coast (220+ UK locations)
- **Topographic Shelter**: Urban vs rural exposure, wind direction analysis
- **Window Detection**: Finds continuous 2+ hour optimal periods (score ≥50)

### Decision Thresholds
- **YES** (70-100): Excellent drying conditions
- **MAYBE** (50-69): Marginal but acceptable
- **NO** (0-49): Indoor drying recommended

### Disqualification Rules
- Dew point spread <1°C (condensation risk)
- Rain risk >0.2
- Any detected rainfall

---

## Key Files & Components

### Start Here
- [App.tsx:29-110](App.tsx#L29-L110) - Main app logic and state
- [types.ts](types.ts) - TypeScript definitions
- [services/algorithm/config.ts](services/algorithm/config.ts) - Algorithm weights (easiest to tune)
- [services/weatherService.ts](services/weatherService.ts) - Core DryCast implementation

### Critical Services
- [services/weatherService.ts](services/weatherService.ts) - DryCast scoring (1879 lines)
- [services/weatherAPIService.ts](services/weatherAPIService.ts) - Weather data fetching (658 lines)
- [services/geminiService.ts](services/geminiService.ts) - AI summaries (337 lines, using SecureAIClient)
- [services/geoLocationService.ts](services/geoLocationService.ts) - Location handling (646 lines)
- [services/cacheService.ts](services/cacheService.ts) - IndexedDB caching (255 lines)

### UI Components
- [components/HeroDecision.tsx](components/HeroDecision.tsx) - YES/MAYBE/NO decision display
- [components/ForecastTimeline.tsx](components/ForecastTimeline.tsx) - 3-day timeline
- [components/UnifiedDayCard.tsx](components/UnifiedDayCard.tsx) - Expandable day cards
- [components/DryingQualityMeter.tsx](components/DryingQualityMeter.tsx) - Hourly visualization
- [components/LocationInput.tsx](components/LocationInput.tsx) - Search + geolocation

### Configuration
- [vercel.json](vercel.json) - Deployment + security headers
- [vite.config.ts](vite.config.ts) - Build optimization + code splitting
- [tailwind.config.js](tailwind.config.js) - CSS configuration
- `.env.local` - Environment variables (NOT committed)

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | React | 19.1.1 | UI framework |
| | TypeScript | 5.8.3 | Type safety |
| **Build** | Vite | 6.4.1 | Dev server + bundler |
| | Tailwind CSS | 3.4.18 | Utility-first styling (local build) |
| | PostCSS | 8.5.6 | CSS processing |
| **Animation** | Framer Motion | 12.23.24 | Spring animations |
| **AI** | @google/genai | 1.15.0 | Gemini 2.5 Flash Lite (server-side only) |
| **Testing** | Jest | 30.2.0 | Unit tests + coverage |
| | Testing Library | 16.3.0 | React component testing |
| **Deployment** | Vercel | - | Production hosting (lhr1 region) |
| **PWA** | Service Worker | v2 | Offline + install prompt |

**Note**: `@google/genai` pinned to 1.15.0 (v1.16+ has browser bugs), used server-side only in [api/gemini.ts](api/gemini.ts)

---

## Development Workflow

### Quick Start
```bash
# From monorepo root
npm run dev:washing  # http://localhost:5000

# Or from this directory
npm install
npm run dev
```

### Essential Commands
```bash
npm run dev         # Development server (port 5000)
npm run build       # Production build → dist/
npm run preview     # Preview production build
npm test            # Run all tests
npm test -- --coverage  # Coverage report
npx tsc --noEmit    # Type check only
```

### Testing Specific Files
```bash
npm test -- weatherService.test.ts
npm test -- geoLocationService.test.ts
npm test -- -u  # Update snapshots
```

---

## Common Tasks

### 1. Modify Algorithm Weights
**Location**: [services/algorithm/config.ts](services/algorithm/config.ts)

```typescript
// Edit weights here (DO NOT touch weatherService.ts directly)
export const DRY_CAST_CONFIG = {
  weights: {
    vaporPressureDeficit: 0.30,  // ← Edit
    windSpeed: 0.20,              // ← Edit
    // ...
  },
  thresholds: {
    excellent: 70,  // ← Edit decision thresholds
    acceptable: 50,
    poor: 30
  }
};
```

**Test**: `npm test -- weatherService.test.ts`

### 2. Debug Weather Data Issues
1. Check Open-Meteo API response in DevTools Network tab
2. Verify parsing in [weatherAPIService.ts](weatherAPIService.ts)
3. Add console.log in [weatherService.ts](weatherService.ts) `scoreHourForDrying()`
4. Check coastal/wind modifiers if scores seem wrong

### 3. Add New Component
```typescript
// 1. Create in components/ with TypeScript
// 2. Use design tokens
import { colors, spacing } from '../design/tokens';

// 3. Add lazy loading if non-critical
const MyComponent = lazy(() => import('./components/MyComponent'));

// 4. Test mobile (touch targets ≥44px)
```

### 4. Fix Gemini AI Errors
**"API Key must be set"**:
```bash
# Ensure correct version (v1.16+ has browser bugs)
npm install @google/genai@1.15.0
rm -rf node_modules/.vite
npm run dev
```

**Quota exceeded**: App degrades gracefully - weather data continues working, AI summary shows quota message

### 5. Update Dependencies
```bash
npm outdated          # Check outdated packages
npm install pkg@latest # Update specific package
npm test && npm run build # Re-test after updates
```

---

## Deployment (Vercel)

### Production Configuration
**File**: [vercel.json](vercel.json)
- **Region**: lhr1 (London, UK)
- **Framework**: Vite (auto-detected)
- **Build**: `npm run build` → `dist/`
- **SPA Routing**: All routes → `/index.html`

### Security Headers
- **Content-Security-Policy**: Strict allowlists for Open-Meteo + Nominatim
- **X-Frame-Options**: DENY (clickjacking prevention)
- **X-Content-Type-Options**: nosniff
- **Permissions-Policy**: Geolocation only

### Environment Variables
**Required in Vercel Dashboard**:
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```
Set for: Production, Preview, Development

**Security Verification**:
```bash
npm run build
grep -r "AIzaSy" dist/  # Must return 0 results ✅
```

### Automatic Deployments
- **Production**: Push to `main` → auto-deploy
- **Preview**: Open PR → preview URL
- **Rollback**: Vercel Dashboard → Promote previous deployment

---

## Build Optimization

### Manual Code Splitting ([vite.config.ts](vite.config.ts))
```typescript
manualChunks: {
  'react-core': ['react', 'react-dom'],
  'weather-services': ['./services/weatherService', './services/weatherAPIService'],
  'ai-features': ['./services/geminiService'],
  'ui-components': ['./components/AnimatedBackground', './components/ForecastTimeline'],
  'pwa-features': ['./components/MobileShell']
}
```

### Lazy Loading
```typescript
// ForecastTimeline - deferred until results available
const ForecastTimeline = lazy(() => import('./components/ForecastTimeline'));

// AnimatedBackground - non-critical visual
const AnimatedBackground = lazy(() => import('./components/AnimatedBackground'));
```

### Bundle Analysis
```bash
npm run build
# Check dist/ size (~412KB total)
# Chunk size warning: 800KB threshold (mobile-optimized)
```

**Performance**: 58% reduction (996KB → 412KB) via:
- AI SDK moved to server ([api/gemini.ts](api/gemini.ts))
- Code splitting by route
- Tree shaking (Vite + Rollup)

---

## Security Architecture

### API Key Protection
- **Client-side**: API key completely removed from browser bundles
- **Server-side**: API key stored in Vercel environment variables
- **Proxy Pattern**: All AI requests route through [api/gemini.ts](api/gemini.ts) serverless function
- **Verification**: `grep -r "AIzaSy" dist/` returns 0 results ✅

### Rate Limiting
- **Server-side** ([api/gemini.ts](api/gemini.ts)): 20 requests/minute per IP address
- **Client-side**: Graceful degradation on quota exceeded

### Input Validation
- Request type validation (comprehensive-advice, location-validation, place-name)
- XSS pattern blocking (`<script>`, `javascript:`, etc.)
- SQL injection pattern blocking (`UNION SELECT`, `--`, etc.)
- Coordinate bounds validation (-90 to 90 lat, -180 to 180 lon)

### CORS Protection
Allowed origins ([api/gemini.ts](api/gemini.ts)):
- `http://localhost:5000` (development)
- `http://localhost:4173` (preview)
- `https://getthewashingout.vercel.app` (production)

---

## Monorepo Integration Status

### Using Shared Packages (✅ Integrated)
- `@weather-apps/ai-services` - SecureAIClient for Gemini proxy

### Pending Migration (🚧 ~30% remaining)
- `@weather-apps/core-algorithm` - Move DryCast to DryingScorer class
- `@weather-apps/weather-api` - Replace weatherAPIService.ts
- `@weather-apps/geolocation` - Replace geoLocationService.ts
- `@weather-apps/design-system` - Migrate design/tokens.ts
- `@weather-apps/monitoring` - Replace utils/performanceMonitor.ts

**See**: [../../claude.md](../../claude.md) for monorepo architecture and shared packages

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| UI looks outdated | `rm -rf dist/ && npm run dev` |
| "API Key must be set" | `npm install @google/genai@1.15.0` |
| Geolocation blocked | DevTools Console → Check Permissions |
| Weather data incorrect | Check [weatherAPIService.ts](weatherAPIService.ts) parsing |
| Tests failing | `npm test -- -u` (update snapshots) |
| Service worker issues | DevTools → Application → Clear site data |
| TypeScript errors | `npx tsc --noEmit` for details |
| Build size too large | Check [vite.config.ts](vite.config.ts) manualChunks |

---

## API Dependencies

1. **Open-Meteo API** - Weather data (UK Met Office models)
   - Rate limit: 10,000 calls/day (free tier)
   - Cache TTL: 10 minutes

2. **Nominatim (OpenStreetMap)** - Geocoding
   - Rate limit: 1 request/second
   - Cache TTL: 24 hours

3. **Google Gemini AI** - Natural language summaries (via [api/gemini.ts](api/gemini.ts) proxy)
   - Rate limit: 20 requests/minute per IP (server-enforced)
   - Cache TTL: 1 hour

4. **Sunrise-Sunset API** - Astronomy data
   - No rate limit
   - Cache TTL: 24 hours

**Error Handling**: All services have graceful degradation with exponential backoff retry and cached data fallback

---

## Project Vision

**Goal**: World-class laundry weather app - fastest, leanest, most secure, most maintainable.

**Principles**:
- **Mobile-first**: UK users drying laundry are on mobile
- **Performance-obsessed**: Lazy loading, caching, code splitting, PWA
- **Scientifically accurate**: VPD, coastal intelligence, real UK Met Office data
- **Delightfully simple**: YES/MAYBE/NO in <3 seconds

**Inspiration**: Apple Weather (polish), Stripe (clarity), Linear (speed)

---

## Contributing

Before committing:
1. **Type check**: `npx tsc --noEmit` (must pass)
2. **Test**: `npm test` (must pass)
3. **Mobile-first**: Test in DevTools responsive mode
4. **Use tokens**: Import from `design/tokens.ts` (no hardcoded colors/spacing)
5. **Document**: Add comments for complex algorithm logic

---

## Additional Documentation

- [SECURITY_MIGRATION_COMPLETE.md](SECURITY_MIGRATION_COMPLETE.md) - Security audit and changes
- [DEPLOY_NOW.md](DEPLOY_NOW.md) - Quick deployment guide
- [STRATEGIC_PLAN.md](STRATEGIC_PLAN.md) - 14-week roadmap
- [../../claude.md](../../claude.md) - Monorepo architecture
- [../../MONOREPO_COMPLETE.md](../../MONOREPO_COMPLETE.md) - Migration details

---

**Last Updated**: 2025-11-05
**Status**: Production-deployed, monorepo migration ~30% complete
**Maintainer**: steel + Claude Code
**License**: MIT
