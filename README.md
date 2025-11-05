# Weather Decision Apps Monorepo

**Production-ready PWA family** for UK/Ireland weather-based decisions.

## Apps in this Monorepo

| App | Status | Description |
|-----|--------|-------------|
| 🧺 **GetTheWashingOut** | ✅ Production | Laundry drying recommendations |
| 🔥 **GetTheWoodburnerOn** | ✅ Production | Wood burner operation advice |
| 🌱 **GetTheGrassCut** | 🚧 Planned | Lawn mowing recommendations |
| ⛳ **Get18HolesIn** | 🚧 Planned | Golf weather optimization |

## Shared Packages

- **@weather-apps/core-algorithm** - Abstract weather scoring engine
- **@weather-apps/weather-api** - Open-Meteo API integration
- **@weather-apps/ai-services** - Secure Gemini AI proxy client
- **@weather-apps/geolocation** - Geocoding and location services
- **@weather-apps/design-system** - Shared UI components and design tokens
- **@weather-apps/security** - Input validation and rate limiting
- **@weather-apps/monitoring** - Performance tracking and error reporting

## Quick Start

```bash
# Install dependencies
npm install

# Run all apps in dev mode
npm run dev

# Build all apps
npm run build

# Run tests
npm run test

# Lint all code
npm run lint
```

## Monorepo Architecture

```
weather-decision-apps/
├── packages/          # Shared code (60-70% reuse)
├── apps/              # Individual applications
├── infra/             # Shared infrastructure configs
├── turbo.json         # Build orchestration
└── tsconfig.base.json # Shared TypeScript config
```

## Tech Stack

- **Build System**: Turborepo for monorepo orchestration
- **Framework**: React 19.1.1 + TypeScript 5.8.3
- **Bundler**: Vite 6.4.1
- **Styling**: Tailwind CSS 3.4.18
- **Animation**: Framer Motion 12.x
- **Testing**: Jest + Testing Library
- **Deployment**: Vercel (lhr1 region)
- **AI**: Google Gemini 2.5 Flash Lite (via secure proxy)

## Development Workflow

### Working on a Specific App

```bash
# Navigate to app directory
cd apps/washing

# Run dev server
npm run dev
```

### Working on a Shared Package

```bash
# Navigate to package directory
cd packages/core-algorithm

# Build package
npm run build

# Run tests
npm run test
```

### Adding a New Dependency

```bash
# Add to specific app
cd apps/washing && npm install package-name

# Add to shared package
cd packages/weather-api && npm install package-name

# Add to root (dev tools only)
npm install -D package-name
```

## Code Reuse Metrics

| Component | Lines of Code | Apps Sharing |
|-----------|---------------|--------------|
| Weather API | ~650 | All apps |
| Geolocation | ~645 | All apps |
| Core Algorithm | ~800 | All apps |
| AI Services | ~335 | All apps |
| Design System | ~1,200 | All apps |
| Security | ~400 | All apps |
| **Total Shared** | **~4,030** | **All apps** |

**Per-App Unique Code**: 2,000-3,000 lines
**Code Reuse**: 60-70% shared across family

## Deployment

Each app deploys independently to Vercel:

```bash
# Deploy specific app
cd apps/washing
vercel --prod

# Deploy all apps (CI/CD)
# Push to main branch → auto-deploy via GitHub integration
```

## Environment Variables

Required for each app (set in Vercel Dashboard):

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Documentation

- **Architecture**: See [STRATEGIC_PLAN.md](../GetTheWashingOut/STRATEGIC_PLAN.md)
- **Security**: See [SECURITY_MIGRATION_COMPLETE.md](../GetTheWashingOut/SECURITY_MIGRATION_COMPLETE.md)
- **Individual Apps**: Each app has its own CLAUDE.md with specific details

## Contributing

### Before Committing

1. **Type check**: `npx tsc --noEmit` (must pass)
2. **Test**: `npm run test` (must pass)
3. **Lint**: `npm run lint` (must pass)
4. **Format**: `npm run format` (auto-formats code)

### Coding Standards

- Mobile-first design
- Use design system tokens (no hardcoded colors/spacing)
- Write tests for algorithms (90%+ coverage target)
- Document complex logic with comments
- Keep bundle sizes minimal (<800KB per app)

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Bundle Size | <800KB | Vite build output |
| LCP (First Visit) | <1.8s | Core Web Vitals |
| LCP (Repeat) | <0.4s | Core Web Vitals |
| Test Coverage | >85% | Jest coverage |

## Support

- **Issues**: Report bugs in individual app repositories
- **Discussions**: Use GitHub Discussions for feature requests
- **Documentation**: See CLAUDE.md files in each app

---

**Status**: Phase 1 - Foundation Setup
**Timeline**: 14-week migration plan
**Maintainer**: steel + Claude Code
**License**: MIT
