// Fonctionnement hors connexion : tout le jeu est mis en cache à l'installation.
// La version est inscrite automatiquement au build (scripts/aura-version.mjs) : rien à changer à la main.
const CACHE = 'aura-__AURA_VERSION__';
const FILES = ['./', './index.html', './aura.css', './manifest.webmanifest', './icons/favicon-64.png', './splash/boot.jpg', './icons/icon-192.png', './icons/apple-touch-icon.png',
  './js/main.js', './js/util.js', './js/i18n.js', './js/economy.js', './js/audio.js', './js/shapes.js', './js/fx.js', './js/creations.js', './js/reactions.js', './js/universe.js', './js/powers.js', './js/haptics.js', './js/ui.js', './js/intro.js', './js/serenity.js', './js/sky.js', './js/objectives.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
// Réseau d'abord (mises à jour), cache en secours (hors ligne).
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('/version.json')) return;
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || caches.match('./index.html'))));
});
