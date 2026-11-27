// Créations vivantes : chaque forme reconnue se transforme, s'anime, puis se dissout en lumière.
import { TAU, clamp, lerp, rand, easeOut, easeInOut, smooth, dist } from './util.js';
import { hue, hueAt, glow, ribbon, burst, curtain, sat, palette } from './fx.js';
import { idealize, glyph } from './shapes.js';
import { audio } from './audio.js';

const LIFE = { line: 3.6, circle: 5.5, wave: 6.5, spiral: 6.5, triangle: 6.5, star: 4.2, flower: 7.5, heart: 6.5, infinity: 13, mandala: 10, galaxy: 9 };

function emitter(o, key, rate, dt, fn) { o[key] = (o[key] || 0) + rate * dt; while (o[key] >= 1) { o[key]--; fn(); } }

export class Creation {
  constructor(G, type, info, opts = {}) {
    this.G = G; this.type = type; this.info = info; this.born = G.t;
    this.drawn = info.pts.map((p) => ({ x: p.x, y: p.y }));
    this.ideal = idealize(type, info);
    this.pts = this.drawn.map((p) => ({ x: p.x, y: p.y, h: 0, w: 1, f: 1 }));
    let cx = 0, cy = 0; for (const p of this.ideal) { cx += p.x; cy += p.y; } cx /= this.ideal.length; cy /= this.ideal.length;
    if (type === 'spiral' || type === 'galaxy') { cx = info.cx; cy = info.cy; }
    this.cx = cx; this.cy = cy; this.r = Math.max(20, info.size / 2);
    this.life = LIFE[type] * G.lifeMult; this.h0 = hueAt(Math.random()); this.dir = info.dir || 1;
    this.sym = opts.sym || 0; this.kc = opts.center || null; this.dead = false; this.reacted = false; this.seed = Math.random() * 100;
    this.petals = info.petals || 5; this.dissolved = false;
    if (type === 'star' || type === 'galaxy') this.boomed = false;
  }
  get age() { return this.G.t - this.born; }
  get k() { return clamp(this.age / this.life, 0, 1); }

  /** Enveloppe d'opacité : apparition rapide, longue disparition douce. */
  env() { const a = this.age; return smooth(0, 0.25, a) * (1 - smooth(this.life * 0.72, this.life, a)) * this.G.exposure; }

  update(dt) {
    const G = this.G; const a = this.age; const m = easeInOut(clamp(a / 0.55, 0, 1)); // métamorphose vers la forme idéale
    const n = this.pts.length; const tw = G.t;
    for (let i = 0; i < n; i++) {
      const p = this.pts[i]; p.x = lerp(this.drawn[i].x, this.ideal[i].x, m); p.y = lerp(this.drawn[i].y, this.ideal[i].y, m);
      p.h = this.h0 + (i / n - 0.5) * 360 * palette.spread * 0.9 + tw * 14; p.f = 1;
    }
    const B = BEHAVIOR[this.type]; if (B && B.update) B.update(this, dt, G, a);
    if (a >= this.life && !this.dissolved) { this.dissolve(); }
    if (a >= this.life + 0.05) this.dead = true;
  }

  dissolve() {
    // Plutôt que disparaître : la forme se défait en braises qui flottent et nourrissent la nébuleuse.
    this.dissolved = true; const G = this.G; const n = this.pts.length; const cnt = Math.min(90, Math.round(26 * G.pm));
    for (let j = 0; j < cnt; j++) {
      const p = this.pts[(Math.random() * n) | 0];
      const [x, y] = this.tx(p.x, p.y, this.sym ? (Math.random() * this.sym) | 0 : 0);
      G.P.add(x, y, rand(-14, 14), rand(-22, 4), { k: 3, life: rand(2.5, 5), s: rand(3, 6), h: p.h + rand(-20, 20), drag: 0.8, grav: -4, tur: 22, hd: rand(-30, 30), a: 0.7 });
    }
    G.universe.deposit(this.cx, this.cy, this.h0, Math.min(1, this.r / 140) * (this.type === 'galaxy' ? 3 : 1));
  }

  /** Transforme un point pour la copie symétrique k (kaléidoscope). */
  tx(x, y, k) {
    if (!this.sym || !k) return [x, y];
    const c = this.kc; const half = k % 2 === 1; const ang = Math.floor(k / 2) * (TAU / (this.sym / 2)); const r0 = half ? -ang : ang;
    const dx = x - c.x, dy = half ? -(y - c.y) : y - c.y; const cs = Math.cos(r0), sn = Math.sin(r0);
    return [c.x + dx * cs - dy * sn, c.y + dx * sn + dy * cs];
  }

  draw(ctx) {
    const G = this.G; const e = this.env(); if (e <= 0.005) return;
    const copies = this.sym || 1;
    for (let k = 0; k < copies; k++) {
      if (k) { const c = this.kc; const half = k % 2 === 1; const ang = Math.floor(k / 2) * (TAU / (this.sym / 2)) + (this.type === 'mandala' ? G.t * 0.15 : 0);
        ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); ctx.translate(c.x, c.y); ctx.rotate(half ? -ang : ang); if (half) ctx.scale(1, -1); ctx.translate(-c.x, -c.y); }
      const B = BEHAVIOR[this.type];
      if (B && B.draw) B.draw(this, ctx, G, e); else ribbon(ctx, this.pts, { width: 2.6, alpha: e, t: G.t, strands: G.strands });
    }
    if (copies > 1) ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
  }
}

// ---------- Comportements par forme ----------
const outline = (c, ctx, G, e, w = 2.6, glowK = 1) => ribbon(ctx, c.pts, { width: w, alpha: e, t: G.t, strands: G.strands, glowK });
const spawnAlong = (c, G, o) => { const p = c.pts[(Math.random() * c.pts.length) | 0]; const k = c.sym ? (Math.random() * c.sym) | 0 : 0; const [x, y] = c.tx(p.x, p.y, k); G.P.add(x, y, o.vx ?? rand(-30, 30), o.vy ?? rand(-30, 30), { h: p.h + rand(-15, 15), ...o }); };

const BEHAVIOR = {
  line: {
    update(c, dt, G, a) {
      // La ligne vibre comme une corde pincée, de moins en moins.
      const n = c.pts.length; const p0 = c.pts[0], p1 = c.pts[n - 1]; const L = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
      const nx = -(p1.y - p0.y) / L, ny = (p1.x - p0.x) / L; const amp = 10 * Math.exp(-a * 1.3) * smooth(0, 0.3, a);
      for (let i = 0; i < n; i++) { const s = i / (n - 1); const o = Math.sin(s * Math.PI * 2) * Math.sin(a * 22) * amp + Math.sin(s * Math.PI) * Math.sin(a * 13) * amp * 0.6; c.pts[i].x += nx * o; c.pts[i].y += ny * o; }
      if (a < c.life * 0.8) emitter(c, '_e', 26 * G.pm, dt, () => spawnAlong(c, G, { vx: nx * rand(-60, 60), vy: ny * rand(-60, 60), k: 1, life: rand(0.8, 1.6), s: 3, grav: -10 }));
    },
    draw(c, ctx, G, e) { outline(c, ctx, G, e, 2.8); },
  },
  circle: {
    update(c, dt, G, a) {
      const sc = 1 + easeOut(a / c.life) * 0.22; const rot = a * 0.4 * c.dir;
      for (const p of c.pts) { const dx = p.x - c.cx, dy = p.y - c.cy; const cs = Math.cos(rot), sn = Math.sin(rot); p.x = c.cx + (dx * cs - dy * sn) * sc; p.y = c.cy + (dx * sn + dy * cs) * sc; }
      // Ondes qui partent de l'anneau.
      c._wave = (c._wave ?? 0.3) - dt; if (c._wave <= 0 && a < c.life * 0.8) { c._wave = 1.3 / (1 + G.bloom * 0.25); (c.waves ||= []).push(G.t); }
      emitter(c, '_e', 18 * G.pm, dt, () => { const ang = rand(TAU); const R = c.r * sc; G.P.add(c.cx + Math.cos(ang) * R, c.cy + Math.sin(ang) * R, -Math.sin(ang) * 50 * c.dir, Math.cos(ang) * 50 * c.dir, { life: rand(1, 2), s: 4, grav: 0, tur: 6 }); });
      G.attract(c.cx, c.cy, c.r * 1.8, 30, 1.4 * c.dir);
    },
    draw(c, ctx, G, e) {
      outline(c, ctx, G, e, 3, 1.3);
      for (const w of c.waves || []) {
        const age = G.t - w; if (age > 2.4) continue; const R = c.r * (1.1 + age * 0.55); const al = (1 - age / 2.4) * 0.5 * e;
        ctx.globalAlpha = al; ctx.strokeStyle = `hsl(${(c.h0 + age * 60) | 0},${sat()}%,78%)`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(c.cx, c.cy, R, 0, TAU); ctx.stroke();
        if (G.bloom >= 2) { ctx.globalAlpha = al * 0.5; ctx.beginPath(); ctx.arc(c.cx, c.cy, R * 0.82, 0, TAU); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
    },
  },
  wave: {
    update(c, dt, G, a) {
      for (let i = 0; i < c.pts.length; i++) c.pts[i].y += Math.sin(a * 1.6 + i * 0.18) * 6 * smooth(0, 0.6, a);
      emitter(c, '_e', 14 * G.pm, dt, () => spawnAlong(c, G, { vx: rand(-10, 10), vy: rand(10, 40), life: rand(1.5, 3), s: 3.5, grav: 8, tur: 12 }));
    },
    draw(c, ctx, G, e) {
      // Rideau d'aurore suspendu sous la vague.
      const step = 2; const hgt = 70 + c.r * 0.9 + G.bloom * 12; const span = Math.max(8, (c.info.L || 200) / c.pts.length * step * 3.2);
      for (let i = 0; i < c.pts.length; i += step) {
        const p = c.pts[i]; const sw = Math.sin(G.t * 1.2 + i * 0.25) * 0.5 + 0.5; const hh = hgt * (0.6 + 0.6 * sw);
        ctx.globalAlpha = 0.26 * e * (0.5 + sw * 0.5); ctx.drawImage(curtain(p.h), p.x - span / 2, p.y - hh * 0.12, span, hh);
      }
      outline(c, ctx, G, e * 0.85, 2.2);
    },
  },
  spiral: {
    update(c, dt, G, a) {
      const rot = a * a * 0.35 * -c.dir; const col = smooth(c.life * 0.6, c.life, a); const sc = 1 - col * 0.85;
      for (const p of c.pts) { const dx = p.x - c.cx, dy = p.y - c.cy; const cs = Math.cos(rot), sn = Math.sin(rot); p.x = c.cx + (dx * cs - dy * sn) * sc; p.y = c.cy + (dx * sn + dy * cs) * sc; }
      G.attract(c.cx, c.cy, c.r * 2.4, 140 + G.bursts * 10, 2.2 * -c.dir);
      emitter(c, '_e', 34 * G.pm, dt, () => { const ang = rand(TAU); const R = c.r * rand(0.9, 1.6); G.P.add(c.cx + Math.cos(ang) * R, c.cy + Math.sin(ang) * R, 0, 0, { life: rand(1.4, 2.4), s: rand(2.5, 4.5), drag: 1.2, grav: 0, tur: 0, k: Math.random() < 0.4 ? 1 : 0 }); });
      if (a > c.life * 0.95 && !c._pop) { c._pop = true; burst(G.P, c.cx, c.cy, { n: Math.round(40 * G.pm * G.burstMult), speed: 140 * G.burstMult, life: 2.4 }); }
    },
    draw(c, ctx, G, e) { outline(c, ctx, G, e, 2.6, 1.2); glow(ctx, c.cx, c.cy, 30 + 20 * Math.sin(G.t * 3), c.h0 + G.t * 40, 0.5 * e); },
  },
  triangle: {
    update(c, dt, G, a) {
      const rot = Math.sin(a * 0.6) * 0.25; for (const p of c.pts) { const dx = p.x - c.cx, dy = p.y - c.cy; const cs = Math.cos(rot), sn = Math.sin(rot); p.x = c.cx + dx * cs - dy * sn; p.y = c.cy + dx * sn + dy * cs; }
      c.rayAng = (c.rayAng ?? rand(TAU)) + dt * 0.25;
      emitter(c, '_e', 16 * G.pm, dt, () => { const t = Math.random(); const ang = c.rayAng + (t - 0.5) * 0.9; const v = rand(80, 160); G.P.add(c.cx, c.cy, Math.cos(ang) * v, Math.sin(ang) * v, { h: t * 300, life: rand(1, 2), k: 1, s: 3, grav: 0, tur: 4 }); });
    },
    draw(c, ctx, G, e) {
      // Faisceau arc-en-ciel déployé par le prisme.
      const len = (c.r * 3 + 120) * smooth(0.3, 1.4, c.age); const nRays = 7 + G.bloom * 2;
      for (let i = 0; i < nRays; i++) {
        const t = i / (nRays - 1); const ang = c.rayAng + (t - 0.5) * 0.9;
        ctx.strokeStyle = `hsl(${(t * 300) | 0},90%,70%)`; ctx.beginPath(); ctx.moveTo(c.cx, c.cy); ctx.lineTo(c.cx + Math.cos(ang) * len, c.cy + Math.sin(ang) * len);
        ctx.globalAlpha = 0.06 * e; ctx.lineWidth = 16 + Math.sin(G.t * 2 + i) * 4; ctx.stroke(); ctx.globalAlpha = 0.28 * e; ctx.lineWidth = 1.4; ctx.stroke();
      }
      ctx.globalAlpha = 1; outline(c, ctx, G, e, 2.4, 1.4);
    },
  },
  star: {
    update(c, dt, G, a) {
      const sc = 1 + Math.sin(Math.min(a, 0.6) / 0.6 * Math.PI) * 0.12; for (const p of c.pts) { p.x = c.cx + (p.x - c.cx) * sc; p.y = c.cy + (p.y - c.cy) * sc; }
      if (a > 0.6 && !c.boomed) {
        c.boomed = true; const bm = G.burstMult; const tips = c.info.sharp ? c.info.sharp.filter((s) => s.convex).map((s) => c.ideal[s.i]) : [];
        audio.note(14, { kind: 'bell', vel: 0.5 }); G.haptic('soft');
        for (let k = 0; k < (c.sym || 1); k++) {
          const [x, y] = c.tx(c.cx, c.cy, k);
          burst(G.P, x, y, { n: Math.round(70 * G.pm * bm / Math.sqrt(c.sym || 1)), speed: 220 * bm, life: 2.6, s: 4.5, hd: 40 });
          for (const tp of tips) { const [tx, ty] = c.tx(tp.x, tp.y, k); const ang = Math.atan2(ty - y, tx - x);
            for (let j = 0; j < 10 * G.pm; j++) G.P.add(tx, ty, Math.cos(ang + rand(-0.3, 0.3)) * rand(60, 180) * bm, Math.sin(ang + rand(-0.3, 0.3)) * rand(60, 180) * bm, { k: 1, life: rand(1.5, 2.6), s: 3.5, drag: 2, grav: 14, hd: 30 }); }
        }
        if (G.bloom >= 1) c._second = G.t + 0.7;
        G.universe.addStar(c.cx, c.cy, c.h0, 1 + c.r / 120);
      }
      if (c._second && G.t > c._second) { // gerbes secondaires (Floraison)
        c._second = 0; for (let j = 0; j < G.bloom + 1; j++) { const ang = rand(TAU), R = c.r * rand(1, 2.2); burst(G.P, c.cx + Math.cos(ang) * R, c.cy + Math.sin(ang) * R, { n: Math.round(16 * G.pm), speed: 70, life: 1.6, s: 3, k: 0 }); }
        audio.note(17, { kind: 'glass', vel: 0.35 });
      }
    },
    draw(c, ctx, G, e) { const pre = 1 - smooth(0.55, 1.1, c.age); outline(c, ctx, G, e * (0.25 + pre * 0.75), 2.6, 1.6); if (pre > 0) glow(ctx, c.cx, c.cy, c.r * 1.4, c.h0, 0.35 * pre * e); },
  },
  flower: {
    update(c, dt, G, a) {
      const sc = 1 - smooth(0.3, 1.2, a) * 0.7; for (const p of c.pts) { p.x = c.cx + (p.x - c.cx) * sc; p.y = c.cy + (p.y - c.cy) * sc; }
      if (a > c.life * 0.55) emitter(c, '_e', 20 * G.pm, dt, () => { const ang = rand(TAU); const R = c.r * rand(0.5, 1.1) * c.open; G.P.add(c.cx + Math.cos(ang) * R, c.cy + Math.sin(ang) * R, rand(-20, 20), rand(-10, 20), { k: 2, life: rand(2.5, 4), s: rand(3, 5), drag: 0.9, grav: 12, tur: 26, hd: 10, h: c.h0 + rand(-40, 40) }); });
    },
    draw(c, ctx, G, e) {
      // Éclosion : couches de pétales qui s'ouvrent en tournant lentement.
      const open = (c.open = easeOut(clamp((c.age - 0.3) / 1.6, 0, 1))); const layers = 2 + Math.min(3, G.bloom);
      for (let L = layers - 1; L >= 0; L--) {
        const nP = c.petals + L * 2; const R = c.r * (0.45 + 0.6 * open) * (1 - L * 0.17); const rot = G.t * 0.12 * (L % 2 ? -1 : 1) + L * 0.4; const pa = 0.13 / Math.sqrt(layers / 2);
        for (let i = 0; i < nP; i++) {
          const ang = rot + (i / nP) * TAU; const h = c.h0 + L * 35 + i * (palette.spread * 30);
          ctx.save(); ctx.translate(c.cx, c.cy); ctx.rotate(ang); ctx.globalAlpha = (pa + 0.03 * L) * e * open;
          ctx.fillStyle = `hsl(${h | 0},${sat()}%,${58 + L * 5}%)`; ctx.beginPath(); ctx.ellipse(R * 0.55, 0, R * 0.55, R * 0.2 * (1 + 0.3 * Math.sin(G.t + i)), 0, 0, TAU); ctx.fill(); ctx.restore();
        }
      }
      glow(ctx, c.cx, c.cy, c.r * 0.45 * (0.5 + open), c.h0 + 40, 0.42 * e);
      outline(c, ctx, G, e * (1 - open * 0.7), 2.2);
    },
  },
  heart: {
    update(c, dt, G, a) {
      const ph = (a % 0.95) / 0.95; const beat = Math.exp(-ph * 9) + 0.6 * Math.exp(-Math.max(0, ph - 0.22) * 9) * (ph > 0.22 ? 1 : 0);
      const sc = 1 + beat * 0.13; for (const p of c.pts) { p.x = c.cx + (p.x - c.cx) * sc; p.y = c.cy + (p.y - c.cy) * sc; }
      const beatIx = Math.floor(a / 0.95); if (beatIx !== c._beat && a < c.life * 0.85) { c._beat = beatIx; (c.rings ||= []).push(G.t); if (beatIx > 0) audio.thump(); if (beatIx > 0 && beatIx % 2 === 0) audio.note(5 + (beatIx % 4), { kind: 'piano', vel: 0.3 }); G.haptic('soft');
        burst(G.P, c.cx, c.cy, { n: Math.round(14 * G.pm), speed: 90 * G.burstMult, life: 1.6, k: 0, s: 4, h: 335, spread: 0.6, grav: -8 }); }
    },
    draw(c, ctx, G, e) {
      for (const r0 of c.rings || []) {
        const age = G.t - r0; if (age > 2) continue; const sc = 1 + age * 0.7; ctx.globalAlpha = (1 - age / 2) * 0.35 * e; ctx.strokeStyle = `hsl(${(335 + age * 30) % 360},${sat()}%,75%)`; ctx.lineWidth = 2;
        ctx.beginPath(); c.pts.forEach((p, i) => { const x = c.cx + (p.x - c.cx) * sc, y = c.cy + (p.y - c.cy) * sc; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.stroke();
      }
      ctx.globalAlpha = 1; outline(c, ctx, G, e, 3, 1.4);
    },
  },
  infinity: {
    update(c, dt, G, a) {
      emitter(c, '_e', 12 * G.pm, dt, () => spawnAlong(c, G, { vx: rand(-15, 15), vy: rand(-15, 15), life: rand(1, 2), s: 3, grav: -4 }));
      if (a > c.life * 0.9 && !c._saved) { c._saved = true; G.universe.addLoop(c.cx, c.cy, c.r, c.h0); }
    },
    draw(c, ctx, G, e) {
      outline(c, ctx, G, e * 0.6, 2.2);
      const n = c.pts.length; const comets = 3 + G.bloom;
      for (let k = 0; k < comets; k++) for (let j = 0; j < 10; j++) { const s = ((G.t * 0.35 + k / comets) * n - j * 0.8 + n * 10) % n; const p = c.pts[Math.floor(s)]; glow(ctx, p.x, p.y, 12 - j, p.h + k * 50, (1 - j / 10) * 0.8 * e); }
    },
  },
  mandala: {
    update(c, dt, G, a) { emitter(c, '_e', 10 * G.pm, dt, () => spawnAlong(c, G, { life: rand(1.2, 2.4), s: 3, k: 0, grav: 0 })); },
    draw(c, ctx, G, e) { outline(c, ctx, G, e, 2.2, 1.2); const R = dist(c.cx, c.cy, c.kc.x, c.kc.y); ctx.globalAlpha = 0.18 * e; ctx.strokeStyle = `hsl(${(c.h0 + G.t * 20) | 0},${sat()}%,75%)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(c.kc.x, c.kc.y, R * (1 + 0.05 * Math.sin(G.t * 2)), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; },
  },
  galaxy: {
    update(c, dt, G, a) {
      const rot = a * 0.5 * -c.dir; for (const p of c.pts) { const dx = p.x - c.cx, dy = p.y - c.cy; const cs = Math.cos(rot), sn = Math.sin(rot); p.x = c.cx + dx * cs - dy * sn; p.y = c.cy + dx * sn + dy * cs; }
      G.attract(c.cx, c.cy, c.r * 2.2, 160, 2.6 * -c.dir);
      emitter(c, '_e', 70 * G.pm, dt, () => { const arm = (Math.random() * 3) | 0; const t = Math.random(); const ang = arm * TAU / 3 + t * 5 * -c.dir + rot; const R = t * c.r * 1.2; G.P.add(c.cx + Math.cos(ang) * R, c.cy + Math.sin(ang) * R, 0, 0, { life: rand(1.5, 3), s: rand(2, 4), grav: 0, tur: 0, drag: 1, h: c.h0 + t * 120 }); });
      if (a > c.life * 0.9 && !c._saved) { c._saved = true; G.universe.addGalaxy(c.cx, c.cy, c.h0, Math.min(1.6, c.r / 90)); audio.reaction(true); }
    },
    draw(c, ctx, G, e) { glow(ctx, c.cx, c.cy, c.r * 0.9, c.h0, 0.4 * e); outline(c, ctx, G, e * 0.7, 2.4, 1.4); },
  },
};

// ---------- Geste libre ----------
/** Un geste non reconnu reste un filament vivant qui dérive et s'efface lentement : toujours récompensé. */
export class Filament {
  constructor(G, pts, opts = {}) {
    this.G = G; this.born = G.t; this.life = (2.6 + G.trailMult * 1.4) * (opts.lifeK || 1); this.dead = false; this.sym = opts.sym || 0; this.kc = opts.center;
    this.pts = pts.map((p) => ({ x: p.x, y: p.y, h: p.h, w: p.w ?? 1, f: 1, vx: rand(-6, 6), vy: rand(-10, 2) }));
  }
  update(dt) {
    const a = this.G.t - this.born; if (a > this.life) { this.dead = true; return; }
    for (const p of this.pts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx += Math.sin(this.G.t * 0.8 + p.y * 0.01) * 6 * dt; }
  }
  draw(ctx) {
    const G = this.G; const a = G.t - this.born; const k = a / this.life; const n = this.pts.length;
    // Le filament s'efface depuis sa queue, comme une mèche qui se consume.
    for (let i = 0; i < n; i++) this.pts[i].f = smooth(k * 1.15 - 0.15, k * 1.15 + 0.05, i / n) * (1 - smooth(0.85, 1, k));
    const copies = this.sym || 1;
    for (let c = 0; c < copies; c++) {
      if (c) { const half = c % 2 === 1; const ang = Math.floor(c / 2) * (TAU / (this.sym / 2)); ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); ctx.translate(this.kc.x, this.kc.y); ctx.rotate(half ? -ang : ang); if (half) ctx.scale(1, -1); ctx.translate(-this.kc.x, -this.kc.y); }
      ribbon(ctx, this.pts, { width: 2.2, alpha: 0.9, t: G.t, strands: G.strands });
    }
    if (copies > 1) ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
  }
}

// ---------- Fantôme d'apprentissage ----------
/** Trace doucement une forme à l'écran pour montrer comment la dessiner. */
export class Ghost {
  constructor(G, type) { this.G = G; this.born = G.t; this.life = 3.2; this.dead = false; const m = Math.min(G.W, G.H); this.pts = glyph(type, 0.5, 0.5, 0.3).map((p) => ({ x: G.W / 2 + (p.x - 0.5) * m, y: G.H * 0.46 + (p.y - 0.5) * m })); }
  update() { if (this.G.t - this.born > this.life) this.dead = true; }
  draw(ctx) {
    const a = this.G.t - this.born; const n = this.pts.length; const head = Math.min(n - 1, Math.floor(easeInOut(a / 1.8) * (n - 1))); const fade = 1 - smooth(2.2, 3.2, a);
    for (let i = 0; i <= head; i += 2) { const p = this.pts[i]; glow(ctx, p.x, p.y, 7, hue(i / n), 0.35 * fade); }
    const p = this.pts[head]; glow(ctx, p.x, p.y, 22, hue(0.5), 0.55 * fade);
  }
}
