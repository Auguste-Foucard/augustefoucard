// Pouvoirs sensoriels : chacun change la façon de toucher la lumière.
import { TAU, rand, clamp, dist, smooth } from './util.js';
import { hue, hueAt, glow, burst, ribbon, sat, palette } from './fx.js';
import { noise2 } from './util.js';
import { gainMult } from './economy.js';
import { audio } from './audio.js';

// ---------- Feux d'artifice : accumuler puis libérer ----------
export class Charge {
  constructor(G, x, y, id) { this.G = G; this.x = x; this.y = y; this.id = id; this.t0 = G.t; this.h = hue(Math.random()); this.dead = false; }
  get level() { return clamp((this.G.t - this.t0) / 2.4, 0, 1); }
  move(x, y) { this.x += (x - this.x) * 0.6; this.y += (y - this.y) * 0.6; }
  update(dt) {
    const G = this.G; const L = this.level; const R = 40 + L * 90;
    this._e = (this._e || 0) + dt * (30 + L * 90) * G.pm;
    while (this._e > 1) { this._e--; const a = rand(TAU); const r = R * rand(0.8, 1.3); G.P.add(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r, -Math.cos(a) * r * 1.4, -Math.sin(a) * r * 1.4, { life: 0.7, s: rand(2, 3.5), drag: 0.5, grav: 0, tur: 0, h: this.h + rand(-30, 30) * (0.3 + L) }); }
    audio.charge(L); if (Math.random() < dt * 6 * (0.3 + L)) G.haptic('tick');
  }
  draw(ctx) { const L = this.level; const G = this.G; const pul = 1 + Math.sin(G.t * (6 + L * 10)) * 0.08; glow(ctx, this.x, this.y, (18 + L * 46) * pul, this.h + L * 60, 0.5 + L * 0.4); glow(ctx, this.x, this.y, 6 + L * 8, this.h, 0.9); }
  release() {
    const G = this.G; const L = Math.max(0.12, this.level); const bm = G.burstMult; const n = Math.round((50 + L * 220) * G.pm * Math.min(2, bm));
    // Plusieurs coquilles concentriques, chacune avec sa teinte, qui se transforment en braises flottantes.
    const shells = 1 + Math.round(L * 2) + Math.min(2, G.bloom);
    for (let s = 0; s < shells; s++) burst(G.P, this.x, this.y, { n: Math.round(n / shells), speed: (120 + L * 260) * bm * (1 - s * 0.18), life: 2.2 + L * 1.4, s: 3.5 + L * 2, h: this.h + s * 50 * (0.4 + G.colors / 8), spread: 0.4 + G.colors * 0.1, ring: s === 1, k: s === shells - 1 ? 0 : 1, drag: 2.1, grav: 16, hd: 50 });
    if (G.bloom >= 1 && L > 0.5) setTimeout(() => { for (let j = 0; j < 3 + G.bloom; j++) { const a = rand(TAU), r = rand(60, 160) * bm; burst(G.P, this.x + Math.cos(a) * r, this.y + Math.sin(a) * r, { n: Math.round(14 * G.pm), speed: 60, life: 1.4, s: 3, k: 0 }); } audio.note(17, { kind: 'glass', vel: 0.3 }); }, 650);
    const d = Math.round(L * 9) + 3; [0, 2, 4].forEach((k, i) => audio.note(d + k, { kind: 'bell', vel: 0.35 + L * 0.3, delay: i * 0.05, pan: (this.x / G.W) * 2 - 1 }));
    audio.swell(L * 0.4, 2.5); G.haptic(L > 0.6 ? 'strong' : 'soft');
    G.earn(3 + Math.pow(L, 1.5) * 34, this.x, this.y, 'firework');
    G.universe.deposit(this.x, this.y, this.h, L * 1.2);
    if (L > 0.85) G.universe.addStar(this.x, this.y, this.h, 0.7);
    this.dead = true;
  }
}

// ---------- L'eau : ondulations qui se croisent ----------
export class Ripples {
  constructor(G) { this.G = G; this.list = []; this.sparkT = 0; }
  add(x, y, strong = 1) {
    const G = this.G; if (this.list.length > 26) this.list.shift();
    this.list.push({ x, y, t: G.t, h: hue(Math.random()), s: strong });
    audio.noteOnGrid(Math.round((1 - y / G.H) * 10) + 3, { kind: 'drop', vel: 0.5 * strong, pan: (x / G.W) * 2 - 1 });
    G.earn(1.4 * strong, x, y, 'water', true);
  }
  update(dt) {
    const G = this.G; this.list = this.list.filter((r) => G.t - r.t < 5.5);
    // Interférences : là où deux ondes se croisent, la lumière scintille.
    this.sparkT += dt; if (this.sparkT < 0.05) return; this.sparkT = 0;
    const L = this.list; let gained = 0;
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const a = L[i], b = L[j]; const ra = (G.t - a.t) * 110, rb = (G.t - b.t) * 110; const d = dist(a.x, a.y, b.x, b.y);
      if (d < 1 || d > ra + rb || d < Math.abs(ra - rb)) continue;
      const k = (ra * ra - rb * rb + d * d) / (2 * d); const h2 = ra * ra - k * k; if (h2 < 0) continue; const hh = Math.sqrt(h2);
      const mx = a.x + ((b.x - a.x) * k) / d, my = a.y + ((b.y - a.y) * k) / d; const fade = 1 - Math.max(G.t - a.t, G.t - b.t) / 5.5;
      for (const sgn of [1, -1]) { const x = mx + (sgn * hh * (b.y - a.y)) / d, y = my - (sgn * hh * (b.x - a.x)) / d; if (Math.random() < 0.5 * G.pm) G.P.add(x, y, rand(-8, 8), rand(-8, 8), { life: 0.9, s: 4 + fade * 3, h: (a.h + b.h) / 2, grav: -6, tur: 0, a: fade }); gained += 0.03 * fade; }
    }
    if (gained > 0) { G.earn(gained, 0, 0, 'water', true); if (Math.random() < gained * 0.6) audio.note(12 + ((Math.random() * 6) | 0), { kind: 'glass', vel: 0.15 }); }
  }
  draw(ctx) {
    const G = this.G; ctx.lineWidth = 1.4;
    for (const r of this.list) {
      const age = G.t - r.t;
      for (let k = 0; k < 3 + G.bloom; k++) {
        const a = age - k * 0.32; if (a <= 0) continue; const R = a * 110; const al = Math.pow(1 - a / 5.5, 2) * 0.55 * r.s * G.intensity; if (al <= 0.01) continue;
        ctx.globalAlpha = al; ctx.strokeStyle = `hsl(${(r.h + k * 25 + a * 20) % 360 | 0},${sat()}%,${78 - k * 5}%)`; ctx.beginPath(); ctx.arc(r.x, r.y, R, 0, TAU); ctx.stroke();
      }
      if (age < 0.6) glow(ctx, r.x, r.y, 26, r.h, (1 - age / 0.6) * 0.6);
    }
    ctx.globalAlpha = 1;
  }
}

// ---------- Magnétisme : sable cosmique ----------
// Garder le doigt posé rassemble le sable en tourbillon (la gamme monte) ; le relâcher le fait éclater en gerbe.
export class Sand {
  constructor(G) {
    this.G = G; this.n = 0; this.cap = 4200; const F = () => new Float32Array(this.cap);
    this.x = F(); this.y = F(); this.vx = F(); this.vy = F(); this.pos = F(); this.b = F();
    this.active = false; this.fade = 0; this.gathered = 0; this.step = 0; this.holding = null;
  }
  ensure() {
    const G = this.G; const want = Math.round(clamp(1100 * G.pm, 600, this.cap));
    while (this.n < want) { const i = this.n++; this.x[i] = rand(G.W); this.y[i] = rand(G.H); this.vx[i] = 0; this.vy[i] = 0; this.pos[i] = Math.random(); this.b[i] = 0; }
    this.n = Math.min(this.n, want);
  }
  /** Début d'une prise : la voix cristalline s'allume. */
  press(p) { this.holding = p.id; this.step = 0; this.gathered = 0; audio.voiceStart(audio.snap(4 + Math.round((1 - p.y / this.G.H) * 4))); this.G.haptic('soft'); }
  /** Relâchement : tout ce qui a été rassemblé éclate en gerbe colorée. */
  release(p) {
    const G = this.G; if (this.holding !== p.id) return; this.holding = null; audio.voiceStop();
    const g = this.gathered; this.gathered = 0; if (g < 25) return;
    const R = 170, bm = G.burstMult, k = Math.min(1, g / 500);
    for (let i = 0; i < this.n; i++) {
      const dx = this.x[i] - p.x, dy = this.y[i] - p.y; const d = Math.hypot(dx, dy); if (d > R) continue;
      const v = (200 + 360 * Math.random()) * (0.85 + 0.25 * bm) * (0.7 + 0.5 * k) * (1 - d / R * 0.5); const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;
      this.vx[i] = Math.cos(a) * v; this.vy[i] = Math.sin(a) * v; this.b[i] = 1;
    }
    burst(G.P, p.x, p.y, { n: Math.round((30 + 70 * k) * G.pm), speed: (140 + 150 * k) * (0.85 + 0.25 * bm), life: 2.2, s: 4, k: 1, hd: 50, ring: G.bloom >= 1 });
    if (G.bloom >= 2) setTimeout(() => { for (let j = 0; j < G.bloom; j++) { const a = rand(TAU), r = rand(80, 170) * bm; burst(G.P, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, { n: Math.round(14 * G.pm), speed: 70, life: 1.5, s: 3, k: 0 }); } }, 380);
    const notes = 3 + Math.round(k * 4); const base = audio.snap(4 + Math.round((1 - p.y / G.H) * 4));
    for (let j = 0; j < notes; j++) audio.noteOnGrid(base + [0, 2, 4, 5, 7, 9, 12][j], { kind: j === notes - 1 ? 'bell' : 'keys', vel: 0.42, pan: (p.x / G.W) * 2 - 1, delay: j * 0.07, harm: false });
    audio.swell(0.3 + 0.4 * k, 2.5); G.haptic(k > 0.5 ? 'strong' : 'soft');
    G.earn((3 + Math.sqrt(g) * 1.2) * gainMult(G.state), p.x, p.y, 'magnet');
    G.universe.deposit(p.x, p.y, hueAt(Math.random()), 0.6 + k);
  }
  update(dt, pointers) {
    const G = this.G; this.fade += ((this.active ? 1 : 0) - this.fade) * Math.min(1, dt * 2); if (this.fade < 0.01) return;
    this.ensure();
    const repel = pointers.length >= 2; const t = G.t; const decay = Math.exp(-dt * (1.1 / G.lifeMult)); const swirl = 0.45 + G.bloom * 0.05;
    const hold = pointers.find((p) => p.id === this.holding); let near = 0;
    for (let i = 0; i < this.n; i++) {
      const ang = noise2(this.x[i] * 0.004 + t * 0.05, this.y[i] * 0.004) * TAU * 2; let ax = Math.cos(ang) * 10, ay = Math.sin(ang) * 10;
      for (const p of pointers) {
        const dx = p.x - this.x[i], dy = p.y - this.y[i]; const d2 = dx * dx + dy * dy; const R = repel ? 170 : 280; if (d2 > R * R) continue;
        const d = Math.sqrt(d2) + 10; const f = (repel ? -1500 : 1100) * (repel ? 1 - d / R : 0.35 + 0.65 * (1 - d / R));
        ax += (dx / d) * f + (repel ? 0 : (-dy / d) * f * swirl); ay += (dy / d) * f + (repel ? 0 : (dx / d) * f * swirl);
        this.b[i] = Math.min(1, this.b[i] + dt * 2.5);
        if (hold && p === hold && d < 130) near++;
      }
      const dr = Math.exp(-2.1 * dt); this.vx[i] = (this.vx[i] + ax * dt) * dr; this.vy[i] = (this.vy[i] + ay * dt) * dr;
      this.x[i] += this.vx[i] * dt; this.y[i] += this.vy[i] * dt; this.b[i] *= decay;
      if (this.x[i] < -10) this.x[i] = G.W + 10; else if (this.x[i] > G.W + 10) this.x[i] = -10;
      if (this.y[i] < -10) this.y[i] = G.H + 10; else if (this.y[i] > G.H + 10) this.y[i] = -10;
    }
    if (hold && this.active) {
      this.gathered += (near - this.gathered) * Math.min(1, dt * 3);
      // Chaque palier rassemblé fait monter la gamme d'une note.
      const lvl = Math.floor(this.gathered / 70);
      if (lvl > this.step) { this.step = lvl; const d = audio.snap(5 + lvl * 2); audio.noteOnGrid(d, { kind: 'glass', vel: 0.3, harm: false }); audio.voiceTo(d, audio.ctx ? audio.ctx.currentTime : 0); G.haptic('tick'); }
      audio.voiceSpeed(0.2 + Math.min(1.2, this.gathered / 300));
      G.earn(Math.sqrt(this.gathered) * 0.12 * dt * gainMult(G.state), 0, 0, 'magnet', true);
    }
  }
  draw(ctx) {
    if (this.fade < 0.01) return; const G = this.G; const S = sat(); const trailK = 0.018 * G.trailMult; const width = 0.75 + 0.25 * (palette.spread - 0.38) / 0.62;
    const pts = new Map(), lines = new Map();
    for (let i = 0; i < this.n; i++) {
      const sp = Math.abs(this.vx[i]) + Math.abs(this.vy[i]); const lv = Math.min(2, (this.b[i] * 2.2 + sp / 260) | 0);
      const h = hueAt(this.pos[i] * width + Math.min(0.25, sp / 2400)); const key = ((h / 15) | 0) * 3 + lv;
      const m = sp > 90 ? lines : pts; let b = m.get(key); if (!b) m.set(key, (b = [])); b.push(i);
    }
    const prevOp = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'round';
    for (const [key, list] of lines) { const h = ((key / 3) | 0) * 15, lv = key % 3; ctx.globalAlpha = (0.45 + lv * 0.2) * this.fade * G.intensity; ctx.strokeStyle = `hsl(${h},${S}%,${60 + lv * 7}%)`; ctx.lineWidth = 1.1 + lv * 0.5; ctx.beginPath(); for (const i of list) { const sp = Math.abs(this.vx[i]) + Math.abs(this.vy[i]); const c = trailK * Math.min(1, 520 / sp); ctx.moveTo(this.x[i], this.y[i]); ctx.lineTo(this.x[i] - this.vx[i] * c, this.y[i] - this.vy[i] * c); } ctx.stroke(); }
    for (const [key, list] of pts) { const h = ((key / 3) | 0) * 15, lv = key % 3; ctx.globalAlpha = (0.45 + lv * 0.2) * this.fade * G.intensity; ctx.fillStyle = `hsl(${h},${S}%,${60 + lv * 8}%)`; ctx.beginPath(); const sz = 1.4 + lv * 0.7; for (const i of list) ctx.rect(this.x[i] - sz / 2, this.y[i] - sz / 2, sz, sz); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = prevOp;
    // Cœur du tourbillon sous le doigt : il grossit à mesure qu'on rassemble.
    if (this.holding !== null && this.gathered > 5) { const p = [...this.G._ptrs()].find((q) => q.id === this.holding); if (p) { const k = Math.min(1, this.gathered / 500); glow(ctx, p.x, p.y, 40 + 90 * k, hueAt(G.t * 0.05), 0.25 + 0.35 * k); glow(ctx, p.x, p.y, 12 + 14 * k, hueAt(G.t * 0.05 + 0.3), 0.6 + 0.3 * k); } }
  }
}

export { ribbon, smooth };
