// sw.js
const CACHE = "glass-invite-final-v12"; // bump versi setiap rilis
const PRECACHE = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/script.js",
  "./manifest.webmanifest",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
  // Tidak mem-precache ./data/config.json agar selalu fresh
];

// Hardening: blok pesan injeksi (placeholder; jika perlu, isi whitelist di sini)
self.addEventListener("message", (e) => { /* no-op */ });

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
    ).then(async () => {
      await self.clients.claim();
      // Force refresh semua tab agar ambil asset terbaru
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      clients.forEach(client => client.navigate(client.url));
    })
  );
});

// Strategi:
// - document/script/style/json → NETWORK-FIRST
// - image/font/audio/video     → CACHE-FIRST
// - Hormati request.cache === "no-store" (untuk config.json)
self.addEventListener("fetch", (e) => {
  const req = e.request;

  // Hanya tangani origin yang sama
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Hormati 'no-store'
  if (req.cache === "no-store") {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  const dest = req.destination;

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

  // CACHE-FIRST untuk aset berat
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

  // Default
  e.respondWith(
    fetch(req).then(res => {
      putToCache(req, res.clone());
      return res;
    }).catch(() => caches.match(req))
  );
});
