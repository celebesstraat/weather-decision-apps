/**
 * useHapticFeedback Hook
 * Mobile vibration feedback for interactions
 */

import { useCallback } from 'react';

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 50,
  success: [10, 50, 10],
  warning: [20, 100, 20],
  error: [50, 100, 50, 100, 50],
};

/**
 * Hook for triggering haptic feedback on mobile devices
 * @returns Object with haptic feedback functions
 */
export const useHapticFeedback = () => {
  const isSupported = useCallback(() => {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }, []);

  const trigger = useCallback((pattern: HapticPattern = 'light') => {
    if (!isSupported()) {
      return false;
    }

    try {
      const vibrationPattern = patterns[pattern];
      navigator.vibrate(vibrationPattern);
      return true;
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
      return false;
    }
  }, [isSupported]);

  const triggerLight = useCallback(() => trigger('light'), [trigger]);
  const triggerMedium = useCallback(() => trigger('medium'), [trigger]);
  const triggerHeavy = useCallback(() => trigger('heavy'), [trigger]);
  const triggerSuccess = useCallback(() => trigger('success'), [trigger]);
  const triggerWarning = useCallback(() => trigger('warning'), [trigger]);
  const triggerError = useCallback(() => trigger('error'), [trigger]);

  const cancel = useCallback(() => {
    if (!isSupported()) {
      return false;
    }

    try {
      navigator.vibrate(0);
      return true;
    } catch (error) {
      console.warn('Cancel haptic feedback failed:', error);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported: isSupported(),
    trigger,
    triggerLight,
    triggerMedium,
    triggerHeavy,
    triggerSuccess,
    triggerWarning,
    triggerError,
    cancel,
  };
};

export default useHapticFeedback;
