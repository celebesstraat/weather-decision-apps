import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { DryingWindow, HourlyScore } from '../types';
import { colors, typography, spacing, animations } from '../design/tokens';

interface WindowMarkerProps {
  window: DryingWindow;
  index: number;
  visibleScores: HourlyScore[];
  compact?: boolean;
}

const WindowMarker: React.FC<WindowMarkerProps> = ({
  window,
  index,
  visibleScores,
  compact = false,
}) => {
  // Parse time strings to hour numbers
  const parseHour = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours;
  };

  // Calculate position and width
  const position = useMemo(() => {
    if (visibleScores.length === 0) return null;

    const startHour = parseHour(window.startTime);
    const endHour = parseHour(window.endTime);
    const firstVisibleHour = visibleScores[0]?.hour || 0;
    const lastVisibleHour = visibleScores[visibleScores.length - 1]?.hour || 23;
    const totalVisibleHours = lastVisibleHour - firstVisibleHour + 1;

    // Calculate left position (where window starts)
    const hoursFromStart = startHour - firstVisibleHour;
    const leftPercent = (hoursFromStart / totalVisibleHours) * 100;

    // Calculate width (window duration)
    const windowDuration = endHour - startHour;
    const widthPercent = (windowDuration / totalVisibleHours) * 100;

    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${Math.min(100 - leftPercent, widthPercent)}%`,
    };
  }, [window, visibleScores]);

  if (!position || compact) return null;

  // Primary window gets gold, alternatives get white/gray
  const isPrimary = index === 0;
  const borderColor = isPrimary ? '#FFD700' : 'rgba(255, 255, 255, 0.6)';
  const borderWidth = isPrimary ? '3px' : '2px';

  // Badge colors
  const badgeBg = isPrimary ? '#FFD700' : 'rgba(255, 255, 255, 0.9)';
  const badgeText = isPrimary ? '#000' : '#666';

  return (
    <motion.div
      className="absolute"
      style={{
        left: position.left,
        width: position.width,
        top: 0,
        bottom: 0,
        borderTop: `${borderWidth} solid ${borderColor}`,
        borderBottom: `${borderWidth} solid ${borderColor}`,
        pointerEvents: 'none',
        zIndex: 5,
      }}
      initial={{ opacity: 0, scaleX: 0.8 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ delay: 0.5 + index * 0.15, ...animations.spring.snappy }}
    >
      {/* Window number badge */}
      <motion.div
        className="absolute"
        style={{
          left: '4px',
          top: '4px',
          backgroundColor: badgeBg,
          color: badgeText,
          fontSize: typography.caption.size,
          fontWeight: typography.label.weight,
          fontFamily: typography.label.family,
          padding: '2px 6px',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7 + index * 0.15, type: 'spring', stiffness: 300 }}
        whileHover={{ scale: 1.1 }}
        title={`Window #${index + 1}: ${window.startTime}-${window.endTime}, ${Math.round(window.averageScore)}% ${window.description}`}
      >
        {isPrimary ? '🥇' : index === 1 ? '🥈' : '🥉'}
      </motion.div>
    </motion.div>
  );
};

export default WindowMarker;
