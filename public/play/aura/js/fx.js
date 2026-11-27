// Rendu lumineux : palettes, sprites de halo, réserve de particules (structure de tableaux), rubans.
import { TAU, clamp, lerp, rand, noise2, hueWrap } from './util.js';

// ---------- Palettes ----------
export const PALETTES = {
  aurora: { stops: [200, 260, 300, 340, 20, 50, 120, 170, 200], sat: 88, name: { fr: 'Aurore', en: 'Aurora' } },
  ocean: { stops: [165, 190, 215, 240, 265, 215, 165], sat: 80, name: { fr: 'Océan', en: 'Ocean' } },
  garden: { stops: [330, 350, 40, 80, 130, 160, 330], sat: 75, name: { fr: 'Jardin', en: 'Garden' } },
  ember: { stops: [345, 10, 25, 40, 30, 15, 345], sat: 80, name: { fr: 'Braise douce', en: 'Soft ember' } },
  moon: { stops: [220, 245, 270, 290, 250, 220], sat: 38, name: { fr: 'Lune', en: 'Moon' } },
  // Palettes à débloquer sur le Chemin.
  nebula: { stops: [285, 310, 330, 260, 210, 285], sat: 85, name: { fr: 'Nébuleuse', en: 'Nebula' } },
  coral: { stops: [350, 8, 22, 175, 190, 350], sat: 78, name: { fr: 'Corail', en: 'Coral' } },
  frost: { stops: [185, 200, 215, 235, 255, 185], sat: 48, name: { fr: 'Givre', en: 'Frost' } },
  gold: { stops: [42, 50, 30, 18, 38, 42], sat: 88, name: { fr: 'Or', en: 'Gold' } },
  iris: { stops: [0, 45, 90, 150, 200, 250, 300, 360], sat: 96, name: { fr: 'Iris', en: 'Iris' } },
};
// Teintes du sommeil : ambres et roses très doux, sans bleu (moins stimulant le soir).
const SLEEP = { stops: [8, 20, 32, 40, 26, 350, 8], sat: 70 };

export const palette = { id: 'aurora', spread: 0.15, base: 0, night: false };
export function setPalette(id, colorsLvl, night, sleeping = false) {
  palette.id = PALETTES[id] ? id : 'aurora'; palette.night = night; palette.sleeping = sleeping;
  palette.spread = 0.38 + (colorsLvl / 8) * 0.62; // variée dès le début, arc-en-ciel complet avec le Prisme
  buildSprites();
}
const P = () => (palette.sleeping ? SLEEP : PALETTES[palette.night ? 'ember' : palette.id]);
/** Teinte pour une position t (0..1) dans le geste ; la base dérive lentement avec le temps. */
export function hue(t = Math.random()) {
  const st = P().stops; const pos = ((palette.base + (t - 0.5) * palette.spread) % 1 + 1) % 1;
  const k = pos * (st.length - 1); const i = Math.floor(k); const f = k - i;
  let a = st[i], b = st[Math.min(st.length - 1, i + 1)]; let d = b - a; if (d > 180) d -= 360; if (d < -180) d += 360;
  return hueWrap(a + d * f);
}
/** Teinte à une position absolue de la palette (0..1), qui dérive lentement : chaque geste peut avoir sa couleur. */
export function hueAt(pos) {
  const st = P().stops; const q = ((pos + palette.base) % 1 + 1) % 1; const k = q * (st.length - 1); const i = Math.floor(k); const f = k - i;
  let a = st[i], b = st[Math.min(st.length - 1, i + 1)]; let d = b - a; if (d > 180) d -= 360; if (d < -180) d += 360;
  return hueWrap(a + d * f);
}
export const sat = () => P().sat;
export const col = (h, l = 70, a = 1, s = sat()) => `hsla(${h | 0},${s}%,${l}%,${a})`;

// ---------- Sprites ----------
const BUCKETS = 36; let sprites = []; let curtains = [];
function buildSprites() {
  sprites = []; curtains = []; const s = sat();
  for (let i = 0; i < BUCKETS; i++) {
    const h = i * 10; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `hsla(${h},${s}%,90%,1)`); gr.addColorStop(0.12, `hsla(${h},${s}%,74%,0.8)`); // cœur coloré : garde sa teinte quand tout se superpose
    gr.addColorStop(0.32, `hsla(${h},${s}%,64%,0.32)`); gr.addColorStop(0.62, `hsla(${h},${s}%,56%,0.08)`); gr.addColorStop(1, `hsla(${h},${s}%,50%,0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); sprites.push(c);
    // Rideau vertical d'aurore.
    const v = document.createElement('canvas'); v.width = 16; v.height = 128; const gv = v.getContext('2d');
    const lg = gv.createLinearGradient(0, 0, 0, 128);
    lg.addColorStop(0, `hsla(${h},${s}%,75%,0)`); lg.addColorStop(0.15, `hsla(${h},${s}%,78%,0.55)`); lg.addColorStop(0.45, `hsla(${(h + 40) % 360},${s}%,66%,0.22)`); lg.addColorStop(1, `hsla(${(h + 80) % 360},${s}%,60%,0)`);
    gv.fillStyle = lg; gv.fillRect(0, 0, 16, 128);
    // Bords latéraux doux : les rideaux se fondent les uns dans les autres, sans rayures.
    const hg = gv.createLinearGradient(0, 0, 16, 0); hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(0.5, 'rgba(0,0,0,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
    gv.globalCompositeOperation = 'destination-in'; gv.fillStyle = hg; gv.fillRect(0, 0, 16, 128); curtains.push(v);
  }
}
export const sprite = (h) => sprites[(Math.round(hueWrap(h) / 10)) % BUCKETS];
export const curtain = (h) => curtains[(Math.round(hueWrap(h) / 10)) % BUCKETS];
export function glow(ctx, x, y, r, h, a = 1) { if (a <= 0.003 || r <= 0.2) return; ctx.globalAlpha = Math.min(1, a); ctx.drawImage(sprite(h), x - r, y - r, r * 2, r * 2); }

// ---------- Particules ----------
// kind : 0 halo · 1 étincelle à traînée · 2 pétale (halo étiré, lent) · 3 braise flottante
export class Particles {
  constructor(cap = 6000) {
    this.cap = cap; this.n = 0;
    const F = () => new Float32Array(cap);
    this.x = F(); this.y = F(); this.vx = F(); this.vy = F(); this.age = F(); this.life = F(); this.h = F(); this.s = F();
    this.drag = F(); this.grav = F(); this.tur = F(); this.hd = F(); this.k = new Uint8Array(cap); this.a = F();
    this.budget = cap; this.attractors = []; this.trail = 1; this.timeScale = 1;
  }
  /** Ajoute une particule ; renvoie false si le budget est atteint. */
  add(x, y, vx, vy, o = {}) {
    if (this.n >= this.budget) {
      // Recycle la plus ancienne en douceur plutôt que de refuser un geste.
      const i = (Math.random() * this.n) | 0; if (this.age[i] / this.life[i] < 0.6) return false; this.set(i, x, y, vx, vy, o); return true;
    }
    this.set(this.n++, x, y, vx, vy, o); return true;
  }
  set(i, x, y, vx, vy, o) {
    this.x[i] = x; this.y[i] = y; this.vx[i] = vx; this.vy[i] = vy; this.age[i] = 0;
    this.life[i] = o.life ?? rand(1.2, 2.6); this.h[i] = o.h ?? hue(); this.s[i] = o.s ?? rand(3, 7);
    this.drag[i] = o.drag ?? 1.6; this.grav[i] = o.grav ?? -6; this.tur[i] = o.tur ?? 18; this.hd[i] = o.hd ?? rand(-12, 12);
    this.k[i] = o.k ?? 0; this.a[i] = o.a ?? 1;
  }
  update(dt, t) {
    dt *= this.timeScale; const A = this.attractors; const nt = t * 0.12;
    for (let i = 0; i < this.n; i++) {
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) { this.swap(i, --this.n); i--; continue; }
      let ax = 0, ay = this.grav[i];
      const tu = this.tur[i];
      if (tu > 0) { const nx = this.x[i] * 0.004, ny = this.y[i] * 0.004; const ang = noise2(nx + nt, ny) * TAU * 2; ax += Math.cos(ang) * tu; ay += Math.sin(ang) * tu; }
      for (let j = 0; j < A.length; j++) {
        const at = A[j]; const dx = at.x - this.x[i], dy = at.y - this.y[i]; const d2 = dx * dx + dy * dy;
        if (d2 > at.r * at.r || d2 < 1) continue; const d = Math.sqrt(d2); const f = (1 - d / at.r) * at.str;
        ax += (dx / d) * f - (dy / d) * f * (at.swirl || 0); ay += (dy / d) * f + (dx / d) * f * (at.swirl || 0);
      }
      const dr = Math.exp(-this.drag[i] * dt);
      this.vx[i] = (this.vx[i] + ax * dt) * dr; this.vy[i] = (this.vy[i] + ay * dt) * dr;
      this.x[i] += this.vx[i] * dt; this.y[i] += this.vy[i] * dt; this.h[i] += this.hd[i] * dt;
    }
  }
  swap(i, j) {
    if (i === j) return;
    for (const arr of [this.x, this.y, this.vx, this.vy, this.age, this.life, this.h, this.s, this.drag, this.grav, this.tur, this.hd, this.k, this.a]) arr[i] = arr[j];
  }
  draw(ctx, intensity = 1) {
    const trailK = 0.045 * this.trail;
    // Traînées des étincelles : regroupées par teinte pour limiter les changements d'état.
    const buckets = new Map();
    for (let i = 0; i < this.n; i++) {
      if (this.k[i] !== 1) continue;
      const p = this.age[i] / this.life[i]; const al = (p < 0.08 ? p / 0.08 : 1) * Math.pow(1 - p, 1.4) * this.a[i];
      const key = ((Math.round(hueWrap(this.h[i]) / 20)) % 18) * 4 + Math.min(3, (al * 4) | 0);
      let b = buckets.get(key); if (!b) { b = []; buckets.set(key, b); } b.push(i);
    }
    ctx.lineCap = 'round';
    for (const [key, list] of buckets) {
      const h = Math.floor(key / 4) * 20, al = ((key % 4) + 0.5) / 4;
      ctx.globalAlpha = al * 0.8 * intensity; ctx.strokeStyle = `hsl(${h},${sat()}%,78%)`; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (const i of list) { ctx.moveTo(this.x[i], this.y[i]); ctx.lineTo(this.x[i] - this.vx[i] * trailK, this.y[i] - this.vy[i] * trailK); }
      ctx.stroke(); ctx.lineWidth = 2.6; ctx.globalAlpha = Math.min(1, al * 1.1 * intensity); ctx.beginPath(); for (const i of list) { ctx.moveTo(this.x[i], this.y[i]); ctx.lineTo(this.x[i] + 0.1, this.y[i]); } ctx.stroke();
    }
    const W = ctx.canvas.width / (ctx.getTransform ? ctx.getTransform().a || 1 : 1), H = ctx.canvas.height / (ctx.getTransform ? ctx.getTransform().d || 1 : 1);
    for (let i = 0; i < this.n; i++) {
      if (this.k[i] === 1) continue; // les étincelles sont déjà dessinées en traits lumineux (une seule fois)
      const x = this.x[i], y = this.y[i]; if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue; // hors écran
      const p = this.age[i] / this.life[i];
      const fin = this.k[i] === 3 ? Math.sin(p * Math.PI) : (p < 0.1 ? p / 0.1 : 1) * Math.pow(1 - p, 1.3);
      const al = fin * this.a[i] * intensity; if (al < 0.02) continue;
      let s = this.s[i] * (this.k[i] === 1 ? 1 - p * 0.6 : 0.7 + p * 0.6);
      if (this.k[i] === 2) s *= 1.6;
      ctx.globalAlpha = Math.min(1, al); ctx.drawImage(sprite(this.h[i]), this.x[i] - s, this.y[i] - s, s * 2, s * 2);
    }
    ctx.globalAlpha = 1;
  }
}

/** Gerbe de particules (feu d'artifice doux). */
export function burst(P, x, y, { n = 40, speed = 160, h = null, spread = 1, life = 2.2, k = 1, s = 4, drag = 2.2, grav = 10, tur = 10, hd = 18, ring = false } = {}) {
  for (let i = 0; i < n; i++) {
    const a = ring ? (i / n) * TAU : rand(TAU); const v = ring ? speed * rand(0.88, 1.06) : speed * Math.sqrt(Math.random()) * rand(0.4, 1);
    P.add(x, y, Math.cos(a) * v, Math.sin(a) * v, { h: h === null ? hue(i / n) : h + rand(-25, 25) * spread, life: life * rand(0.7, 1.25), k, s: s * rand(0.7, 1.3), drag, grav, tur, hd: rand(-hd, hd) });
  }
}

/** Ruban lumineux multicouche : halo, cœur, filaments latéraux ondulants. */
export function ribbon(ctx, pts, { width = 3, alpha = 1, strands = 2, t = 0, hueOf = null, glowK = 1 } = {}) {
  const n = pts.length; if (n < 2) return;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // Courbes lissées (milieux + courbes quadratiques), regroupées par tronçons :
  // pas de « perles » aux jonctions, et peu de changements d'état.
  const CH = 6; const mid = (i) => ({ x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 });
  for (let layer = 0; layer < 3; layer++) {
    const lw = layer === 0 ? width * 7 : layer === 1 ? width * 2.4 : width * 0.8;
    const la = layer === 0 ? 0.08 * glowK : layer === 1 ? 0.24 : 0.9;
    const l = layer === 2 ? 90 : layer === 1 ? 72 : 62;
    for (let i0 = 0; i0 < n - 1; i0 += CH) {
      const i1 = Math.min(n - 1, i0 + CH); const pm = pts[(i0 + i1) >> 1];
      const f = ((pts[i0].f ?? 1) + (pts[i1].f ?? 1)) / 2; const a = la * alpha * f; if (a < 0.01) continue;
      const h = hueOf ? hueOf(((i0 + i1) / 2) / n, pm) : pm.h ?? 200;
      ctx.globalAlpha = Math.min(1, a); ctx.strokeStyle = `hsl(${h | 0},${sat()}%,${l}%)`; ctx.lineWidth = lw * (pm.w ?? 1);
      ctx.lineCap = layer === 2 || i0 === 0 || i1 === n - 1 ? 'round' : 'butt';
      ctx.beginPath();
      const s0 = i0 === 0 ? pts[0] : mid(i0 - 1); ctx.moveTo(s0.x, s0.y);
      for (let i = i0; i < i1; i++) { const m = i + 1 < n - 1 ? mid(i) : pts[n - 1]; if (i === i0 && i0 === 0) { ctx.lineTo(m.x, m.y); continue; } ctx.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y); }
      ctx.stroke();
    }
  }
  ctx.lineCap = 'round';
  // Filaments latéraux, comme des fibres de lumière qui respirent autour du geste.
  for (let s = 0; s < strands; s++) {
    const ph = s * 2.1 + t * (1.3 + s * 0.4); const amp = width * (2.2 + s * 1.4);
    ctx.lineWidth = 0.9; ctx.beginPath(); let started = false; let lastH = -1;
    for (let i = 1; i < n - 1; i++) {
      const p = pts[i]; const nx = -(pts[i + 1].y - pts[i - 1].y), ny = pts[i + 1].x - pts[i - 1].x; const nl = Math.hypot(nx, ny) || 1;
      const o = Math.sin(i * 0.22 + ph) * amp * (p.w ?? 1) * Math.sin((i / n) * Math.PI);
      const x = p.x + (nx / nl) * o, y = p.y + (ny / nl) * o;
      const h = (hueOf ? hueOf(i / n, p) : p.h ?? 200) + 30 * (s + 1);
      if (!started) { ctx.moveTo(x, y); started = true; lastH = h; continue; }
      ctx.lineTo(x, y);
      if (i % 8 === 0 || i === n - 2) { ctx.globalAlpha = 0.45 * alpha * (p.f ?? 1); ctx.strokeStyle = `hsl(${lastH | 0},${sat()}%,80%)`; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); lastH = h; }
    }
  }
  ctx.globalAlpha = 1;
}

export { clamp, lerp };
