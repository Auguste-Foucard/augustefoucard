// Outils mathématiques partagés.
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const easeInOut = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const wrapAngle = (a) => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const hueWrap = (h) => ((h % 360) + 360) % 360;

// Bruit de valeur 2D lissé (léger, suffisant pour des courants organiques).
const P = new Uint8Array(512);
{ const p = Array.from({ length: 256 }, (_, i) => i); for (let i = 255; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) P[i] = p[i & 255]; }
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const grad = (h, x, y) => { const g = h & 7; const u = g < 4 ? x : y; const v = g < 4 ? y : x; return ((g & 1) ? -u : u) + ((g & 2) ? -2 * v : 2 * v); };
export function noise2(x, y) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
  x -= Math.floor(x); y -= Math.floor(y);
  const u = fade(x), v = fade(y);
  const a = P[X] + Y, b = P[X + 1] + Y;
  return lerp(lerp(grad(P[a], x, y), grad(P[b], x - 1, y), u), lerp(grad(P[a + 1], x, y - 1), grad(P[b + 1], x - 1, y - 1), u), v) * 0.25;
}

/** Nombre compact et doux : 1,2 k · 34 M. */
export function fmt(n, lang = 'fr') {
  if (!isFinite(n)) return '∞';
  const s = lang === 'fr' ? ['', ' k', ' M', ' Md', ' T', ' Qa', ' Qi'] : ['', 'k', 'M', 'B', 'T', 'Qa', 'Qi'];
  let i = 0; let v = Math.floor(n);
  while (v >= 1000 && i < s.length - 1) { v /= 1000; i++; }
  const str = i === 0 ? String(Math.floor(v)) : v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0);
  return (lang === 'fr' ? str.replace('.', ',') : str) + s[i];
}
