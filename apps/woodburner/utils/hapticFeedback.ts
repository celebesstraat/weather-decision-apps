/**
 * Haptic Feedback Handler for Enhanced Mobile Experience
 * Provides vibration feedback for user interactions
 */

export interface HapticPattern {
  name: string;
  pattern: number[];
  description: string;
}

class HapticFeedbackHandler {
  private isSupported: boolean = false;
  private isEnabled: boolean = true;

  // Predefined haptic patterns
  private patterns: { [key: string]: HapticPattern } = {
    tap: {
      name: 'tap',
      pattern: [50],
      description: 'Light tap feedback'
    },
    select: {
      name: 'select',
      pattern: [30, 20, 50],
      description: 'Selection confirmation'
    },
    success: {
      name: 'success',
      pattern: [100, 50, 100],
      description: 'Success notification'
    },
    error: {
      name: 'error',
      pattern: [200, 100, 200, 100, 200],
      description: 'Error notification'
    },
    warning: {
      name: 'warning',
      pattern: [150, 75, 150],
      description: 'Warning notification'
    },
    swipe: {
      name: 'swipe',
      pattern: [40],
      description: 'Swipe gesture feedback'
    },
    longPress: {
      name: 'longPress',
      pattern: [80, 40, 120],
      description: 'Long press feedback'
    },
    weatherUpdate: {
      name: 'weatherUpdate',
      pattern: [60, 30, 60, 30, 100],
      description: 'Weather data updated'
    },
    favoriteAdded: {
      name: 'favoriteAdded',
      pattern: [50, 50, 100, 50, 150],
      description: 'Location added to favorites'
    },
    favoriteRemoved: {
      name: 'favoriteRemoved',
      pattern: [100, 100, 100],
      description: 'Location removed from favorites'
    }
  };

  constructor() {
    this.checkSupport();
    this.loadUserPreferences();
  }

  private checkSupport(): void {
    this.isSupported = 'vibrate' in navigator && typeof navigator.vibrate === 'function';
    
    if (!this.isSupported) {
      console.warn('Haptic feedback not supported in this browser/device');
    }
  }

  private loadUserPreferences(): void {
    try {
      const stored = localStorage.getItem('haptic-feedback-enabled');
      if (stored !== null) {
        this.isEnabled = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load haptic preferences:', error);
    }
  }

  // Check if haptic feedback is supported
  isHapticSupported(): boolean {
    return this.isSupported;
  }

  // Check if haptic feedback is currently enabled
  isHapticEnabled(): boolean {
    return this.isEnabled && this.isSupported;
  }

  // Enable/disable haptic feedback
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    try {
      localStorage.setItem('haptic-feedback-enabled', JSON.stringify(enabled));
    } catch (error) {
      console.warn('Failed to save haptic preferences:', error);
    }

    // Provide feedback when enabling
    if (enabled && this.isSupported) {
      this.vibrate('tap');
    }
  }

  // Vibrate with a predefined pattern
  vibrate(patternName: string): boolean {
    if (!this.isHapticEnabled()) {
      return false;
    }

    const pattern = this.patterns[patternName];
    if (!pattern) {
      console.warn(`Haptic pattern '${patternName}' not found`);
      return false;
    }

    try {
      navigator.vibrate(pattern.pattern);
      return true;
    } catch (error) {
      console.error('Haptic feedback failed:', error);
      return false;
    }
  }

  // Vibrate with custom pattern
  vibrateCustom(pattern: number[]): boolean {
    if (!this.isHapticEnabled()) {
      return false;
    }

    try {
      navigator.vibrate(pattern);
      return true;
    } catch (error) {
      console.error('Custom haptic feedback failed:', error);
      return false;
    }
  }

  // Convenience methods for common interactions
  onTap(): void {
    this.vibrate('tap');
  }

  onSelect(): void {
    this.vibrate('select');
  }

  onSuccess(): void {
    this.vibrate('success');
  }

  onError(): void {
    this.vibrate('error');
  }

  onWarning(): void {
    this.vibrate('warning');
  }

  onSwipe(): void {
    this.vibrate('swipe');
  }

  onLongPress(): void {
    this.vibrate('longPress');
  }

  onWeatherUpdate(): void {
    this.vibrate('weatherUpdate');
  }

  onFavoriteAdded(): void {
    this.vibrate('favoriteAdded');
  }

  onFavoriteRemoved(): void {
    this.vibrate('favoriteRemoved');
  }

  // Get all available patterns
  getAvailablePatterns(): HapticPattern[] {
    return Object.values(this.patterns);
  }

  // Add custom pattern
  addCustomPattern(name: string, pattern: number[], description: string): void {
    this.patterns[name] = {
      name,
      pattern,
      description
    };
  }

  // Remove custom pattern
  removeCustomPattern(name: string): boolean {
    if (this.patterns[name]) {
      delete this.patterns[name];
      return true;
    }
    return false;
  }

  // Cancel any ongoing vibration
  cancelVibration(): void {
    if (this.isSupported) {
      navigator.vibrate(0);
    }
  }

  // Test haptic feedback
  testHaptic(patternName: string = 'tap'): void {
    console.log(`Testing haptic pattern: ${patternName}`);
    this.vibrate(patternName);
  }
}

// Export singleton instance
export const hapticFeedback = new HapticFeedbackHandler();
export default hapticFeedback;