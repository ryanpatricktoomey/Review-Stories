// English Corner PWA: intentionally conservative caching.
// Keep all HTML, Firebase auth, Firestore, Word Bank and activity requests on the network.
// This avoids stale lessons or accidental caching of student data.
const VERSION = 'english-corner-shell-v3';
const ASSETS = ['./icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('english-corner-shell-') && key !== VERSION).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (ASSETS.some(asset => url.pathname.endsWith(asset.replace('./', '/')))) {
    event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request)));
  }
});
