// L'univers personnel : ce qui reste de tes créations, et qui continue de vivre.
// Coordonnées normalisées (0..1) pour survivre aux rotations et changements d'écran.
import { TAU, rand, clamp } from './util.js';
import { glow, curtain, sat, hue } from './fx.js';
import { audio } from './audio.js';

const CAP = { stars: 220, flowers: 90, galaxies: 12, loops: 10, constellations: 16, auroras: 3, nebula: 140 };

export class Universe {
  constructor(state) { this.s = state; this.neb = document.createElement('canvas'); this.dirty = true; this.bg = null; this.field = []; this.lastMusic = 0; this.galaxySprites = new Map(); this.W = 1; this.H = 1; }
  get u() { return this.s.universe; }
  resize(W, H) { this.W = W; this.H = H; this.dirty = true; this.bg = null; this.makeField(); }
  makeField() {
    // Champ d'étoiles lointaines : plus dense à mesure que l'univers grandit.
    const n = 40 + Math.min(260, this.s.level * 5 + this.u.stars.length);
    if (this.field.length === n) return;
    this.field = Array.from({ length: n }, (_, i) => ({ x: Math.random(), y: Math.random(), s: rand(0.4, 1.3), p: rand(TAU), h: hue(Math.random()), i }));
  }
  push(list, item, cap) { list.push(item); if (list.length > cap) list.splice(0, list.length - cap); }
  nx(x) { return clamp(x / this.W, 0.02, 0.98); } ny(y) { return clamp(y / this.H, 0.02, 0.98); }

  addStar(x, y, h, mag = 1) { this.push(this.u.stars, { x: this.nx(x), y: this.ny(y), h: h | 0, m: +mag.toFixed(2), p: +rand(TAU).toFixed(2) }, CAP.stars); this.makeField(); }
  addFlower(x, y, h, n = 6, s = 1) { this.push(this.u.flowers, { x: this.nx(x), y: this.ny(y), h: h | 0, n, s: +s.toFixed(2), p: +rand(TAU).toFixed(2) }, CAP.flowers); }
  addGalaxy(x, y, h, s = 1) { this.push(this.u.galaxies, { x: this.nx(x), y: this.ny(y), h: h | 0, s: +s.toFixed(2), r: +rand(TAU).toFixed(2), d: Math.random() < 0.5 ? 1 : -1, seed: (Math.random() * 1e6) | 0 }, CAP.galaxies); }
  addLoop(x, y, r, h) { this.push(this.u.loops, { x: this.nx(x), y: this.ny(y), r: +(r / Math.min(this.W, this.H)).toFixed(3), h: h | 0 }, CAP.loops); }
  addConstellation(nodes, h, edges = null, keep = false) { const c = { n: nodes.map((p) => [+this.nx(p.x).toFixed(3), +this.ny(p.y).toFixed(3)]), h: h | 0 }; if (edges) c.e = edges; if (keep) { c.k = 1; this.u.constellations.push(c); } else this.push(this.u.constellations, c, CAP.constellations); }
  addAurora(h) { this.push(this.u.auroras, { h: h | 0, p: +rand(TAU).toFixed(2), y: +rand(0.05, 0.25).toFixed(2) }, CAP.auroras); }
  /** Dépose un peu de couleur dans la nébuleuse : la mémoire visuelle de tous tes gestes. */
  deposit(x, y, h, amount = 1) {
    const neb = this.u.nebula; const X = this.nx(x), Y = this.ny(y);
    const near = neb.find((b) => Math.hypot(b.x - X, b.y - Y) < 0.08 && Math.abs(((b.h - h + 540) % 360) - 180) < 50);
    if (near) { near.a = Math.min(0.2, +(near.a + 0.008 * amount).toFixed(3)); near.r = Math.min(0.3, +(near.r + 0.003 * amount).toFixed(3)); /* la nébuleuse s'étoffe sans devenir un gros nuage */ }
    else if (neb.length < CAP.nebula) neb.push({ x: +X.toFixed(3), y: +Y.toFixed(3), h: h | 0, r: +(0.08 + 0.03 * amount).toFixed(3), a: +(0.05 * Math.min(2, amount)).toFixed(3) });
    else { const b = neb[(Math.random() * neb.length) | 0]; b.a = Math.min(0.2, b.a + 0.006); }
    this.dirty = true;
  }
  count() { const u = this.u; return u.stars.length + u.flowers.length + u.galaxies.length * 6 + u.loops.length * 3 + u.constellations.length * 4 + u.auroras.length * 5; }

  buildNebula() {
    const W = this.W, H = this.H; const sc = 0.2; const c = this.neb; c.width = Math.max(2, Math.ceil(W * sc)); c.height = Math.max(2, Math.ceil(H * sc));
    const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.globalCompositeOperation = 'screen'; // les nuages se fondent sans saturer
    const m = Math.max(c.width, c.height); const S = sat();
    for (const b of this.u.nebula) {
      const x = b.x * c.width, y = b.y * c.height, r = b.r * m; const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `hsla(${b.h},${S}%,60%,${b.a})`); gr.addColorStop(0.5, `hsla(${(b.h + 25) % 360},${S}%,45%,${b.a * 0.4})`); gr.addColorStop(1, `hsla(${b.h},${S}%,40%,0)`);
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    this.dirty = false;
  }
  /** Dégradé du fond, dessiné en pleine résolution (pas d'image agrandie, donc pas de bandes). */
  buildBg(ctx) {
    const night = this.s.settings.night || this.sleep; const gr = ctx.createLinearGradient(0, 0, 0, this.H);
    gr.addColorStop(0, night ? '#0b0608' : '#06060f'); gr.addColorStop(0.6, night ? '#0d0709' : '#080714'); gr.addColorStop(1, night ? '#120a09' : '#0d0a1a');
    this.bg = gr;
  }
  galaxySprite(gx) {
    if (this.galaxySprites.has(gx.seed)) return this.galaxySprites.get(gx.seed);
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.globalCompositeOperation = 'lighter';
    let s = gx.seed; const R = () => ((s = (s * 16807) % 2147483647) / 2147483647); const S = sat();
    const core = g.createRadialGradient(128, 128, 0, 128, 128, 60); core.addColorStop(0, `hsla(${gx.h + 40},${S}%,85%,0.7)`); core.addColorStop(1, `hsla(${gx.h},${S}%,50%,0)`); g.fillStyle = core; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {
      const arm = Math.floor(R() * 3); const t = Math.pow(R(), 0.7); const ang = arm * TAU / 3 + t * 5.5 + (R() - 0.5) * 0.6 * (1 - t * 0.5); const r = t * 118;
      const x = 128 + Math.cos(ang) * r, y = 128 + Math.sin(ang) * r; const sz = R() * 1.8 + 0.4;
      g.fillStyle = `hsla(${(gx.h + t * 140 + R() * 30) % 360},${S}%,${70 + R() * 20}%,${0.25 + R() * 0.5})`; g.fillRect(x, y, sz, sz);
    }
    this.galaxySprites.set(gx.seed, c); return c;
  }

  /** Production passive visible : renvoie un point de l'univers d'où part une lueur. */
  randomSource() {
    const u = this.u; const all = [...u.stars, ...u.flowers, ...u.galaxies]; if (!all.length) return null;
    const o = all[(Math.random() * all.length) | 0]; return { x: o.x * this.W, y: o.y * this.H, h: o.h };
  }

  draw(ctx, t, G) {
    if (!this._nebFix) { this._nebFix = true; for (const b of this.u.nebula) { b.a = Math.min(b.a, 0.2); b.r = Math.min(b.r, 0.3); } this.dirty = true; }
    const W = this.W, H = this.H; const u = this.u; const I = G.intensity;
    if (!this.bg) this.buildBg(ctx);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = this.bg; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    if (this.dirty && (!this._nebT || t - this._nebT > 0.8)) { this._nebT = t; this.buildNebula(); }
    if (u.nebula.length) {
      // Deux couches de nébuleuse qui dérivent à des vitesses différentes : profondeur.
      const dx = Math.sin(t * 0.03) * 14, dy = Math.cos(t * 0.025) * 10;
      ctx.globalAlpha = 0.75 * I * (0.85 + 0.15 * Math.sin(t * 0.2)); ctx.drawImage(this.neb, dx, dy, W, H);
      ctx.globalAlpha = 0.35 * I; ctx.drawImage(this.neb, -dx * 2 - W * 0.04, -dy * 2 - H * 0.04, W * 1.08, H * 1.08);
    }
    // Étoiles lointaines.
    for (const f of this.field) { const tw = 0.5 + 0.5 * Math.sin(t * (0.6 + f.s) + f.p); glow(ctx, f.x * W, f.y * H, 2.2 * f.s + 1, f.h, (0.12 + 0.3 * tw) * I); }
    // Aurores conservées.
    for (const a of u.auroras) {
      const n = 44; const cw = W / n; for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * W; const y = H * a.y + Math.sin(i * 0.2 + t * 0.25 + a.p) * H * 0.04; const hh = H * (0.25 + 0.1 * Math.sin(i * 0.27 + t * 0.4 + a.p)); ctx.globalAlpha = 0.06 * I; ctx.drawImage(curtain(a.h + i * 2 + Math.sin(t * 0.1) * 20), x - cw * 2, y, cw * 4, hh); }
    }
    // Galaxies qui tournent lentement.
    for (const gx of u.galaxies) {
      const sp = this.galaxySprite(gx); const sz = Math.min(W, H) * 0.32 * gx.s;
      ctx.save(); ctx.translate(gx.x * W, gx.y * H); ctx.rotate(gx.r + t * 0.03 * gx.d); ctx.scale(1, 0.62); ctx.globalAlpha = 0.75 * I; ctx.drawImage(sp, -sz / 2, -sz / 2, sz, sz); ctx.restore();
    }
    // Constellations.
    ctx.lineWidth = 0.8;
    for (const c of u.constellations) {
      // Discrètes : on devine la figure plus qu'on ne la voit (un léger reflet passe de temps en temps).
      const ci = u.constellations.indexOf(c); ctx.globalAlpha = (c.k ? 0.045 + 0.05 * Math.max(0, Math.sin(t * 0.12 + ci * 1.7)) ** 4 : 0.07) * I; ctx.strokeStyle = `hsl(${c.h},${sat()}%,80%)`; ctx.beginPath(); if (c.e) for (const [a, b] of c.e) { ctx.moveTo(c.n[a][0] * W, c.n[a][1] * H); ctx.lineTo(c.n[b][0] * W, c.n[b][1] * H); } else c.n.forEach(([x, y], i) => (i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H))); ctx.stroke();
      c.n.forEach(([x, y], i) => glow(ctx, x * W, y * H, 4.5, c.h + i * 15, (0.22 + 0.12 * Math.sin(t * 1.3 + i * 2.1)) * I));
    }
    // Boucles éternelles.
    for (const l of u.loops) {
      const R = l.r * Math.min(W, H); const cx = l.x * W, cy = l.y * H;
      for (let j = 0; j < 6; j++) { const s = t * 0.4 - j * 0.05; const d = 1 + Math.sin(s) ** 2; glow(ctx, cx + Math.cos(s) / d * R, cy + Math.sin(s) * Math.cos(s) / d * R, 6 - j * 0.7, l.h + j * 10, (0.5 - j * 0.07) * I); }
    }
    // Fleurs qui ondulent.
    for (const fl of u.flowers) {
      const cx = fl.x * W, cy = fl.y * H; const sz = 10 * fl.s; const rot = fl.p + Math.sin(t * 0.4 + fl.p) * 0.3;
      for (let i = 0; i < fl.n; i++) { const a = rot + (i / fl.n) * TAU; glow(ctx, cx + Math.cos(a) * sz, cy + Math.sin(a) * sz, sz * 0.8, fl.h + i * 6, 0.22 * I); }
      glow(ctx, cx, cy, sz * 0.7, fl.h + 40, 0.4 * I);
    }
    // Étoiles créées.
    for (const st of u.stars) { const tw = 0.6 + 0.4 * Math.sin(t * 0.9 + st.p); const x = st.x * W, y = st.y * H; glow(ctx, x, y, 9 * st.m * (0.8 + tw * 0.3), st.h, 0.55 * tw * I); glow(ctx, x, y, 3, st.h, 0.9 * I); }

    // Musique de l'univers : quelques notes douces jouées par tes étoiles.
    const richness = this.count();
    if (richness > 0 && G.audioOn && t - this.lastMusic > Math.max(2.2, 9 - richness * 0.05) * (this.sleep ? 2.5 : 1)) {
      this.lastMusic = t; const src = this.randomSource();
      if (src) { audio.note(4 + Math.round((1 - src.y / H) * 9), { kind: Math.random() < 0.5 ? 'glass' : 'kalimba', vel: 0.16, pan: (src.x / W) * 2 - 1 }); G.twinkle(src.x, src.y, src.h); }
    }
    ctx.globalAlpha = 1;
  }
}
