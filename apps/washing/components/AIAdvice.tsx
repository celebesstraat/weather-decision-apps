import React from 'react';
import { motion } from 'framer-motion';
import { RecommendationStatus } from '../types';
import { colors, typography, spacing, animations } from '../design/tokens';

interface AIAdviceProps {
  advice: string;
  isLoading?: boolean;
  status?: RecommendationStatus;
}

const AIAdvice: React.FC<AIAdviceProps> = ({
  advice,
  isLoading = false,
  status = RecommendationStatus.GET_THE_WASHING_OUT,
}) => {
  // Determine color scheme based on status
  const getColorScheme = () => {
    switch (status) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={animations.spring.gentle}
      style={{ padding: spacing.md }}
    >
      {/* AI Advice Panel */}
      <div
        style={{
          position: 'relative',
          background: colorScheme.bgSolid,
          borderRadius: '12px',
          padding: '16px 20px',
          border: `2px solid ${colorScheme.border}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Header */}
        <div
          style={{
            fontSize: typography.bodySmall.size,
            fontWeight: typography.h3.weight,
            fontFamily: typography.h4.family,
            color: colorScheme.icon,
            marginBottom: spacing.xs,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          <span>🤖</span>
          <span>AI Drying Advice</span>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3">
            <motion.div
              className="w-4 h-4 border-3 rounded-full"
              style={{
                borderColor: `${colorScheme.icon} transparent ${colorScheme.icon} transparent`,
                borderStyle: 'solid',
                borderWidth: '2px',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p
              style={{
                fontSize: typography.body.size,
                fontWeight: typography.body.weight,
                fontFamily: typography.body.family,
                color: colorScheme.text,
              }}
            >
              Analyzing the weather...
            </p>
          </div>
        ) : (
          <p
            style={{
              fontSize: typography.h4.size,
              fontWeight: typography.body.weight,
              fontFamily: typography.body.family,
              lineHeight: '1.6',
              color: colorScheme.text,
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}
          >
            {advice}
          </p>
        )}

        {/* Footer */}
        {!isLoading && (
          <div
            className="mt-2 text-right"
            style={{
              fontSize: typography.caption.size,
              color: colorScheme.textSecondary,
              opacity: 0.7,
            }}
          >
            Powered by AI
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AIAdvice;
