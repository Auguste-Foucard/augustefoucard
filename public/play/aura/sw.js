// Fonctionnement hors connexion : tout le jeu est mis en cache à l'installation.
const CACHE = 'aura-v2';
const FILES = ['./', './index.html', './aura.css', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/apple-touch-icon.png',
  './js/main.js', './js/util.js', './js/i18n.js', './js/economy.js', './js/audio.js', './js/shapes.js', './js/fx.js', './js/creations.js', './js/reactions.js', './js/universe.js', './js/powers.js', './js/haptics.js', './js/ui.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
// Réseau d'abord (mises à jour), cache en secours (hors ligne).
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || caches.match('./index.html'))));
});
