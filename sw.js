// English Corner PWA: intentionally conservative caching.
// Keep all HTML, Firebase auth, Firestore, Word Bank and activity requests on the network.
// This avoids stale lessons or accidental caching of student data.
const VERSION = 'english-corner-shell-v5';
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


// Daily review push notifications are opt-in and never contain student data.
self.addEventListener('push', event => {
  if (!event.data) return;
  let payload={};
  try { payload=event.data.json(); } catch (_) { return; }
  const title=payload.title||'Reps';
  const target=new URL('./index.html#review-stories',self.registration.scope).href;
  event.waitUntil(self.registration.showNotification(title,{
    body:payload.body||'오늘의 복습 자료가 준비됐어요!',
    icon:new URL('./icons/icon-192.png',self.registration.scope).href,
    badge:new URL('./icons/icon-192.png',self.registration.scope).href,
    tag:payload.tag||'reps-review-ready',
    renotify:false,
    data:{url:target}
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url=event.notification.data?.url || new URL('./index.html#review-stories',self.registration.scope).href;
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      if(new URL(client.url).origin===new URL(url).origin){
        await client.navigate(url);
        return client.focus();
      }
    }
    return self.clients.openWindow(url);
  })());
});
