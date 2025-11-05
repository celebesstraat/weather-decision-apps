import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { DailyFlameCastSummary, FlameCastScore, WoodburnerRecommendation } from '../types-woodburner';
import type { FlameCastStatus } from '../services/algorithm/woodburner-config';
import { colors, typography, spacing, borderRadius, shadows } from '../design/tokens';

interface WoodburnerForecastProps {
  recommendation: WoodburnerRecommendation;
  isLoading?: boolean;
}

// Loading skeleton component
const ForecastSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
    {[1, 2, 3].map((i) => (
      <motion.div
        key={i}
        className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
      >
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="h-4 w-48 bg-slate-200 rounded" />
        <div className="h-3 w-full bg-slate-200 rounded" />
      </motion.div>
    ))}
  </div>
);

const WoodburnerForecast: React.FC<WoodburnerForecastProps> = ({ recommendation, isLoading = false }) => {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [hoveredHour, setHoveredHour] = useState<string | null>(null);
  const todayTimelineRef = useRef<HTMLDivElement>(null);

  // Scroll to current hour when Today panel expands
  useEffect(() => {
    if (expandedDay === 0 && todayTimelineRef.current) {
      // Find the "NOW" hour element
      const nowElement = todayTimelineRef.current.querySelector('[data-is-now="true"]');
      if (nowElement) {
        // Scroll to center the NOW hour
        nowElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [expandedDay]);

  // Show loading skeleton
  if (isLoading) {
    return <ForecastSkeleton />;
  }

  // Status color mapping with hex colors for mini timeline + gradients
  const getStatusColors = (status: FlameCastStatus) => {
    switch (status) {
      case 'EXCELLENT':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-300',
          hex: '#22c55e', // green-500 - vibrant and visible
          gradient: 'from-green-400 to-emerald-500',
          emoji: '🔥'
        };
      case 'GOOD':
        return {
          bg: 'bg-emerald-100',
          text: 'text-emerald-800',
          border: 'border-emerald-300',
          hex: '#10b981', // emerald-500 - bright
          gradient: 'from-emerald-400 to-teal-500',
          emoji: '✅'
        };
      case 'MARGINAL':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-800',
          border: 'border-amber-300',
          hex: '#f59e0b', // amber-500 - strong orange
          gradient: 'from-amber-400 to-orange-500',
          emoji: '⚠️'
        };
      case 'POOR':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-800',
          border: 'border-orange-300',
          hex: '#f97316', // orange-500 - vivid
          gradient: 'from-orange-400 to-red-500',
          emoji: '⏰'
        };
      case 'AVOID':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-300',
          hex: '#ef4444', // red-500 - strong red
          gradient: 'from-red-400 to-rose-600',
          emoji: '❌'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-300',
          hex: '#9ca3af', // gray-400 - visible gray
          gradient: 'from-gray-400 to-slate-500',
          emoji: '❓'
        };
    }
  };

  // Get confidence dots based on window quality
  const getConfidenceDots = (quality: 'excellent' | 'good' | 'marginal') => {
    const dots = quality === 'excellent' ? 5 : quality === 'good' ? 4 : 3;
    return Array(5).fill(0).map((_, i) => i < dots);
  };

  // Get weather icon emoji based on conditions
  const getWeatherEmoji = (dayIndex: number) => {
    const hours = recommendation.hourlyScores.slice(dayIndex * 24, (dayIndex + 1) * 24);
    const avgTemp = hours.reduce((sum, h) => sum + h.outdoorTemp, 0) / hours.length;

    if (avgTemp < 5) return '🥶';
    if (avgTemp < 12) return '🌡️';
    return '☀️';
  };

  // Generate smart suggestion for the day
  const getSmartSuggestion = (day: DailyFlameCastSummary, dayIndex: number) => {
    if (day.status === 'EXCELLENT' || day.status === 'GOOD') {
      if (dayIndex === 0 && day.bestWindow) {
        const startHour = new Date(day.bestWindow.startTime).getHours();
        const now = new Date().getHours();
        if (now < startHour) {
          return `🔥 Prime Time: Light at ${new Date(day.bestWindow.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (now >= startHour && now < new Date(day.bestWindow.endTime).getHours()) {
          return '🔥 Light It Now: Excellent conditions!';
        }
      }
      return day.bestWindow ? '🔥 Great Day for Burning' : '✅ Decent Conditions';
    } else if (day.status === 'MARGINAL') {
      return '⚠️ Marginal: Use dry kindling';
    } else {
      return '❌ Skip Today: Poor conditions';
    }
  };

  // Format hour from ISO string
  const formatHour = (isoTime: string) => {
    const date = new Date(isoTime);
    const hour = date.getHours();
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  // Get current hour for "now" indicator
  const getCurrentHour = () => {
    return new Date().getHours();
  };

  // Check if this hour is the current hour (for "now" indicator)
  const isCurrentHour = (isoTime: string, dayIndex: number) => {
    if (dayIndex !== 0) return false; // Only show on today
    const hourDate = new Date(isoTime);
    const now = new Date();
    return hourDate.getHours() === now.getHours() &&
           hourDate.getDate() === now.getDate();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">3-Day FlameCast Forecast</h2>

      {/* Daily Cards */}
      {recommendation.dailyForecasts.map((day, dayIndex) => {
        const colors = getStatusColors(day.status);
        const isExpanded = expandedDay === dayIndex;
        const allDayHours = recommendation.hourlyScores.slice(dayIndex * 24, (dayIndex + 1) * 24);

        // Filter to only show burning hours: 6am (06:00) to 11pm (23:00)
        // Hours 0-5 are overnight (00:00-05:00), excluded
        const dayHours = allDayHours.filter(hour => {
          const date = new Date(hour.time);
          const hourOfDay = date.getHours();
          return hourOfDay >= 6 && hourOfDay <= 23; // 6am to 11pm only
        });

        const suggestion = getSmartSuggestion(day, dayIndex);
        const weatherEmoji = getWeatherEmoji(dayIndex);

        return (
          <motion.div
            key={day.date}
            className={`rounded-2xl border-3 overflow-hidden shadow-md relative bg-gradient-to-br ${colors.gradient}`}
            style={{
              borderWidth: '3px',
              borderStyle: 'solid',
              borderImage: `linear-gradient(135deg, ${colors.hex}, ${colors.hex}99) 1`,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dayIndex * 0.1 }}
            whileHover={{ scale: 1.01 }}
          >
            {/* Gradient overlay for depth */}
            <div className={`absolute inset-0 ${colors.bg} opacity-95`} />

            {/* Content */}
            <div className="relative">
              {/* Day Header - Minimized Clean Design */}
              <button
                onClick={() => setExpandedDay(isExpanded ? null : dayIndex)}
                className="w-full p-4 sm:p-5 text-left hover:bg-black/5 transition-colors"
              >
                <div className="space-y-3">
                  {/* Top Row: Day Name + Chevron */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{day.dayName}</h3>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </div>

                  {/* Best Window (Primary Info) - Centered */}
                  {day.bestWindow ? (
                    <div className="flex flex-col items-center text-center space-y-1.5 py-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-base sm:text-lg font-bold text-slate-700">
                          Best: {new Date(day.bestWindow.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(day.bestWindow.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-slate-500 font-normal ml-1">({day.bestWindow.durationHours}h)</span>
                        </span>
                      </div>
                      {/* Confidence Dots + Weather Icons */}
                      <div className="flex items-center gap-3">
                        <div className="flex gap-0.5">
                          {getConfidenceDots(day.bestWindow.quality).map((filled, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${filled ? 'bg-slate-700' : 'bg-slate-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm sm:text-base text-slate-600">
                          {weatherEmoji} {day.averageTemp.toFixed(0)}°C
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center p-2">
                      <div className="flex items-center gap-2 p-2 bg-slate-200/50 rounded-lg">
                        <span className="text-base sm:text-lg text-slate-700">
                          ⚠️ No ideal windows today - Burn only if necessary
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Mini FlameCast Timeline (6am-11pm) - Interactive */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base text-slate-500 font-medium">FlameCast Timeline:</span>
                      <span className="text-xs sm:text-sm text-slate-400">06:00 - 23:00</span>
                    </div>
                    <div className="flex gap-0.5 h-4 rounded-md overflow-hidden shadow-sm border border-slate-200">
                      {dayHours.map((hour, hourIdx) => {
                        const hourColors = getStatusColors(hour.status);
                        const isNow = isCurrentHour(hour.time, dayIndex);
                        const isHovered = hoveredHour === hour.time;

                        return (
                          <motion.div
                            key={hour.time}
                            className={`flex-1 transition-all cursor-pointer ${isNow ? 'ring-2 ring-black ring-inset z-10' : ''}`}
                            style={{
                              backgroundColor: hourColors.hex,
                            }}
                            whileHover={{ scale: 1.1, zIndex: 20 }}
                            onHoverStart={() => setHoveredHour(hour.time)}
                            onHoverEnd={() => setHoveredHour(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedDay(dayIndex);
                            }}
                            title={`${formatHour(hour.time)}: ${Math.round(hour.totalScore)} - ${hour.status}`}
                          >
                            {/* Tooltip on hover */}
                            {isHovered && (
                              <motion.div
                                className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-30"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                {formatHour(hour.time)}: {Math.round(hour.totalScore)}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900" />
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subtle "Click for Details" hint */}
                  {!isExpanded && (
                    <motion.div
                      className="flex items-center justify-center gap-1 text-sm text-slate-400 pt-1"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    >
                      <span>Tap timeline or anywhere for hourly details</span>
                    </motion.div>
                  )}
              </div>
            </button>

              {/* Hourly Timeline (Expanded) */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t-2 border-slate-200 bg-white/30"
                >
                <div className="p-4 overflow-x-auto" ref={dayIndex === 0 ? todayTimelineRef : null}>
                  <div className="flex gap-2 min-w-max pb-2 relative">
                    {dayHours.map((hour, hourIndex) => {
                      const hourColors = getStatusColors(hour.status);
                      const isSuitable = hour.suitable;
                      const isNow = isCurrentHour(hour.time, dayIndex);

                      return (
                        <div key={hour.time} className="relative" data-is-now={isNow ? 'true' : 'false'}>
                          {/* Current time indicator - black vertical bar */}
                          {isNow && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-black z-10 rounded-full shadow-lg">
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-0.5 rounded whitespace-nowrap font-bold">
                                NOW
                              </div>
                            </div>
                          )}

                          <div
                            className={`
                              flex-shrink-0 w-20 sm:w-24 rounded-lg p-2.5 text-center
                              ${hourColors.bg} ${hourColors.border} border-2
                              ${isSuitable ? 'ring-2 ring-green-500' : ''}
                              ${isNow ? 'ring-4 ring-black shadow-2xl' : ''}
                            `}
                          >
                            <div className="text-sm font-bold text-slate-600 mb-1">{formatHour(hour.time)}</div>
                            <div className={`text-xl sm:text-2xl font-bold ${hourColors.text} mb-1`}>{Math.round(hour.totalScore)}</div>
                            <div className="text-sm text-slate-600">
                              ΔT: {hour.temperatureDifferential.toFixed(1)}°
                            </div>
                            <div className="text-sm text-slate-500 mt-1">
                              {hour.outdoorTemp.toFixed(0)}°C
                            </div>
                            {hour.isInversion && (
                              <div className="text-base text-red-600 font-bold mt-1">⚠️</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Warnings */}
                {day.warnings.length > 0 && (
                  <div className="p-4 bg-amber-50 border-t-2 border-amber-200">
                    <div className="text-base sm:text-lg font-bold text-amber-900 mb-2">⚠️ Warnings:</div>
                    <ul className="text-base text-amber-800 space-y-1">
                      {day.warnings.map((warning, i) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Legend */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="text-base sm:text-lg font-bold text-slate-700 mb-3">FlameCast Status Guide</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-green-500"></div>
            <span>Excellent (75-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-emerald-500"></div>
            <span>Good (60-74)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-amber-500"></div>
            <span>Marginal (45-59)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-orange-500"></div>
            <span>Poor (30-44)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-red-500"></div>
            <span>Avoid (0-29)</span>
          </div>
        </div>
        <div className="mt-3 text-sm text-slate-600">
          <strong>ΔT</strong> = Temperature Differential (Indoor - Outdoor). Higher = better draft.<br/>
          <strong>Timeline shows 06:00-23:00</strong> (burning hours only, overnight excluded).
        </div>
      </div>
    </div>
  );
};

export default WoodburnerForecast;
