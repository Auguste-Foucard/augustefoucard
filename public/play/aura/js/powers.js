// Pouvoirs sensoriels : chacun change la façon de toucher la lumière.
import { TAU, rand, clamp, dist, smooth } from './util.js';
import { hue, glow, burst, ribbon, sat } from './fx.js';
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
export class Sand {
  constructor(G) { this.G = G; this.n = 0; this.cap = 3200; const F = () => new Float32Array(this.cap); this.x = F(); this.y = F(); this.vx = F(); this.vy = F(); this.h = F(); this.b = F(); this.active = false; this.fade = 0; }
  ensure() {
    const G = this.G; const want = Math.round(clamp(900 * G.pm, 500, this.cap));
    while (this.n < want) { const i = this.n++; this.x[i] = rand(G.W); this.y[i] = rand(G.H); this.vx[i] = 0; this.vy[i] = 0; this.h[i] = hue(Math.random()); this.b[i] = 0; }
    this.n = Math.min(this.n, want);
  }
  update(dt, pointers) {
    const G = this.G; this.fade += ((this.active ? 1 : 0) - this.fade) * Math.min(1, dt * 2); if (this.fade < 0.01) return;
    this.ensure();
    const repel = pointers.length >= 2; let energy = 0; const t = G.t;
    for (let i = 0; i < this.n; i++) {
      let ax = Math.sin(this.y[i] * 0.01 + t * 0.3) * 6, ay = Math.cos(this.x[i] * 0.01 + t * 0.25) * 6;
      for (const p of pointers) {
        const dx = p.x - this.x[i], dy = p.y - this.y[i]; const d2 = dx * dx + dy * dy; const R = repel ? 160 : 260; if (d2 > R * R) continue;
        const d = Math.sqrt(d2) + 8; const f = (1 - d / R) * (repel ? -1400 : 900);
        ax += (dx / d) * f + (repel ? 0 : (-dy / d) * f * 0.8); ay += (dy / d) * f + (repel ? 0 : (dx / d) * f * 0.8);
        this.b[i] = Math.min(1, this.b[i] + dt * 3);
      }
      const dr = Math.exp(-2.2 * dt); this.vx[i] = (this.vx[i] + ax * dt) * dr; this.vy[i] = (this.vy[i] + ay * dt) * dr;
      this.x[i] += this.vx[i] * dt; this.y[i] += this.vy[i] * dt; this.b[i] *= Math.exp(-dt * 0.9);
      if (this.x[i] < -10) this.x[i] = G.W + 10; else if (this.x[i] > G.W + 10) this.x[i] = -10;
      if (this.y[i] < -10) this.y[i] = G.H + 10; else if (this.y[i] > G.H + 10) this.y[i] = -10;
      energy += Math.abs(this.vx[i]) + Math.abs(this.vy[i]);
    }
    if (pointers.length && this.active) {
      const e = energy / this.n; G.earn(e * 0.0009 * dt * 60 * (this.n / 900), 0, 0, 'magnet', true);
      this._snd = (this._snd || 0) + dt; if (this._snd > 0.5) { this._snd = 0; audio.breath(Math.min(1, e / 200), repel ? 900 : 2200); if (Math.random() < 0.5) audio.note(8 + ((pointers[0].y < G.H / 2) ? 5 : 0) + ((Math.random() * 4) | 0), { kind: 'glass', vel: 0.18 }); }
    }
  }
  draw(ctx) {
    if (this.fade < 0.01) return; const S = sat(); const buckets = new Map();
    for (let i = 0; i < this.n; i++) { const key = ((this.h[i] / 30) | 0) * 3 + Math.min(2, (this.b[i] * 3) | 0); let b = buckets.get(key); if (!b) buckets.set(key, (b = [])); b.push(i); }
    for (const [key, list] of buckets) {
      const h = ((key / 3) | 0) * 30, lv = key % 3; ctx.globalAlpha = (0.35 + lv * 0.25) * this.fade * this.G.intensity; ctx.fillStyle = `hsl(${h},${S}%,${70 + lv * 8}%)`; ctx.beginPath();
      const sz = 1.3 + lv * 0.6; for (const i of list) ctx.rect(this.x[i] - sz / 2, this.y[i] - sz / 2, sz, sz); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export { ribbon, smooth };
