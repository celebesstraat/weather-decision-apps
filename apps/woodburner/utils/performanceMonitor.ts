/**
 * Performance Monitoring Utility for Core Web Vitals
 * Tracks key performance metrics for mobile PWA optimization
 */

interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  init(): void {
    // Only initialize in browser environment
    if (typeof window === 'undefined') return;

    this.measureTTFB();
    this.measureFCP();
    this.measureLCP();
    this.measureFID();
    this.measureCLS();

    // Report metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => this.reportMetrics(), 1000);
    });

    // Report metrics when user leaves the page
    window.addEventListener('beforeunload', () => {
      this.reportMetrics();
    });
  }

  private measureTTFB(): void {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      this.metrics.ttfb = navigationEntry.responseStart - navigationEntry.fetchStart;
    }
  }

  private measureFCP(): void {
    try {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
            observer.disconnect();
            break;
          }
        }
      });
      
      observer.observe({ type: 'paint', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FCP measurement not supported:', error);
    }
  }

  private measureLCP(): void {
    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(observer);

      // Stop observing after 10 seconds or when the page is hidden
      setTimeout(() => observer.disconnect(), 10000);
      
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          observer.disconnect();
        }
      });
    } catch (error) {
      console.warn('LCP measurement not supported:', error);
    }
  }

  private measureFID(): void {
    try {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // Only report if the page wasn't hidden prior to the first input
          if (entry.startTime < this.getFirstHiddenTime()) {
            // Type assertion for PerformanceEventTiming
            const eventEntry = entry as any; // PerformanceEventTiming
            this.metrics.fid = eventEntry.processingStart - entry.startTime;
            observer.disconnect();
            break;
          }
        }
      });

      observer.observe({ type: 'first-input', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FID measurement not supported:', error);
    }
  }

  private measureCLS(): void {
    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: PerformanceEntry[] = [];

    try {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // Only count layout shifts without recent user input
          if (!(entry as any).hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            // If the entry occurred less than 1 second after the previous entry
            // and less than 5 seconds after the first entry in the session,
            // include the entry in the current session. Otherwise, start a new session.
            if (sessionValue &&
                entry.startTime - lastSessionEntry.startTime < 1000 &&
                entry.startTime - firstSessionEntry.startTime < 5000) {
              sessionValue += (entry as any).value;
              sessionEntries.push(entry);
            } else {
              sessionValue = (entry as any).value;
              sessionEntries = [entry];
            }

            // If the current session value is larger than the current CLS value,
            // update CLS and the entries contributing to it.
            if (sessionValue > clsValue) {
              clsValue = sessionValue;
            }
          }
        }
        
        this.metrics.cls = clsValue;
      });

      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('CLS measurement not supported:', error);
    }
  }

  private getFirstHiddenTime(): number {
    // Check if the page was hidden before the first paint
    if (document.visibilityState === 'hidden') {
      return 0;
    }

    // Find the first visibilitychange event where the page became hidden
    let firstHiddenTime = Infinity;
    
    document.addEventListener('visibilitychange', (event) => {
      if (document.visibilityState === 'hidden' && firstHiddenTime === Infinity) {
        firstHiddenTime = event.timeStamp;
      }
    }, { once: true });

    return firstHiddenTime;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  private reportMetrics(): void {
    const metrics = this.getMetrics();
    
    console.group('🚀 Performance Metrics');
    console.log('📊 Core Web Vitals:');
    
    if (metrics.lcp) {
      const lcpScore = metrics.lcp <= 2500 ? '🟢 Good' : metrics.lcp <= 4000 ? '🟡 Needs Improvement' : '🔴 Poor';
      console.log(`  LCP (Largest Contentful Paint): ${Math.round(metrics.lcp)}ms ${lcpScore}`);
    }
    
    if (metrics.fid !== undefined) {
      const fidScore = metrics.fid <= 100 ? '🟢 Good' : metrics.fid <= 300 ? '🟡 Needs Improvement' : '🔴 Poor';
      console.log(`  FID (First Input Delay): ${Math.round(metrics.fid)}ms ${fidScore}`);
    }
    
    if (metrics.cls !== undefined) {
      const clsScore = metrics.cls <= 0.1 ? '🟢 Good' : metrics.cls <= 0.25 ? '🟡 Needs Improvement' : '🔴 Poor';
      console.log(`  CLS (Cumulative Layout Shift): ${metrics.cls.toFixed(3)} ${clsScore}`);
    }
    
    console.log('📈 Additional Metrics:');
    
    if (metrics.fcp) {
      console.log(`  FCP (First Contentful Paint): ${Math.round(metrics.fcp)}ms`);
    }
    
    if (metrics.ttfb) {
      console.log(`  TTFB (Time to First Byte): ${Math.round(metrics.ttfb)}ms`);
    }
    
    console.groupEnd();

    // Could send to analytics service in production
    this.sendToAnalytics(metrics);
  }

  private sendToAnalytics(metrics: PerformanceMetrics): void {
    // In a real application, you would send these metrics to your analytics service
    // For now, we'll just store them locally for development
    if (typeof localStorage !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('performance-metrics') || '[]');
      existing.push({
        timestamp: Date.now(),
        url: window.location.pathname,
        userAgent: navigator.userAgent,
        ...metrics
      });
      
      // Keep only the last 50 measurements
      if (existing.length > 50) {
        existing.splice(0, existing.length - 50);
      }
      
      localStorage.setItem('performance-metrics', JSON.stringify(existing));
    }
  }

  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;