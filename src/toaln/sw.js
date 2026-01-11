const CACHE_NAME = 'cache-v1'
const CACHEABLE_EXTENSIONS = [
  'css',
  'html',
  'jpeg',
  'jpg',
  'js',
  'map',
  'png',
  'svg',
]

const sendMessageToClients = (
  message,
) => {
  self.clients.matchAll()
    .then(clients => {
      clients.forEach(
        client => client.postMessage(message),
      )
    })
}

const updateCacheAndNotify = async (
  request,
  cachedResponse,
) => {
  const networkResponse = await fetch(
    request.clone(),
  )
  if (
    !networkResponse
    || networkResponse.status !== 200
  ) {
    return
  }

  const cache = await caches.open(CACHE_NAME)
  const responseForCache = networkResponse.clone()

  let changed = true
  // Compare cached response to new response.
  if (cachedResponse) {
    const responseForComparison = networkResponse.clone()

    // Compare the new response with the cached one.
    const [newContent, cachedContent] = await Promise.all([
      responseForComparison.text(),
      cachedResponse.text(),
    ])

    changed = newContent !== cachedContent
  }
  // If it  has changed update the cache and notify the main thread.
  if (changed) {
    await cache.put(request, responseForCache)

    sendMessageToClients({
      type: 'cacheUpdate',
      url: request.url,
    })
  }
}

// Clean up old caches during the activation phase.
self.addEventListener('activate', (
  event,
) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames.map(name => {
            if (name !== CACHE_NAME) {
              return caches.delete(name)
            }
          })
        )
      )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (
  event,
) => {
  const url = new URL(
    event.request.url,
  )
  // Check if the request is for allowed file types.
  const isCacheable = (
    process.env.NODE_ENV === 'production'
    && (
      CACHEABLE_EXTENSIONS.some((
        extension,
      ) => url.pathname.endsWith('.' + extension))
      || url.pathname.endsWith('manifest.json')
    )
  )

  event.respondWith(
    isCacheable
      ? caches.match(event.request)
        .then((
          cachedResponse,
        ) => {
          // Trigger background update.
          event.waitUntil(
            updateCacheAndNotify(event.request, (
              cachedResponse
                ? cachedResponse.clone()
                : cachedResponse
            ))
          )
          // Return cached response immediately if available.
          return (
            cachedResponse
            || fetch(event.request)
          )
        })
      : fetch(event.request)
  )
})

const FILES_TO_CACHE = (
  process.env.NODE_ENV === 'production'
    ? [
      './index.html',
      './app.min.css',
      './app.min.js',
      './manifest.json',
      './sw.min.js',
    ]
    : []
)

// Cache the files during the installation phase.
self.addEventListener('install', (
  event,
) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  )
  self.skipWaiting()
})
