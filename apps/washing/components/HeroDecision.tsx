import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecommendationStatus } from '../types';
import type { Recommendation } from '../types';
import { colors, typography, spacing, borderRadius, shadows, animations } from '../design/tokens';

interface HeroDecisionProps {
  recommendation: Recommendation | null;
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
        subtitle: 'Let me check the drying conditions',
        icon: '🌤️',
        colorScheme: colors.maybe,
        statusForCharacter: RecommendationStatus.GET_THE_WASHING_OUT,
      };
    }

    const { status, confidence, dryingWindow } = recommendation;

    // Format time window
    const timeWindow = dryingWindow
      ? `${dryingWindow.startTime} - ${dryingWindow.endTime}`
      : 'Check hourly breakdown below';

    switch (status) {
      case RecommendationStatus.GET_THE_WASHING_OUT:
        const yesConfidenceText = confidence ? ` - ${Math.round(confidence)}% CONFIDENCE` : '';
        return {
          type: 'yes' as const,
          message: `GET THE WASHING OUT TODAY${yesConfidenceText}`,
          subtitle: dryingWindow
            ? `Perfect drying window: ${timeWindow}`
            : `Great conditions for drying today!`,
          icon: '☀️',
          colorScheme: colors.yes,
          statusForCharacter: status,
        };

      case RecommendationStatus.ACCEPTABLE_CONDITIONS:
        const confidenceText = confidence ? ` - ${Math.round(confidence)}% CONFIDENCE` : '';
        return {
          type: 'maybe' as const,
          message: `RISKY DRYING${confidenceText}`,
          subtitle: dryingWindow
            ? `Watch conditions closely: ${timeWindow}`
            : `Conditions are borderline - check timeline carefully`,
          icon: '⚠️',
          colorScheme: colors.maybe,
          statusForCharacter: status,
        };

      case RecommendationStatus.INDOOR_DRYING_ONLY:
        return {
          type: 'no' as const,
          message: 'INDOOR DRYING ONLY TODAY',
          subtitle: '',
          icon: '🏠',
          colorScheme: colors.no,
          statusForCharacter: status,
        };

      default:
        return {
          type: 'neutral' as const,
          message: 'Analyzing...',
          subtitle: 'Checking conditions',
          icon: '🌤️',
          colorScheme: colors.maybe,
          statusForCharacter: RecommendationStatus.GET_THE_WASHING_OUT,
        };
    }
  }, [recommendation]);

  // Weather stats for display
  const weatherStats = useMemo(() => {
    if (!recommendation?.currentConditions) return null;

    const { temperature, humidity, windSpeed } = recommendation.currentConditions;
    return {
      temp: `${Math.round(temperature)}°C`,
      humidity: `${Math.round(humidity)}%`,
      wind: `${Math.round(windSpeed)}km/h`,
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
              <div className="flex justify-center gap-6 mt-4 flex-wrap">
                <WeatherStat
                  icon="🌡️"
                  value={weatherStats.temp}
                  label="Temp"
                  color={decisionConfig.colorScheme.text}
                />
                <WeatherStat
                  icon="💧"
                  value={weatherStats.humidity}
                  label="Humidity"
                  color={decisionConfig.colorScheme.text}
                />
                <WeatherStat
                  icon="💨"
                  value={weatherStats.wind}
                  label="Wind"
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
    <div className="text-2xl mb-1">{icon}</div>
    <div
      style={{
        fontSize: typography.h4.size,
        fontWeight: typography.h4.weight,
        fontFamily: typography.h4.family,
        color: color,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: typography.caption.size,
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
