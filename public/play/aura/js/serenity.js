// Moments de sérénité : respiration guidée vivante, et séance pour s'endormir.
import { TAU, clamp, rand, smooth } from './util.js';
import { glow, hue, sat } from './fx.js';
import { audio } from './audio.js';

// ---------- Respiration ----------
export const PATTERNS = {
  calm: { phases: [['inhale', 4], ['hold', 2], ['exhale', 6]], cycles: 15, name: { fr: 'Apaiser · 4-2-6', en: 'Soothe · 4-2-6' } },
  coherence: { phases: [['inhale', 5], ['exhale', 5]], cycles: 18, name: { fr: 'Cohérence · 5-5', en: 'Coherence · 5-5' } },
  box: { phases: [['inhale', 4], ['hold', 4], ['exhale', 4], ['rest', 4]], cycles: 11, name: { fr: 'Carré · 4-4-4-4', en: 'Box · 4-4-4-4' } },
  sleep: { phases: [['inhale', 4], ['hold', 7], ['exhale', 8]], cycles: 6, name: { fr: 'Sommeil · 4-7-8', en: 'Sleep · 4-7-8' } },
};
// Une note de plus à chaque respiration : la mélodie monte doucement puis redescend.
const MELODY = [0, 2, 4, 5, 7, 9, 7, 5, 4, 7, 9, 12, 9, 7, 4, 2, 4, 7];

export class Breath {
  constructor(G, id, hooks) {
    this.G = G; this.p = PATTERNS[id] || PATTERNS.calm; this.hooks = hooks; this.t0 = G.t; this.cycle = 0; this.ph = null; this.stars = []; this.done = false; this.outro = null;
    this.period = this.p.phases.reduce((s, x) => s + x[1], 0); this.baseHue = Math.random();
    audio.bed(true); audio.wave(0.15, 2);
  }
  phase() {
    let a = (this.G.t - this.t0) % this.period; const n = Math.floor((this.G.t - this.t0) / this.period);
    for (const [id, d] of this.p.phases) { if (a < d) return { id, k: a / d, d, n }; a -= d; }
    return { id: 'exhale', k: 1, d: 1, n };
  }
  /** Ouverture de la fleur (0 fermée → 1 ouverte), lissée. */
  open(ph) { const e = (x) => 0.5 - Math.cos(Math.PI * x) / 2; return ph.id === 'inhale' ? e(ph.k) : ph.id === 'hold' ? 1 : ph.id === 'exhale' ? 1 - e(ph.k) : 0; }
  update(dt) {
    const G = this.G;
    if (this.outro !== null) { if (G.t - this.outro > 5 && !this.done) { this.done = true; this.hooks.done(this.cycle); } return; }
    const ph = this.phase();
    if (ph.n >= this.p.cycles) { this.finish(); return; }
    const key = ph.id + ph.n;
    if (key !== this.ph) {
      this.ph = key; this.hooks.label(ph.id, `${ph.n + 1} / ${this.p.cycles}`); G.haptic('soft');
      if (ph.id === 'inhale') {
        if (ph.n > 0) this.addStar(ph.n - 1);
        this.cycle = ph.n; audio.wave(0.95, ph.d); audio.swell(0.6, ph.d);
        audio.note(MELODY[ph.n % MELODY.length] + 3, { kind: 'bell', vel: 0.28 });
      } else if (ph.id === 'exhale') { audio.wave(0.12, ph.d); audio.note(MELODY[ph.n % MELODY.length] - 2, { kind: 'harp', vel: 0.18 }); }
      else if (ph.id === 'rest') audio.wave(0.06, ph.d);
    }
    // Particules : aspirées à l'inspiration, libérées à l'expiration.
    const c = this.center(); const R = this.radius(this.open(ph)); const h = this.hueOf(ph.n);
    this._e = (this._e || 0) + dt * 26 * G.pm;
    while (this._e > 1) { this._e--; const a = rand(TAU); const inward = ph.id === 'inhale'; const d = inward ? R * 2.4 : R * 0.9; G.P.add(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, Math.cos(a) * (inward ? -46 : 34), Math.sin(a) * (inward ? -46 : 34), { life: 2.2, s: rand(2, 4), grav: 0, tur: 4, drag: 0.6, h: h + rand(-25, 25) }); }
  }
  center() { return { x: this.G.W / 2, y: this.G.H * 0.47 }; }
  radius(open) { const m = Math.min(this.G.W, this.G.H); return m * (0.1 + 0.2 * open); }
  hueOf(n) { return hue((this.baseHue + n * 0.13) % 1); }
  ringR() { return Math.min(this.G.W, this.G.H) * 0.4; }
  starPos(i) { const c = this.center(); const a = -Math.PI / 2 + (i / this.p.cycles) * TAU; return { x: c.x + Math.cos(a) * this.ringR(), y: c.y + Math.sin(a) * this.ringR() }; }
  addStar(i) { const p = this.starPos(i); this.stars.push({ ...p, h: this.hueOf(i), t: this.G.t }); audio.note(12 + (i % 5), { kind: 'glass', vel: 0.14 }); }
  finish() {
    if (this.outro !== null) return; this.addStar(this.p.cycles - 1); this.outro = this.G.t; this.cycle = this.p.cycles;
    audio.wave(0.3, 3); audio.reaction(true);
    this.G.universe.addConstellation(this.stars.map((s) => ({ x: s.x, y: s.y })), this.stars[0]?.h ?? 220);
  }
  stop() { audio.wave(0, 2); }
  draw(ctx) {
    const G = this.G; const c = this.center(); const outro = this.outro !== null ? clamp((G.t - this.outro) / 3, 0, 1) : 0;
    const ph = this.outro !== null ? { id: 'hold', k: 1, n: this.p.cycles } : this.phase(); const open = Math.max(this.open(ph), outro);
    const R = this.radius(open); const n = Math.min(12, 4 + ph.n); const h0 = this.hueOf(ph.n); const rot = G.t * 0.06;
    // Anneau de progression : une étoile par respiration, les suivantes en pointillés.
    for (let i = 0; i < this.p.cycles; i++) { const p = this.starPos(i); if (i >= this.stars.length) glow(ctx, p.x, p.y, 4, h0, 0.14); }
    ctx.lineWidth = 1; for (let i = 1; i < this.stars.length; i++) { const a = this.stars[i - 1], b = this.stars[i]; ctx.globalAlpha = 0.22 + outro * 0.3; ctx.strokeStyle = `hsl(${b.h | 0},${sat()}%,80%)`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    if (outro > 0 && this.stars.length > 2) { const a = this.stars[this.stars.length - 1], b = this.stars[0]; ctx.globalAlpha = 0.5 * outro; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    ctx.globalAlpha = 1;
    for (const s of this.stars) { const age = G.t - s.t; glow(ctx, s.x, s.y, 10 + 18 * Math.exp(-age * 2), s.h, 0.85); }
    // Fleur de lumière : les pétales s'ouvrent à l'inspiration, se referment à l'expiration.
    glow(ctx, c.x, c.y, R * 2.6, h0, 0.22 + 0.15 * open);
    for (let layer = 0; layer < 2; layer++) {
      const nn = layer ? n : Math.max(3, n - 2); const L = R * (layer ? 1 : 0.72); const off = layer ? 0 : Math.PI / nn;
      for (let i = 0; i < nn; i++) {
        const a = rot * (layer ? 1 : -1) + off + (i / nn) * TAU; const hh = h0 + i * (180 / nn) * 0.4 + layer * 30;
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(a); ctx.globalAlpha = (0.1 + 0.12 * open) * (layer ? 1 : 0.8);
        ctx.fillStyle = `hsl(${hh | 0},${sat()}%,${62 + layer * 8}%)`; ctx.beginPath(); ctx.ellipse(L * 0.55, 0, L * 0.55, L * (0.12 + 0.1 * open), 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = 0.25 + 0.2 * open; ctx.strokeStyle = `hsl(${hh | 0},${sat()}%,84%)`; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
      }
    }
    glow(ctx, c.x, c.y, R * 0.5, h0 + 40, 0.7); ctx.globalAlpha = 1;
  }
}

// ---------- S'endormir ----------
export class Sleep {
  constructor(G, minutes, hooks) {
    this.G = G; this.dur = minutes * 60; this.t0 = G.t; this.hooks = hooks; this.phase = 0; this.half = 'in'; this.nextLantern = 3; this.ended = false; this.dark = 0;
    audio.setSleep(true); audio.sleepLevel(1, 1);
  }
  get progress() { return clamp((this.G.t - this.t0) / this.dur, 0, 1); }
  /** Rythme respiratoire proposé : de 6 à 4 respirations par minute, très progressivement. */
  period() { return 10 + 5 * smooth(0, 0.6, this.progress); }
  update(dt) {
    const G = this.G; const p = this.progress;
    this.phase += dt / this.period(); const inhale = (this.phase % 1) < 0.42; const half = inhale ? 'in' : 'out';
    if (half !== this.half) { this.half = half; const P = this.period(); audio.wave(inhale ? 0.85 * (1 - this.dark) : 0.18, inhale ? P * 0.42 : P * 0.58); }
    // Lanternes chaudes qui montent très lentement.
    this.nextLantern -= dt;
    if (this.nextLantern < 0 && !this.ended) { this.nextLantern = rand(5, 9); const x = rand(G.W * 0.15, G.W * 0.85); for (let i = 0; i < 4; i++) G.P.add(x + rand(-30, 30), G.H + 20, rand(-4, 4), rand(-22, -12), { k: 3, life: rand(14, 20), s: rand(7, 13), grav: -1.5, tur: 4, drag: 0.15, h: hue(Math.random()), a: 0.55 }); }
    // Tout s'assombrit et se tait lentement sur le dernier tiers.
    this.dark = smooth(0.6, 1, p); audio.sleepLevel(1 - this.dark, 3);
    if (p >= 1 && !this.ended) { this.ended = true; audio.wave(0, 8); audio.sleepLevel(0, 4); setTimeout(() => { if (this.ended) audio.suspend(); }, 20000); this.hooks.end && this.hooks.end(); }
  }
  breathLevel() { const x = this.phase % 1; return x < 0.42 ? 0.5 - Math.cos(Math.PI * x / 0.42) / 2 : 0.5 + Math.cos(Math.PI * (x - 0.42) / 0.58) / 2; }
  draw(ctx) {
    const G = this.G; const b = this.breathLevel(); const m = Math.min(G.W, G.H);
    // Une lueur chaude qui respire : il suffit de la suivre des yeux.
    glow(ctx, G.W / 2, G.H * 0.55, m * (0.42 + 0.14 * b), hue(0.5), (0.1 + 0.12 * b) * (1 - this.dark));
    glow(ctx, G.W / 2, G.H * 0.55, m * (0.1 + 0.05 * b), hue(0.3), (0.12 + 0.1 * b) * (1 - this.dark));
  }
  /** Teinte ambrée sur toute l'image (aucune lumière bleue), puis voile noir final. */
  drawDark(ctx) {
    ctx.globalCompositeOperation = 'color'; ctx.globalAlpha = 0.62; ctx.fillStyle = '#ff9b5c'; ctx.fillRect(0, 0, this.G.W, this.G.H);
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.35; ctx.fillStyle = '#ffb27a'; ctx.fillRect(0, 0, this.G.W, this.G.H); ctx.globalAlpha = 1;
    if (this.dark <= 0.001) { ctx.globalCompositeOperation = 'source-over'; return; } ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(0.97, this.dark); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, this.G.W, this.G.H); ctx.globalAlpha = 1; }
  stop() { this.ended = false; audio.setSleep(false); audio.sleepLevel(1, 0.8); audio.resume(); }
}
