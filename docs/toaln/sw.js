// src/toaln/sw.js
var CACHE_NAME = "cache-v1";
var CACHEABLE_EXTENSIONS = [
  "css",
  "html",
  "jpeg",
  "jpg",
  "js",
  "map",
  "png",
  "svg"
];
var sendMessageToClients = (message) => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage(message));
  });
};
var updateCacheAndNotify = async (request, cachedResponse) => {
  const networkResponse = await fetch(request.clone());
  if (!networkResponse || networkResponse.status !== 200) {
    return;
  }
  const cache = await caches.open(CACHE_NAME);
  const responseForCache = networkResponse.clone();
  let changed = true;
  if (cachedResponse) {
    const responseForComparison = networkResponse.clone();
    const [newContent, cachedContent] = await Promise.all([
      responseForComparison.text(),
      cachedResponse.text()
    ]);
    changed = newContent !== cachedContent;
  }
  if (changed) {
    await cache.put(request, responseForCache);
    sendMessageToClients({
      type: "cacheUpdate",
      url: request.url
    });
  }
};
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((cacheNames) => Promise.all(cacheNames.map((name) => {
    if (name !== CACHE_NAME) {
      return caches.delete(name);
    }
  }))));
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isCacheable = CACHEABLE_EXTENSIONS.some((extension) => url.pathname.endsWith("." + extension)) || url.pathname.endsWith("manifest.json");
  event.respondWith(isCacheable ? caches.match(event.request).then((cachedResponse) => {
    event.waitUntil(updateCacheAndNotify(event.request, cachedResponse ? cachedResponse.clone() : cachedResponse));
    return cachedResponse || fetch(event.request);
  }) : fetch(event.request));
});
var FILES_TO_CACHE = [
  "./index.html",
  "./app.min.css",
  "./app.min.js",
  "./manifest.json",
  "./sw.min.js"
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE)));
  self.skipWaiting();
});

//# debugId=FF9A81FBFD2B2F6B64756E2164756E21
