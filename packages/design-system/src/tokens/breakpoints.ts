/**
 * Breakpoint Design Tokens
 * Responsive breakpoints for mobile-first design
 */

export const breakpoints = {
  // Pixel values
  values: {
    xs: 0,       // Extra small (phones)
    sm: 640,     // Small (large phones)
    md: 768,     // Medium (tablets)
    lg: 1024,    // Large (laptops)
    xl: 1280,    // Extra large (desktops)
    '2xl': 1536, // 2X extra large (large desktops)
  },

  // Media query strings
  up: {
    xs: '@media (min-width: 0px)',
    sm: '@media (min-width: 640px)',
    md: '@media (min-width: 768px)',
    lg: '@media (min-width: 1024px)',
    xl: '@media (min-width: 1280px)',
    '2xl': '@media (min-width: 1536px)',
  },

  down: {
    xs: '@media (max-width: 639px)',
    sm: '@media (max-width: 767px)',
    md: '@media (max-width: 1023px)',
    lg: '@media (max-width: 1279px)',
    xl: '@media (max-width: 1535px)',
  },

  only: {
    xs: '@media (max-width: 639px)',
    sm: '@media (min-width: 640px) and (max-width: 767px)',
    md: '@media (min-width: 768px) and (max-width: 1023px)',
    lg: '@media (min-width: 1024px) and (max-width: 1279px)',
    xl: '@media (min-width: 1280px) and (max-width: 1535px)',
    '2xl': '@media (min-width: 1536px)',
  },

  // Orientation queries
  landscape: '@media (orientation: landscape)',
  portrait: '@media (orientation: portrait)',

  // Touch device query
  touch: '@media (hover: none) and (pointer: coarse)',

  // Mouse device query
  mouse: '@media (hover: hover) and (pointer: fine)',

  // Prefers color scheme
  prefersDark: '@media (prefers-color-scheme: dark)',
  prefersLight: '@media (prefers-color-scheme: light)',

  // Reduced motion
  prefersReducedMotion: '@media (prefers-reduced-motion: reduce)',

  // High contrast
  prefersHighContrast: '@media (prefers-contrast: high)',
} as const;

export type Breakpoint = keyof typeof breakpoints.values;

/**
 * Helper function to create media queries
 * @param breakpoint - The breakpoint to use
 * @param direction - 'up' | 'down' | 'only'
 */
export const mediaQuery = (
  breakpoint: Breakpoint,
  direction: 'up' | 'down' | 'only' = 'up'
): string => {
  const directionQueries = breakpoints[direction] as Record<Breakpoint, string>;
  return directionQueries[breakpoint];
};

/**
 * Helper function to check if screen is mobile
 * @param width - Current window width
 */
export const isMobile = (width: number): boolean => {
  return width < breakpoints.values.md;
};

/**
 * Helper function to check if screen is tablet
 * @param width - Current window width
 */
export const isTablet = (width: number): boolean => {
  return width >= breakpoints.values.md && width < breakpoints.values.lg;
};

/**
 * Helper function to check if screen is desktop
 * @param width - Current window width
 */
export const isDesktop = (width: number): boolean => {
  return width >= breakpoints.values.lg;
};
