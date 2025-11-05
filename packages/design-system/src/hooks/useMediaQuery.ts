/**
 * useMediaQuery Hook
 * Responsive breakpoint detection with SSR support
 */

import { useState, useEffect } from 'react';
import { breakpoints, type Breakpoint } from '../tokens/breakpoints';

/**
 * Hook to detect media query matches
 * @param query - Media query string (e.g., '(min-width: 768px)')
 * @returns Boolean indicating if the query matches
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Legacy browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
};

/**
 * Hook to detect if screen is at or above a breakpoint
 * @param breakpoint - Breakpoint name ('sm', 'md', 'lg', etc.)
 * @returns Boolean indicating if screen is at or above the breakpoint
 */
export const useBreakpoint = (breakpoint: Breakpoint): boolean => {
  return useMediaQuery(breakpoints.up[breakpoint]);
};

/**
 * Hook to detect if screen is mobile (below 'md' breakpoint)
 * @returns Boolean indicating if screen is mobile
 */
export const useIsMobile = (): boolean => {
  return !useBreakpoint('md');
};

/**
 * Hook to detect if screen is tablet (between 'md' and 'lg')
 * @returns Boolean indicating if screen is tablet
 */
export const useIsTablet = (): boolean => {
  const isMd = useBreakpoint('md');
  const isLg = useBreakpoint('lg');
  return isMd && !isLg;
};

/**
 * Hook to detect if screen is desktop (at or above 'lg')
 * @returns Boolean indicating if screen is desktop
 */
export const useIsDesktop = (): boolean => {
  return useBreakpoint('lg');
};

/**
 * Hook to detect current breakpoint
 * @returns Current breakpoint name
 */
export const useCurrentBreakpoint = (): Breakpoint => {
  const is2xl = useBreakpoint('2xl');
  const isXl = useBreakpoint('xl');
  const isLg = useBreakpoint('lg');
  const isMd = useBreakpoint('md');
  const isSm = useBreakpoint('sm');

  if (is2xl) return '2xl';
  if (isXl) return 'xl';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  if (isSm) return 'sm';
  return 'xs';
};

/**
 * Hook to detect if user prefers dark mode
 * @returns Boolean indicating if user prefers dark mode
 */
export const usePrefersDarkMode = (): boolean => {
  return useMediaQuery(breakpoints.prefersDark);
};

/**
 * Hook to detect if user prefers reduced motion
 * @returns Boolean indicating if user prefers reduced motion
 */
export const usePrefersReducedMotion = (): boolean => {
  return useMediaQuery(breakpoints.prefersReducedMotion);
};

/**
 * Hook to detect if device is touch-enabled
 * @returns Boolean indicating if device is touch-enabled
 */
export const useIsTouchDevice = (): boolean => {
  return useMediaQuery(breakpoints.touch);
};

/**
 * Hook to detect screen orientation
 * @returns 'portrait' | 'landscape'
 */
export const useOrientation = (): 'portrait' | 'landscape' => {
  const isLandscape = useMediaQuery(breakpoints.landscape);
  return isLandscape ? 'landscape' : 'portrait';
};

export default useMediaQuery;
