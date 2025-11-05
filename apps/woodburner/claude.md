# GetTheWoodburnerOn

**AI Assistant Guide** - Wood burner operation PWA for UK/Ireland

## What This Is

A **production-deployed React PWA** that tells UK/Ireland residents when to operate their wood burners based on comfort, environmental conditions, and smoke dispersion. Combines Open-Meteo weather data with a BurnCast algorithm and Gemini AI for 5-tier recommendations.

**Live**: [getthewoodburneronapp.vercel.app](https://getthewoodburneronapp.vercel.app)
**Status**: Production-ready, deployed on Vercel (lhr1)
**Bundle**: 443KB

---

## Architecture at a Glance

```
App.tsx (React 19)
├── HeroDecision          → 5-tier decision display
├── LocationInput         → Geolocation + text search
├── ForecastTimeline      → 3-day forecast timeline (lazy)
└── AnimatedBackground    → Dynamic weather backdrop (lazy)

Services (Legacy - being migrated to monorepo packages)
├── weatherService.ts                    → BurnCast scoring algorithm
│   └── algorithm/
│       ├── woodburner-config.ts         → Weights & thresholds
│       ├── temperature-differential.ts  → Indoor/outdoor comfort
│       ├── atmospheric-stability.ts     → Smoke dispersion analysis
│       ├── burning-windows.ts           → Optimal operation windows
│       ├── coastal-intelligence.ts      → Wind modifiers
│       └── wind-analysis.ts             → Topographic shelter
├── weatherAPIService.ts                 → Open-Meteo integration (legacy)
├── geminiService.ts                     → AI proxy client (legacy)
├── geoLocationService.ts                → Geocoding (legacy)
└── cacheService.ts                      → IndexedDB caching (legacy)

Monorepo Integration (using shared packages)
├── @weather-apps/ai-services            → SecureAIClient (✅ integrated)
└── (Other packages pending migration - see ../claude.md)

Serverless (Vercel Edge)
└── api/gemini.ts                        → Secure AI proxy (no API keys in bundle)
```

**Migration Note**: This app is ~30% migrated to shared monorepo packages. See [../../claude.md](../../claude.md) for package details.

---

## The BurnCast Algorithm

**Purpose**: Scientific burning score (0-100) based on temperature differential and environmental conditions

### Scoring Weights ([services/algorithm/woodburner-config.ts](services/algorithm/woodburner-config.ts))
```typescript
Temperature Differential: 50%  // Indoor vs outdoor comfort (most important)
Pressure:                15%  // Smoke dispersion (high pressure = poor)
Humidity:                15%  // Comfort and efficiency
Wind:                    10%  // Smoke dispersal assistance
Precipitation:           10%  // Outdoor activity deterrent
```

### Advanced Features
- **Temperature Differential**: Indoor (18°C baseline) vs outdoor temperature gap
- **Atmospheric Stability**: Pressure analysis for smoke dispersion
- **Temporal Weighting**: Evening (6pm-10pm) and morning (6am-9am) emphasis
- **Critical Warnings**: Dangerous burning conditions (very high pressure + low temp)

### Decision Thresholds (5-Tier System)
- **Excellent** (75-100): Perfect burning conditions
- **Good** (60-74): Favorable for burning
- **Marginal** (45-59): Borderline, proceed with caution
- **Poor** (30-44): Not recommended
- **Avoid** (0-29): Do not burn (environmental/safety concerns)

### Disqualification Rules
- Very high atmospheric pressure + very low temperature (smoke trap)
- Extreme wind conditions (fire safety)
- Heavy precipitation (operational difficulty)

---

## Key Files & Components

### Start Here
- [App.tsx](App.tsx) - Main app logic and state
- [types.ts](types.ts) - TypeScript definitions
- [services/algorithm/woodburner-config.ts](services/algorithm/woodburner-config.ts) - Algorithm weights (easiest to tune)
- [services/weatherService.ts](services/weatherService.ts) - Core BurnCast implementation

### Critical Services
- [services/weatherService.ts](services/weatherService.ts) - BurnCast scoring
- [services/weatherAPIService.ts](services/weatherAPIService.ts) - Weather data fetching
- [services/geminiService.ts](services/geminiService.ts) - AI summaries (using SecureAIClient)
- [services/geoLocationService.ts](services/geoLocationService.ts) - Location handling
- [services/cacheService.ts](services/cacheService.ts) - IndexedDB caching

### Algorithm Modules
- [services/algorithm/temperature-differential.ts](services/algorithm/temperature-differential.ts) - Indoor/outdoor gap
- [services/algorithm/atmospheric-stability.ts](services/algorithm/atmospheric-stability.ts) - Smoke dispersion
- [services/algorithm/burning-windows.ts](services/algorithm/burning-windows.ts) - Optimal time detection

### UI Components
- [components/HeroDecision.tsx](components/HeroDecision.tsx) - 5-tier decision display
- [components/ForecastTimeline.tsx](components/ForecastTimeline.tsx) - 3-day timeline
- [components/UnifiedDayCard.tsx](components/UnifiedDayCard.tsx) - Expandable day cards
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
npm run dev:woodburner  # http://localhost:5001

# Or from this directory
npm install
npm run dev
```

### Essential Commands
```bash
npm run dev         # Development server (port 5001)
npm run build       # Production build → dist/
npm run preview     # Preview production build
npm test            # Run all tests
npm test -- --coverage  # Coverage report
npx tsc --noEmit    # Type check only
```

### Testing Specific Files
```bash
npm test -- weatherService.test.ts
npm test -- -u  # Update snapshots
```

---

## Common Tasks

### 1. Modify Algorithm Weights
**Location**: [services/algorithm/woodburner-config.ts](services/algorithm/woodburner-config.ts)

```typescript
// Edit weights here (DO NOT touch weatherService.ts directly)
export const BURN_CAST_CONFIG = {
  weights: {
    temperatureDifferential: 0.50,  // ← Edit
    pressure: 0.15,                  // ← Edit
    humidity: 0.15,                  // ← Edit
    wind: 0.10,                      // ← Edit
    precipitation: 0.10              // ← Edit
  },
  thresholds: {
    excellent: 75,  // ← Edit decision thresholds
    good: 60,
    marginal: 45,
    poor: 30
  }
};
```

**Test**: `npm test -- weatherService.test.ts`

### 2. Debug Weather Data Issues
1. Check Open-Meteo API response in DevTools Network tab
2. Verify parsing in [weatherAPIService.ts](weatherAPIService.ts)
3. Add console.log in [weatherService.ts](weatherService.ts) scoring functions
4. Check temperature differential calculation if scores seem wrong

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
# Check dist/ size (~443KB total)
# Chunk size warning: 800KB threshold (mobile-optimized)
```

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
- `http://localhost:5001` (development)
- `http://localhost:4173` (preview)
- `https://getthewoodburneronapp.vercel.app` (production)

---

## Monorepo Integration Status

### Using Shared Packages (✅ Integrated)
- `@weather-apps/ai-services` - SecureAIClient for Gemini proxy

### Pending Migration (🚧 ~30% remaining)
- `@weather-apps/core-algorithm` - Move BurnCast to BurningScorer class
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

**Goal**: Best-in-class wood burner operation app - scientifically accurate, environmentally conscious, user-friendly.

**Principles**:
- **Comfort-focused**: Temperature differential as primary decision factor
- **Environmentally conscious**: Smoke dispersion analysis prevents air quality issues
- **Safety-first**: Critical warnings for dangerous burning conditions
- **Mobile-first**: UK users checking from home on mobile devices

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

- [../../claude.md](../../claude.md) - Monorepo architecture
- [../../MONOREPO_COMPLETE.md](../../MONOREPO_COMPLETE.md) - Migration details

---

**Last Updated**: 2025-11-05
**Status**: Production-deployed, monorepo migration ~30% complete
**Maintainer**: steel + Claude Code
**License**: MIT
