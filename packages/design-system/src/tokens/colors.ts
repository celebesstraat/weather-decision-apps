/**
 * Color Design Tokens
 * Tailwind-compatible color palette for weather decision apps
 */

export const colors = {
  // Primary colors - Sky theme
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  // Secondary colors - Slate for text and UI elements
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Status colors for decisions
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Decision-specific colors
  decision: {
    yes: '#22c55e',      // Green - excellent drying
    maybe: '#f59e0b',    // Amber - marginal conditions
    no: '#ef4444',       // Red - indoor drying
  },

  // Weather condition colors
  weather: {
    sunny: '#fbbf24',
    cloudy: '#94a3b8',
    rainy: '#0ea5e9',
    windy: '#64748b',
    stormy: '#475569',
  },

  // Gradient definitions
  gradients: {
    sky: 'linear-gradient(to bottom, #0ea5e9, #38bdf8)',
    sunset: 'linear-gradient(to bottom, #f59e0b, #f97316)',
    night: 'linear-gradient(to bottom, #1e293b, #0f172a)',
    success: 'linear-gradient(135deg, #22c55e, #16a34a)',
    warning: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    danger: 'linear-gradient(135deg, #f87171, #ef4444)',
  },

  // Semantic colors
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    dark: '#0f172a',
  },

  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#94a3b8',
    inverse: '#ffffff',
    disabled: '#cbd5e1',
  },

  border: {
    default: '#e2e8f0',
    focus: '#0ea5e9',
    error: '#ef4444',
  },

  // Overlay and backdrop
  overlay: {
    light: 'rgba(15, 23, 42, 0.1)',
    medium: 'rgba(15, 23, 42, 0.3)',
    dark: 'rgba(15, 23, 42, 0.6)',
    heavy: 'rgba(15, 23, 42, 0.8)',
  },
} as const;

export type ColorToken = keyof typeof colors;
export type PrimaryColor = keyof typeof colors.primary;
export type SecondaryColor = keyof typeof colors.secondary;
export type DecisionColor = keyof typeof colors.decision;
