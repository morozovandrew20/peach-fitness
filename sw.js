const CACHE = "peach-flagship-14";
const NAV_TIMEOUT = 3500;
const CORE = [
  "./",
  "./index.html",
  "./flagship.css",
  "./technique.js",
  "./technique3d.js",
  "./assets/technique/peach-mannequin.glb",
  "./assets/technique/LICENSE-desk-break.txt",
  "./assets/technique/LICENSE-three.txt",
  "./sw.js",
  "./manrope-cyrillic.woff2",
  "./manrope-latin.woff2",
  "./manifest.webmanifest",
  "./manifest-dark.webmanifest",
  "./release.html",
  "./privacy.html",
  "./terms.html",
  "./credits.html",
  "./assets/release/screenshot-mobile.png",
  "./assets/release/screenshot-progress.png",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png",
  "./logo-512.png",
  "./peach-logo.svg",
  "./favicon.ico"
];

function store(key, response) {
  const copy = response.clone();
  caches.open(CACHE).then(cache => cache.put(key, copy)).catch(() => {});
}

function networkNavigation(request) {
  return fetch(request).then(response => {
    if (!response.ok) throw new Error("Navigation unavailable");
    store("./index.html", response);
    return response;
  });
}

async function navigation(request) {
  const cached = await caches.match("./index.html");
  const network = networkNavigation(request);

  if (!cached) {
    try {
      return await network;
    } catch (error) {
      const root = await caches.match("./");
      if (root) return root;
      throw error;
    }
  }

  let timer;
  const fallback = new Promise(resolve => {
    timer = setTimeout(() => resolve(cached), NAV_TIMEOUT);
  });

  try {
    return await Promise.race([network, fallback]);
  } catch (error) {
    return cached;
  } finally {
    clearTimeout(timer);
  }
}

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("peach-") && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(navigation(request));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const fresh = fetch(request).then(response => {
        if (response.ok) store(request, response);
        return response;
      });
      if (cached) {
        fresh.catch(() => {});
        return cached;
      }
      return fresh;
    })
  );
});
