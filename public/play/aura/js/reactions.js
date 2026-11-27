// Harmonies : quand des formes vivantes se rencontrent, elles réagissent ensemble.
import { TAU, clamp, rand, smooth, easeOut, dist } from './util.js';
import { hue, glow, burst, curtain, sat } from './fx.js';
import { COMBOS } from './economy.js';
import { audio } from './audio.js';

/** Cherche une harmonie déclenchée par la création `c`. Renvoie { combo, parts } ou null. */
export function findReaction(G, c) {
  const alive = G.creations.filter((o) => !o.dead && !o.reacted && o !== c && G.t - o.born < G.reactWindow);
  const near = (o) => dist(o.cx, o.cy, c.cx, c.cy) < G.reactDist + (o.r + c.r) * 0.6;
  for (const combo of COMBOS) {
    if (!(c.type in combo.need)) continue;
    if (G.level < Math.max(...Object.keys(combo.need).map((t) => G.formLevel(t)))) continue;
    const parts = [c]; let ok = true;
    for (const [type, cnt] of Object.entries(combo.need)) {
      const have = type === c.type ? 1 : 0; const need = cnt - have; if (need <= 0) continue;
      const pool = cnt >= 3 ? alive.concat((G.gone || []).filter((o) => !o.reacted && G.t - o.born < Math.max(20, G.reactWindow * 2.2))) : alive;
      const cands = pool.filter((o) => o.type === type && !parts.includes(o) && (cnt >= 3 || near(o)));
      if (combo.cross) {
        const target = type === 'line' ? null : cands.find((o) => crosses(c, o));
        const lineFirst = type === 'line' ? cands.find((o) => crosses(o, c)) : null;
        const hit = target || lineFirst; if (!hit) { ok = false; break; } parts.push(hit); continue;
      }
      if (cands.length < need) { ok = false; break; }
      cands.sort((a, b) => dist(a.cx, a.cy, c.cx, c.cy) - dist(b.cx, b.cy, c.cx, c.cy));
      parts.push(...cands.slice(0, need));
    }
    if (ok) return { combo, parts };
  }
  return null;
}

/** Le segment de la ligne `l` passe-t-il à travers la forme `o` ? */
function crosses(l, o) {
  if (l.type !== 'line') return false;
  const a = l.ideal[0], b = l.ideal[l.ideal.length - 1]; const dx = b.x - a.x, dy = b.y - a.y; const L2 = dx * dx + dy * dy || 1;
  const t = clamp(((o.cx - a.x) * dx + (o.cy - a.y) * dy) / L2, 0, 1); const px = a.x + dx * t, py = a.y + dy * t;
  return dist(px, py, o.cx, o.cy) < o.r * 1.25 + 20;
}

/** Effet visuel d'une harmonie (objet animé autonome). */
export class Reaction {
  constructor(G, combo, parts) {
    this.G = G; this.id = combo.id; this.parts = parts; this.born = G.t; this.dead = false;
    this.cx = parts.reduce((s, p) => s + p.cx, 0) / parts.length; this.cy = parts.reduce((s, p) => s + p.cy, 0) / parts.length;
    this.r = Math.max(60, ...parts.map((p) => p.r)); this.h0 = hue(Math.random());
    this.life = { cosmic: 4.5, vortex: 7, garden: 9, constellation: 9, pulse: 5, aurora: 14, tide: 4, starburst: 3, rainbow: 5, eternal: 10 }[this.id] * (G.reduced ? 0.8 : 1);
    for (const p of parts) { p.reacted = true; p.life = Math.min(p.life, p.age + 1.6); }
    this.start();
  }
  get age() { return this.G.t - this.born; }
  start() {
    const G = this.G; const bm = G.burstMult; const pm = G.pm; const U = G.universe;
    switch (this.id) {
      case 'cosmic':
        for (let w = 0; w < 3; w++) setTimeout(() => !this.dead && burst(G.P, this.cx, this.cy, { n: Math.round(70 * pm * bm), speed: (180 + w * 90) * bm, life: 3, s: 4.5, ring: w === 1, hd: 60, k: w === 2 ? 0 : 1 }), w * 260);
        for (let j = 0; j < 5; j++) U.addStar(this.cx + rand(-1, 1) * this.r * 2, this.cy + rand(-1, 1) * this.r * 2, hue(j / 5), 0.6);
        break;
      case 'garden':
        this.blooms = Array.from({ length: 7 + G.bloom * 2 }, () => ({ x: this.cx + rand(-1, 1) * this.r * 2.2, y: this.cy + rand(-0.6, 1) * this.r * 1.6, t: rand(0, 1.8), h: hue(Math.random()), n: 5 + ((Math.random() * 3) | 0), s: rand(14, 30) }));
        for (const b of this.blooms) U.addFlower(b.x, b.y, b.h, b.n, 0.8);
        break;
      case 'constellation': {
        this.nodes = this.parts.map((p) => ({ x: p.cx, y: p.cy }));
        for (let j = 0; j < 3 + G.bloom; j++) this.nodes.push({ x: this.cx + rand(-1, 1) * this.r * 2, y: this.cy + rand(-1, 1) * this.r * 2 });
        U.addConstellation(this.nodes, this.h0);
        this.nodes.forEach((n, i) => audio.note(7 + i * 2, { kind: 'bell', vel: 0.35, delay: 0.25 + i * 0.22, pan: (n.x / G.W) * 2 - 1 }));
        break;
      }
      case 'aurora': U.addAurora(this.h0); break;
      case 'vortex': break;
      case 'eternal': U.addLoop(this.cx, this.cy, this.r * 1.3, 330); break;
      case 'starburst': {
        const star = this.parts.find((p) => p.type === 'star') || this.parts[0]; const line = this.parts.find((p) => p.type === 'line');
        const a = line.ideal[0], b = line.ideal[line.ideal.length - 1]; const ang = Math.atan2(b.y - a.y, b.x - a.x);
        for (let j = 0; j < 140 * pm; j++) { const s = Math.random() < 0.5 ? 1 : -1; const v = rand(80, 340) * bm; const da = rand(-0.5, 0.5); G.P.add(star.cx, star.cy, Math.cos(ang + da) * v * s, Math.sin(ang + da) * v * s, { k: 1, life: rand(1.4, 2.8), s: 3.5, drag: 1.8, grav: 10, hd: 60 }); }
        U.addStar(star.cx, star.cy, star.h0, 1.4);
        break;
      }
      case 'rainbow': {
        const tri = this.parts.find((p) => p.type === 'triangle'); const line = this.parts.find((p) => p.type === 'line');
        const a = line.ideal[0], b = line.ideal[line.ideal.length - 1]; this.ang = Math.atan2(b.y - a.y, b.x - a.x); this.cx = tri.cx; this.cy = tri.cy; break;
      }
      case 'tide': break;
      case 'pulse': break;
    }
    G.haptic('strong');
  }
  update(dt) {
    const G = this.G; const a = this.age; if (a > this.life) { this.dead = true; G.universe.deposit(this.cx, this.cy, this.h0, 2); return; }
    switch (this.id) {
      case 'vortex': {
        const str = 260 * smooth(0, 1, a) * (1 - smooth(this.life - 1.5, this.life, a));
        G.attract(this.cx, this.cy, this.r * 3.5, str, 3);
        this._e = (this._e || 0) + dt * 120 * G.pm; while (this._e > 1) { this._e--; const ang = rand(TAU), R = this.r * rand(1.5, 3.2); G.P.add(this.cx + Math.cos(ang) * R, this.cy + Math.sin(ang) * R, 0, 0, { life: rand(1.5, 2.6), s: rand(2.5, 5), drag: 1, grav: 0, tur: 0, h: (G.t * 80 + ang * 57) % 360, k: Math.random() < 0.5 ? 1 : 0 }); }
        if (!this._saved && a > this.life - 1.2) { this._saved = true; G.universe.addGalaxy(this.cx, this.cy, this.h0, 0.9); burst(G.P, this.cx, this.cy, { n: Math.round(90 * G.pm * G.burstMult), speed: 200 * G.burstMult, life: 3 }); audio.reaction(true); }
        break;
      }
      case 'tide': G.attract(this.cx, this.cy, this.r + a * 420, -220 * (1 - a / this.life), 0); break;
      case 'pulse': { const beat = Math.floor(a / 0.8); if (beat !== this._b && a < this.life - 1) { this._b = beat; audio.thump(); G.haptic('soft'); burst(G.P, this.cx, this.cy, { n: Math.round(36 * G.pm), speed: 160 * G.burstMult, ring: true, life: 1.8, s: 4, h: 330 + beat * 12, spread: 0.4, k: 0 }); } break; }
      case 'eternal': { this._e = (this._e || 0) + dt * 30 * G.pm; while (this._e > 1) { this._e--; const t = rand(TAU); const d = 1 + Math.sin(t) ** 2; G.P.add(this.cx + Math.cos(t) / d * this.r * 1.6, this.cy + Math.sin(t) * Math.cos(t) / d * this.r * 1.6, 0, rand(-10, -30), { life: rand(1.5, 2.5), s: 4, h: 330 + rand(-30, 40), grav: -6 }); } break; }
      case 'garden': { for (const b of this.blooms) if (!b.done && a > b.t) { b.done = true; audio.note(5 + ((Math.random() * 8) | 0), { kind: 'harp', vel: 0.25, pan: (b.x / G.W) * 2 - 1 }); burst(G.P, b.x, b.y, { n: Math.round(10 * G.pm), speed: 50, life: 2, k: 2, h: b.h, grav: 6 }); } break; }
    }
  }
  draw(ctx) {
    const G = this.G; const a = this.age; const e = smooth(0, 0.4, a) * (1 - smooth(this.life * 0.7, this.life, a));
    switch (this.id) {
      case 'cosmic': { for (let i = 0; i < 3; i++) { const R = this.r * (0.6 + easeOut(a / 2.5) * (2.5 + i)); ctx.globalAlpha = 0.3 * e * (1 - i * 0.25); ctx.strokeStyle = `hsl(${(this.h0 + i * 70 + a * 40) % 360 | 0},${sat()}%,75%)`; ctx.lineWidth = 3 - i * 0.7; ctx.beginPath(); ctx.arc(this.cx, this.cy, R, 0, TAU); ctx.stroke(); } glow(ctx, this.cx, this.cy, this.r * 2.2 * (1 + a * 0.2), this.h0 + a * 50, 0.35 * e); break; }
      case 'vortex': { for (let arm = 0; arm < 4; arm++) { ctx.globalAlpha = 0.25 * e; ctx.strokeStyle = `hsl(${(G.t * 60 + arm * 90) % 360 | 0},${sat()}%,72%)`; ctx.lineWidth = 3; ctx.beginPath(); for (let j = 0; j < 40; j++) { const t = j / 39; const ang = arm * TAU / 4 + t * 4 - a * 2.2; const R = t * this.r * 3; const x = this.cx + Math.cos(ang) * R, y = this.cy + Math.sin(ang) * R; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); } glow(ctx, this.cx, this.cy, 60 + 20 * Math.sin(a * 4), G.t * 80, 0.6 * e); break; }
      case 'garden': for (const b of this.blooms) { if (a < b.t) continue; const o = easeOut((a - b.t) / 1.5); for (let i = 0; i < b.n; i++) { const ang = i / b.n * TAU + a * 0.2; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(ang); ctx.globalAlpha = 0.3 * e; ctx.fillStyle = `hsl(${b.h | 0},${sat()}%,72%)`; ctx.beginPath(); ctx.ellipse(b.s * o * 0.55, 0, b.s * o * 0.55, b.s * o * 0.2, 0, 0, TAU); ctx.fill(); ctx.restore(); } glow(ctx, b.x, b.y, b.s * 0.6 * o, b.h + 40, 0.6 * e); } break;
      case 'constellation': { const nodes = this.nodes; const shown = clamp(a / 2.5, 0, 1) * (nodes.length - 1); ctx.lineWidth = 1.2; for (let i = 0; i < nodes.length - 1; i++) { if (i > shown) break; const f = clamp(shown - i, 0, 1); const p = nodes[i], q = nodes[i + 1]; ctx.globalAlpha = 0.5 * e; ctx.strokeStyle = `hsl(${(this.h0 + i * 20) % 360 | 0},${sat()}%,82%)`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + (q.x - p.x) * f, p.y + (q.y - p.y) * f); ctx.stroke(); } nodes.forEach((n, i) => glow(ctx, n.x, n.y, 14 + 4 * Math.sin(G.t * 3 + i), this.h0 + i * 20, (i <= shown + 1 ? 0.9 : 0) * e)); break; }
      case 'pulse': { for (let i = 0; i < 4; i++) { const ph = ((a - i * 0.2) % 0.8) / 0.8; if (a < i * 0.2) continue; ctx.globalAlpha = (1 - ph) * 0.35 * e; ctx.strokeStyle = `hsl(${(335 + i * 15) % 360},${sat()}%,75%)`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(this.cx, this.cy, this.r * (0.6 + ph * 2.2), 0, TAU); ctx.stroke(); } glow(ctx, this.cx, this.cy, this.r * 1.3, 340, 0.4 * e * (0.7 + 0.3 * Math.sin(a * 8))); break; }
      case 'aurora': { const n = 70; const cw = G.W / n; for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * G.W; const y = G.H * 0.1 + Math.sin(i * 0.16 + a * 0.7) * G.H * 0.05 + Math.sin(i * 0.06 - a * 0.3) * G.H * 0.04; const hh = G.H * (0.32 + 0.14 * Math.sin(i * 0.21 + a)); ctx.globalAlpha = 0.16 * e * (0.7 + 0.3 * Math.sin(i * 0.4 + a * 1.3)); ctx.drawImage(curtain(this.h0 + i * 2 + a * 10), x - cw * 2, y, cw * 4, hh); } break; }
      case 'tide': { const R = this.r + a * 420; ctx.globalAlpha = 0.4 * (1 - a / this.life); ctx.strokeStyle = `hsl(${(this.h0 + a * 60) % 360 | 0},${sat()}%,78%)`; ctx.lineWidth = 6 * (1 - a / this.life) + 1; ctx.beginPath(); ctx.arc(this.cx, this.cy, R, 0, TAU); ctx.stroke(); ctx.globalAlpha *= 0.5; ctx.beginPath(); ctx.arc(this.cx, this.cy, R * 0.9, 0, TAU); ctx.stroke(); break; }
      case 'rainbow': { const len = Math.hypot(G.W, G.H) * easeOut(a / 1.2); for (let i = 0; i < 14; i++) { const t = i / 13; const ang = this.ang + (t - 0.5) * 0.5; const x2 = this.cx + Math.cos(ang) * len, y2 = this.cy + Math.sin(ang) * len; ctx.strokeStyle = `hsl(${(t * 300) | 0},92%,68%)`; ctx.globalAlpha = 0.07 * e; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(this.cx, this.cy); ctx.lineTo(x2, y2); ctx.stroke(); ctx.globalAlpha = 0.3 * e; ctx.lineWidth = 1.5; ctx.stroke(); } glow(ctx, this.cx, this.cy, 50, 50, 0.6 * e); break; }
      case 'starburst': glow(ctx, this.cx, this.cy, this.r * 1.6 * (1 + a), this.h0, 0.4 * e); break;
      case 'eternal': { ctx.globalAlpha = 0.4 * e; ctx.strokeStyle = `hsl(335,${sat()}%,78%)`; ctx.lineWidth = 2; ctx.beginPath(); for (let j = 0; j <= 80; j++) { const t = j / 80 * TAU; const d = 1 + Math.sin(t) ** 2; const x = this.cx + Math.cos(t) / d * this.r * 1.6, y = this.cy + Math.sin(t) * Math.cos(t) / d * this.r * 1.6; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); break; }
    }
    ctx.globalAlpha = 1;
  }
}
