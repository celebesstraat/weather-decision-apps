const CACHE_NAME = 'get-the-washing-out-v2';
const STATIC_CACHE_URLS = [
  '/',
  '/styles.css',
  '/laundry-man.jpg',
  '/manifest.json',
  // Add other static assets as needed
];

// Dynamic caching for API calls
const DYNAMIC_CACHE_URLS = [
  'open-meteo.com',
  'geocoding-api',
  'generativelanguage.googleapis.com'
];

const WEATHER_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const LOCATION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .catch((error) => {
        console.error('Service Worker: Cache installation failed', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Enhanced fetch event with intelligent caching
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  const url = new URL(event.request.url);
  
  // Handle API requests with smart caching
  if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(event.request));
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Check if cached response is still valid
        if (cachedResponse && isCacheValid(cachedResponse)) {
          console.log('Service Worker: Serving valid cache for', event.request.url);
          return cachedResponse;
        }

        // Fetch from network and update cache
        console.log('Service Worker: Fetching fresh data for', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('Service Worker: Network fetch failed', error);
            
            // Return a custom offline page or basic response for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return new Response(
                `
                <!DOCTYPE html>
                <html>
                <head>
                  <title>GetTheWashingOut - Offline</title>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                    .offline-content { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 20px; backdrop-filter: blur(10px); }
                    .laundo-offline { width: 120px; height: 120px; margin: 0 auto 20px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; }
                  </style>
                </head>
                <body>
                  <div class="offline-content">
                    <div class="laundo-offline">🧺</div>
                    <h1>You're Offline!</h1>
                    <p>GetTheWashingOut needs an internet connection to check the weather.</p>
                    <p>Please check your connection and try again.</p>
                  </div>
                </body>
                </html>
                `,
                {
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            }
            
            // Return cached response even if expired for offline functionality
            if (cachedResponse) {
              console.log('Service Worker: Serving expired cache (offline)', event.request.url);
              return cachedResponse;
            }
            
            // Return offline page for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return new Response(
                `
                <!DOCTYPE html>
                <html>
                <head>
                  <title>GetTheWashingOut - Offline</title>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                    .offline-content { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 20px; backdrop-filter: blur(10px); }
                    .laundo-offline { width: 120px; height: 120px; margin: 0 auto 20px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; }
                  </style>
                </head>
                <body>
                  <div class="offline-content">
                    <div class="laundo-offline">🧺</div>
                    <h1>You're Offline!</h1>
                    <p>GetTheWashingOut needs an internet connection to check the weather.</p>
                    <p>Please check your connection and try again.</p>
                    <button onclick="location.reload()" style="background: #4ade80; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; margin-top: 20px;">Try Again</button>
                  </div>
                </body>
                </html>
                `,
                {
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            }
            
            throw error;
          });
      })
  );
});

// Helper functions for enhanced caching
function isAPIRequest(url) {
  return DYNAMIC_CACHE_URLS.some(pattern => url.hostname.includes(pattern)) ||
         url.pathname.includes('/api/') ||
         url.hostname.includes('open-meteo.com') ||
         url.hostname.includes('googleapis.com');
}

function isCacheValid(cachedResponse) {
  const cacheTimestamp = cachedResponse.headers.get('Cache-Timestamp');
  const cacheDuration = cachedResponse.headers.get('Cache-Duration');
  
  if (!cacheTimestamp || !cacheDuration) {
    return false; // No cache metadata, consider invalid
  }
  
  const now = Date.now();
  const cacheAge = now - parseInt(cacheTimestamp);
  const maxAge = parseInt(cacheDuration);
  
  return cacheAge < maxAge;
}

async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try cache first for API requests
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse && isCacheValid(cachedResponse)) {
      console.log('Service Worker: Serving valid API cache for', request.url);
      return cachedResponse;
    }
    
    // Fetch fresh data from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Determine cache duration based on API type
      let cacheDuration = WEATHER_CACHE_DURATION;
      if (url.pathname.includes('geocoding') || url.hostname.includes('geocoding')) {
        cacheDuration = LOCATION_CACHE_DURATION;
      }
      
      // Create enhanced response with cache metadata
      const responseToCache = new Response(await networkResponse.clone().text(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'Cache-Timestamp': Date.now().toString(),
          'Cache-Duration': cacheDuration.toString()
        }
      });
      
      // Cache the response
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, responseToCache.clone());
      
      console.log('Service Worker: Cached fresh API response for', request.url);
      return responseToCache;
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Service Worker: API request failed', error);
    
    // Return cached response even if expired for offline functionality
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving expired API cache (offline)', request.url);
      return cachedResponse;
    }
    
    // Return error response
    return new Response(JSON.stringify({
      error: 'Service unavailable',
      message: 'Unable to fetch data. Please check your internet connection.',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Enhanced background sync for weather updates
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered for', event.tag);
  
  if (event.tag === 'background-weather-sync') {
    event.waitUntil(syncWeatherData());
  } else if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavoritesData());
  }
});

// Sync weather data for cached locations
async function syncWeatherData() {
  try {
    // Get cached locations from IndexedDB
    const db = await openDB();
    const tx = db.transaction(['location-cache'], 'readonly');
    const store = tx.objectStore('location-cache');
    const locations = await getAllFromStore(store);
    
    console.log('Service Worker: Syncing weather for', locations.length, 'cached locations');
    
    // Update weather data for each cached location
    for (const locationItem of locations) {
      try {
        const location = locationItem.data;
        // Make fresh weather API call
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,precipitation,precipitation_probability,wind_speed_10m,uv_index,cloud_cover&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`;
        
        const response = await fetch(weatherUrl);
        if (response.ok) {
          const weatherData = await response.text();
          
          // Cache the updated weather data
          const cache = await caches.open(CACHE_NAME);
          await cache.put(new Request(weatherUrl), new Response(weatherData, {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Timestamp': Date.now().toString(),
              'Cache-Duration': WEATHER_CACHE_DURATION.toString()
            }
          }));
          
          console.log('Service Worker: Updated weather cache for', location.name);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync weather for location:', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background weather sync failed:', error);
  }
}

// Sync favorites data
async function syncFavoritesData() {
  try {
    console.log('Service Worker: Syncing favorites data');
    // This would sync favorites with a backend service if implemented
    // For now, just log the action
  } catch (error) {
    console.error('Service Worker: Favorites sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GetTheWashingOutCache', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Push notifications (for future weather alerts)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Weather conditions have changed!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: [
        {
          action: 'check-weather',
          title: 'Check Weather',
          icon: '/icons/icon-96x96.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'GetTheWashingOut', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'check-weather') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});