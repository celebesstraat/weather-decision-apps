/**
 * Error Reporter
 *
 * Integrates with Sentry for error tracking
 */

import type { ErrorReporterConfig } from './types';

export class ErrorReporter {
  private config: ErrorReporterConfig;
  private initialized = false;

  constructor(config: ErrorReporterConfig) {
    this.config = config;
  }

  /**
   * Initialize error reporting (Sentry)
   */
  async initialize(): Promise<void> {
    if (this.initialized || !this.config.dsn) {
      return;
    }

    try {
      // Dynamic import to avoid bundling Sentry if not needed
      const Sentry = await import('@sentry/react');

      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,

        // Performance monitoring
        tracesSampleRate: this.config.sampleRate || 0.1, // 10% of transactions

        // Session replay
        integrations: [
          Sentry.replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
          }),
        ],
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of errors

        beforeSend(event: any, _hint: any) {
          // Filter out sensitive data
          if (event.request?.headers) {
            delete event.request.headers['Authorization'];
            delete event.request.headers['Cookie'];
          }

          return event;
        },
      });

      this.initialized = true;
      console.log(`[${this.config.appName}] Error reporting initialized`);
    } catch (error) {
      console.warn('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Report an error
   */
  reportError(error: Error, context?: Record<string, any>): void {
    if (!this.initialized) {
      console.error('[ErrorReporter] Error:', error, context);
      return;
    }

    try {
      const Sentry = (window as any).Sentry;
      if (Sentry) {
        if (context) {
          Sentry.setContext('custom', context);
        }
        Sentry.captureException(error);
      }
    } catch (e) {
      console.error('Failed to report error to Sentry:', e);
    }
  }

  /**
   * Report a message
   */
  reportMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.initialized) {
      const consoleMethod = level === 'warning' ? 'warn' : level;
      console[consoleMethod](`[ErrorReporter] ${message}`);
      return;
    }

    try {
      const Sentry = (window as any).Sentry;
      if (Sentry) {
        Sentry.captureMessage(message, level);
      }
    } catch (e) {
      console.error('Failed to report message to Sentry:', e);
    }
  }

  /**
   * Set user context
   */
  setUser(user: { id?: string; email?: string; username?: string }): void {
    if (!this.initialized) {
      return;
    }

    try {
      const Sentry = (window as any).Sentry;
      if (Sentry) {
        Sentry.setUser(user);
      }
    } catch (e) {
      console.error('Failed to set user context:', e);
    }
  }
}
