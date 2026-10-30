/**
 * CareerBridge Service Worker (Phase 12: PWA & Low-Bandwidth Optimization)
 * Designed for low-connectivity environments across Tier-2/3 Indian colleges.
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `careerbridge-shell-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `careerbridge-dynamic-${CACHE_VERSION}`;

// Pre-cached core assets required for offline application shell
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon.svg',
];

// Sensitive path regexes that MUST NEVER be stored in the Service Worker cache
const SENSITIVE_URL_PATTERNS = [
  /\/api\/auth\//i,
  /\/api\/admin\//i,
  /\/api\/whatsapp\//i,
  /\/api\/employers\//i,
  /\/api\/colleges\//i,
  /\/api\/students\/me\//i,
  /\/api\/notifications\//i,
  /\/api\/applications\//i,
];

// Safe public read-only API endpoints eligible for low-bandwidth caching
const SAFE_PUBLIC_API_PATTERNS = [
  /\/api\/health/i,
  /\/api\/skills/i,
  /\/api\/events/i,
];

// 1. Install Event: Cache Core App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Use addAll with error resilience
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] Failed to pre-cache ${url}:`, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean Outdated Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Check if request is safe to cache
function isSafeToCache(request) {
  // Only GET requests are ever cached
  if (request.method !== 'GET') {
    return false;
  }

  const url = request.url;

  // Never cache sensitive endpoints (auth, passwords, tokens, admin, private records)
  for (const pattern of SENSITIVE_URL_PATTERNS) {
    if (pattern.test(url)) {
      return false;
    }
  }

  // Never cache authenticated API calls carrying Authorization headers in shared cache
  if (url.includes('/api/') && request.headers.has('Authorization')) {
    return false;
  }

  return true;
}

// Helper: Check if API endpoint is safe public data
function isSafePublicApi(url) {
  return SAFE_PUBLIC_API_PATTERNS.some((pattern) => pattern.test(url));
}

// 3. Fetch Event: Low-Bandwidth Network Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Non-GET requests (POST, PUT, DELETE, PATCH): Always Network Only, never cached
  if (request.method !== 'GET') {
    return;
  }

  // A. Navigation Requests (HTML Pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // If network succeeds and is valid, optionally update root cache
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline navigation fallback: Try cached index.html, else return offline.html
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // B. Security Check: Never cache sensitive API endpoints
  if (!isSafeToCache(request)) {
    return; // Pass through to network without touching cache
  }

  // C. Static Assets (Scripts, Styles, Fonts, Icons) -> Cache First with Network Fallback
  const isStaticAsset =
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|woff2?|ttf|eot)$/i) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => {
            // Return empty response or nothing for broken static assets
            return new Response('', { status: 408, statusText: 'Request Timed Out' });
          });
      })
    );
    return;
  }

  // D. Safe Public Read-Only APIs (e.g. /api/health, /api/skills) -> Network First with Cache Fallback
  if (isSafePublicApi(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) {
              // Add custom header to indicate cached snapshot
              const headers = new Headers(cached.headers);
              headers.set('X-CareerBridge-Cache', 'STALE_OFFLINE_SNAPSHOT');
              return new Response(cached.body, {
                status: cached.status,
                statusText: cached.statusText,
                headers: headers,
              });
            }
            return new Response(
              JSON.stringify({
                success: false,
                error: {
                  code: 'OFFLINE_UNAVAILABLE',
                  message: 'This resource is unavailable offline. Please reconnect.',
                },
              }),
              { headers: { 'Content-Type': 'application/json' }, status: 503 }
            );
          });
        })
    );
    return;
  }
});

// 4. Message Event: Support Manual Skip Waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
