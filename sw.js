// Just One offline support (used by the shared GitHub Pages copy only).
// The app opens instantly and keeps working with the last word lists it downloaded.
// lists.json and the page: network first, saved copy if offline. Icons: saved copy first.
const CACHE = 'justone-v1';
const SHELL = ['./', 'index.html', 'lists.json', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png',
               'icons/apple-touch-icon.png', 'icons/favicon-32.png', 'icons/favicon-16.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;   // fonts come from elsewhere
  const fresh = req.mode === 'navigate' || url.pathname.endsWith('/lists.json') ||
                url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (fresh){
    e.respondWith(fetch(req).then(res => {
      if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('index.html'))));
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
