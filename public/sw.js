// ReliefLink AI — Service Worker
// Cache-first strategy for shell assets, network-first for API calls

const CACHE_NAME = "relieflink-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
];

// Install: cache static shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Non-critical — continue even if some assets fail
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for supabase/API, cache-first for static
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET, supabase API, and browser extensions
  if (
    event.request.method !== "GET" ||
    url.hostname.includes("supabase.co") ||
    url.protocol === "chrome-extension:"
  ) {
    return;
  }

  // Cache-first for static assets (fonts, leaflet, etc.)
  if (
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("gstatic.com") ||
    url.hostname.includes("unpkg.com") ||
    url.hostname.includes("cartocdn.com")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Network-first for app pages (fall back to cache)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Background sync placeholder for offline request queue
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-emergency-requests") {
    // In production: read from IndexedDB and replay failed requests
    console.log("[SW] Background sync: emergency-requests");
  }
});
