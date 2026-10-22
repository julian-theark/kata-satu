// sw.js — offline shell for Kata Satu.
//
// The PAGE is network-first: it is one file that changes with every release,
// and a cache-first page means a new version is invisible until the app has
// been opened twice. Everything else (icons, the manifest) is cache-first,
// since those rarely change and should never cost a round trip.
const CACHE = "kata-satu-deb4c77d45f8";
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

function isPage(req) {
  return req.mode === "navigate" || (req.destination === "document");
}

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  if (isPage(e.request)) {
    // Fresh page when there is a network, the last good one when there is not.
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put("./index.html", copy));
          }
          return res;
        })
        .catch(() => caches.match("./index.html").then(hit => hit || caches.match("./")))
    );
    return;
  }

  e.respondWith(caches.match(e.request).then(hit => {
    const live = fetch(e.request).then(res => {
      if (res && res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      return res;
    }).catch(() => hit);
    return hit || live;
  }));
});
