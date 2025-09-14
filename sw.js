const CACHE_NAME = 'text-to-handwriting-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/index.css',
  '/js/script.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
  'https://fonts.googleapis.com/css2?family=Homemade+Apple&family=Caveat:wght@400;600&family=Liu+Jian+Mao+Cao&family=Dancing+Script:wght@400;600&display=swap'
];

// Install event
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
      .catch(function(err) {
        // Silent fail
      })
  );
});

// Fetch event
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(function() {
        // Return offline page or basic response
        return new Response('Offline', { status: 200 });
      })
  );
});

// Activate event
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});