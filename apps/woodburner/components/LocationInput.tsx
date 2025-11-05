import React, { useState, useEffect } from 'react';
import ArrowRightIcon from './icons/ArrowRightIcon';
import LocationMarkerIcon from './icons/LocationMarkerIcon';
import { getPlacenameFromCoords, validateLocationInput } from '../services/geminiService';
import { sanitizeLocationInput, validateLocationInput as secureValidate, sanitizeCoordinates, locationRateLimiter } from '../utils/inputSanitization';
import { hapticFeedback } from '../utils/hapticFeedback';

interface LocationInputProps {
  onLocationSubmit: (location: string, indoorTemp?: number) => void;
  isLoading: boolean;
  onError: (message: string | null) => void;
}

// Helper function to calculate smart default indoor temperature
const getDefaultIndoorTemp = (): number => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const hour = now.getHours();

  // Determine season
  let season: 'winter' | 'spring' | 'summer' | 'autumn';
  if (month === 12 || month === 1 || month === 2) season = 'winter';
  else if (month >= 3 && month <= 5) season = 'spring';
  else if (month >= 6 && month <= 8) season = 'summer';
  else season = 'autumn';

  // Base temperatures by season and time of day
  const profiles = {
    winter: { morning: 15, day: 17, evening: 18, night: 15 },
    spring: { morning: 16, day: 18, evening: 19, night: 16 },
    summer: { morning: 17, day: 19, evening: 20, night: 17 },
    autumn: { morning: 16, day: 18, evening: 19, night: 16 }
  };

  const profile = profiles[season];

  if (hour >= 6 && hour < 9) return profile.morning;
  if (hour >= 9 && hour < 17) return profile.day;
  if (hour >= 17 && hour < 23) return profile.evening;
  return profile.night;
};

const LocationInput: React.FC<LocationInputProps> = ({ onLocationSubmit, isLoading, onError }) => {
  const [location, setLocation] = useState<string>('');
  const [indoorTemp, setIndoorTemp] = useState<number>(getDefaultIndoorTemp());
  const [isGeolocating, setIsGeolocating] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [invalidInputMessage, setInvalidInputMessage] = useState<string | null>(null);

  useEffect(() => {
    if (invalidInputMessage) {
      const timer = setTimeout(() => {
        setInvalidInputMessage(null);
      }, 3000); // Clear the message after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [invalidInputMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;

    hapticFeedback.onSelect();
    setIsValidating(true);
    onError(null);

    try {
      // DEMO MODE: Allow "demo" or "test" to bypass all validation
      const isDemoMode = location.toLowerCase() === 'demo' || location.toLowerCase() === 'test';

      if (isDemoMode) {
        console.log('🎭 Demo mode detected in LocationInput - bypassing validation');
        onLocationSubmit(location.toLowerCase(), indoorTemp);
        setIsValidating(false);
        return;
      }

      // SECURITY: Rate limiting to prevent abuse
      if (!locationRateLimiter.checkLimit('location-submit')) {
        setInvalidInputMessage("Too many requests. Please wait a moment.");
        hapticFeedback.onError();
        setIsValidating(false);
        return;
      }

      // SECURITY: Sanitize input first to remove dangerous characters
      const sanitized = sanitizeLocationInput(location);

      // SECURITY: Validate the sanitized input
      const securityValidation = secureValidate(sanitized);
      if (!securityValidation.valid) {
        setLocation('');
        setInvalidInputMessage(securityValidation.error || "Invalid location format");
        hapticFeedback.onError();
        setIsValidating(false);
        return;
      }

      // AI-powered validation (optional enhancement)
      const validatedLocation = await validateLocationInput(sanitized);

      if (validatedLocation.toLowerCase() === 'invalid') {
        setLocation('');
        setInvalidInputMessage("Please try a valid location.");
        hapticFeedback.onError();
      } else {
        setLocation(validatedLocation);
        onLocationSubmit(validatedLocation, indoorTemp);
      }
    } catch (error) {
      console.error("Location validation failed:", error);
      // Fallback: use sanitized input if AI validation fails
      const sanitized = sanitizeLocationInput(location);
      const securityValidation = secureValidate(sanitized);
      if (securityValidation.valid) {
        onLocationSubmit(sanitized, indoorTemp);
      } else {
        setInvalidInputMessage("Invalid location format");
        hapticFeedback.onError();
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      onError("Geolocation is not supported by your browser.");
      hapticFeedback.onError();
      return;
    }

    hapticFeedback.onTap();
    setIsGeolocating(true);
    onError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // SECURITY: Sanitize coordinates
          const coords = sanitizeCoordinates(
            position.coords.latitude,
            position.coords.longitude
          );

          if (!coords) {
            onError("Invalid coordinates received from device.");
            hapticFeedback.onError();
            setIsGeolocating(false);
            return;
          }

          const placename = await getPlacenameFromCoords({
            lat: coords.latitude,
            lon: coords.longitude,
          });
          setLocation(placename);
          hapticFeedback.onSuccess();
          onLocationSubmit(placename, indoorTemp);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            onError(`Could not determine placename. ${errorMessage}`);
            hapticFeedback.onWarning();

            // Fallback: use sanitized coordinates
            const coords = sanitizeCoordinates(
              position.coords.latitude,
              position.coords.longitude
            );

            if (coords) {
              const newLocation = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
              setLocation(newLocation);
              onLocationSubmit(newLocation, indoorTemp);
            } else {
              onError("Invalid coordinates received from device.");
              hapticFeedback.onError();
            }
        } finally {
            setIsGeolocating(false);
        }
      },
      (error: GeolocationPositionError) => {
        console.error("Error getting user location:", `(Code: ${error.code}) ${error.message}`);
        
        let userMessage: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            userMessage = "Location access denied. Please enable location services in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            userMessage = "Location information is unavailable. Please try again or enter your location manually.";
            break;
          case error.TIMEOUT:
            userMessage = "The request to get user location timed out. Please try again.";
            break;
          default:
            userMessage = "An unknown error occurred while trying to get your location.";
            break;
        }
        
        onError(userMessage);
        hapticFeedback.onError();
        setIsGeolocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const isDisabled = isLoading || isGeolocating || isValidating;

  return (
    <div className="max-w-md mx-auto space-y-2">
      {/* Location Input */}
      <form onSubmit={handleSubmit} className="bg-white/20 backdrop-blur-xl p-2 rounded-full shadow-lg flex items-center transition-all duration-300">
        <input
          type="text"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            onError(null);
            if (invalidInputMessage) setInvalidInputMessage(null);
          }}
          placeholder={invalidInputMessage || "e.g., London, Birmingham, or M1 1AA"}
          className={`w-full bg-transparent p-3 pl-5 border-0 rounded-full focus:outline-none focus:ring-0 text-base sm:text-lg text-slate-800 placeholder-slate-500 transition-all duration-300 ${invalidInputMessage ? 'placeholder-red-500' : ''}`}
          disabled={isDisabled}
        />
      
      <button
        type="button"
        onClick={handleGeolocate}
        className="text-slate-500 h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-slate-200/50 hover:text-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isDisabled}
        aria-label="Use my current location"
        title="Use my current location"
      >
        {isGeolocating ? (
            <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
            <LocationMarkerIcon className="w-6 h-6" />
        )}
      </button>
      
        <button
          type="submit"
          className="bg-orange-600 text-white font-bold h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed ml-1"
          disabled={isDisabled || !location.trim()}
          aria-label="Check location weather"
          title="Get weather recommendation"
        >
          {isLoading || isValidating ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
              <ArrowRightIcon className="w-6 h-6" />
          )}
        </button>
      </form>

      {/* Indoor Temperature Input */}
      <div className="flex items-center justify-center gap-2 text-base sm:text-sm">
        <label htmlFor="indoorTemp" className="text-slate-700 font-medium">
          🏠 Indoor temp:
        </label>
        <div className="relative">
          <input
            id="indoorTemp"
            type="number"
            min="10"
            max="25"
            step="0.5"
            value={indoorTemp}
            onChange={(e) => setIndoorTemp(parseFloat(e.target.value) || indoorTemp)}
            className="w-20 bg-white/40 backdrop-blur-sm border-2 border-orange-200 rounded-lg px-3 py-2 text-center font-bold text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
            disabled={isDisabled}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 text-sm pointer-events-none">°C</span>
        </div>
        <span className="text-sm text-slate-500">(adjust if needed)</span>
      </div>
    </div>
  );
};

export default LocationInput;
