# CLAUDE.md

**AI Assistant Guide** - Production-ready PWA architecture and development reference

## What This Is

**GetTheWashingOut** is a production-deployed React PWA that tells UK/Ireland residents when to hang their laundry outside. It combines real-time weather data from Open-Meteo API with a proprietary DryCast algorithm and Google Gemini AI to deliver instant YES/MAYBE/NO recommendations.

**Target Users**: UK/Ireland residents who air-dry laundry outdoors
**Core Value**: Never bring in soggy washing or miss a perfect drying day
**Production Status**: Live on Vercel (lhr1 region) with full PWA capabilities

---

## Architecture Overview

```
App.tsx (React 19)
├── HeroDecision          → Giant YES/MAYBE/NO decision display
├── LocationInput         → Geolocation + text search
├── ForecastTimeline      → 3-day swipeable timeline (lazy)
└── AnimatedBackground    → Dynamic weather backdrop (lazy)

Services (Business Logic)
├── weatherService.ts               → DryCast scoring algorithm
│   └── algorithm/
│       ├── config.ts               → Weights & thresholds
│       ├── coastal-intelligence.ts → Coastal wind modifiers
│       └── wind-analysis.ts        → Topographic shelter
├── weatherAPIService.ts            → Open-Meteo integration
├── geminiService.ts                → Gemini proxy client (secure)
├── geoLocationService.ts           → Geocoding & validation
└── cacheService.ts                 → IndexedDB caching

Serverless Functions (Vercel)
└── api/
    └── gemini.ts                   → Secure Gemini AI proxy with rate limiting

Data & Utilities
├── data/uk-coastal-distances.json  → 220+ UK coastal distances
├── utils/performanceMonitor.ts     → Core Web Vitals
├── utils/hapticFeedback.ts         → Mobile vibration
└── design/tokens.ts                → Design system
```

---

## The DryCast Algorithm

**Purpose**: Scientific drying score calculation (0-100) based on meteorological data

### Input Data (Hourly)
- Vapor Pressure Deficit (kPa)
- Wind speed/direction (km/h, degrees)
- Wet bulb temperature (°C)
- Sunshine duration (hours)
- Temperature (°C)
- Shortwave radiation (W/m²)
- Evapotranspiration (mm/day)
- Dew point spread (°C)
- Rain risk (probability × intensity)

### Scoring Weights (services/algorithm/config.ts)
```typescript
Vapor Pressure Deficit: 30%  // Direct drying potential
Wind Speed:             20%  // Evaporation acceleration
Wet Bulb Temperature:   10%  // Evaporative cooling
Sunshine Duration:       9%  // Actual sun exposure
Temperature:             8%  // Warmth factor
Shortwave Radiation:     8%  // Solar energy
Evapotranspiration:      5%  // Real evaporation rates
Wind Direction:          5%  // Shelter logic
Dew Point Spread:        5%  // Condensation risk
```

### Advanced Modifiers
- **Coastal Intelligence**: Adjusts wind tolerance based on distance from coast (220+ UK locations)
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

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | React | 19.1.1 | UI framework (latest stable) |
| | TypeScript | 5.8.3 | Type safety |
| **Build** | Vite | 6.4.1 | Dev server + bundler |
| | Tailwind CSS | 3.4.18 | Utility-first styling (local build) |
| | PostCSS | 8.5.6 | CSS processing |
| **Animation** | Framer Motion | 12.23.24 | Spring animations |
| **AI** | @google/genai | 1.15.0 | Gemini 2.5 Flash Lite |
| **Testing** | Jest | 30.2.0 | Unit tests + coverage |
| | Testing Library | 16.3.0 | React component testing |
| **Deployment** | Vercel | - | Production hosting (lhr1) |
| **PWA** | Service Worker | v2 | Offline + caching |

**Note**: `@google/genai` pinned to 1.15.0 (v1.16+ has browser bugs)

---

## Key Services

### weatherService.ts (1879 lines)
**Purpose**: Core DryCast algorithm implementation
**Main Functions**:
- `getWashingRecommendation(location)` - Main entry point
- `scoreHourForDrying(weatherData)` - Calculates 0-100 score
- `findDryingWindows(hourlyScores)` - Identifies optimal 2+ hour windows
- `determineDailyCondition(hourlyData)` - Weather classification

**Architecture**: Modular with algorithm/ subdirectory for weights and modifiers

### weatherAPIService.ts (658 lines)
**Purpose**: Weather data from Open-Meteo API
**Coverage**: 72-hour hourly forecast + current conditions
**Data Source**: UK Met Office models (UKMO + UKV)
**Key Functions**:
- `fetchWeatherData(lat, lon)` - Hourly forecast
- `fetchSunriseSunset(lat, lon)` - Astronomy data
- `checkWeatherAPIHealth()` - API status check

### geminiService.ts (337 lines)
**Purpose**: AI-powered natural language summaries
**Model**: Gemini 2.5 Flash Lite (temperature: 0.4)
**Key Functions**:
- `generateComprehensiveDryingAdvice()` - 24h + 3-day advice (single API call)
- `validateLocationInput()` - Typo correction & abuse detection
- `getPlacenameFromCoords()` - Reverse geocoding

**Rate Limiting**: Graceful degradation when quota exceeded (weather data still works)

### geoLocationService.ts (646 lines)
**Purpose**: Location resolution and validation
**APIs**: Nominatim (primary), Open-Meteo geocoding (fallback)
**Features**:
- UK/Ireland geographic validation
- Confidence scoring for ambiguous locations
- Browser Geolocation API integration

### cacheService.ts (255 lines)
**Purpose**: Performance optimization via IndexedDB
**Cache TTLs**:
- Weather data: 10 minutes
- Location geocoding: 24 hours
- AI summaries: 1 hour

**Features**: Automatic expiry, background cleanup, network fallback

---

## Development Workflow

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Create .env.local
echo "VITE_GEMINI_API_KEY=your_key_here" > .env.local

# 3. Start dev server
npm run dev  # http://localhost:5000
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

## Deployment (Vercel)

### Production Configuration
**File**: `vercel.json`
- **Region**: lhr1 (London, UK)
- **Framework**: Vite (auto-detected)
- **Build**: `npm run build` → `dist/`
- **SPA Routing**: All routes → `/index.html`

### Security Headers
- **Content-Security-Policy**: Strict with allowlisted APIs
- **X-Frame-Options**: DENY (clickjacking prevention)
- **X-Content-Type-Options**: nosniff
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Geolocation only

### Caching Strategy
- Service worker (`/sw.js`): `max-age=0, must-revalidate`
- Manifest (`/manifest.json`): `max-age=3600`
- Assets (`/assets/*`): `max-age=31536000, immutable`

### Environment Variables
**Required in Vercel Dashboard**:
```
VITE_GEMINI_API_KEY = your_gemini_api_key_here
```
Set for: Production, Preview, Development

### Automatic Deployments
- **Production**: Push to `main` → auto-deploy
- **Preview**: Open PR → preview URL
- **Rollback**: Vercel Dashboard → Promote previous deployment

---

## Common Tasks

### 1. Modify Algorithm Weights
```bash
# Edit weights in config (DO NOT touch weatherService.ts directly)
# File: services/algorithm/config.ts

# Test changes
npm test -- weatherService.test.ts

# Verify edge cases make sense
```

### 2. Debug Weather Data Issues
```bash
# 1. Check API response in DevTools Network tab
# 2. Verify parsing in weatherAPIService.ts
# 3. Add console.log in weatherService.ts scoreHourForDrying()
# 4. Check coastal/wind modifiers if scores seem wrong
```

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
# Check outdated packages
npm outdated

# Update specific package
npm install package@latest

# Re-test after updates
npm test && npm run build
```

---

## Build Optimization

### Manual Code Splitting (vite.config.ts)
```typescript
manualChunks: {
  'react-core': ['react', 'react-dom'],
  'weather-services': ['./services/weatherService', './services/weatherAPIService'],
  'ai-features': ['./services/geminiService', '@google/genai'],
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
# Check dist/ size (~996KB total is expected)
# Chunk size warning: 800KB threshold (mobile-optimized)
```

---

## Troubleshooting

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| UI looks outdated | Stale build cache | `rm -rf dist/ && npm run dev` |
| "API Key must be set" | Wrong @google/genai version | `npm install @google/genai@1.15.0` |
| Geolocation blocked | Browser permission denied | DevTools Console → Check Permissions |
| Weather data incorrect | API change or parsing error | Inspect `weatherAPIService.ts` |
| Tests failing | Outdated snapshots | `npm test -- -u` |
| Service worker issues | Stale cache | DevTools → Application → Clear site data |
| TypeScript errors | Missing types or config | `npx tsc --noEmit` for details |
| Build size too large | Lazy loading not working | Check vite.config.ts manualChunks |

---

## File Reference

### Start Here
- `App.tsx` - Main app logic and state
- `types.ts` - TypeScript definitions
- `services/algorithm/config.ts` - Algorithm weights (easiest to tune)
- `services/weatherService.ts` - Core algorithm implementation

### Key Components
- `components/HeroDecision.tsx` - YES/MAYBE/NO decision display
- `components/ForecastTimeline.tsx` - 3-day timeline with AI advice
- `components/UnifiedDayCard.tsx` - Expandable day forecast card
- `components/DryingQualityMeter.tsx` - Hourly visualization
- `components/LocationInput.tsx` - Search + geolocation

### Critical Services
- `services/weatherAPIService.ts` - Weather data fetching
- `services/geminiService.ts` - AI summaries
- `services/geoLocationService.ts` - Location handling
- `services/cacheService.ts` - Performance caching

### Configuration
- `vercel.json` - Deployment config + security headers
- `vite.config.ts` - Build optimization + code splitting
- `tailwind.config.js` - CSS configuration
- `.env.local` - Environment variables (NOT committed)

---

## Project Principles

**Goal**: World-class laundry weather app - fast, lean, secure, maintainable

**Core Values**:
- **Mobile-first**: UK users are primarily on mobile devices
- **Performance-obsessed**: Lazy loading, caching, code splitting, PWA
- **Scientifically accurate**: VPD, coastal intelligence, real Met Office data
- **Delightfully simple**: YES/MAYBE/NO in under 3 seconds

**Inspiration**: Apple Weather (polish), Stripe (clarity), Linear (speed)

---

## Contributing Guidelines

Before committing:
1. **Type check**: `npx tsc --noEmit` (must pass)
2. **Test**: `npm test` (must pass)
3. **Mobile-first**: Test in DevTools responsive mode
4. **Use tokens**: Import from `design/tokens.ts` (no hardcoded colors/spacing)
5. **Document complexity**: Add comments for non-obvious algorithm logic

---

## Recent Production Improvements (Nov 2025)

### Vercel Deployment Readiness
- Comprehensive `vercel.json` with security headers and CSP
- UK regional deployment (lhr1) for optimal latency
- React ErrorBoundary for graceful error handling
- API key security fixes (removed logging)

### Tailwind CSS Migration
- Migrated from CDN to local build system
- PostCSS pipeline with Autoprefixer
- Reduced bundle size via tree-shaking
- Improved offline PWA functionality

### AI Security & Architecture (Jan 2025)
- **Serverless Proxy**: API key moved from client to server-side
- **Rate Limiting**: 20 requests/minute per IP (prevents abuse)
- **Input Validation**: XSS/SQLi protection on all requests
- **CORS Protection**: Same-origin only
- **Bundle Size**: 53% reduction (996KB → 471KB) by removing client-side GenAI
- Upgraded to Gemini 2.5 Flash Lite
- Faster response times, more cost-effective
- Graceful degradation on quota exceeded

### PWA Optimizations
- Service worker v2 with smart caching
- 10-min weather cache, 24-hr location cache
- Offline-first architecture
- Install prompt removed (browser native prompts)

---

## API Dependencies

### External APIs
1. **Open-Meteo API** - Weather data (UK Met Office models)
   - Rate limit: 10,000 calls/day (free tier)
   - Cache TTL: 10 minutes

2. **Nominatim (OpenStreetMap)** - Geocoding (primary)
   - Rate limit: 1 request/second
   - Cache TTL: 24 hours

3. **Google Gemini AI** - Natural language summaries (via secure proxy)
   - **Architecture**: Serverless function `/api/gemini` (Vercel Edge)
   - **Security**: API key server-side only (never exposed to client)
   - **Rate limit**: 20 requests/minute per IP (enforced)
   - **Cache TTL**: 1 hour

4. **Sunrise-Sunset API** - Astronomy data
   - No rate limit
   - Cache TTL: 24 hours

### Error Handling
All services have graceful degradation:
- Network errors → exponential backoff retry
- API failures → cached data fallback
- Gemini quota → weather data continues working

---

## Environment Variables

### Production (Vercel Dashboard)
```bash
# Set in Vercel Dashboard → Settings → Environment Variables
# Required for: Production, Preview, Development
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Local Development (Optional)
```bash
# .env.local (NEVER commit - already in .gitignore)
# Only needed if testing serverless functions locally with `vercel dev`
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Security Note**: API key is NEVER exposed to client. It only exists in:
1. Vercel environment variables (server-side)
2. `/api/gemini.ts` serverless function
3. Never bundled into JavaScript sent to browsers

**Common mistake**: `VITE_VITE_GEMINI_API_KEY` (double prefix) - this won't work

---

## Security Architecture

### API Key Protection
- **Client-side**: API key completely removed from browser bundles
- **Server-side**: API key stored in Vercel environment variables
- **Proxy Pattern**: All AI requests route through `/api/gemini` serverless function
- **Verification**: `grep -r "AIzaSy" dist/` returns 0 results ✅

### Rate Limiting
- **Limit**: 20 requests per minute per IP address
- **Method**: In-memory sliding window (resets on cold start)
- **Future**: Upgrade to Vercel KV (Redis) for distributed limiting
- **Response**: HTTP 429 with `Retry-After: 60` header

### Input Validation
- Request type validation (comprehensive-advice, location-validation, place-name)
- Field presence and type checking
- Length limits enforced
- XSS pattern blocking (`<script>`, `javascript:`, etc.)
- SQL injection pattern blocking (`UNION SELECT`, `--`, etc.)
- Coordinate bounds validation (-90 to 90 lat, -180 to 180 lon)

### CORS Protection
Allowed origins only:
- `http://localhost:5000` (development)
- `http://localhost:4173` (preview)
- `https://getthewashingout.vercel.app` (production)

All other origins: blocked

### Additional Files
- `SECURITY_MIGRATION_COMPLETE.md` - Detailed security audit and changes
- `DEPLOY_NOW.md` - Quick deployment guide with verification steps

---

**Last Updated**: 2025-01-05
**Status**: Production-ready, deployed on Vercel
**Maintainer**: steel + Claude Code
**License**: MIT
