/**
 * Gesture Handler for Mobile Touch Interactions
 * Adds swipe gestures for favorites navigation and weather data
 */

interface SwipeConfig {
  threshold: number; // Minimum distance for swipe
  velocityThreshold: number; // Minimum velocity for swipe
  timeThreshold: number; // Maximum time for swipe
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
  element: HTMLElement;
}

export type SwipeHandler = (event: SwipeEvent) => void;

class GestureHandler {
  private startTouch: TouchPoint | null = null;
  private config: SwipeConfig = {
    threshold: 50, // 50px minimum swipe distance
    velocityThreshold: 0.3, // Pixels per millisecond
    timeThreshold: 300 // 300ms maximum swipe time
  };
  private handlers: Map<HTMLElement, {
    onSwipe?: SwipeHandler;
    onSwipeLeft?: SwipeHandler;
    onSwipeRight?: SwipeHandler;
    onSwipeUp?: SwipeHandler;
    onSwipeDown?: SwipeHandler;
  }> = new Map();

  constructor(config?: Partial<SwipeConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  // Add swipe gesture to an element
  addSwipeGesture(
    element: HTMLElement,
    handlers: {
      onSwipe?: SwipeHandler;
      onSwipeLeft?: SwipeHandler;
      onSwipeRight?: SwipeHandler;
      onSwipeUp?: SwipeHandler;
      onSwipeDown?: SwipeHandler;
    }
  ): void {
    this.handlers.set(element, handlers);
    
    // Add touch event listeners
    element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: true });
    
    // Prevent default touch behaviors that might interfere
    element.style.touchAction = 'pan-y'; // Allow vertical scrolling, prevent horizontal
  }

  // Remove swipe gesture from an element
  removeSwipeGesture(element: HTMLElement): void {
    this.handlers.delete(element);
    element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    element.style.touchAction = '';
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return; // Only handle single touch
    
    const touch = event.touches[0];
    this.startTouch = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (!this.startTouch || event.changedTouches.length !== 1) return;
    
    const touch = event.changedTouches[0];
    const endTouch: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    const swipeEvent = this.analyzeSwipe(this.startTouch, endTouch, event.target as HTMLElement);
    
    if (swipeEvent) {
      this.triggerSwipeHandlers(event.currentTarget as HTMLElement, swipeEvent);
    }
    
    this.startTouch = null;
  }

  private handleTouchCancel(): void {
    this.startTouch = null;
  }

  private analyzeSwipe(start: TouchPoint, end: TouchPoint, element: HTMLElement): SwipeEvent | null {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const duration = end.time - start.time;
    
    // Check if swipe meets time threshold
    if (duration > this.config.timeThreshold) {
      return null;
    }
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / duration;
    
    // Check if swipe meets distance and velocity thresholds
    if (distance < this.config.threshold || velocity < this.config.velocityThreshold) {
      return null;
    }
    
    // Determine swipe direction (favor the axis with greater movement)
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    let direction: 'left' | 'right' | 'up' | 'down';
    
    if (absX > absY) {
      // Horizontal swipe
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      // Vertical swipe
      direction = deltaY > 0 ? 'down' : 'up';
    }
    
    return {
      direction,
      distance,
      velocity,
      duration,
      element
    };
  }

  private triggerSwipeHandlers(element: HTMLElement, swipeEvent: SwipeEvent): void {
    const handlers = this.handlers.get(element);
    if (!handlers) return;
    
    // Trigger general swipe handler
    if (handlers.onSwipe) {
      handlers.onSwipe(swipeEvent);
    }
    
    // Trigger direction-specific handler
    switch (swipeEvent.direction) {
      case 'left':
        handlers.onSwipeLeft?.(swipeEvent);
        break;
      case 'right':
        handlers.onSwipeRight?.(swipeEvent);
        break;
      case 'up':
        handlers.onSwipeUp?.(swipeEvent);
        break;
      case 'down':
        handlers.onSwipeDown?.(swipeEvent);
        break;
    }
  }

  // Helper method to add simple left/right swipe to favorites
  addFavoritesSwipe(
    element: HTMLElement,
    onSwipeLeft: () => void,
    onSwipeRight: () => void
  ): void {
    this.addSwipeGesture(element, {
      onSwipeLeft: () => {
        this.addHapticFeedback('light');
        onSwipeLeft();
      },
      onSwipeRight: () => {
        this.addHapticFeedback('light');
        onSwipeRight();
      }
    });
  }

  // Helper method to add swipe navigation to weather cards
  addWeatherCardSwipe(
    element: HTMLElement,
    onNext: () => void,
    onPrevious: () => void
  ): void {
    this.addSwipeGesture(element, {
      onSwipeLeft: () => {
        this.addHapticFeedback('medium');
        onNext();
      },
      onSwipeRight: () => {
        this.addHapticFeedback('medium');
        onPrevious();
      }
    });
  }

  // Add haptic feedback if available
  private addHapticFeedback(intensity: 'light' | 'medium' | 'heavy'): void {
    if ('vibrate' in navigator) {
      let pattern: number[];
      switch (intensity) {
        case 'light':
          pattern = [50];
          break;
        case 'medium':
          pattern = [100];
          break;
        case 'heavy':
          pattern = [200];
          break;
      }
      navigator.vibrate(pattern);
    }
  }
}

// Export singleton instance
export const gestureHandler = new GestureHandler();
export default gestureHandler;