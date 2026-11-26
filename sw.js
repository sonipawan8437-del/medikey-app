/**
 * MediKey | Service Worker (PWA Offline Support)
 * Caches static core application shell only.
 * STRICT SECURITY: Never caches private medical records, Supabase API calls, or auth tokens.
 */

const CACHE_NAME = 'medikey-shell-v3';

const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/script.js',
  './js/supabase-client.js',
  './js/auth.js',
  './js/profile.js',
  './js/records.js',
  './js/storage.js',
  './js/qr.js',
  './js/emergency.js',
  './js/utils.js',
  './assets/vendor/qrcode.min.js',
  './assets/vendor/html5-qrcode.min.js',
  './assets/vendor/supabase.min.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './manifest.json'
];

// Install event: Pre-cache static shell assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('Some static assets could not be pre-cached:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event: Clean up obsolete caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first for static shell, STRICT BYPASS for medical APIs
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. NEVER cache any Supabase backend requests, Auth tokens, or Storage API signed URLs
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/auth/v1/') ||
    url.pathname.includes('/storage/v1/') ||
    event.request.method !== 'GET'
  ) {
    return; // Pass through directly to network
  }

  // 2. For static app shell, try cache first, fall back to network
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Fetch in background to update cache (stale-while-revalidate for static shell)
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    }).catch(() => {
      // Offline fallback
      if (event.request.destination === 'document') {
        return caches.match('./index.html');
      }
    })
  );
});
