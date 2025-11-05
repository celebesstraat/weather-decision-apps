import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WoodburnerRecommendation } from '../types-woodburner';
import type { FlameCastStatus } from '../services/algorithm/woodburner-config';
import { colors, typography, spacing, borderRadius, shadows, animations } from '../design/tokens';

interface HeroDecisionProps {
  recommendation: WoodburnerRecommendation | null;
  location: string;
  localTime?: string;
  isLoading?: boolean;
}

const HeroDecision: React.FC<HeroDecisionProps> = ({
  recommendation,
  location,
  localTime,
  isLoading = false,
}) => {
  // Determine decision type and styling
  const decisionConfig = useMemo(() => {
    if (!recommendation) {
      return {
        type: 'neutral' as const,
        message: 'Enter your location',
        subtitle: 'Let me check the burning conditions',
        icon: '🔥',
        colorScheme: colors.maybe,
        statusValue: 'MARGINAL' as FlameCastStatus,
      };
    }

    const { status, timeWindow, burningWindow } = recommendation;

    // Format time window
    const windowDisplay = timeWindow !== 'Current' && timeWindow !== 'None'
      ? `Best window: ${timeWindow}`
      : burningWindow
      ? `${burningWindow.quality.charAt(0).toUpperCase() + burningWindow.quality.slice(1)} conditions for ${burningWindow.durationHours}h`
      : '';

    switch (status) {
      case 'EXCELLENT':
        return {
          type: 'yes' as const,
          message: 'LIGHT THE STOVE NOW!',
          subtitle: `Perfect conditions - ΔT: ${recommendation.currentConditions.deltaT.toFixed(1)}°C`,
          icon: '🔥',
          colorScheme: colors.yes,
          statusValue: status,
        };

      case 'GOOD':
        return {
          type: 'yes' as const,
          message: 'GOOD TIME TO BURN',
          subtitle: windowDisplay || `Good draft expected - ${recommendation.reason}`,
          icon: '✓',
          colorScheme: colors.yes,
          statusValue: status,
        };

      case 'MARGINAL':
        return {
          type: 'maybe' as const,
          message: 'TAKE PRECAUTIONS',
          subtitle: windowDisplay || 'Pre-warm chimney, use dry kindling',
          icon: '⚠️',
          colorScheme: colors.maybe,
          statusValue: status,
        };

      case 'POOR':
        return {
          type: 'no' as const,
          message: 'NOT RECOMMENDED',
          subtitle: windowDisplay || 'Difficult ignition, expect smoking',
          icon: '✗',
          colorScheme: colors.no,
          statusValue: status,
        };

      case 'AVOID':
        return {
          type: 'no' as const,
          message: 'DO NOT LIGHT',
          subtitle: recommendation.warnings[0] ? 'Critical conditions - see warnings below' : 'Backdraft risk',
          icon: '✗✗',
          colorScheme: colors.no,
          statusValue: status,
        };

      default:
        return {
          type: 'neutral' as const,
          message: 'Analyzing...',
          subtitle: 'Checking conditions',
          icon: '🔥',
          colorScheme: colors.maybe,
          statusValue: 'MARGINAL' as FlameCastStatus,
        };
    }
  }, [recommendation]);

  // Weather stats for display
  const weatherStats = useMemo(() => {
    if (!recommendation?.currentConditions) return null;

    const { temperature, indoorTemp, deltaT, pressure, humidity } = recommendation.currentConditions;
    return {
      outdoor: `${Math.round(temperature)}°C`,
      indoor: `${Math.round(indoorTemp)}°C`,
      deltaT: `ΔT: ${deltaT.toFixed(1)}°C`,
      pressure: `${Math.round(pressure)}mb`,
      humidity: `${Math.round(humidity)}%`,
    };
  }, [recommendation]);

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: decisionConfig.colorScheme.bg,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={animations.spring.gentle}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 30% 50%, ${decisionConfig.colorScheme.icon}, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="relative z-10 p-6 sm:p-8 md:p-12">
        {/* Main decision message */}
        <AnimatePresence mode="wait">
          <motion.div
            key={decisionConfig.message}
            className="text-center"
            variants={animations.variants.scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={animations.spring.snappy}
          >
            <h1
              style={{
                fontSize: typography.hero.size,
                fontWeight: typography.hero.weight,
                lineHeight: typography.hero.lineHeight,
                letterSpacing: typography.hero.letterSpacing,
                fontFamily: typography.hero.family,
                color: decisionConfig.colorScheme.text,
                marginBottom: spacing.sm,
              }}
            >
              {isLoading ? 'ANALYZING...' : decisionConfig.message}
            </h1>

            <p
              style={{
                fontSize: typography.h4.size,
                fontWeight: typography.body.weight,
                lineHeight: typography.body.lineHeight,
                fontFamily: typography.body.family,
                color: decisionConfig.colorScheme.textSecondary,
                marginBottom: spacing.lg,
              }}
            >
              {isLoading ? 'Checking weather data' : decisionConfig.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Location and weather stats */}
        {!isLoading && location && (
          <motion.div
            className="text-center space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Location */}
            <div
              style={{
                fontSize: typography.h4.size,
                fontWeight: typography.h4.weight,
                fontFamily: typography.h4.family,
                color: decisionConfig.colorScheme.text,
              }}
            >
              📍 {location}
            </div>

            {/* Local time */}
            {localTime && (
              <div
                style={{
                  fontSize: typography.bodySmall.size,
                  fontWeight: typography.bodySmall.weight,
                  fontFamily: typography.bodySmall.family,
                  color: decisionConfig.colorScheme.textSecondary,
                  opacity: 0.8,
                }}
              >
                Local time: {localTime}
              </div>
            )}

            {/* Weather stats row */}
            {weatherStats && (
              <div className="flex justify-center gap-4 mt-4 flex-wrap">
                <WeatherStat
                  icon="🏠"
                  value={weatherStats.indoor}
                  label="Indoor"
                  color={decisionConfig.colorScheme.text}
                />
                <WeatherStat
                  icon="🌡️"
                  value={weatherStats.outdoor}
                  label="Outdoor"
                  color={decisionConfig.colorScheme.text}
                />
                <WeatherStat
                  icon="↕️"
                  value={weatherStats.deltaT}
                  label="Differential"
                  color={decisionConfig.colorScheme.text}
                />
                <WeatherStat
                  icon="⏱️"
                  value={weatherStats.pressure}
                  label="Pressure"
                  color={decisionConfig.colorScheme.text}
                />
                <WeatherStat
                  icon="💧"
                  value={weatherStats.humidity}
                  label="Humidity"
                  color={decisionConfig.colorScheme.text}
                />
              </div>
            )}
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

// Weather stat mini component
const WeatherStat: React.FC<{
  icon: string;
  value: string;
  label: string;
  color: string;
}> = ({ icon, value, label, color }) => (
  <div className="flex flex-col items-center">
    <div className="text-3xl sm:text-2xl mb-1">{icon}</div>
    <div
      style={{
        fontSize: 'clamp(20px, 4vw, 24px)', // Larger on mobile
        fontWeight: typography.h4.weight,
        fontFamily: typography.h4.family,
        color: color,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: 'clamp(13px, 2vw, 14px)', // Slightly larger on mobile
        fontWeight: typography.caption.weight,
        fontFamily: typography.caption.family,
        color: color,
        opacity: 0.7,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {label}
    </div>
  </div>
);

export default HeroDecision;
