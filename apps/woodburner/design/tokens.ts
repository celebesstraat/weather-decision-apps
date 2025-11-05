/**
 * Design System Tokens for GetTheWashingOut
 *
 * Central source of truth for all design values.
 * Use these tokens throughout the app for consistency.
 */

export const colors = {
  // Decision States (with gradients for modern feel)
  yes: {
    bg: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    bgSolid: '#E8F5E9',
    bgHover: 'linear-gradient(135deg, #C8E6C9 0%, #A5D6A7 100%)',
    text: '#2E7D32',
    textSecondary: '#388E3C',
    icon: '#4CAF50',
    border: 'rgba(46, 125, 50, 0.2)',
  },
  maybe: {
    bg: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
    bgSolid: '#FFF8E1',
    bgHover: 'linear-gradient(135deg, #FFECB3 0%, #FFE082 100%)',
    text: '#F57C00',
    textSecondary: '#EF6C00',
    icon: '#FFA726',
    border: 'rgba(245, 124, 0, 0.2)',
  },
  no: {
    bg: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
    bgSolid: '#FFEBEE',
    bgHover: 'linear-gradient(135deg, #FFCDD2 0%, #EF9A9A 100%)',
    text: '#C62828',
    textSecondary: '#D32F2F',
    icon: '#EF5350',
    border: 'rgba(198, 40, 40, 0.2)',
  },

  // Glassmorphism
  glass: {
    light: 'rgba(255, 255, 255, 0.75)',
    medium: 'rgba(255, 255, 255, 0.85)',
    dark: 'rgba(255, 255, 255, 0.95)',
    border: 'rgba(255, 255, 255, 0.5)',
    borderStrong: 'rgba(255, 255, 255, 0.8)',
  },

  // Text hierarchy
  text: {
    primary: '#1E293B',
    secondary: '#64748B',
    tertiary: '#94A3B8',
    disabled: '#CBD5E1',
    inverse: '#FFFFFF',
  },

  // UI elements
  ui: {
    background: '#F8FAFC',
    backgroundAlt: '#F1F5F9',
    border: '#E2E8F0',
    borderHover: '#CBD5E1',
    shadow: 'rgba(15, 23, 42, 0.08)',
    shadowHover: 'rgba(15, 23, 42, 0.16)',
  },

  // Brand colors
  brand: {
    primary: '#0EA5E9', // Sky blue (for buttons, links)
    primaryHover: '#0284C7',
    secondary: '#06B6D4', // Cyan
    secondaryHover: '#0891B2',
  },

  // Status colors (for non-drying contexts)
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
};

export const spacing = {
  xxs: '2px',
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px',
  xxxxl: '96px',
};

export const typography = {
  // Hero (main decision)
  hero: {
    size: 'clamp(40px, 8vw, 72px)',
    sizeSmall: 'clamp(32px, 6vw, 56px)', // For smaller hero contexts
    weight: 900,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    family: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  // Headings
  h1: {
    size: 'clamp(32px, 5vw, 48px)',
    weight: 800,
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
    family: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  h2: {
    size: 'clamp(24px, 4vw, 36px)',
    weight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
    family: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  h3: {
    size: 'clamp(20px, 3.5vw, 28px)',
    weight: 700,
    lineHeight: 1.3,
    family: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  h4: {
    size: 'clamp(18px, 3vw, 24px)',
    weight: 600,
    lineHeight: 1.4,
    family: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  // Body text
  body: {
    size: 'clamp(16px, 2vw, 18px)',
    weight: 500,
    lineHeight: 1.6,
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  bodySmall: {
    size: 'clamp(14px, 1.8vw, 16px)',
    weight: 500,
    lineHeight: 1.5,
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  caption: {
    size: 'clamp(12px, 1.5vw, 14px)',
    weight: 500,
    lineHeight: 1.4,
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  // Special
  label: {
    size: 'clamp(12px, 1.5vw, 14px)',
    weight: 600,
    lineHeight: 1.4,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
};

export const borderRadius = {
  none: '0',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(15, 23, 42, 0.05)',
  md: '0 4px 6px rgba(15, 23, 42, 0.08)',
  lg: '0 8px 16px rgba(15, 23, 42, 0.1)',
  xl: '0 12px 24px rgba(15, 23, 42, 0.12)',
  xxl: '0 24px 48px rgba(15, 23, 42, 0.16)',

  // Special glassmorphism shadow
  glass: '0 8px 32px rgba(15, 23, 42, 0.08)',
  glassHover: '0 12px 48px rgba(15, 23, 42, 0.12)',
};

export const animations = {
  // Durations
  duration: {
    instant: '100ms',
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
    verySlow: '1000ms',
  },

  // Easing curves (matching framer-motion)
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy spring
  },

  // Framer Motion variants (ready-to-use)
  variants: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    slideDown: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
    },
  },

  // Spring configs for framer-motion
  spring: {
    gentle: { type: 'spring' as const, stiffness: 200, damping: 20 },
    bouncy: { type: 'spring' as const, stiffness: 300, damping: 15 },
    snappy: { type: 'spring' as const, stiffness: 400, damping: 25 },
  },
};

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  xxl: '1536px',
};

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1200,
  popover: 1300,
  toast: 1400,
  tooltip: 1500,
};

/**
 * Helper function to get decision colors based on status
 */
export const getDecisionColors = (status: 'yes' | 'maybe' | 'no') => {
  return colors[status];
};

/**
 * Helper to create backdrop blur CSS
 */
export const backdropBlur = (amount: 'sm' | 'md' | 'lg' | 'xl' = 'md') => {
  const blurAmounts = {
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '40px',
  };
  return `blur(${blurAmounts[amount]}) saturate(180%)`;
};
