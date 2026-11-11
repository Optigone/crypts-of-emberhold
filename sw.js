/* Crypts of Emberhold — caches the app for fully offline play. */
const CACHE = "emberhold-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/app.css",
  "./js/main.js",
  "./js/game.js",
  "./js/ui.js",
  "./js/render.js",
  "./js/audio.js",
  "./js/data/classes.js",
  "./js/data/spells.js",
  "./js/data/items.js",
  "./js/data/monsters.js",
  "./js/data/quests.js",
  "./js/data/gen.js",
  "./js/data/maps.js",
  "./js/systems/rules.js",
  "./js/systems/state.js",
  "./js/systems/combat.js",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/favicon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok && url.pathname.startsWith(self.registration.scope.replace(self.location.origin, ""))) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
