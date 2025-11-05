/**
 * Typography Design Tokens
 * Font sizes, weights, line heights, and letter spacing
 */

export const typography = {
  // Font families
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(', '),
    mono: [
      '"SF Mono"',
      'Monaco',
      '"Cascadia Code"',
      '"Roboto Mono"',
      'Consolas',
      '"Liberation Mono"',
      '"Courier New"',
      'monospace',
    ].join(', '),
  },

  // Font sizes (Tailwind-compatible scale)
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }],       // 72px
    '8xl': ['6rem', { lineHeight: '1' }],         // 96px
    '9xl': ['8rem', { lineHeight: '1' }],         // 128px
  },

  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Semantic typography styles
  heading: {
    h1: {
      fontSize: '3rem',        // 48px
      fontWeight: '700',
      lineHeight: '1.2',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '2.25rem',     // 36px
      fontWeight: '700',
      lineHeight: '1.25',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.875rem',    // 30px
      fontWeight: '600',
      lineHeight: '1.3',
      letterSpacing: '-0.025em',
    },
    h4: {
      fontSize: '1.5rem',      // 24px
      fontWeight: '600',
      lineHeight: '1.4',
      letterSpacing: '0em',
    },
    h5: {
      fontSize: '1.25rem',     // 20px
      fontWeight: '600',
      lineHeight: '1.5',
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1.125rem',    // 18px
      fontWeight: '600',
      lineHeight: '1.5',
      letterSpacing: '0em',
    },
  },

  body: {
    large: {
      fontSize: '1.125rem',    // 18px
      fontWeight: '400',
      lineHeight: '1.75',
    },
    regular: {
      fontSize: '1rem',        // 16px
      fontWeight: '400',
      lineHeight: '1.5',
    },
    small: {
      fontSize: '0.875rem',    // 14px
      fontWeight: '400',
      lineHeight: '1.5',
    },
    tiny: {
      fontSize: '0.75rem',     // 12px
      fontWeight: '400',
      lineHeight: '1.5',
    },
  },

  label: {
    large: {
      fontSize: '0.875rem',    // 14px
      fontWeight: '500',
      lineHeight: '1.25',
      letterSpacing: '0.025em',
      textTransform: 'uppercase' as const,
    },
    regular: {
      fontSize: '0.75rem',     // 12px
      fontWeight: '500',
      lineHeight: '1.25',
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
    },
    small: {
      fontSize: '0.625rem',    // 10px
      fontWeight: '500',
      lineHeight: '1.25',
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
    },
  },

  // Decision display typography (for YES/MAYBE/NO)
  decision: {
    hero: {
      fontSize: '6rem',        // 96px
      fontWeight: '900',
      lineHeight: '1',
      letterSpacing: '-0.05em',
    },
    large: {
      fontSize: '4.5rem',      // 72px
      fontWeight: '800',
      lineHeight: '1',
      letterSpacing: '-0.025em',
    },
  },
} as const;

export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type LineHeight = keyof typeof typography.lineHeight;
export type LetterSpacing = keyof typeof typography.letterSpacing;
