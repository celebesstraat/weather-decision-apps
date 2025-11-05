import React, { useState, useEffect } from 'react';
import ArrowRightIcon from './icons/ArrowRightIcon';
import LocationMarkerIcon from './icons/LocationMarkerIcon';
import { getPlacenameFromCoords, validateLocationInput } from '../services/geminiService';
import { sanitizeLocationInput, validateLocationInput as secureValidate, sanitizeCoordinates, locationRateLimiter } from '../utils/inputSanitization';
import { hapticFeedback } from '../utils/hapticFeedback';

interface LocationInputProps {
  onLocationSubmit: (location: string) => void;
  isLoading: boolean;
  onError: (message: string | null) => void;
}

const LocationInput: React.FC<LocationInputProps> = ({ onLocationSubmit, isLoading, onError }) => {
  const [location, setLocation] = useState<string>('');
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
        onLocationSubmit(location.toLowerCase());
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
        onLocationSubmit(validatedLocation);
      }
    } catch (error) {
      console.error("Location validation failed:", error);
      // Fallback: use sanitized input if AI validation fails
      const sanitized = sanitizeLocationInput(location);
      const securityValidation = secureValidate(sanitized);
      if (securityValidation.valid) {
        onLocationSubmit(sanitized);
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
          onLocationSubmit(placename);
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
              onLocationSubmit(newLocation);
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
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white/20 backdrop-blur-xl p-2 rounded-full shadow-lg flex items-center transition-all duration-300">
      <input
        type="text"
        value={location}
        onChange={(e) => {
          setLocation(e.target.value);
          onError(null);
          if (invalidInputMessage) setInvalidInputMessage(null);
        }}
        placeholder={invalidInputMessage || "e.g., London, Birmingham, or M1 1AA"}
        className={`w-full bg-transparent p-3 pl-5 border-0 rounded-full focus:outline-none focus:ring-0 text-slate-800 placeholder-slate-500 transition-all duration-300 ${invalidInputMessage ? 'placeholder-red-500' : ''}`}
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
        className="bg-cyan-600 text-white font-bold h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed ml-1"
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
  );
};

export default LocationInput;