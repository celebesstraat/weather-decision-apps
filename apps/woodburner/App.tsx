import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import type { WoodburnerRecommendation } from './types-woodburner';
import { getWoodburnerRecommendation } from './services/woodburnerService';
import LocationInput from './components/LocationInput';
import Loader from './components/Loader';
import ErrorDisplay from './components/ErrorDisplay';
import MobileShell from './components/MobileShell';
import { performanceMonitor } from './utils/performanceMonitor';
import { cacheService } from './services/cacheService';
import { hapticFeedback } from './utils/hapticFeedback';
import HeroDecision from './components/HeroDecision';

// Lazy load non-critical components for better performance
const WoodburnerForecast = lazy(() => import('./components/WoodburnerForecast'));
const AnimatedBackground = lazy(() => import('./components/AnimatedBackground'));

// Lazy load AI service to reduce initial bundle size
const generateShortTermSummary = lazy(() => 
  import('./services/geminiService').then(module => ({ 
    default: module.generateShortTermSummary 
  }))
);

const App: React.FC = () => {
  // API key is now handled server-side via /api/gemini proxy
  // No client-side API key validation needed

  const [location, setLocation] = useState<string>('');
  const [recommendation, setRecommendation] = useState<WoodburnerRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialState, setInitialState] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    // Initialize performance monitoring and caching
    performanceMonitor.init();
    cacheService.init().catch(error =>
      console.warn('Cache initialization failed:', error)
    );

    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      performanceMonitor.cleanup();
    };
  }, []);

  const handleLocationSubmit = useCallback(async (newLocation: string, indoorTemp?: number) => {
    if (!newLocation.trim()) {
      setError("Please enter a location.");
      hapticFeedback.onError();
      return;
    }

    setLocation(newLocation);
    setIsLoading(true);
    setError(null);
    setInitialState(false);
    setRecommendation(null);

    try {
      const result = await getWoodburnerRecommendation(newLocation, indoorTemp);

      // Generate AI advice (import function lazily)
      try {
        const { generateWoodburnerAdvice } = await import('./services/geminiService');
        const aiAdvice = await generateWoodburnerAdvice(result, result.hourlyScores);
        console.log('✅ AI advice generated, length:', aiAdvice.length);
        result.aiAdvice = {
          shortTerm: aiAdvice
        };
        console.log('✅ result.aiAdvice set:', !!result.aiAdvice, 'shortTerm:', !!result.aiAdvice?.shortTerm);
      } catch (aiError) {
        console.warn('AI advice generation failed:', aiError);
        // Continue without AI advice
      }

      console.log('📦 Setting recommendation, aiAdvice exists:', !!result.aiAdvice);
      setRecommendation(result);

      // Success haptic feedback
      hapticFeedback.onWeatherUpdate();

    } catch (err) {
      console.error('Woodburner recommendation error:', err);

      let errorMessage = "An unexpected error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      hapticFeedback.onError();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <MobileShell>
      <div className="font-sans text-slate-800 relative">
        <Suspense fallback={<div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-sky-100" />}>
          <AnimatedBackground recommendation={recommendation} />
        </Suspense>
        <main className="max-w-3xl mx-auto px-2 sm:px-4 py-4 sm:py-8 relative z-10">

        {/* SINGLE UNIFIED PANEL - Always visible */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-sky-200/50 overflow-hidden">
          {/* App Title */}
          <div className="text-center pt-6 px-6">
            <h1 className="text-3xl sm:text-5xl font-black text-slate-800" style={{ fontFamily: 'Nunito, sans-serif' }}>
              <span className="text-orange-600">Get</span>
              <span className="text-slate-700">TheWoodburner</span>
              <span className="text-orange-600">On</span>
            </h1>
          </div>

          {/* Welcome message */}
          <div className="text-center px-4 py-4">
            <p className="text-orange-700 text-lg sm:text-xl">
              Check the best time to light your woodburner
            </p>
          </div>

          {/* Location Input */}
          <div className="px-4 pb-4">
            <LocationInput
              onLocationSubmit={handleLocationSubmit}
              isLoading={isLoading}
              onError={setError}
            />
          </div>

          {error && (
            <div className="px-4 pb-4">
              <ErrorDisplay message={error} />
            </div>
          )}

          {isLoading && (
            <div className="text-center px-6 py-8 bg-orange-50/50 rounded-2xl mx-4 mb-4 border border-orange-200/50">
              <p className="text-xl sm:text-2xl font-bold text-slate-800 mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Analyzing chimney draft conditions...
              </p>
              <p className="text-base sm:text-lg text-slate-600 mb-6">
                Calculating temperature differential, pressure, and wind
              </p>
              {/* Loading dots - larger and bouncier */}
              <div className="flex justify-center items-center gap-4">
                <div className="w-6 h-6 bg-orange-500 rounded-full animate-bouncy"></div>
                <div className="w-6 h-6 bg-orange-500 rounded-full animate-bouncy" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-6 h-6 bg-orange-500 rounded-full animate-bouncy" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          )}

          {/* INITIAL STATE - No welcome message needed, location input is self-explanatory */}

          {/* RESULTS STATE - Inside the same container */}
          {!isLoading && !error && !initialState && recommendation && (
            <>
              {/* AI Advice Section - Prominent placement */}
              {recommendation.aiAdvice && (
                <div className="px-4 sm:px-6 pb-4">
                  {(() => {
                    // Get current status colors to match the Today panel
                    const status = recommendation.dailyForecasts[0]?.status || 'GOOD';
                    let bgColors = 'bg-gradient-to-br from-emerald-100 to-green-100';
                    let borderColor = 'border-emerald-300';

                    if (status === 'EXCELLENT') {
                      bgColors = 'bg-gradient-to-br from-green-100 to-emerald-100';
                      borderColor = 'border-green-300';
                    } else if (status === 'GOOD') {
                      bgColors = 'bg-gradient-to-br from-emerald-100 to-green-100';
                      borderColor = 'border-emerald-300';
                    } else if (status === 'MARGINAL') {
                      bgColors = 'bg-gradient-to-br from-amber-100 to-yellow-100';
                      borderColor = 'border-amber-300';
                    } else if (status === 'POOR') {
                      bgColors = 'bg-gradient-to-br from-orange-100 to-amber-100';
                      borderColor = 'border-orange-300';
                    } else if (status === 'AVOID') {
                      bgColors = 'bg-gradient-to-br from-red-100 to-orange-100';
                      borderColor = 'border-red-300';
                    }

                    // Get current hour conditions for summary
                    const currentHourData = recommendation.hourlyScores.find(hour => {
                      const hourDate = new Date(hour.time);
                      const now = new Date();
                      return hourDate.getHours() === now.getHours() &&
                             hourDate.getDate() === now.getDate();
                    });

                    const currentConditions = currentHourData ? currentHourData.status : status;

                    return (
                      <div className={`${bgColors} rounded-2xl p-5 sm:p-6 border-2 ${borderColor} shadow-lg`}>
                        <div className="flex items-start gap-3">
                          <div className="text-4xl sm:text-3xl">🔥</div>
                          <div className="flex-1">
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">Expert Lighting Advice</h3>
                            <div className="text-slate-700 text-base sm:text-lg leading-relaxed space-y-4">
                              {(() => {
                                const adviceText = recommendation.aiAdvice?.shortTerm;
                                if (!adviceText) return null;

                                console.log("🔥 Full AI advice text:", adviceText);
                                console.log("🔥 Text length:", adviceText?.length);

                                // Split by headers (lines that are section titles) to create sections
                                const lines = adviceText.split('\n');
                                const sections: Array<{ header: string; bullets: string[] }> = [];
                                let currentSection: { header: string; bullets: string[] } | null = null;

                                for (const line of lines) {
                                  const trimmed = line.trim();

                                  // Check if this is a header line
                                  // Headers can be: **text**, or plain text that's all caps or title-like
                                  const isMarkdownHeader = trimmed.startsWith('**') && trimmed.endsWith('**');
                                  const isPlainHeader = !trimmed.startsWith('*') && !trimmed.startsWith('•') &&
                                                       trimmed.length > 0 &&
                                                       (trimmed === trimmed.toUpperCase() ||
                                                        trimmed.includes("Today's Woodburning Conditions") ||
                                                        trimmed.includes("If you need to light your woodburner"));

                                  if (isMarkdownHeader || isPlainHeader) {
                                    // Save previous section if exists
                                    if (currentSection) {
                                      sections.push(currentSection);
                                    }
                                    // Start new section
                                    const headerText = isMarkdownHeader
                                      ? trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '').trim()
                                      : trimmed;
                                    currentSection = { header: headerText, bullets: [] };
                                  } else if (currentSection && (trimmed.startsWith('*') || trimmed.startsWith('•'))) {
                                    // This is a bullet point for the current section
                                    currentSection.bullets.push(trimmed);
                                  }
                                }

                                // Don't forget the last section
                                if (currentSection) {
                                  sections.push(currentSection);
                                }

                                console.log("🔥 Parsed sections:", sections.length);
                                sections.forEach((s, i) => console.log(`🔥 Section ${i}: ${s.header} (${s.bullets.length} bullets)`));

                                return sections;
                              })()?.map((section, idx) => {
                                const headerText = section.header;

                                return (
                                  <div key={idx} className="space-y-2">
                                    <h4 className="font-bold text-slate-900 text-base sm:text-lg">{headerText}</h4>
                                    {section.bullets.length > 0 && (
                                      <ul className="space-y-2 ml-0">
                                        {section.bullets.map((bullet, i) => {
                                          // Remove bullet prefix and any ** markdown formatting
                                          const cleanBullet = bullet
                                            .replace(/^[*•]\s*/, '')  // Remove bullet
                                            .replace(/\*\*/g, '')      // Remove all ** (bold markdown)
                                            .trim();
                                          return (
                                            <li key={i} className="flex items-start gap-2">
                                              <span className="text-orange-600 font-bold flex-shrink-0 text-lg">•</span>
                                              <span className="flex-1">{cleanBullet}</span>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    )}
                                  </div>
                                );
                              })}
                        </div>
                      </div>
                    </div>
                  </div>
                    );
                  })()}
                </div>
              )}

              {/* 3-Day Forecast Section */}
              <div className="p-4 sm:p-6">
                <Suspense fallback={
                  <div className="bg-white/20 rounded-3xl p-6 animate-pulse h-96">
                    <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-24 bg-slate-200 rounded"></div>
                      <div className="h-24 bg-slate-200 rounded"></div>
                      <div className="h-24 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                }>
                  <WoodburnerForecast recommendation={recommendation} />
                </Suspense>
              </div>
            </>
          )}
        </div>
      </main>
      <footer className="text-center p-4 text-slate-500 text-sm relative z-10">
        <p>&copy; {new Date().getFullYear()} GetTheWoodburnerOn. Perfect chimney draft conditions, every time.</p>
      </footer>
      </div>
    </MobileShell>
  );
};

export default App;