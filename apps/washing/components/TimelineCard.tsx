import React from 'react';
import { motion } from 'framer-motion';
import type { ShortTermForecastItem } from '../types';
import { RecommendationStatus } from '../types';
import { getWeatherIconWithColor } from '../services/weatherIconService';
import { colors, typography, spacing, borderRadius, shadows, animations } from '../design/tokens';

interface TimelineCardProps {
  item: ShortTermForecastItem;
  isExpanded: boolean;
  onToggle: () => void;
  isToday?: boolean;
}

const TimelineCard: React.FC<TimelineCardProps> = ({
  item,
  isExpanded,
  onToggle,
  isToday = false,
}) => {
  // Determine color scheme based on washing status
  const getColorScheme = () => {
    switch (item.washingStatus) {
      case RecommendationStatus.GET_THE_WASHING_OUT:
        return colors.yes;
      case RecommendationStatus.ACCEPTABLE_CONDITIONS:
        return colors.maybe;
      case RecommendationStatus.INDOOR_DRYING_ONLY:
        return colors.no;
      default:
        return colors.maybe;
    }
  };

  const colorScheme = getColorScheme();

  // Status label
  const getStatusLabel = () => {
    switch (item.washingStatus) {
      case RecommendationStatus.GET_THE_WASHING_OUT:
        return 'Perfect';
      case RecommendationStatus.ACCEPTABLE_CONDITIONS:
        return 'Marginal';
      case RecommendationStatus.INDOOR_DRYING_ONLY:
        return 'Indoor Only';
      default:
        return 'Unknown';
    }
  };

  return (
    <motion.div
      layout
      className="snap-start flex-shrink-0"
      style={{
        width: isExpanded ? '100%' : '280px',
        scrollSnapAlign: 'start',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={animations.spring.gentle}
    >
      <motion.div
        onClick={onToggle}
        className="cursor-pointer h-full"
        style={{
          background: colorScheme.bg,
          borderRadius: borderRadius.xl,
          border: `2px solid ${colorScheme.border}`,
          boxShadow: shadows.md,
          padding: spacing.lg,
        }}
        whileHover={{
          scale: 1.02,
          boxShadow: shadows.lg,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Day label */}
        <div className="flex items-center justify-between mb-3">
          <h3
            style={{
              fontSize: typography.h3.size,
              fontWeight: typography.h3.weight,
              fontFamily: typography.h3.family,
              color: colorScheme.text,
            }}
          >
            {isToday ? 'Today' : item.day}
          </h3>

          {/* Status badge */}
          <span
            style={{
              fontSize: typography.caption.size,
              fontWeight: typography.label.weight,
              fontFamily: typography.label.family,
              color: 'white',
              backgroundColor: colorScheme.icon,
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: borderRadius.md,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {getStatusLabel()}
          </span>
        </div>

        {/* Weather icon */}
        <div className="flex justify-center my-4">
          {getWeatherIconWithColor(item.condition, 80, 'w-20 h-20')}
        </div>

        {/* Condition name */}
        <p
          className="text-center mb-4"
          style={{
            fontSize: typography.h4.size,
            fontWeight: typography.h4.weight,
            fontFamily: typography.h4.family,
            color: colorScheme.textSecondary,
          }}
        >
          {item.condition}
        </p>

        {/* Drying window if available */}
        {item.dryingWindow && (
          <div
            className="text-center p-3 rounded-lg"
            style={{
              backgroundColor: `${colorScheme.text}15`,
            }}
          >
            <p
              style={{
                fontSize: typography.bodySmall.size,
                fontWeight: typography.label.weight,
                fontFamily: typography.label.family,
                color: colorScheme.text,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: spacing.xs,
              }}
            >
              Best Window
            </p>
            <p
              style={{
                fontSize: typography.body.size,
                fontWeight: typography.body.weight,
                fontFamily: typography.body.family,
                color: colorScheme.textSecondary,
              }}
            >
              {item.dryingWindow.startTime} - {item.dryingWindow.endTime}
            </p>
          </div>
        )}

        {/* Expand indicator */}
        <motion.div
          className="flex justify-center mt-4"
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={colorScheme.textSecondary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default TimelineCard;
