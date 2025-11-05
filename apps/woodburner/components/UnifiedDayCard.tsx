import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ShortTermForecastItem, WeatherData } from '../types';
import { RecommendationStatus } from '../types';
import { getWeatherIconWithColor } from '../services/weatherIconService';
import DryingQualityMeter from './DryingQualityMeter';
import { colors, typography, spacing, borderRadius, shadows, animations } from '../design/tokens';

interface UnifiedDayCardProps {
  item: ShortTermForecastItem;
  weatherData: WeatherData;
  isExpanded: boolean;
  onToggle: () => void;
  isToday?: boolean;
  currentLocalHour?: number;
}

const UnifiedDayCard: React.FC<UnifiedDayCardProps> = ({
  item,
  weatherData,
  isExpanded,
  onToggle,
  isToday = false,
  currentLocalHour,
}) => {
  // Use the recommendation status from the weather service algorithm
  // This already considers continuous drying windows, not just averages
  const washingStatus = item.washingStatus;

  // Map RecommendationStatus to color scheme
  const actualQuality: 'yes' | 'maybe' | 'no' =
    washingStatus === RecommendationStatus.GET_THE_WASHING_OUT ? 'yes' :
    washingStatus === RecommendationStatus.ACCEPTABLE_CONDITIONS ? 'maybe' :
    'no';

  // Use actual quality for colors
  const colorScheme = colors[actualQuality];

  // Status label based on recommendation status - unified with hero panel
  const getStatusLabel = () => {
    if (washingStatus === RecommendationStatus.GET_THE_WASHING_OUT) return 'Get The Washing Out!';
    if (washingStatus === RecommendationStatus.ACCEPTABLE_CONDITIONS) return 'Keep Your Eye On It';
    return 'Indoor Drying Only';
  };

  // Get weather stats
  const getWeatherStats = () => {
    if (!weatherData.hourly || weatherData.hourly.length === 0) return null;

    return {
      maxTemp: Math.round(Math.max(...weatherData.hourly.map(h => h.temperature))),
      maxRain: Math.max(...weatherData.hourly.map(h => h.rainChance)),
      maxWind: Math.round(Math.max(...weatherData.hourly.map(h => h.windSpeed))),
      minHumidity: Math.round(Math.min(...weatherData.hourly.map(h => h.humidity))),
    };
  };

  const stats = getWeatherStats();

  return (
    <motion.div
      layout
      className="w-full"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={animations.spring.gentle}
    >
      <motion.div
        layout
        onClick={onToggle}
        className="cursor-pointer h-full"
        style={{
          background: colorScheme.bg,
          borderRadius: borderRadius.xl,
          border: `2px solid ${colorScheme.border}`,
          boxShadow: isExpanded ? shadows.lg : shadows.md,
          padding: spacing.lg,
        }}
        whileHover={{
          scale: isExpanded ? 1 : 1.02,
          boxShadow: shadows.lg,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Collapsed View - Always Visible */}
        <motion.div layout="position">
          {/* Collapsed view - consistent layout for all days */}
          {!isExpanded && (
            <>
              {/* Day label - centered at top */}
              <div className="text-center mb-4">
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
              </div>

              {/* Large prominent drying recommendation panel */}
              <div
                className="text-center py-6 mb-4 rounded-xl"
                style={{
                  backgroundColor: colorScheme.icon,
                }}
              >
                <p
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: typography.h1.weight,
                    fontFamily: typography.h1.family,
                    color: 'white',
                    lineHeight: '1.2',
                  }}
                >
                  {getStatusLabel()}
                </p>
              </div>

              {/* Mini drying quality timeline preview */}
              <div style={{ marginBottom: spacing.md }}>
                <DryingQualityMeter
                  hourlyScores={weatherData.hourlyScores}
                  startFromHour={undefined}
                  currentHour={undefined}
                  astronomy={weatherData.astronomy}
                  compact={true}
                />
              </div>

              {/* Tap for details hint */}
              <div className="text-center mt-4">
                <p
                  style={{
                    fontSize: typography.caption.size,
                    fontWeight: typography.caption.weight,
                    fontFamily: typography.caption.family,
                    color: colorScheme.textSecondary,
                    opacity: 0.7,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Tap for details
                </p>
              </div>
            </>
          )}
        </motion.div>

        {/* Expanded View - Animated */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Day label and status for expanded view */}
                <div className="flex items-center justify-between mb-4">
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

                {/* Divider */}
                <div
                  style={{
                    height: '2px',
                    backgroundColor: colorScheme.border,
                    marginBottom: spacing.md,
                  }}
                />

                {/* Drying Quality Meter */}
                <div style={{ marginBottom: spacing.md }}>
                  <DryingQualityMeter
                    hourlyScores={weatherData.hourlyScores}
                    startFromHour={isToday ? currentLocalHour : undefined}
                    currentHour={isToday ? currentLocalHour : undefined}
                    astronomy={weatherData.astronomy}
                    dryingWindows={item.dryingWindows}
                  />
                </div>

                {/* Alternative Windows List */}
                {item.dryingWindows && item.dryingWindows.length > 1 && (
                  <div style={{ marginBottom: spacing.md }}>
                    <h4
                      style={{
                        fontSize: typography.h4.size,
                        fontWeight: typography.h4.weight,
                        fontFamily: typography.h4.family,
                        color: colorScheme.text,
                        marginBottom: spacing.sm,
                      }}
                    >
                      Available Drying Windows
                    </h4>
                    <div className="space-y-2">
                      {item.dryingWindows.map((window, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: `${colorScheme.text}10`,
                            borderRadius: borderRadius.md,
                            padding: spacing.sm,
                            border: index === 0 ? `2px solid ${colorScheme.icon}` : `1px solid ${colorScheme.border}`,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ fontSize: '16px' }}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                            <span
                              style={{
                                fontSize: typography.body.size,
                                fontWeight: typography.label.weight,
                                fontFamily: typography.body.family,
                                color: colorScheme.text,
                              }}
                            >
                              {window.startTime} - {window.endTime}
                            </span>
                            <span
                              style={{
                                fontSize: typography.bodySmall.size,
                                fontWeight: typography.label.weight,
                                fontFamily: typography.body.family,
                                color: colorScheme.icon,
                                backgroundColor: `${colorScheme.icon}20`,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                marginLeft: 'auto',
                              }}
                            >
                              {Math.round(window.averageScore)}%
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: typography.bodySmall.size,
                              fontWeight: typography.bodySmall.weight,
                              fontFamily: typography.bodySmall.family,
                              color: colorScheme.textSecondary,
                            }}
                          >
                            {window.duration} hours • {window.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weather Stats Grid */}
                {stats && (
                  <>
                    <h4
                      style={{
                        fontSize: typography.h4.size,
                        fontWeight: typography.h4.weight,
                        fontFamily: typography.h4.family,
                        color: colorScheme.text,
                        marginBottom: spacing.sm,
                      }}
                    >
                      Weather Summary
                    </h4>
                    <div
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      }}
                    >
                      <WeatherStat
                        icon="🌡️"
                        label="Max Temp"
                        value={`${stats.maxTemp}°C`}
                        colorScheme={colorScheme}
                      />
                      <WeatherStat
                        icon="🌧️"
                        label="Max Rain"
                        value={`${stats.maxRain}%`}
                        colorScheme={colorScheme}
                      />
                      <WeatherStat
                        icon="💨"
                        label="Max Wind"
                        value={`${stats.maxWind}km/h`}
                        colorScheme={colorScheme}
                      />
                      <WeatherStat
                        icon="💧"
                        label="Min Humidity"
                        value={`${stats.minHumidity}%`}
                        colorScheme={colorScheme}
                      />
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand indicator */}
        <motion.div
          layout
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

// Weather stat component
const WeatherStat: React.FC<{
  icon: string;
  label: string;
  value: string;
  colorScheme: any;
}> = ({ icon, label, value, colorScheme }) => (
  <div
    className="text-center p-2 rounded-lg"
    style={{
      backgroundColor: `${colorScheme.text}10`,
    }}
  >
    <div className="text-xl mb-0.5">{icon}</div>
    <div
      style={{
        fontSize: typography.h4.size,
        fontWeight: typography.h4.weight,
        fontFamily: typography.h4.family,
        color: colorScheme.text,
        marginBottom: '2px',
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: typography.caption.size,
        fontWeight: typography.caption.weight,
        fontFamily: typography.caption.family,
        color: colorScheme.textSecondary,
      }}
    >
      {label}
    </div>
  </div>
);

export default UnifiedDayCard;
