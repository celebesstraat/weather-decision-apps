# @weather-apps/monitoring

Monitoring and observability for the weather-decision app family.

## Features

- **PerformanceMonitor**: Track Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
- **ErrorReporter**: Sentry integration for error tracking
- **Custom Metrics**: Track app-specific performance metrics

## Installation

```bash
npm install @weather-apps/monitoring web-vitals
npm install --save-dev @sentry/react  # Optional
```

## Usage

### Performance Monitoring

```typescript
import { PerformanceMonitor } from '@weather-apps/monitoring';

const perfMonitor = new PerformanceMonitor({
  appName: 'GetTheWashingOut',
  enabled: true,
  reportToConsole: import.meta.env.DEV,
  reportToSentry: import.meta.env.PROD,
});

perfMonitor.initialize();

// Track custom metrics
perfMonitor.trackCustomMetric('weather-api-latency', 450);
perfMonitor.trackCustomMetric('cache-hit-rate', 85);
```

### Error Reporting

```typescript
import { ErrorReporter } from '@weather-apps/monitoring';

const errorReporter = new ErrorReporter({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  appName: 'GetTheWashingOut',
  release: `washing@${import.meta.env.VITE_APP_VERSION}`,
  sampleRate: 0.1, // 10% of transactions
});

await errorReporter.initialize();

// Report errors
try {
  await fetchWeatherData();
} catch (error) {
  errorReporter.reportError(error, {
    location: 'London',
    action: 'fetch-weather',
  });
}

// Report messages
errorReporter.reportMessage('Rate limit exceeded', 'warning');

// Set user context
errorReporter.setUser({
  id: 'user-123',
  email: 'user@example.com',
});
```

### React Integration

```typescript
import { ErrorReporter, PerformanceMonitor } from '@weather-apps/monitoring';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Initialize monitoring
    const perfMonitor = new PerformanceMonitor({
      appName: 'GetTheWashingOut',
      enabled: true,
      reportToConsole: import.meta.env.DEV,
    });
    perfMonitor.initialize();

    const errorReporter = new ErrorReporter({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      appName: 'GetTheWashingOut',
    });
    errorReporter.initialize();
  }, []);

  return <YourApp />;
}
```

## API Reference

### PerformanceMonitor

**Constructor:**
```typescript
new PerformanceMonitor(config: PerformanceConfig)
```

**Methods:**
- `initialize(): void` - Start monitoring Core Web Vitals
- `trackCustomMetric(name: string, value: number): void` - Track custom metric
- `getMetrics(): MetricReport[]` - Get all recorded metrics

### ErrorReporter

**Constructor:**
```typescript
new ErrorReporter(config: ErrorReporterConfig)
```

**Methods:**
- `initialize(): Promise<void>` - Initialize Sentry integration
- `reportError(error: Error, context?: Record<string, any>): void` - Report error
- `reportMessage(message: string, level?: 'info' | 'warning' | 'error'): void` - Report message
- `setUser(user: { id?: string; email?: string; username?: string }): void` - Set user context

## Core Web Vitals Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤2.5s | ≤4.0s | >4.0s |
| FID | ≤100ms | ≤300ms | >300ms |
| CLS | ≤0.1 | ≤0.25 | >0.25 |
| FCP | ≤1.8s | ≤3.0s | >3.0s |
| TTFB | ≤800ms | ≤1.8s | >1.8s |

## License

MIT
