/**
 * Button Component
 * Primary button with variants and states
 */

import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { colors, spacing, typography, shadows, animations } from '../../tokens';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

const variantStyles = {
  primary: {
    backgroundColor: colors.primary[600],
    color: colors.text.inverse,
    hoverBg: colors.primary[700],
    activeBg: colors.primary[800],
    border: 'none',
  },
  secondary: {
    backgroundColor: colors.secondary[100],
    color: colors.secondary[900],
    hoverBg: colors.secondary[200],
    activeBg: colors.secondary[300],
    border: `1px solid ${colors.border.default}`,
  },
  success: {
    backgroundColor: colors.success[600],
    color: colors.text.inverse,
    hoverBg: colors.success[700],
    activeBg: colors.success[800],
    border: 'none',
  },
  warning: {
    backgroundColor: colors.warning[500],
    color: colors.text.inverse,
    hoverBg: colors.warning[600],
    activeBg: colors.warning[700],
    border: 'none',
  },
  danger: {
    backgroundColor: colors.danger[600],
    color: colors.text.inverse,
    hoverBg: colors.danger[700],
    activeBg: colors.danger[800],
    border: 'none',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colors.primary[600],
    hoverBg: colors.primary[50],
    activeBg: colors.primary[100],
    border: 'none',
  },
};

const sizeStyles = {
  sm: {
    padding: `${spacing['2']} ${spacing['3']}`,
    fontSize: typography.fontSize.sm[0],
    height: '36px',
  },
  md: {
    padding: `${spacing['2.5']} ${spacing['4']}`,
    fontSize: typography.fontSize.base[0],
    height: '44px',
  },
  lg: {
    padding: `${spacing['3']} ${spacing['6']}`,
    fontSize: typography.fontSize.lg[0],
    height: '52px',
  },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  children,
  style,
  onAnimationStart,
  onDragStart,
  onDragEnd,
  onDrag,
  ...props
}) => {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileTap={!isDisabled ? animations.gestures.tap : undefined}
      transition={animations.transitions.fast}
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing['2'],
        width: fullWidth ? '100%' : 'auto',
        height: sizeStyle.height,
        padding: sizeStyle.padding,
        backgroundColor: variantStyle.backgroundColor,
        color: variantStyle.color,
        border: variantStyle.border,
        borderRadius: spacing['2'],
        fontSize: sizeStyle.fontSize,
        fontWeight: typography.fontWeight.medium,
        fontFamily: typography.fontFamily.sans,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        boxShadow: isDisabled ? 'none' : shadows.button.default,
        opacity: isDisabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyle.hoverBg;
          e.currentTarget.style.boxShadow = shadows.button.hover;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyle.backgroundColor;
          e.currentTarget.style.boxShadow = shadows.button.default;
        }
      }}
      onMouseDown={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyle.activeBg;
          e.currentTarget.style.boxShadow = shadows.button.active;
        }
      }}
      onMouseUp={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyle.hoverBg;
          e.currentTarget.style.boxShadow = shadows.button.hover;
        }
      }}
      {...props}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: size === 'sm' ? '14px' : size === 'md' ? '16px' : '18px',
            height: size === 'sm' ? '14px' : size === 'md' ? '16px' : '18px',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="60, 150"
              opacity="0.3"
            />
          </svg>
        </motion.div>
      )}
      {!loading && leftIcon && <span style={{ display: 'flex' }}>{leftIcon}</span>}
      <span>{children}</span>
      {!loading && rightIcon && <span style={{ display: 'flex' }}>{rightIcon}</span>}
    </motion.button>
  );
};

export default Button;
