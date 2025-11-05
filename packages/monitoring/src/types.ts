/**
 * Type definitions for monitoring package
 */

export interface PerformanceConfig {
  appName: string;
  enabled: boolean;
  reportToConsole?: boolean;
  reportToSentry?: boolean;
}

export interface ErrorReporterConfig {
  dsn?: string;
  environment: string;
  appName: string;
  release?: string;
  sampleRate?: number;
}

export interface MetricReport {
  name: string;
  value: number;
  status: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}
