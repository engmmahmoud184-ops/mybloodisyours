
const CACHE_NAME = "myblood-home-executive-director-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./404.html",
  "./robots.txt",
  "./results.html",
  "./add-yourself.html",
  "./contact.html",
  "./about.html",
  "./search-wizard.html",
  "./styles.css",
  "./app.js",
  "./supporters.js",
  "./assets/logo.png",
  "./assets/logo-64.png",
  "./assets/logo-192.png",
  "./manifest.webmanifest"
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
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  if (request.url.includes("firebaseio.com")) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
