import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { HourlyScore, DryingWindow } from '../types';
import { colors, typography, spacing, borderRadius, animations } from '../design/tokens';
import SunriseIcon from './icons/SunriseIcon';
import SunsetIcon from './icons/SunsetIcon';
import WindowMarker from './WindowMarker';

interface DryingQualityMeterProps {
  hourlyScores: HourlyScore[];
  startFromHour?: number; // For "today" view, start from current hour
  currentHour?: number; // Current hour to show indicator
  astronomy?: {
    sunrise: string;
    sunset: string;
    sunriseDecimal: number;
    sunsetDecimal: number;
  };
  compact?: boolean; // Mini preview mode for collapsed cards
  dryingWindows?: DryingWindow[]; // All available drying windows
}

const DryingQualityMeter: React.FC<DryingQualityMeterProps> = ({
  hourlyScores,
  startFromHour,
  currentHour,
  astronomy,
  compact = false,
  dryingWindows = [],
}) => {
  // Filter and prepare data - ALWAYS show full daylight hours
  const visibleScores = useMemo(() => {
    // Guard against undefined hourlyScores
    if (!hourlyScores || !Array.isArray(hourlyScores)) {
      return [];
    }

    let scores = hourlyScores;

    // Filter to daylight hours if astronomy data is available
    if (astronomy) {
      const startHour = Math.floor(astronomy.sunriseDecimal);
      const endHour = Math.floor(astronomy.sunsetDecimal);
      scores = scores.filter(score => score.hour >= startHour && score.hour <= endHour);
    }

    // DO NOT filter from current hour - show the full timeline

    return scores;
  }, [hourlyScores, astronomy]);

  // Determine quality level for each hour
  const getQualityColor = (score: number): string => {
    if (score >= 70) return colors.yes.icon;
    if (score >= 50) return colors.maybe.icon;
    return colors.no.icon;
  };

  const getQualityLabel = (score: number): string => {
    if (score >= 70) return 'Perfect';
    if (score >= 50) return 'OK';
    return 'Poor';
  };

  // Group consecutive hours with same quality
  const qualityBlocks = useMemo(() => {
    const blocks: Array<{
      startHour: number;
      endHour: number;
      quality: 'perfect' | 'ok' | 'poor';
      color: string;
      avgScore: number;
    }> = [];

    let currentBlock: typeof blocks[0] | null = null;

    visibleScores.forEach((score, index) => {
      const hour = score.hour;
      const quality = score.totalScore >= 70 ? 'perfect' : score.totalScore >= 50 ? 'ok' : 'poor';
      const color = getQualityColor(score.totalScore);

      if (!currentBlock || currentBlock.quality !== quality) {
        // Start new block
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          startHour: hour,
          endHour: hour,
          quality,
          color,
          avgScore: score.totalScore,
        };
      } else {
        // Extend current block
        currentBlock.endHour = hour;
        currentBlock.avgScore = (currentBlock.avgScore + score.totalScore) / 2;
      }
    });

    if (currentBlock) blocks.push(currentBlock);
    return blocks;
  }, [visibleScores]);

  // Format hour for display
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    if (hour < 12) return `${hour}am`;
    return `${hour - 12}pm`;
  };

  return (
    <div>
      {/* Title - hide in compact mode */}
      {!compact && (
        <h4
          className="mb-3"
          style={{
            fontSize: typography.h4.size,
            fontWeight: typography.h4.weight,
            fontFamily: typography.h4.family,
            color: colors.text.primary,
          }}
        >
          Drying Quality Timeline
        </h4>
      )}

      {/* Sunrise/Sunset times above timeline - hide in compact mode */}
      {!compact && astronomy && (
        <div className="flex justify-between mb-2 px-2">
          <div className="flex items-center gap-1">
            <SunriseIcon className="w-4 h-4 text-orange-500" />
            <span
              style={{
                fontSize: typography.caption.size,
                fontWeight: typography.label.weight,
                fontFamily: typography.label.family,
                color: colors.text.secondary,
              }}
            >
              {astronomy.sunrise}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span
              style={{
                fontSize: typography.caption.size,
                fontWeight: typography.label.weight,
                fontFamily: typography.label.family,
                color: colors.text.secondary,
              }}
            >
              {astronomy.sunset}
            </span>
            <SunsetIcon className="w-4 h-4 text-orange-700" />
          </div>
        </div>
      )}

      {/* Visual timeline */}
      <div
        className="relative"
        style={{
          height: compact ? '60px' : '120px',
          borderRadius: borderRadius.lg,
          backgroundColor: colors.ui.backgroundAlt,
          overflow: 'hidden',
        }}
      >
        {/* Quality blocks */}
        <div className="flex h-full">
          {qualityBlocks.map((block, index) => {
            const blockWidth = ((block.endHour - block.startHour + 1) / visibleScores.length) * 100;

            return (
              <motion.div
                key={`${block.startHour}-${index}`}
                className="relative group"
                style={{
                  width: `${blockWidth}%`,
                  backgroundColor: block.color,
                  opacity: 0.8,
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: index * 0.1, ...animations.spring.snappy }}
                whileHover={!compact ? { opacity: 1, scaleY: 1.05 } : {}}
              >
                {/* Hover tooltip - hide in compact mode */}
                {!compact && (
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      fontSize: typography.caption.size,
                      fontWeight: typography.label.weight,
                      fontFamily: typography.label.family,
                      padding: spacing.sm,
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div>{formatHour(block.startHour)}-{formatHour(block.endHour + 1)}</div>
                      <div>{getQualityLabel(block.avgScore)}</div>
                      <div>{Math.round(block.avgScore)}%</div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Transition timestamps - show at each color change boundary */}
        {!compact && qualityBlocks.map((block, index) => {
          // Calculate position for start timestamp (except for first block)
          const calculatePosition = (hour: number) => {
            const firstHour = visibleScores[0]?.hour || 0;
            const lastHour = visibleScores[visibleScores.length - 1]?.hour || 23;
            const totalHours = lastHour - firstHour + 1;
            const hoursFromStart = hour - firstHour;
            return (hoursFromStart / totalHours) * 100;
          };

          // Show timestamp at the start of each block (except the first one, which has sunrise)
          if (index > 0) {
            const position = calculatePosition(block.startHour);

            return (
              <motion.div
                key={`timestamp-${block.startHour}-${index}`}
                className="absolute"
                style={{
                  left: `${position}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20,
                  pointerEvents: 'none',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div
                  style={{
                    fontSize: typography.caption.size,
                    fontWeight: typography.label.weight,
                    fontFamily: typography.label.family,
                    color: '#000',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {formatHour(block.startHour)}
                </div>
              </motion.div>
            );
          }
          return null;
        })}

        {/* Window markers - show available drying windows */}
        {!compact && dryingWindows?.map((window, index) => (
          <WindowMarker
            key={`window-${index}`}
            window={window}
            index={index}
            visibleScores={visibleScores}
            compact={compact}
          />
        ))}

        {/* Current time indicator - single black line */}
        {currentHour !== undefined && visibleScores.length > 0 && (() => {
          const firstHour = visibleScores[0]?.hour || 0;
          const lastHour = visibleScores[visibleScores.length - 1]?.hour || 23;

          // Only show if current hour is within visible range
          if (currentHour >= firstHour && currentHour <= lastHour) {
            // Calculate position within the daylight hours
            const totalHours = lastHour - firstHour + 1;
            const hoursFromStart = currentHour - firstHour;
            const position = (hoursFromStart / totalHours) * 100;

            return (
              <div
                className="absolute top-0 bottom-0"
                style={{
                  left: `${position}%`,
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                {/* Single vertical black line */}
                <div
                  style={{
                    width: '2px',
                    height: '100%',
                    backgroundColor: '#000',
                    boxShadow: '0 0 4px rgba(0, 0, 0, 0.5)',
                  }}
                />
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Hour markers - show key times below timeline */}
      {!compact && visibleScores.length > 0 && (
        <div className="flex justify-between mt-2 px-1">
          {(() => {
            const firstHour = visibleScores[0]?.hour || 0;
            const lastHour = visibleScores[visibleScores.length - 1]?.hour || 23;
            const totalHours = lastHour - firstHour + 1;

            // Show hour markers every 2 hours
            const markers = [];
            for (let hour = firstHour; hour <= lastHour; hour += 2) {
              markers.push(
                <span
                  key={hour}
                  style={{
                    fontSize: typography.caption.size,
                    fontWeight: typography.caption.weight,
                    fontFamily: typography.caption.family,
                    color: colors.text.secondary,
                    opacity: 0.6,
                  }}
                >
                  {formatHour(hour)}
                </span>
              );
            }
            return markers;
          })()}
        </div>
      )}

      {/* Legend - hide in compact mode */}
      {!compact && (
        <div className="flex items-center justify-center gap-6 mt-4">
          <LegendItem color={colors.yes.icon} label="Perfect" />
          <LegendItem color={colors.maybe.icon} label="OK" />
          <LegendItem color={colors.no.icon} label="Poor" />
        </div>
      )}
    </div>
  );
};

// Legend item component
const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div
      style={{
        width: '16px',
        height: '16px',
        backgroundColor: color,
        borderRadius: '4px',
      }}
    />
    <span
      style={{
        fontSize: typography.bodySmall.size,
        fontWeight: typography.bodySmall.weight,
        fontFamily: typography.bodySmall.family,
        color: colors.text.secondary,
      }}
    >
      {label}
    </span>
  </div>
);

export default DryingQualityMeter;
