const CACHE_NAME = 'order-orbit-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-512.jpg',
  '/coffee_cup_with_plate.glb',
  '/celestial_sphere.glb'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension/etc requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Handle Firebase / API calls with Network-First
  if (url.pathname.startsWith('/api') || url.hostname.includes('firebase') || url.hostname.includes('firestore')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets and page routing (stale-while-revalidate or cache-first)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (stale-while-revalidate)
        fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => { /* ignore network error when offline */ });
        return cachedResponse;
      }

      // If not in cache, fetch from network and cache it
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback to index.html for SPA routing when offline
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/');
        }
      });
    })
  );
});

// Push Notification Event (Web Push / Background payloads)
self.addEventListener('push', (event) => {
  let data = {
    title: '🚨 NEW ORDER RECEIVED!',
    body: 'A customer order has arrived. Tap to open Kitchen Queue.',
    icon: '/icon-512.jpg',
    badge: '/icon-512.jpg',
    tag: `caidoz-order-${Date.now()}`,
    data: { url: '/?view=cashier', view: 'cashier' },
    vibrate: [300, 150, 300, 150, 400],
    actions: [
      { action: 'view', title: '👀 View Order' }
    ]
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/icon-512.jpg',
    badge: data.badge || '/icon-512.jpg',
    tag: data.tag || `caidoz-order-${Date.now()}`,
    data: data.data || { url: '/?view=cashier', view: 'cashier' },
    vibrate: data.vibrate || [300, 150, 300, 150, 400],
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'view', title: '👀 View in Kitchen Queue' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Notification Click Event (Deep linking to window or launching PWA)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notificationData = event.notification.data || {};
  const targetView = notificationData.view || 'cashier';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window client is already open, focus it and notify App.tsx to switch view
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NAVIGATE_TO_VIEW',
            view: targetView,
            orderId: notificationData.orderId
          });
          return client.focus();
        }
      }
      // If no window is open, open a new window
      if (self.clients.openWindow) {
        const urlToOpen = notificationData.url || `/?view=${targetView}`;
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
