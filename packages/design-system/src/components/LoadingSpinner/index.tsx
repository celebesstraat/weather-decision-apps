/**
 * LoadingSpinner Component
 * Animated loading indicator with size variants
 */

import React from 'react';
import { motion } from 'framer-motion';
import { colors, spacing } from '../../tokens';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  label?: string;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = colors.primary[600],
  label,
}) => {
  const spinnerSize = sizeMap[size];
  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 3 : size === 'lg' ? 4 : 4;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing['2'],
      }}
      role="status"
      aria-label={label || 'Loading'}
    >
      <motion.svg
        width={spinnerSize}
        height={spinnerSize}
        viewBox="0 0 50 50"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <motion.circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="90, 150"
          strokeDashoffset="0"
          animate={{
            strokeDasharray: ['90, 150', '60, 150', '90, 150'],
            strokeDashoffset: [0, -35, -124],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.svg>
      {label && (
        <span
          style={{
            color: colors.text.secondary,
            fontSize: size === 'sm' || size === 'md' ? '0.875rem' : '1rem',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
