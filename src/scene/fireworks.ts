// Feux d'artifice : petit moteur de particules sur un canvas qui ne tourne que pendant les explosions.
// Étincelles fines à longue traînée, gravité, traînée de l'air, couleurs qui évoluent, crépitements.

export type FwType = 'peony' | 'chrysanthemum' | 'willow' | 'crackle' | 'ring' | 'rainbow';
const MAJESTIC: FwType[] = ['peony', 'chrysanthemum', 'willow', 'crackle', 'ring', 'rainbow', 'rainbow', 'chrysanthemum'];
const HUES = [335, 285, 205, 175, 48, 140, 18, 260];
const anyHue = () => HUES[Math.floor(Math.random() * HUES.length)] + (Math.random() - 0.5) * 16;
export const randomType = () => MAJESTIC[Math.floor(Math.random() * MAJESTIC.length)];

type P = {
  x: number; y: number; vx: number; vy: number; age: number; life: number;
  h0: number; h1: number; s: number; l: number; g: number; drag: number; tr: number;
  trail: number[]; w: number; crackle: boolean; spark: boolean; flick: boolean;
};
type Rocket = { x: number; y: number; tx: number; ty: number; sx: number; sy: number; t: number; dur: number; then: () => void; trail: number[] };

export class Fireworks {
  private c: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private ps: P[] = [];
  private rockets: Rocket[] = [];
  private raf = 0;
  private last = 0;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private cap: number;
  private small: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.c = canvas;
    this.g = canvas.getContext('2d')!;
    this.small = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760;
    this.cap = this.small ? 520 : 1100;
    this.resize();
  }
  resize() {
    const r = this.c.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, this.small ? 1.5 : 2);
    this.w = r.width; this.h = r.height;
    this.c.width = Math.round(r.width * this.dpr); this.c.height = Math.round(r.height * this.dpr);
  }
  /** coordonnées client → canvas */
  local(cx: number, cy: number) { const r = this.c.getBoundingClientRect(); return [cx - r.left, cy - r.top] as const; }

  private kick() { if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(this.frame); } }

  /** Fusée qui monte du bas puis éclate en (x, y), coordonnées locales. */
  rocket(x: number, y: number, type: FwType, hue: number, power = 1, onBurst?: () => void) {
    const sx = x + (Math.random() - 0.5) * this.w * 0.12, sy = this.h + 10;
    const dur = 0.55 + Math.min(0.5, (sy - y) / this.h) * 0.6;
    this.rockets.push({ x: sx, y: sy, tx: x, ty: y, sx, sy, t: 0, dur, trail: [], then: () => { this.burst(x, y, type, hue, power); onBurst?.(); } });
    this.kick();
  }

  burst(x: number, y: number, type: FwType, hue: number, power = 1) {
    const k = this.small ? 0.68 : 1;
    const room = this.cap - this.ps.length;
    if (room < 20) return;
    const S = (this.small ? 0.82 : 1) * Math.sqrt(power);
    const hue2 = hue + (Math.random() < 0.5 ? 40 : -40) + (Math.random() - 0.5) * 30;
    const add = (n: number, f: (i: number, n: number) => Partial<P> & { a: number; sp: number; ty?: number }) => {
      n = Math.min(n, room);
      for (let i = 0; i < n; i++) {
        const o = f(i, n);
        const vx = Math.cos(o.a) * o.sp, vy = Math.sin(o.a) * o.sp * (o.ty ?? 1);
        this.ps.push({ x, y, vx, vy, age: 0, life: o.life ?? 1.8, h0: o.h0 ?? hue, h1: o.h1 ?? hue2, s: o.s ?? 95, l: o.l ?? 68, g: o.g ?? 70, drag: o.drag ?? 1.6, tr: o.tr ?? 9, trail: [], w: o.w ?? (this.small ? 1 : 1.1), crackle: !!o.crackle, spark: false, flick: !!o.flick });
      }
    };
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    // direction sur une sphère projetée à l'écran : bords denses, centre plus clair, comme un vrai bouquet
    const sph = (sp: number) => { const u = rnd(-1, 1), th = rnd(0, 6.283), r = Math.sqrt(1 - u * u); const vx = r * Math.cos(th), vy = r * Math.sin(th); return { a: Math.atan2(vy, vx), sp: sp * Math.hypot(vx, vy) }; };
    switch (type) {
      case 'peony':
        add(Math.round(80 * k * power), () => ({ ...sph(rnd(250, 290) * S), life: rnd(1.5, 2.2), tr: 9 }));
        break;
      case 'chrysanthemum':
        add(Math.round(70 * k * power), () => ({ ...sph(rnd(265, 300) * S), life: rnd(2, 2.7), tr: 16, h0: hue, h1: hue, l: 74, flick: true }));
        add(Math.round(30 * k * power), () => ({ ...sph(rnd(120, 140) * S), life: rnd(1.4, 1.9), tr: 6, h0: hue2, h1: hue2 + 30, l: 70 }));
        break;
      case 'willow':
        add(Math.round(64 * k * power), () => ({ ...sph(rnd(215, 245) * S), life: rnd(2.8, 3.4), tr: 26, g: 120, drag: 2.3, h0: 44, h1: 30, s: 100, l: 66, w: 1.1, flick: true }));
        break;
      case 'crackle':
        add(Math.round(58 * k * power), () => ({ ...sph(rnd(240, 280) * S), life: rnd(1.05, 1.4), tr: 7, crackle: true, l: 72 }));
        break;
      case 'rainbow':
        // crépitant multicolore : chaque étincelle a sa couleur et finit en éclats
        add(Math.round(70 * k * power), () => { const h = anyHue(); return { ...sph(rnd(240, 285) * S), life: rnd(1.1, 1.6), tr: 9, h0: h, h1: h + 15, l: 70, crackle: true }; });
        break;
      case 'ring': {
        const tilt = rnd(-0.6, 0.6), sq = rnd(0.35, 0.6);
        add(Math.round(52 * k * power), (i, n) => {
          const a = (i / n) * 6.283 + rnd(-0.03, 0.03), sp = rnd(235, 255) * S;
          const vx = Math.cos(a) * sp, vy = Math.sin(a) * sp * sq;
          const rx = vx * Math.cos(tilt) - vy * Math.sin(tilt), ry = vx * Math.sin(tilt) + vy * Math.cos(tilt);
          return { a: Math.atan2(ry, rx), sp: Math.hypot(rx, ry), life: rnd(1.7, 2.1), tr: 10, g: 50 };
        });
        add(Math.round(14 * k * power), () => ({ a: rnd(0, 6.283), sp: rnd(30, 70) * S, life: rnd(1.2, 1.6), tr: 4, h0: hue2, h1: hue2, l: 80 }));
        break;
      }
    }
    this.kick();
  }

  /** Petite gerbe discrète (liaison d'étoiles). */
  spark(x: number, y: number, hue: number) {
    const n = this.small ? 14 : 20;
    for (let i = 0; i < n && this.ps.length < this.cap; i++) {
      const a = (i / n) * 6.283 + Math.random() * 0.3, sp = 90 + Math.random() * 70;
      this.ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: 0.7 + Math.random() * 0.4, h0: hue, h1: hue + 20, s: 95, l: 75, g: 40, drag: 2, tr: 6, trail: [], w: 1, crackle: false, spark: false, flick: false });
    }
    this.kick();
  }

  private frame = (now: number) => {
    const dt = Math.min(0.033, (now - this.last) / 1000); this.last = now;
    const g = this.g, d = this.dpr;
    g.setTransform(d, 0, 0, d, 0, 0);
    g.clearRect(0, 0, this.w, this.h);
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';

    // fusées
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.t += dt / r.dur;
      const e = 1 - Math.pow(1 - Math.min(1, r.t), 2.4);
      r.x = r.sx + (r.tx - r.sx) * e + Math.sin(r.t * 18) * 1.2;
      r.y = r.sy + (r.ty - r.sy) * e;
      r.trail.push(r.x, r.y); if (r.trail.length > 28) r.trail.splice(0, 2);
      g.beginPath();
      for (let j = 0; j < r.trail.length; j += 2) j ? g.lineTo(r.trail[j], r.trail[j + 1]) : g.moveTo(r.trail[j], r.trail[j + 1]);
      g.strokeStyle = 'rgba(255,214,150,0.55)'; g.lineWidth = 1.4; g.stroke();
      g.fillStyle = '#fff6e0'; g.beginPath(); g.arc(r.x, r.y, 1.8, 0, 6.283); g.fill();
      if (Math.random() < 0.6 && this.ps.length < this.cap) this.ps.push({ x: r.x, y: r.y, vx: (Math.random() - 0.5) * 30, vy: 20 + Math.random() * 30, age: 0, life: 0.35 + Math.random() * 0.3, h0: 38, h1: 25, s: 100, l: 70, g: 60, drag: 1, tr: 2, trail: [], w: 0.9, crackle: false, spark: true, flick: true });
      if (r.t >= 1) { this.rockets.splice(i, 1); r.then(); }
    }

    // particules
    const ps = this.ps;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.age += dt;
      if (p.age >= p.life) {
        if (p.crackle) {
          // crépitement : la particule éclate en minuscules éclairs blancs
          for (let k = 0; k < 5 && ps.length < this.cap; k++) {
            const a = Math.random() * 6.283, sp = 20 + Math.random() * 45;
            const wh = Math.random() < 0.35;
            ps.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: 0.14 + Math.random() * 0.32, h0: p.h1, h1: p.h1, s: wh ? 20 : 100, l: wh ? 94 : 76, g: 20, drag: 3, tr: 1, trail: [], w: 1, crackle: false, spark: true, flick: true });
          }
        }
        ps[i] = ps[ps.length - 1]; ps.pop(); continue;
      }
      const f = Math.exp(-p.drag * dt);
      p.vx *= f; p.vy = p.vy * f + p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.trail.push(p.x, p.y);
      if (p.trail.length > p.tr * 2) p.trail.splice(0, 2);
      const t = p.age / p.life;
      let a = t < 0.08 ? t / 0.08 : 1 - Math.pow((t - 0.08) / 0.92, 1.6);
      if (p.flick && t > 0.55) a *= 0.45 + Math.random() * 0.75;
      if (a <= 0.01) continue;
      const hue = p.h0 + (p.h1 - p.h0) * t;
      const L = p.l + (1 - t) * (t < 0.15 ? 22 : 0); // cœur presque blanc à l'éclosion
      const col = `hsla(${hue.toFixed(0)},${p.s}%,${L.toFixed(0)}%,`;
      const tl = p.trail;
      if (tl.length >= 4) {
        // traînée effilée : la partie ancienne est plus pâle et plus fine
        const mid = Math.max(2, (tl.length >> 2) << 1);
        g.beginPath(); g.moveTo(tl[0], tl[1]);
        for (let j = 2; j <= mid; j += 2) g.lineTo(tl[j], tl[j + 1]);
        g.strokeStyle = col + (a * 0.18).toFixed(3) + ')'; g.lineWidth = p.w * 0.7; g.stroke();
        g.beginPath(); g.moveTo(tl[mid], tl[mid + 1]);
        for (let j = mid + 2; j < tl.length; j += 2) g.lineTo(tl[j], tl[j + 1]);
        g.strokeStyle = col + (a * 0.6).toFixed(3) + ')'; g.lineWidth = p.w; g.stroke();
      }
      g.fillStyle = col + a.toFixed(3) + ')';
      g.beginPath(); g.arc(p.x, p.y, p.spark ? 0.9 : p.w * 0.95, 0, 6.283); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    if (ps.length || this.rockets.length) this.raf = requestAnimationFrame(this.frame);
    else { this.raf = 0; g.clearRect(0, 0, this.w, this.h); }
  };

  destroy() { cancelAnimationFrame(this.raf); this.ps = []; this.rockets = []; }
}
