const CACHE_NAME = "myblood-pwa-v2-birthyear";
const OFFLINE_URL = "/offline.html";

const APP_SHELL = [
  "/",
  "/index.html",
  "/offline.html",
  "/404.html",
  "/privacy-policy.html",
  "/about.html",
  "/contact.html",
  "/search-wizard.html",
  "/search.html",
  "/results.html",
  "/add-yourself.html",
  "/styles.css",
  "/app.js",
  "/supporters.js",
  "/manifest.webmanifest",
  "/assets/logo.png",
  "/assets/logo-32.png",
  "/assets/logo-64.png",
  "/assets/logo-192.png",
  "/assets/logo-512.png",
  "/assets/logo-maskable-192.png",
  "/assets/logo-maskable-512.png",
  "/assets/profile.png",
  "/assets/lebanon-coverage-map.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  // Never cache Firebase or other remote API responses.
  if (
    request.url.includes("firebaseio.com") ||
    url.origin !== self.location.origin
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML navigation: network first, then cached page, then offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          return (
            await caches.match(request) ||
            await caches.match(OFFLINE_URL)
          );
        })
    );
    return;
  }

  // JS/CSS: network first to keep updates fresh, cache fallback.
  if (
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".webmanifest")
  ) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Images and static assets: cache first.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      });
    })
  );
});
