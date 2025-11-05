/**
 * Performance Monitor
 *
 * Tracks Core Web Vitals and custom performance metrics
 */

import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';
import type { PerformanceConfig, MetricReport } from './types';

export class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: MetricReport[] = [];

  constructor(config: PerformanceConfig) {
    this.config = config;
  }

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    if (!this.config.enabled) {
      return;
    }

    // Core Web Vitals
    onCLS(metric => this.reportMetric('CLS', metric.value));
    onFID(metric => this.reportMetric('FID', metric.value));
    onLCP(metric => this.reportMetric('LCP', metric.value));
    onFCP(metric => this.reportMetric('FCP', metric.value));
    onTTFB(metric => this.reportMetric('TTFB', metric.value));
  }

  /**
   * Report a performance metric
   */
  private reportMetric(name: string, value: number): void {
    const status = this.getMetricStatus(name, value);
    const report: MetricReport = {
      name,
      value,
      status,
      timestamp: Date.now(),
    };

    this.metrics.push(report);

    if (this.config.reportToConsole) {
      const emoji = status === 'good' ? '✅' : status === 'needs-improvement' ? '⚠️' : '❌';
      console.log(
        `${emoji} [${this.config.appName}] ${name}: ${value.toFixed(2)}${this.getUnit(name)} - ${status.toUpperCase()}`
      );
    }

    if (this.config.reportToSentry) {
      this.sendToSentry(report);
    }
  }

  /**
   * Get metric status based on thresholds
   */
  private getMetricStatus(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, { good: number; poor: number }> = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Get unit for metric
   */
  private getUnit(name: string): string {
    if (name === 'CLS') return '';
    return 'ms';
  }

  /**
   * Send metric to Sentry (if available)
   */
  private sendToSentry(report: MetricReport): void {
    // Check if Sentry is available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${report.name}: ${report.value.toFixed(2)}`,
        level: report.status === 'poor' ? 'warning' : 'info',
        data: {
          metric: report.name,
          value: report.value,
          status: report.status,
        },
      });
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): MetricReport[] {
    return [...this.metrics];
  }

  /**
   * Track custom metric
   */
  trackCustomMetric(name: string, value: number): void {
    this.reportMetric(name, value);
  }
}
