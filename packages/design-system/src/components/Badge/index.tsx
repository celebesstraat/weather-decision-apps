/**
 * Badge Component
 * Status indicator with color variants
 */

import React, { HTMLAttributes, ReactNode } from 'react';
import { colors, spacing, typography } from '../../tokens';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  dot?: boolean;
  children: ReactNode;
}

const variantStyles = {
  primary: {
    backgroundColor: colors.primary[100],
    color: colors.primary[800],
    border: `1px solid ${colors.primary[200]}`,
  },
  success: {
    backgroundColor: colors.success[100],
    color: colors.success[800],
    border: `1px solid ${colors.success[200]}`,
  },
  warning: {
    backgroundColor: colors.warning[100],
    color: colors.warning[800],
    border: `1px solid ${colors.warning[200]}`,
  },
  danger: {
    backgroundColor: colors.danger[100],
    color: colors.danger[800],
    border: `1px solid ${colors.danger[200]}`,
  },
  secondary: {
    backgroundColor: colors.secondary[100],
    color: colors.secondary[800],
    border: `1px solid ${colors.secondary[200]}`,
  },
  neutral: {
    backgroundColor: colors.background.tertiary,
    color: colors.text.secondary,
    border: `1px solid ${colors.border.default}`,
  },
};

const dotColors = {
  primary: colors.primary[600],
  success: colors.success[600],
  warning: colors.warning[500],
  danger: colors.danger[600],
  secondary: colors.secondary[600],
  neutral: colors.secondary[500],
};

const sizeStyles = {
  sm: {
    padding: `${spacing['0.5']} ${spacing['2']}`,
    fontSize: typography.fontSize.xs[0],
    height: '20px',
  },
  md: {
    padding: `${spacing['1']} ${spacing['2.5']}`,
    fontSize: typography.fontSize.sm[0],
    height: '24px',
  },
  lg: {
    padding: `${spacing['1.5']} ${spacing['3']}`,
    fontSize: typography.fontSize.base[0],
    height: '28px',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  rounded = false,
  dot = false,
  children,
  style,
  ...props
}) => {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: dot ? spacing['1.5'] : '0',
        height: sizeStyle.height,
        padding: sizeStyle.padding,
        backgroundColor: variantStyle.backgroundColor,
        color: variantStyle.color,
        border: variantStyle.border,
        borderRadius: rounded ? '9999px' : spacing['1.5'],
        fontSize: sizeStyle.fontSize,
        fontWeight: typography.fontWeight.medium,
        fontFamily: typography.fontFamily.sans,
        lineHeight: '1',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...style,
      }}
      {...props}
    >
      {dot && (
        <span
          style={{
            width: size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px',
            height: size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px',
            borderRadius: '50%',
            backgroundColor: dotColors[variant],
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
