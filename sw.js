// sw.js — offline app shell for Kata Satu.
// Cache first, refreshed in the background. The version is the build's hash, so
// publishing a new build retires the old cache by itself.
const CACHE = "kata-satu-bedc12dc6fc0";
const SHELL = ["./", "./index.html", "./manifest.webmanifest",
               "./icon/icon-192.png", "./icon/icon-512.png", "./icon/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(hit => {
    const live = fetch(e.request).then(res => {
      if (res && res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      return res;
    }).catch(() => hit);
    return hit || live;
  }));
});
