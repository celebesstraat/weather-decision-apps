import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ShortTermForecastItem, WeatherData } from '../types';
import UnifiedDayCard from './UnifiedDayCard';
import AIAdvice from './AIAdvice';
import { colors, typography, spacing, borderRadius, shadows, animations } from '../design/tokens';
import { generateComprehensiveDryingAdvice } from '../services/geminiService';

interface ForecastTimelineProps {
  forecastData: ShortTermForecastItem[];
  weatherData: WeatherData[];
  location: string;
  localTime?: string;
}

const ForecastTimeline: React.FC<ForecastTimelineProps> = ({
  forecastData,
  weatherData,
  location,
  localTime,
}) => {
  // Parse current hour from localTime string (format: "HH:MM")
  const currentLocalHour = useMemo(() => {
    if (!localTime) return undefined;
    const hourMatch = localTime.match(/^(\d{1,2}):/);
    if (!hourMatch) return undefined;
    return parseInt(hourMatch[1], 10);
  }, [localTime]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastFetchedCacheKey = useRef<string>('');

  // Create a stable cache key to prevent duplicate AI calls on re-renders
  const cacheKey = useMemo(() => {
    if (!weatherData || weatherData.length === 0 || !forecastData || forecastData.length === 0) return '';
    // Use location + first timestamp as unique identifier
    // Safe access with optional chaining to prevent crashes
    const firstTime = weatherData[0]?.hourly?.[0]?.time || 'unknown';
    return `${location}_${firstTime}_${forecastData.length}`;
  }, [weatherData, forecastData, location]);

  // Generate AI advice when data loads (only once per unique dataset)
  useEffect(() => {
    if (!cacheKey) return; // No data yet
    if (lastFetchedCacheKey.current === cacheKey) return; // Already fetched for this data

    const fetchAdvice = async () => {
      lastFetchedCacheKey.current = cacheKey; // Mark as fetching
      setIsLoadingAdvice(true);
      try {
        const todayData = weatherData[0];
        const currentTime = new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const sunset = todayData.astronomy?.sunset || "20:00";
        const dryingWindow = todayData.recommendation?.dryingWindow;

        // Filter to ONLY daylight hours for AI advice - no point mentioning 4am in winter!
        const astronomy = todayData.astronomy;
        const startHour = astronomy ? Math.floor(astronomy.sunriseDecimal) : 6;
        const endHour = astronomy ? Math.floor(astronomy.sunsetDecimal) : 20;

        const hourlyWithScores = todayData.hourly
          .map((h, idx) => ({
            time: h.time,
            temperature: h.temperature,
            humidity: h.humidity,
            rainChance: h.rainChance,
            windSpeed: h.windSpeed,
            uvIndex: h.uvIndex,
            dewPoint: h.dewPoint,
            dryingScore: todayData.hourlyScores[idx]?.totalScore || 0,
            suitable: todayData.hourlyScores[idx]?.suitable || false,
            hour: idx // Add hour index for filtering
          }))
          .filter(h => h.hour >= startHour && h.hour <= endHour); // Only daylight hours

        // Single comprehensive AI call (replaces 2 separate calls for better speed)
        const advice = await generateComprehensiveDryingAdvice(
          hourlyWithScores,
          dryingWindow,
          forecastData,
          currentTime,
          sunset
        );
        setAiAdvice(advice);
      } catch (error) {
        console.error('Failed to generate AI advice:', error);
        setAiAdvice('Weather advice temporarily unavailable.');
      } finally {
        setIsLoadingAdvice(false);
      }
    };

    fetchAdvice();
  }, [cacheKey]); // Only re-run when cache key changes (new location/data)

  const handleToggleExpand = (index: number) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
      // Scroll to expanded card on mobile
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const card = scrollContainerRef.current.children[index] as HTMLElement;
          card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        }
      }, 100);
    }
  };

  return (
    <motion.div
      layout
      style={{
        overflow: 'hidden',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={animations.spring.gentle}
    >
      {/* AI Advice Panel - Always visible at top */}
      <AIAdvice
        advice={aiAdvice}
        isLoading={isLoadingAdvice}
        status={forecastData[0]?.washingStatus}
      />

      {/* Divider */}
      <div
        style={{
          height: '1px',
          backgroundColor: colors.ui.border,
        }}
      />

      {/* Main content area */}
      <div style={{ padding: spacing.lg }}>
        {/* Daily Breakdown Section */}
        <h3
          className="mb-3"
          style={{
            fontSize: typography.h3.size,
            fontWeight: typography.h3.weight,
            fontFamily: typography.h3.family,
            color: colors.text.primary,
          }}
        >
          3-Day Drying Quality Forecast
        </h3>

        <div
          ref={scrollContainerRef}
          className="grid gap-3"
          style={{
            gridTemplateColumns: expandedIndex !== null
              ? '1fr'
              : 'repeat(3, 1fr)',
          }}
        >
          {expandedIndex !== null ? (
            // Show only expanded card
            <UnifiedDayCard
              key={forecastData[expandedIndex].day}
              item={forecastData[expandedIndex]}
              weatherData={weatherData[expandedIndex]}
              isExpanded={true}
              onToggle={() => handleToggleExpand(expandedIndex)}
              isToday={expandedIndex === 0}
              currentLocalHour={expandedIndex === 0 ? currentLocalHour : undefined}
            />
          ) : (
            // Show all 3 cards in collapsed state
            forecastData.map((item, index) => (
              <UnifiedDayCard
                key={item.day}
                item={item}
                weatherData={weatherData[index]}
                isExpanded={false}
                onToggle={() => handleToggleExpand(index)}
                isToday={index === 0}
                currentLocalHour={index === 0 ? currentLocalHour : undefined}
              />
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ForecastTimeline;
