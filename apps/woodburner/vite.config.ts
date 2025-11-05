import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Core React and essential utilities
              'react-core': ['react', 'react-dom'],
              // Weather processing (largest service)
              'weather-services': ['./services/weatherService', './services/weatherAPIService', './services/geoLocationService'],
              // AI features (loaded on demand)
              'ai-features': ['./services/geminiService', '@google/genai'],
              // UI components that can be lazy loaded
              'ui-components': ['./components/AnimatedBackground', './components/ForecastTimeline'],
              // PWA and mobile features
              'pwa-features': ['./components/PWAInstallPrompt', './components/MobileShell']
            }
          }
        },
        chunkSizeWarningLimit: 800, // Optimized for mobile (800KB chunks max)
        sourcemap: mode === 'development'
      },
      server: {
        host: '0.0.0.0',
        port: 5000,
        strictPort: false,
        cors: {
          origin: ['http://localhost:5000', 'http://localhost:5173'],
          credentials: true
        },
        hmr: {
          port: 5000
        },
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
        dedupe: ['react', 'react-dom']
      },
      clearScreen: false,
      esbuild: {
        logOverride: { 'this-is-undefined-in-esm': 'silent' }
      },
      optimizeDeps: {
        include: ['react', 'react-dom'],
        exclude: ['@google/genai'] // Lazy load AI features
      }
    };
});
