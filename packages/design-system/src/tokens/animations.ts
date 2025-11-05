/**
 * Animation Design Tokens
 * Animation timings, easings, and spring configurations for Framer Motion
 */

export const animations = {
  // Duration values (in seconds)
  duration: {
    instant: 0,
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    slower: 0.75,
    slowest: 1.0,
  },

  // Easing functions (CSS)
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Custom easing curves
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },

  // Framer Motion spring configurations
  spring: {
    // Gentle spring (default)
    default: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
      mass: 1,
    },

    // Quick response
    quick: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 40,
      mass: 1,
    },

    // Bouncy spring
    bouncy: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 20,
      mass: 1,
    },

    // Smooth spring (less oscillation)
    smooth: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 30,
      mass: 1,
    },

    // Slow and smooth
    slow: {
      type: 'spring' as const,
      stiffness: 150,
      damping: 25,
      mass: 1,
    },

    // Stiff and responsive
    stiff: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 40,
      mass: 1,
    },
  },

  // Tween configurations (non-spring)
  tween: {
    fast: {
      type: 'tween' as const,
      duration: 0.15,
      ease: 'easeOut' as const,
    },
    normal: {
      type: 'tween' as const,
      duration: 0.3,
      ease: 'easeInOut' as const,
    },
    slow: {
      type: 'tween' as const,
      duration: 0.5,
      ease: 'easeInOut' as const,
    },
  },

  // Common animation variants
  variants: {
    // Fade animations
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },

    fadeInUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },

    fadeInDown: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },

    // Scale animations
    scaleIn: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 },
    },

    scaleUp: {
      initial: { scale: 0.95 },
      animate: { scale: 1 },
      exit: { scale: 0.95 },
    },

    // Slide animations
    slideInLeft: {
      initial: { x: -20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -20, opacity: 0 },
    },

    slideInRight: {
      initial: { x: 20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 20, opacity: 0 },
    },

    // Stagger children
    staggerContainer: {
      animate: {
        transition: {
          staggerChildren: 0.1,
        },
      },
    },

    staggerItem: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
    },
  },

  // Gesture animations (tap, hover, etc.)
  gestures: {
    tap: {
      scale: 0.95,
      transition: { duration: 0.1 },
    },

    hover: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },

    press: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  },

  // Transition presets
  transitions: {
    // Default transition
    default: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },

    // Fast transition
    fast: {
      duration: 0.15,
      ease: [0, 0, 0.2, 1],
    },

    // Slow transition
    slow: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },

    // Spring-based
    spring: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },

  // Loading animations
  loading: {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },

    spin: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },

    bounce: {
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
} as const;

export type AnimationDuration = keyof typeof animations.duration;
export type AnimationEasing = keyof typeof animations.easing;
export type SpringConfig = keyof typeof animations.spring;
export type AnimationVariant = keyof typeof animations.variants;
