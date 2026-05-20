/* eslint-disable no-restricted-globals */
// NUMA Service Worker — App shell + API caching + offline-first

const VERSION = "numa-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const API_CACHE = `${VERSION}-api`;
const FILE_CACHE = `${VERSION}-files`;

const SHELL_URLS = ["/", "/index.html", "/logo.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isFileRequest(url) {
  return url.pathname.startsWith("/api/files/");
}

function isStaticAsset(url) {
  return /\.(js|css|png|jpe?g|svg|woff2?|ttf|ico)$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // POST/PUT/DELETE handled by app sync layer

  const url = new URL(req.url);

  // Files: cache-first (heavy resources downloaded for offline)
  if (isFileRequest(url)) {
    event.respondWith(
      caches.open(FILE_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const resp = await fetch(req);
          if (resp.ok) cache.put(req, resp.clone());
          return resp;
        } catch (e) {
          return new Response("File not available offline", { status: 503 });
        }
      })
    );
    return;
  }

  // API: network-first, fall back to cache
  if (isApiRequest(url)) {
    event.respondWith(
      (async () => {
        try {
          const resp = await fetch(req);
          if (resp.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put(req, resp.clone());
          }
          return resp;
        } catch (e) {
          const cached = await caches.match(req);
          if (cached) return cached;
          return new Response(JSON.stringify({ offline: true, detail: "Sin conexión y sin datos en caché" }),
            { status: 503, headers: { "Content-Type": "application/json" } });
        }
      })()
    );
    return;
  }

  // Static assets: cache-first
  if (isStaticAsset(url) || url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((resp) => {
            if (resp.ok && url.origin === self.location.origin) {
              const copy = resp.clone();
              caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
            }
            return resp;
          })
          .catch(() => caches.match("/index.html"));
      })
    );
  }
});

// Allow page to trigger cache cleanup or pre-cache files
self.addEventListener("message", (event) => {
  const { type, url } = event.data || {};
  if (type === "PRECACHE_FILE" && url) {
    caches.open(FILE_CACHE).then((cache) =>
      fetch(url).then((resp) => {
        if (resp.ok) cache.put(url, resp.clone());
      }).catch(() => {})
    );
  }
  if (type === "CLEAR_CACHE") {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
});
