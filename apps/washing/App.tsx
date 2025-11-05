import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import type { Recommendation, ShortTermForecastItem, Favorite, WeatherData } from './types';
import { RecommendationStatus } from './types';
import { getWashingRecommendation } from './services/weatherService';
import LocationInput from './components/LocationInput';
import Loader from './components/Loader';
import ErrorDisplay from './components/ErrorDisplay';
import MobileShell from './components/MobileShell';
import { getWeatherIcon } from './services/weatherIconService';
import ApiKeyPrompt from './components/ApiKeyPrompt';
import { WeatherCondition } from './types';
import { performanceMonitor } from './utils/performanceMonitor';
import { cacheService } from './services/cacheService';
import { hapticFeedback } from './utils/hapticFeedback';
import HeroDecision from './components/HeroDecision';

// Lazy load non-critical components for better performance
const ForecastTimeline = lazy(() => import('./components/ForecastTimeline'));
const AnimatedBackground = lazy(() => import('./components/AnimatedBackground'));

// Lazy load AI service to reduce initial bundle size
const generateShortTermSummary = lazy(() => 
  import('./services/geminiService').then(module => ({ 
    default: module.generateShortTermSummary 
  }))
);

const App: React.FC = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return <ApiKeyPrompt />;
  }

  const [location, setLocation] = useState<string>('');
  const [locationName, setLocationName] = useState<string>(''); // Geocoded location name
  const [localTime, setLocalTime] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [shortTermForecast, setShortTermForecast] = useState<ShortTermForecastItem[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialState, setInitialState] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isHeroSticky, setIsHeroSticky] = useState<boolean>(false);

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

  const handleLocationSubmit = useCallback(async (newLocation: string) => {
    if (!newLocation.trim()) {
      setError("Please enter a location.");
      hapticFeedback.onError();
      return;
    }


    setLocation(newLocation);
    setLocationName(''); // Clear previous geocoded location name
    setIsLoading(true);
    setError(null);
    setInitialState(false);
    setRecommendation(null);
    setShortTermForecast([]);
    setWeatherData([]);
    setAiSummary('');

    try {
      const result = await getWashingRecommendation(newLocation);
      setRecommendation(result.currentRecommendation);
      setShortTermForecast(result.weeklyForecast);
      setWeatherData(result.weatherData);
      setLocationName(result.locationName); // Set the geocoded location name
      setLocalTime(result.localTime || '');
      setTimezone(result.timezone || '');

      // AI summary generation is now handled by ForecastTimeline component
      // to avoid duplicate calls and improve performance

      // Success haptic feedback
      hapticFeedback.onWeatherUpdate();

    } catch (err) {
      console.error('Weather recommendation error:', err);

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
              <span className="text-sky-600">Get</span>
              <span className="text-slate-700">TheWashing</span>
              <span className="text-sky-600">Out</span>
            </h1>
          </div>

          {/* Welcome message */}
          <div className="text-center px-4 py-4">
            <p className="text-sky-700 text-lg">
              Check if it's a good day to hang your washing outside
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
            <div className="text-center px-6 py-8 bg-sky-50/50 rounded-2xl mx-4 mb-4 border border-sky-200/50">
              <p className="text-2xl font-bold text-slate-800 mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Checking the weather...
              </p>
              <p className="text-lg text-slate-600 mb-6">
                Analyzing humidity, wind patterns, and sunshine
              </p>
              {/* Loading dots - professional messaging style */}
              <div className="flex justify-center items-center gap-3">
                <div className="w-6 h-6 bg-sky-500 rounded-full animate-professional-bounce"></div>
                <div className="w-6 h-6 bg-sky-500 rounded-full animate-professional-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-6 h-6 bg-sky-500 rounded-full animate-professional-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <style>{`
                @keyframes professional-bounce {
                  0%, 60%, 100% {
                    transform: translateY(0);
                    opacity: 1;
                  }
                  30% {
                    transform: translateY(-10px);
                    opacity: 0.7;
                  }
                }
                .animate-professional-bounce {
                  animation: professional-bounce 0.7s ease-in-out infinite;
                }
              `}</style>
            </div>
          )}

          {/* INITIAL STATE - No welcome message needed, location input is self-explanatory */}

          {/* RESULTS STATE - Inside the same container */}
          {!isLoading && !error && !initialState && shortTermForecast.length > 0 && (
            <>
              {/* Hero Decision Section - Rounded sub-panel */}
              <div className="p-4 sm:p-6">
                <HeroDecision
                  recommendation={recommendation}
                  location={locationName || location}
                  localTime={localTime}
                  isLoading={isLoading}
                />
              </div>

              {/* Forecast Section */}
              <div className="p-4 sm:p-6">
                <Suspense fallback={<div className="bg-white/20 rounded-3xl p-6 animate-pulse h-96" />}>
                  <ForecastTimeline
                    forecastData={shortTermForecast}
                    weatherData={weatherData}
                    location={locationName}
                    localTime={localTime}
                  />
                </Suspense>
              </div>
            </>
          )}
        </div>
      </main>
      <footer className="text-center p-4 text-slate-500 text-sm relative z-10">
        <p>&copy; {new Date().getFullYear()} GetTheWashingOut. Never guess about the washing again.</p>
      </footer>
      </div>
    </MobileShell>
  );
};

export default App;