/**
 * ErrorBoundary Component
 * React error boundary for graceful error handling
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { colors, typography, spacing, shadows } from '../../tokens';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error boundary when specified props change
    if (this.state.hasError && this.props.resetOnPropsChange) {
      const hasChanged = this.props.resetOnPropsChange.some(
        (prop, index) => prop !== prevProps.resetOnPropsChange?.[index]
      );
      if (hasChanged) {
        this.setState({ hasError: false, error: null });
      }
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: spacing['6'],
            textAlign: 'center',
            backgroundColor: colors.background.secondary,
            borderRadius: spacing['3'],
            boxShadow: shadows.card.default,
          }}
        >
          <div
            style={{
              fontSize: '3rem',
              marginBottom: spacing['4'],
            }}
          >
            ⚠️
          </div>
          <h2
            style={{
              ...typography.heading.h3,
              color: colors.text.primary,
              marginBottom: spacing['2'],
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              ...typography.body.regular,
              color: colors.text.secondary,
              marginBottom: spacing['4'],
              maxWidth: '500px',
            }}
          >
            We're sorry for the inconvenience. Please try refreshing the page or contact support if the problem persists.
          </p>
          {this.state.error && process.env.NODE_ENV === 'development' && (
            <details
              style={{
                marginBottom: spacing['4'],
                padding: spacing['4'],
                backgroundColor: colors.background.primary,
                borderRadius: spacing['2'],
                maxWidth: '600px',
                textAlign: 'left',
                fontSize: typography.fontSize.sm[0],
                fontFamily: typography.fontFamily.mono,
                color: colors.danger[600],
                overflowX: 'auto',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  marginBottom: spacing['2'],
                  fontWeight: typography.fontWeight.semibold,
                }}
              >
                Error Details
              </summary>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {this.state.error.toString()}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReset}
            style={{
              padding: `${spacing['3']} ${spacing['6']}`,
              backgroundColor: colors.primary[600],
              color: colors.text.inverse,
              border: 'none',
              borderRadius: spacing['2'],
              fontSize: typography.fontSize.base[0],
              fontWeight: typography.fontWeight.medium,
              cursor: 'pointer',
              boxShadow: shadows.button.default,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary[700];
              e.currentTarget.style.boxShadow = shadows.button.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary[600];
              e.currentTarget.style.boxShadow = shadows.button.default;
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
