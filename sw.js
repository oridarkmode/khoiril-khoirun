// sw.js
const CACHE = "glass-invite-final-v11"; // naikkan angkanya
const PRECACHE = [
  "./",
  "./index.html",
  "./css/style.css",      // akan tetap di-refresh via network-first di fetch handler
  "./js/script.js",       // idem
  "./manifest.webmanifest",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
  // ⚠️ SENGAJA: TIDAK mem-precache "./data/config.json" agar selalu fresh
];

// Helper simpan ke cache (best effort)
async function putToCache(request, response){
  try{
    const cache = await caches.open(CACHE);
    await cache.put(request, response);
  }catch(_){}
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

// Strategi:
// - document/script/style/json → NETWORK-FIRST (agar update langsung terlihat)
// - image/font/audio/video    → CACHE-FIRST (hemat bandwidth)
// - Hormati request.cache === "no-store" → selalu network (untuk config.json)
self.addEventListener("fetch", (e) => {
  const req = e.request;

  // Bypass SW untuk domain lain
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Hormati 'no-store' (mis. config.json yang di-fetch no-store)
  if (req.cache === "no-store") {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  const dest = req.destination; // '', 'document', 'script', 'style', 'image', 'audio', 'video', 'font', 'json'

  // NETWORK-FIRST untuk app shell & data
  if (dest === "document" || dest === "script" || dest === "style" || dest === "json" || req.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      fetch(req).then(res => {
        putToCache(req, res.clone());
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // CACHE-FIRST untuk aset berat (img/font/audio/video)
  if (["image", "font", "audio", "video"].includes(dest)) {
    e.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(res => {
          putToCache(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default fallback → try network, else cache
  e.respondWith(
    fetch(req).then(res => {
      putToCache(req, res.clone());
      return res;
    }).catch(() => caches.match(req))
  );
});


