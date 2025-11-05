/**
 * Type declarations for optional Sentry dependency
 * Sentry is loaded dynamically and only when configured
 */

declare module '@sentry/react' {
  export function init(options: any): void;
  export function replayIntegration(options: any): any;
  export function captureException(error: Error): void;
  export function captureMessage(message: string, level: string): void;
  export function setContext(name: string, context: Record<string, any>): void;
  export function setUser(user: Record<string, any>): void;
}
