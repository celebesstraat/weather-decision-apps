/**
 * Shadow Design Tokens
 * Box shadows for depth and elevation
 */

export const shadows = {
  // Base shadow scale
  none: 'none',

  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',

  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',

  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',

  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',

  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',

  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',

  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

  // Semantic shadows
  card: {
    default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    hover: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    active: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  },

  button: {
    default: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    hover: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    active: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  modal: {
    default: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  dropdown: {
    default: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },

  // Colored shadows (for emphasis)
  colored: {
    primary: {
      sm: '0 1px 2px 0 rgb(14 165 233 / 0.2)',
      md: '0 4px 6px -1px rgb(14 165 233 / 0.2), 0 2px 4px -2px rgb(14 165 233 / 0.2)',
      lg: '0 10px 15px -3px rgb(14 165 233 / 0.2), 0 4px 6px -4px rgb(14 165 233 / 0.2)',
    },
    success: {
      sm: '0 1px 2px 0 rgb(34 197 94 / 0.2)',
      md: '0 4px 6px -1px rgb(34 197 94 / 0.2), 0 2px 4px -2px rgb(34 197 94 / 0.2)',
      lg: '0 10px 15px -3px rgb(34 197 94 / 0.2), 0 4px 6px -4px rgb(34 197 94 / 0.2)',
    },
    warning: {
      sm: '0 1px 2px 0 rgb(245 158 11 / 0.2)',
      md: '0 4px 6px -1px rgb(245 158 11 / 0.2), 0 2px 4px -2px rgb(245 158 11 / 0.2)',
      lg: '0 10px 15px -3px rgb(245 158 11 / 0.2), 0 4px 6px -4px rgb(245 158 11 / 0.2)',
    },
    danger: {
      sm: '0 1px 2px 0 rgb(239 68 68 / 0.2)',
      md: '0 4px 6px -1px rgb(239 68 68 / 0.2), 0 2px 4px -2px rgb(239 68 68 / 0.2)',
      lg: '0 10px 15px -3px rgb(239 68 68 / 0.2), 0 4px 6px -4px rgb(239 68 68 / 0.2)',
    },
  },

  // Glow effects
  glow: {
    primary: '0 0 20px rgb(14 165 233 / 0.4)',
    success: '0 0 20px rgb(34 197 94 / 0.4)',
    warning: '0 0 20px rgb(245 158 11 / 0.4)',
    danger: '0 0 20px rgb(239 68 68 / 0.4)',
  },
} as const;

export type ShadowToken = keyof typeof shadows;
export type CardShadow = keyof typeof shadows.card;
export type ButtonShadow = keyof typeof shadows.button;
