// Entrée dans la bulle : au lancement, la bulle de l'icône respire, prend son élan,
// grandit et l'on passe à travers sa paroi irisée pour arriver dans son univers.
import { TAU, clamp, rand } from './util.js';

const HOLO = [195, 230, 270, 310, 340, 20, 50, 160, 195];
const easeIn = (t) => t * t * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function conic(q, a, x, y, alpha, l = 74) {
  if (!q.createConicGradient) { const g = q.createLinearGradient(x - 100, y - 100, x + 100, y + 100); g.addColorStop(0, `hsla(195,95%,${l}%,${alpha})`); g.addColorStop(0.5, `hsla(310,95%,${l}%,${alpha})`); g.addColorStop(1, `hsla(50,95%,${l}%,${alpha})`); return g; }
  const g = q.createConicGradient(a, x, y); HOLO.forEach((h, i) => g.addColorStop(i / (HOLO.length - 1), `hsla(${h},95%,${l}%,${alpha})`)); return g;
}
function radial(q, x, y, r0, r1, stops) { const g = q.createRadialGradient(x, y, r0, x, y, r1); for (const [o, c] of stops) g.addColorStop(o, c); return g; }

/** Intérieur de la bulle : une lueur violette douce et un arc-en-ciel à peine visible au fond (comme l'icône). */
function interior(q, cx, cy, r, t, a) {
  if (a <= 0.01) return;
  q.save(); q.beginPath(); q.arc(cx, cy, r, 0, TAU); q.clip();
  q.globalAlpha = a; q.fillStyle = radial(q, cx, cy + r * 0.25, 0, r * 1.15, [[0, '#4a2a8c'], [0.6, '#22134f'], [1, '#0b0720']]); q.fillRect(cx - r, cy - r, r * 2, r * 2);
  q.globalAlpha = 1; q.globalCompositeOperation = 'screen';
  const br = 0.92 + Math.sin(t * 1.6) * 0.08; // la lueur respire
  q.fillStyle = radial(q, cx, cy + r * 0.18, 0, r * 0.62, [[0, `rgba(205,165,255,${0.6 * a * br})`], [0.5, `rgba(170,120,255,${0.25 * a * br})`], [1, 'rgba(170,120,255,0)']]); q.fillRect(cx - r, cy - r, r * 2, r * 2);
  q.lineWidth = r * 0.05;
  [0, 30, 55, 130, 195, 245, 285].forEach((h, k) => { q.strokeStyle = `hsla(${h},90%,70%,${0.1 * a})`; q.beginPath(); q.arc(cx, cy + r * 1.05, r * (0.92 - k * 0.045), Math.PI * 1.18, Math.PI * 1.82); q.stroke(); });
  q.globalCompositeOperation = 'source-over'; q.fillStyle = radial(q, cx, cy, r * 0.55, r, [[0, 'rgba(0,0,0,0)'], [1, `rgba(8,4,24,${0.7 * a})`]]); q.fillRect(cx - r, cy - r, r * 2, r * 2);
  const dome = q.createLinearGradient(0, cy - r, 0, cy); dome.addColorStop(0, `rgba(6,4,20,${0.7 * a})`); dome.addColorStop(1, 'rgba(6,4,20,0)'); q.fillStyle = dome; q.fillRect(cx - r, cy - r, r * 2, r);
  q.restore();
}

/** Reflet sous la bulle, sur une surface sombre et lisse : il s'efface quand la bulle grandit. */
function reflection(q, cx, cy, r, a) {
  if (a <= 0.01) return;
  const fy = cy + r + r * 0.05;
  q.save(); q.translate(cx, fy + r * 0.02); q.scale(1, 0.12); q.fillStyle = radial(q, 0, 0, 0, r * 0.85, [[0, `rgba(0,0,0,${0.5 * a})`], [1, 'rgba(0,0,0,0)']]); q.beginPath(); q.arc(0, 0, r * 0.85, 0, TAU); q.fill(); q.restore();
  q.save(); q.beginPath(); q.rect(cx - r * 1.2, fy, r * 2.4, r); q.clip();
  q.translate(0, fy * 2); q.scale(1, -1);
  const fade = q.createLinearGradient(0, fy, 0, fy - r * 0.9); fade.addColorStop(0, `rgba(150,110,240,${0.3 * a})`); fade.addColorStop(1, 'rgba(150,110,240,0)');
  q.fillStyle = fade; q.beginPath(); q.arc(cx, cy, r, 0, TAU); q.fill();
  q.strokeStyle = conic(q, -0.7, cx, cy, 0.35 * a, 82); q.lineWidth = Math.max(1.5, r * 0.02); q.beginPath(); q.arc(cx, cy, r * 0.99, Math.PI * 0.15, Math.PI * 0.85); q.stroke();
  q.restore();
  q.save(); q.globalCompositeOperation = 'lighter'; q.translate(cx, fy); q.scale(1, 0.1); q.fillStyle = radial(q, 0, 0, 0, r * 0.6, [[0, `rgba(190,140,255,${0.35 * a})`], [1, 'rgba(190,140,255,0)']]); q.beginPath(); q.arc(0, 0, r * 0.6, 0, TAU); q.fill(); q.restore();
}

/** Paroi irisée, halo et reflets. */
function shell(q, cx, cy, r, t, a) {
  if (a <= 0.01) return;
  q.save(); q.globalCompositeOperation = 'lighter';
  q.fillStyle = radial(q, cx, cy, r * 0.85, r * 1.45, [[0, `rgba(150,110,255,${0.22 * a})`], [1, 'rgba(150,110,255,0)']]); q.fillRect(cx - r * 1.5, cy - r * 1.5, r * 3, r * 3);
  q.fillStyle = radial(q, cx - r * 0.25, cy - r * 0.3, 0, r, [[0, `rgba(255,255,255,${0.07 * a})`], [0.75, `rgba(160,140,255,${0.05 * a})`], [0.95, `rgba(210,180,255,${0.08 * a})`], [1, 'rgba(255,255,255,0)']]); q.beginPath(); q.arc(cx, cy, r, 0, TAU); q.fill();
  const rot = -0.6 + t * 0.35;
  q.strokeStyle = conic(q, rot, cx, cy, 0.22 * a, 80); q.lineWidth = Math.max(6, r * 0.09); q.beginPath(); q.arc(cx, cy, r - q.lineWidth / 2, 0, TAU); q.stroke();
  q.strokeStyle = conic(q, rot, cx, cy, 0.95 * a, 84); q.lineWidth = Math.max(2, r * 0.022); q.beginPath(); q.arc(cx, cy, r - q.lineWidth / 2, 0, TAU); q.stroke();
  q.restore();
  // Reflets (lumière d'une fenêtre sur le verre).
  q.save(); q.globalAlpha = a;
  const hl = (x, y, rx, ry, rot, al) => { q.save(); q.translate(x, y); q.rotate(rot); q.scale(rx, ry); q.fillStyle = radial(q, 0, 0, 0, 1, [[0, `rgba(255,255,255,${al})`], [0.55, `rgba(255,255,255,${al * 0.7})`], [1, 'rgba(255,255,255,0)']]); q.beginPath(); q.arc(0, 0, 1, 0, TAU); q.fill(); q.restore(); };
  hl(cx - r * 0.4, cy - r * 0.55, r * 0.34, r * 0.13, -0.62, 0.8); hl(cx - r * 0.45, cy - r * 0.6, r * 0.14, r * 0.05, -0.62, 0.95); hl(cx + r * 0.6, cy + r * 0.55, r * 0.11, r * 0.04, -0.75, 0.55);
  q.restore();
}

export function bubbleRadius(W, H) { return Math.min(W, H) * 0.24; }

/**
 * Joue l'entrée. `opts.still` fige la première image (écran de démarrage iPhone).
 * Renvoie une fonction qui accélère l'entrée (toucher pendant l'animation).
 */
export function playIntro({ reduced = false, quick = false, still = false, onEnter, onDone } = {}) {
  const cv = document.createElement('canvas'); cv.id = 'entry'; cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;z-index:5;pointer-events:none;transition:opacity .5s ease';
  document.body.appendChild(cv); document.body.classList.add('entering');
  const q = cv.getContext('2d'); let W = 0, H = 0, dpr = 1;
  const size = () => { dpr = still ? devicePixelRatio || 1 : Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); };
  size(); addEventListener('resize', size);
  const stars = Array.from({ length: 140 }, () => ({ a: rand(TAU), d: rand(0.05, 1), s: rand(0.6, 1.8), h: HOLO[(Math.random() * 8) | 0] }));
  const IDLE = quick ? 0.15 : 0.95, GROW = quick ? 0.9 : 1.55; let t0 = performance.now(), skipAt = null, entered = false, done = false;

  function frame(now) {
    if (done) return;
    let t = (now - t0) / 1000; if (still) t = 0;
    if (skipAt !== null && t < IDLE) { t0 -= (IDLE - t) * 1000; t = IDLE; }
    const r0 = bubbleRadius(W, H), rMax = Math.hypot(W, H) * 0.62, cx = W / 2, cy = H / 2;
    q.setTransform(dpr, 0, 0, dpr, 0, 0); q.clearRect(0, 0, W, H);
    let r, k = 0;
    if (reduced && !still) { // version sobre : simple fondu
      const f = clamp(t / 0.8, 0, 1); r = r0; q.globalAlpha = 1 - f; drawAll(r0, 0, t); q.globalAlpha = 1; document.getElementById('boot')?.remove(); if (f >= 1) finish(); else requestAnimationFrame(frame); return;
    }
    if (t < IDLE) r = r0 * (1 + Math.sin(t * 5) * 0.015);
    else {
      k = clamp((t - IDLE) / GROW, 0, 1);
      const squash = Math.sin(clamp(k / 0.16, 0, 1) * Math.PI) * 0.07; // petit élan avant de grandir
      r = r0 * (1 - squash) + (rMax - r0) * easeIn(smooth(0.08, 1, k));
      if (!entered && k > 0.35) { entered = true; onEnter && onEnter(); }
    }
    drawAll(r, k, t); document.getElementById('boot')?.remove();
    if (k >= 1) finish(); else requestAnimationFrame(frame);
  }

  function drawAll(r, k, t) {
    const cx = W / 2, cy = H / 2;
    // Nuit autour de la bulle, percée par la bulle : l'univers du jeu apparaît à l'intérieur.
    const bg = q.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0a0720'); bg.addColorStop(1, '#05040b'); q.fillStyle = bg; q.fillRect(0, 0, W, H);
    q.fillStyle = radial(q, cx, cy, 0, Math.max(W, H) * 0.7, [[0, 'rgba(40,24,90,0.3)'], [1, 'rgba(0,0,0,0)']]); q.fillRect(0, 0, W, H);
    for (const s of stars) { const d = s.d * Math.max(W, H) * 0.6; const tw = 0.4 + 0.6 * Math.sin(t * 2 + s.a * 5); q.fillStyle = `rgba(220,225,255,${0.35 * tw * (1 - k)})`; q.fillRect(cx + Math.cos(s.a) * d, cy + Math.sin(s.a) * d, s.s, s.s); }
    q.save(); q.globalCompositeOperation = 'destination-out'; q.fillStyle = radial(q, cx, cy, Math.max(0, r * 0.96), r, [[0, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]); q.beginPath(); q.arc(cx, cy, r, 0, TAU); q.fill(); q.restore();
    interior(q, cx, cy, r, t, 1 - smooth(0.25, 0.85, k));
    // Étoiles qui filent vers nous depuis l'intérieur de la bulle : on plonge dedans.
    if (k > 0.12) { q.save(); q.beginPath(); q.arc(cx, cy, r, 0, TAU); q.clip(); q.globalCompositeOperation = 'lighter'; q.lineCap = 'round'; const sp = easeIn(smooth(0.12, 1, k)); const fade = Math.sin(Math.PI * smooth(0.12, 1, k));
      for (const s of stars) { const d0 = r * s.d * 0.85 * (1 + sp * 0.6); const len = r * 0.02 + r * sp * 0.22 * s.s * s.d; const x0 = cx + Math.cos(s.a) * d0, y0 = cy + Math.sin(s.a) * d0;
        q.strokeStyle = `hsla(${s.h},95%,82%,${0.6 * fade})`; q.lineWidth = s.s * (0.8 + sp * 1.6); q.beginPath(); q.moveTo(x0, y0); q.lineTo(x0 + Math.cos(s.a) * len, y0 + Math.sin(s.a) * len); q.stroke(); }
      q.restore(); }
    reflection(q, cx, cy, r, 1 - smooth(0, 0.3, k));
    shell(q, cx, cy, r, t, 1 - smooth(0.7, 1, k));
  }

  function finish() {
    if (done) return; done = true; if (!entered) { entered = true; onEnter && onEnter(); }
    document.body.classList.remove('entering'); cv.style.opacity = '0'; setTimeout(() => { cv.remove(); removeEventListener('resize', size); }, 600);
    onDone && onDone();
  }

  if (still) { frame(performance.now()); return () => {}; }
  requestAnimationFrame(frame);
  // Un toucher pendant l'attente lance l'entrée tout de suite.
  return () => { if (skipAt === null) skipAt = performance.now(); };
}
