/**
 * Card Component
 * Container component with elevation and hover states
 */

import React, { HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { colors, spacing, shadows, animations } from '../../tokens';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  interactive?: boolean;
  padding?: keyof typeof spacing.component.padding;
  children: ReactNode;
}

const variantStyles = {
  default: {
    backgroundColor: colors.background.primary,
    border: 'none',
    boxShadow: shadows.card.default,
  },
  outlined: {
    backgroundColor: colors.background.primary,
    border: `1px solid ${colors.border.default}`,
    boxShadow: 'none',
  },
  elevated: {
    backgroundColor: colors.background.primary,
    border: 'none',
    boxShadow: shadows.lg,
  },
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  interactive = false,
  padding = 'md',
  children,
  style,
  onAnimationStart,
  onDragStart,
  onDragEnd,
  onDrag,
  ...props
}) => {
  const variantStyle = variantStyles[variant];
  const paddingValue = spacing.component.padding[padding];

  if (interactive) {
    return (
      <motion.div
        whileHover={{ y: -4, boxShadow: shadows.card.hover }}
        whileTap={{ y: 0, boxShadow: shadows.card.active }}
        transition={animations.transitions.spring}
        style={{
          ...variantStyle,
          padding: paddingValue,
          borderRadius: spacing['3'],
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          ...style,
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      style={{
        ...variantStyle,
        padding: paddingValue,
        borderRadius: spacing['3'],
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
