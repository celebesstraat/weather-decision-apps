# @weather-apps/design-system

Shared UI components and design tokens for weather decision apps. This package provides a consistent design language, reusable components, and utilities for building weather-related applications.

## Installation

```bash
npm install @weather-apps/design-system react react-dom framer-motion
```

**Note**: This package requires React 19.1.1+, React DOM 19.1.1+, and Framer Motion 12.0.0+ as peer dependencies.

## Features

- **Design Tokens**: Colors, spacing, typography, animations, shadows, and breakpoints
- **Components**: ErrorBoundary, LoadingSpinner, Button, Card, Badge
- **Hooks**: useHapticFeedback, useMediaQuery, useBreakpoint, and more
- **TypeScript**: Full type definitions included
- **Mobile-first**: Touch-optimized components with haptic feedback
- **Animation**: Framer Motion integration with spring configurations

---

## Design Tokens

### Colors

```typescript
import { colors } from '@weather-apps/design-system';

// Primary colors (sky theme)
colors.primary[600]; // '#0ea5e9'

// Decision-specific colors
colors.decision.yes;   // Green - excellent drying
colors.decision.maybe; // Amber - marginal conditions
colors.decision.no;    // Red - indoor drying

// Semantic colors
colors.text.primary;
colors.background.primary;
colors.border.default;

// Gradients
colors.gradients.sky;     // Sky gradient
colors.gradients.success; // Success gradient
```

### Spacing

```typescript
import { spacing } from '@weather-apps/design-system';

// Base scale (4px increments)
spacing[4];  // '1rem' (16px)
spacing[8];  // '2rem' (32px)

// Semantic spacing
spacing.xs;  // '0.5rem' (8px)
spacing.md;  // '1rem' (16px)
spacing.xl;  // '2rem' (32px)

// Component-specific
spacing.component.padding.md;  // '1rem'
spacing.component.gap.lg;      // '1.5rem'

// Touch targets
spacing.touch.minimum;     // '44px' (iOS minimum)
spacing.touch.comfortable; // '48px'
```

### Typography

```typescript
import { typography } from '@weather-apps/design-system';

// Font families
typography.fontFamily.sans; // Inter, system fonts
typography.fontFamily.mono; // SF Mono, Monaco

// Font sizes
typography.fontSize.base;   // ['1rem', { lineHeight: '1.5rem' }]
typography.fontSize['2xl']; // ['1.5rem', { lineHeight: '2rem' }]

// Semantic typography
typography.heading.h1;   // { fontSize, fontWeight, lineHeight, letterSpacing }
typography.body.regular; // { fontSize, fontWeight, lineHeight }
typography.label.small;  // { fontSize, fontWeight, lineHeight, letterSpacing, textTransform }

// Decision display
typography.decision.hero; // Large YES/MAYBE/NO display
```

### Animations

```typescript
import { animations } from '@weather-apps/design-system';
import { motion } from 'framer-motion';

// Spring configurations
<motion.div transition={animations.spring.default}>
  Content
</motion.div>

// Animation variants
<motion.div
  variants={animations.variants.fadeInUp}
  initial="initial"
  animate="animate"
  exit="exit"
>
  Content
</motion.div>

// Gesture animations
<motion.button whileTap={animations.gestures.tap}>
  Tap Me
</motion.button>

// Loading animations
<motion.div animate={animations.loading.spin}>
  Loading...
</motion.div>
```

### Shadows

```typescript
import { shadows } from '@weather-apps/design-system';

// Base shadows
boxShadow: shadows.md;
boxShadow: shadows.lg;

// Semantic shadows
boxShadow: shadows.card.default;
boxShadow: shadows.card.hover;
boxShadow: shadows.button.default;

// Colored shadows
boxShadow: shadows.colored.primary.md;
boxShadow: shadows.colored.success.lg;

// Glow effects
boxShadow: shadows.glow.primary;
```

### Breakpoints

```typescript
import { breakpoints, mediaQuery } from '@weather-apps/design-system';

// Media query strings
breakpoints.up.md;   // '@media (min-width: 768px)'
breakpoints.down.lg; // '@media (max-width: 1023px)'
breakpoints.only.sm; // '@media (min-width: 640px) and (max-width: 767px)'

// Helper function
const query = mediaQuery('md', 'up'); // '@media (min-width: 768px)'

// Preference queries
breakpoints.prefersDark;          // Dark mode preference
breakpoints.prefersReducedMotion; // Reduced motion preference
breakpoints.touch;                // Touch device detection
```

---

## Components

### ErrorBoundary

Gracefully handles React errors with a fallback UI.

```typescript
import { ErrorBoundary } from '@weather-apps/design-system';

<ErrorBoundary
  fallback={<div>Custom error UI</div>}
  onError={(error, errorInfo) => console.error(error)}
  resetOnPropsChange={[userId]} // Reset when props change
>
  <YourComponent />
</ErrorBoundary>
```

**Props:**
- `fallback?: ReactNode` - Custom error UI (optional)
- `onError?: (error: Error, errorInfo: ErrorInfo) => void` - Error callback
- `resetOnPropsChange?: unknown[]` - Reset error boundary when these values change

### LoadingSpinner

Animated loading indicator with size variants.

```typescript
import { LoadingSpinner } from '@weather-apps/design-system';

<LoadingSpinner
  size="md"
  color={colors.primary[600]}
  label="Loading weather data..."
/>
```

**Props:**
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Spinner size (default: 'md')
- `color?: string` - Spinner color (default: primary blue)
- `label?: string` - Loading label text (optional)

### Button

Primary button with variants, sizes, and states.

```typescript
import { Button } from '@weather-apps/design-system';

<Button
  variant="primary"
  size="md"
  loading={isLoading}
  leftIcon={<Icon />}
  onClick={() => console.log('clicked')}
>
  Get Weather
</Button>
```

**Props:**
- `variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'`
- `size?: 'sm' | 'md' | 'lg'`
- `fullWidth?: boolean` - Stretch to full width
- `loading?: boolean` - Show loading spinner
- `leftIcon?: ReactNode` - Icon before text
- `rightIcon?: ReactNode` - Icon after text
- All standard button HTML attributes

### Card

Container component with elevation and hover states.

```typescript
import { Card } from '@weather-apps/design-system';

<Card
  variant="elevated"
  interactive={true}
  padding="lg"
  onClick={() => console.log('clicked')}
>
  <h3>Weather Forecast</h3>
  <p>Details here...</p>
</Card>
```

**Props:**
- `variant?: 'default' | 'outlined' | 'elevated'`
- `interactive?: boolean` - Enable hover effects and cursor pointer
- `padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'`
- All standard div HTML attributes

### Badge

Status indicator with color variants.

```typescript
import { Badge } from '@weather-apps/design-system';

<Badge
  variant="success"
  size="md"
  rounded={true}
  dot={true}
>
  YES
</Badge>
```

**Props:**
- `variant?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'neutral'`
- `size?: 'sm' | 'md' | 'lg'`
- `rounded?: boolean` - Fully rounded corners
- `dot?: boolean` - Show colored dot indicator
- All standard span HTML attributes

---

## Hooks

### useHapticFeedback

Trigger vibration feedback on mobile devices.

```typescript
import { useHapticFeedback } from '@weather-apps/design-system';

function MyComponent() {
  const haptic = useHapticFeedback();

  const handleClick = () => {
    if (haptic.isSupported) {
      haptic.triggerSuccess(); // Or: light, medium, heavy, warning, error
    }
  };

  return <button onClick={handleClick}>Tap Me</button>;
}
```

**Returns:**
- `isSupported: boolean` - Whether device supports vibration
- `trigger(pattern: HapticPattern): boolean` - Trigger custom pattern
- `triggerLight(): boolean` - Light tap (10ms)
- `triggerMedium(): boolean` - Medium tap (20ms)
- `triggerHeavy(): boolean` - Heavy tap (50ms)
- `triggerSuccess(): boolean` - Success pattern
- `triggerWarning(): boolean` - Warning pattern
- `triggerError(): boolean` - Error pattern
- `cancel(): boolean` - Cancel ongoing vibration

### useMediaQuery

Detect media query matches with SSR support.

```typescript
import { useMediaQuery } from '@weather-apps/design-system';

function MyComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div>
      {isMobile ? 'Mobile View' : 'Desktop View'}
    </div>
  );
}
```

### useBreakpoint

Detect if screen is at or above a breakpoint.

```typescript
import { useBreakpoint } from '@weather-apps/design-system';

function MyComponent() {
  const isLargeScreen = useBreakpoint('lg'); // 1024px+

  return (
    <div>
      {isLargeScreen ? 'Large Screen' : 'Small Screen'}
    </div>
  );
}
```

### useIsMobile / useIsTablet / useIsDesktop

Convenience hooks for common breakpoints.

```typescript
import { useIsMobile, useIsTablet, useIsDesktop } from '@weather-apps/design-system';

function MyComponent() {
  const isMobile = useIsMobile();   // < 768px
  const isTablet = useIsTablet();   // 768px - 1023px
  const isDesktop = useIsDesktop(); // >= 1024px

  if (isMobile) return <MobileLayout />;
  if (isTablet) return <TabletLayout />;
  return <DesktopLayout />;
}
```

### useCurrentBreakpoint

Get current breakpoint name.

```typescript
import { useCurrentBreakpoint } from '@weather-apps/design-system';

function MyComponent() {
  const breakpoint = useCurrentBreakpoint(); // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

  return <div>Current: {breakpoint}</div>;
}
```

### usePrefersDarkMode

Detect user's color scheme preference.

```typescript
import { usePrefersDarkMode } from '@weather-apps/design-system';

function MyComponent() {
  const prefersDark = usePrefersDarkMode();

  return (
    <div style={{ background: prefersDark ? '#000' : '#fff' }}>
      Content
    </div>
  );
}
```

### usePrefersReducedMotion

Detect if user prefers reduced motion (accessibility).

```typescript
import { usePrefersReducedMotion } from '@weather-apps/design-system';

function MyComponent() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.3 }}
    >
      Content
    </motion.div>
  );
}
```

### useIsTouchDevice

Detect if device is touch-enabled.

```typescript
import { useIsTouchDevice } from '@weather-apps/design-system';

function MyComponent() {
  const isTouch = useIsTouchDevice();

  return (
    <div>
      {isTouch ? 'Touch UI' : 'Mouse UI'}
    </div>
  );
}
```

### useOrientation

Detect screen orientation.

```typescript
import { useOrientation } from '@weather-apps/design-system';

function MyComponent() {
  const orientation = useOrientation(); // 'portrait' | 'landscape'

  return <div>Orientation: {orientation}</div>;
}
```

---

## Development

```bash
# Build the package
npm run build

# Watch mode (rebuild on changes)
npm run dev

# Run tests
npm test
npm test -- --watch
npm test -- --coverage

# Type check
npm run typecheck

# Lint code
npm run lint
```

---

## Storybook (Coming Soon)

```bash
# Start Storybook
npm run storybook

# Build Storybook
npm run build-storybook
```

---

## Usage Examples

### Complete Weather Decision Card

```typescript
import {
  Card,
  Badge,
  Button,
  LoadingSpinner,
  colors,
  spacing,
  typography,
  useHapticFeedback,
  useIsMobile,
} from '@weather-apps/design-system';

function WeatherDecisionCard({ decision, loading, onRefresh }) {
  const haptic = useHapticFeedback();
  const isMobile = useIsMobile();

  const handleRefresh = () => {
    haptic.triggerLight();
    onRefresh();
  };

  if (loading) {
    return <LoadingSpinner size="lg" label="Fetching weather..." />;
  }

  return (
    <Card variant="elevated" padding="lg" interactive={false}>
      <Badge
        variant={decision === 'YES' ? 'success' : decision === 'MAYBE' ? 'warning' : 'danger'}
        size="lg"
        rounded
        dot
      >
        {decision}
      </Badge>

      <h2 style={{
        ...typography.heading.h2,
        color: colors.text.primary,
        marginTop: spacing['4'],
      }}>
        {decision === 'YES' ? 'Perfect drying weather!' : 'Consider indoor drying'}
      </h2>

      <Button
        variant="primary"
        size={isMobile ? 'lg' : 'md'}
        fullWidth={isMobile}
        onClick={handleRefresh}
        style={{ marginTop: spacing['4'] }}
      >
        Refresh Weather
      </Button>
    </Card>
  );
}
```

### Responsive Layout

```typescript
import {
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  spacing,
} from '@weather-apps/design-system';

function ResponsiveLayout({ children }) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  return (
    <div style={{
      padding: isMobile ? spacing['4'] : isTablet ? spacing['6'] : spacing['8'],
      maxWidth: isDesktop ? '1200px' : '100%',
      margin: '0 auto',
    }}>
      {children}
    </div>
  );
}
```

---

## TypeScript

All components, hooks, and tokens are fully typed. Import types as needed:

```typescript
import type {
  ColorToken,
  SpacingToken,
  ButtonProps,
  BadgeProps,
  Breakpoint,
  HapticPattern,
} from '@weather-apps/design-system';
```

---

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 12+
- Android Chrome 80+
- React 19.1.1+

---

## License

MIT

---

## Contributing

This is a monorepo package. To contribute:

1. Make changes in `/packages/design-system/src/`
2. Run tests: `npm test`
3. Build: `npm run build`
4. Update version in `package.json`
5. Commit and push

---

## Changelog

### 1.0.0 (2025-01-05)

- Initial release
- Design tokens: colors, spacing, typography, animations, shadows, breakpoints
- Components: ErrorBoundary, LoadingSpinner, Button, Card, Badge
- Hooks: useHapticFeedback, useMediaQuery, useBreakpoint, and utilities
- TypeScript support
- Framer Motion integration
- Mobile-first design
