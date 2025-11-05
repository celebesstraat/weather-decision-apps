# GetTheWashingOut - Weather-Based Laundry Assistant

## Overview

GetTheWashingOut is an intelligent web application that provides AI-powered laundry recommendations based on weather conditions. The app analyzes weather data using the proprietary DryCast algorithm to determine optimal times for outdoor clothes drying, offering YES/NO/MAYBE recommendations with detailed explanations and hourly forecasts.

## Recent Changes

### September 7, 2025 - Simplified Favorites System
- **Removed complex favorites components**: Eliminated FavoritesList and QuickActions with complex swipe gestures and recent locations tracking
- **Implemented simple star favoriting**: Clean star button next to forecast title for easy favoriting (max 3 locations)
- **Added Home location feature**: Users can designate one favorite as "Home" with house icon, app auto-loads Home location on startup
- **Streamlined favorites display**: Simple component beneath search bar showing favorites as clickable buttons with hover actions
- **Cleaned up dependencies**: Removed unused services and complex state management for leaner codebase

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19.1.1 with TypeScript for type safety and modern development patterns
- **Build System**: Vite 6.2.0 for fast development and optimized production builds
- **Styling**: Custom CSS with Tailwind-inspired utility classes and Google Fonts (Nunito, Inter)
- **State Management**: React hooks (useState, useEffect, useCallback) for local component state
- **Component Structure**: Modular component architecture with separate concerns:
  - UI Components: Location input, weather displays, character animations
  - Service Components: Weather data processing, AI integration
  - Utility Components: Icons, loading states, error handling

### PWA Features
- **Progressive Web App**: Full PWA implementation with service worker for offline functionality
- **Mobile Optimization**: Responsive design with mobile-first approach and viewport optimization
- **Installation Prompts**: Native app-like installation experience across platforms
- **Manifest**: Complete web app manifest for app store-like installation

### Weather Intelligence System
- **DryCast Algorithm**: Proprietary scoring system that analyzes multiple weather factors:
  - Humidity levels (optimized for UK's 60-95% typical range)
  - Wind speed analysis (optimal 3-15km/h range detection)
  - Temperature scoring (peak efficiency at 15-25°C)
  - Rain probability thresholds (strict 25% cutoff)
  - UV index and cloud cover correlation
- **Hourly Scoring**: Comprehensive hourly weather analysis with visual timeline
- **Drying Windows**: Intelligent detection of continuous suitable drying periods
- **Location Awareness**: Geolocation support with geocoding for accurate local weather

### Data Visualization
- **Weather Charts**: Multi-metric visualization with temperature, humidity, wind, and rain data
- **Timeline Interface**: Hourly breakdown with color-coded suitability indicators
- **Traffic Light System**: Simplified YES/NO recommendation display
- **Character Integration**: "Laundo" animated character providing contextual feedback

## External Dependencies

### Weather Data Services
- **Open-Meteo API**: Primary weather data source using UK Met Office models (UKMO Global 10km + UKV 2km)
- **Real-time Data**: Hourly forecasts with 7-day outlook and timezone handling
- **Geolocation Services**: Browser geolocation API with coordinate-based weather fetching

### AI Integration
- **Google Gemini AI**: Natural language generation for weather summaries and recommendations
- **Smart Summaries**: Contextual laundry planning advice in conversational tone
- **Location Recognition**: AI-powered coordinate-to-placename conversion

### Development Infrastructure
- **Testing Framework**: Jest with jsdom for component testing and service testing
- **TypeScript**: Strict type checking with comprehensive type definitions
- **Code Quality**: ESLint configuration and testing utilities

### Browser APIs
- **Geolocation**: Native browser location detection
- **Local Storage**: Favorites management and user preferences
- **Service Worker**: Background processing and caching
- **Web App Manifest**: PWA installation and mobile optimization

### Build and Deployment
- **Environment Variables**: Secure API key management with Vite env handling
- **Hot Module Replacement**: Development experience optimization
- **Production Build**: Optimized bundling with code splitting and asset optimization