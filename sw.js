/**
 * MediKey | Service Worker (PWA Shell v6 & Offline Support)
 * Caches static core application shell only.
 * STRICT SECURITY: Never caches private medical records, Supabase API calls, or auth tokens.
 */

const CACHE_NAME = 'medikey-shell-v7';

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
  './js/i18n.js',
  './assets/vendor/qrcode.min.js',
  './assets/vendor/html5-qrcode.min.js',
  './assets/vendor/supabase.min.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-192.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon-32.png',
  './assets/icons/icon.svg',
  './assets/icons/icon-maskable.svg',
  './manifest.json'
];

// Install event: Pre-cache static shell assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('Some static assets could not be pre-cached:', err);
      });
    })
  );
});

// Message event: Listen for SKIP_WAITING from client update prompt
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate event: Clean up obsolete caches safely
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME && key.startsWith('medikey-shell-')).map(key => {
          console.log(`[SW] Deleting obsolete cache: ${key}`);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first for static shell, STRICT BYPASS for medical APIs
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. STRICT SECURITY BYPASS: Never cache any Supabase backend requests, Auth tokens,
  //    Storage API signed URLs, emergency share tokens, or recovery hashes.
  if (
    event.request.method !== 'GET' ||
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/auth/v1/') ||
    url.pathname.includes('/storage/v1/') ||
    url.search.includes('token=') ||
    url.search.includes('code=') ||
    url.search.includes('access_token=') ||
    url.search.includes('type=recovery') ||
    url.hash.includes('emergency-share=')
  ) {
    return; // Pass through directly to network
  }

  // 2. For static app shell, check cache first, fall back to network
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Stale-while-revalidate for static shell assets in background
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request);
    }).catch(() => {
      // Offline fallback: for HTML page navigation, return cached app shell
      if (event.request.mode === 'navigate' || event.request.destination === 'document') {
        return caches.match('./index.html') || caches.match('./');
      }
    })
  );
});
