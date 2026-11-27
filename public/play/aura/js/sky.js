// « Rallume le ciel » : douze constellations endormies à relier du doigt.
// Chacune révèle une phrase d'un conte, joue sa mélodie, reste dans l'univers et donne +12 % de Lumière pour toujours.
import { TAU, clamp, rand, dist } from './util.js';
import { glow, hueAt, sat, burst } from './fx.js';
import { audio } from './audio.js';
import { xpFor } from './economy.js';

const C = (id, gate, pts, chains, fr, en, tfr, ten) => ({ id, gate, pts, chains, name: { fr, en }, tale: { fr: tfr, en: ten } });
export const SKY = [
  C('plume', 2, [[.3, .8], [.42, .6], [.55, .42], [.7, .22], [.3, .48], [.66, .58]], [[0, 1, 2, 3], [1, 4], [2, 5]], 'La Plume', 'The Feather',
    'Il était une fois un ciel qui avait oublié sa lumière. Une plume tomba la première.', 'Once upon a time, a sky forgot its light. A feather was the first to fall.'),
  C('oiseau', 4, [[.1, .45], [.3, .33], [.5, .45], [.7, .33], [.9, .45], [.5, .62]], [[0, 1, 2, 3, 4], [2, 5]], 'L’Oiseau', 'The Bird',
    'Un oiseau suivit la plume, pour voir où va ce qui tombe.', 'A bird followed the feather, to see where falling things go.'),
  C('barque', 6, [[.15, .55], [.85, .55], [.7, .74], [.3, .74], [.5, .6], [.5, .2], [.74, .5]], [[0, 3, 2, 1], [4, 5, 6, 4]], 'La Barque', 'The Boat',
    'Sur une mer sans reflet, une barque attendait qu’on la regarde.', 'On a sea without reflections, a boat waited to be seen.'),
  C('couronne', 9, [[.15, .7], [.85, .7], [.85, .4], [.7, .55], [.5, .3], [.3, .55], [.15, .4]], [[0, 1, 2, 3, 4, 5, 6, 0]], 'La Couronne', 'The Crown',
    'On dit qu’une reine avait posé sa couronne là-haut, pour enfin dormir.', 'They say a queen left her crown up there, so she could finally sleep.'),
  C('lanterne', 12, [[.5, .15], [.5, .28], [.35, .4], [.65, .4], [.35, .7], [.65, .7], [.5, .82]], [[0, 1], [1, 2, 4, 6, 5, 3, 1]], 'La Lanterne', 'The Lantern',
    'Quelqu’un ralluma une lanterne. Le noir recula d’un pas.', 'Someone lit a lantern again. The dark stepped back.'),
  C('phare', 15, [[.42, .85], [.58, .85], [.54, .35], [.46, .35], [.5, .2], [.25, .25], [.75, .25]], [[0, 1, 2, 3, 0], [3, 4, 2], [4, 5], [4, 6]], 'Le Phare', 'The Lighthouse',
    'Le phare comprit qu’il n’éclairait pas la mer, mais ceux qui la cherchent.', 'The lighthouse understood it did not light the sea, but those looking for it.'),
  C('cle', 19, [[.2, .45], [.3, .35], [.4, .45], [.3, .55], [.85, .45], [.85, .58], [.7, .45], [.7, .56]], [[0, 1, 2, 3, 0], [2, 6, 4], [4, 5], [6, 7]], 'La Clé', 'The Key',
    'Une clé ouvrait une porte que personne n’avait encore vue.', 'A key opened a door no one had seen yet.'),
  C('arbre', 23, [[.5, .9], [.5, .6], [.3, .45], [.7, .45], [.2, .3], [.4, .25], [.6, .25], [.8, .3], [.5, .35]], [[0, 1, 8], [1, 2, 4], [2, 5], [1, 3, 7], [3, 6]], 'L’Arbre', 'The Tree',
    'Derrière la porte, un arbre poussait vers le haut, sans jamais se presser.', 'Behind the door, a tree grew upwards, never in a hurry.'),
  C('cerf', 28, [[.3, .7], [.35, .5], [.6, .5], [.7, .7], [.6, .35], [.65, .2], [.55, .13], [.78, .12], [.72, .3]], [[0, 1, 2, 3], [2, 4, 5, 6], [5, 7], [4, 8]], 'Le Cerf', 'The Stag',
    'Un cerf s’arrêta sous l’arbre. Il n’avait plus peur du silence.', 'A stag stopped beneath the tree. It was no longer afraid of silence.'),
  C('harpe', 33, [[.3, .8], [.3, .2], [.75, .35], [.6, .8], [.45, .25], [.6, .3], [.4, .8], [.5, .8]], [[0, 1, 4, 5, 2, 3, 7, 6, 0], [4, 6], [5, 7]], 'La Harpe', 'The Harp',
    'Le vent toucha la harpe. Pour la première fois, le ciel chanta.', 'The wind touched the harp. For the first time, the sky sang.'),
  C('baleine', 40, [[.1, .55], [.25, .4], [.55, .35], [.8, .45], [.9, .35], [.95, .55], [.8, .55], [.5, .65], [.2, .62], [.45, .2]], [[0, 1, 2, 3, 4], [3, 5, 6, 7, 8, 0], [2, 9]], 'La Baleine', 'The Whale',
    'Une baleine nagea entre les étoiles et emporta les chagrins très loin.', 'A whale swam between the stars and carried the sorrows far away.'),
  C('coeur', 48, [[.5, .35], [.35, .22], [.18, .3], [.18, .5], [.5, .82], [.82, .5], [.82, .3], [.65, .22], [.5, .55]], [[0, 1, 2, 3, 4, 5, 6, 7, 0], [0, 8], [8, 4]], 'Le Cœur du ciel', 'The Heart of the Sky',
    'Et le ciel se souvint : sa lumière, c’était toi.', 'And the sky remembered: its light was you.'),
];
export const edgesOf = (c) => { const e = []; for (const ch of c.chains) for (let i = 1; i < ch.length; i++) e.push([ch[i - 1], ch[i]]); return e; };
/** Coût en Lumière pour réveiller une constellation (lié à son niveau). */
export const skyCost = (c) => Math.round(xpFor(c.gate + 1) * 0.25 + 30);
/** Prochaine constellation endormie. */
export const nextSky = (s) => SKY.find((c) => !(s.sky || []).includes(c.id)) || null;
export const skyMult = (s) => 1 + 0.12 * (s.sky || []).length;
/** Place de chaque constellation dans le ciel de l'univers (douze régions en anneau). */
export const skySpot = (i) => { const a = -Math.PI / 2 + (i / SKY.length) * TAU; return { x: 0.5 + Math.cos(a) * 0.33, y: 0.47 + Math.sin(a) * 0.36 }; };

export class SkyPuzzle {
  constructor(G, c, hooks) {
    this.G = G; this.c = c; this.hooks = hooks; this.edges = edgesOf(c); this.lit = new Set(); this.last = null; this.t0 = G.t; this.lastLit = G.t; this.doneAt = null; this.visited = new Set();
    this.h = hueAt(Math.random()); this.layout();
  }
  layout() { const G = this.G; const s = Math.min(G.W, G.H * 0.8) * 0.82; this.s = s; this.ox = (G.W - s) / 2; this.oy = (G.H - s) / 2 + G.H * 0.02; this.R = Math.max(26, s * 0.075); }
  P(i) { const p = this.c.pts[i]; return { x: this.ox + p[0] * this.s, y: this.oy + p[1] * this.s }; }
  key(a, b) { return a < b ? a + '-' + b : b + '-' + a; }
  beginStroke() { this.last = null; }
  /** Passage du doigt : relie l'étoile précédente à celle-ci si elles forment un trait de la constellation. */
  trace(x, y) {
    if (this.doneAt !== null) return;
    let hit = null, best = this.R; for (let i = 0; i < this.c.pts.length; i++) { const p = this.P(i); const d = dist(x, y, p.x, p.y); if (d < best) { best = d; hit = i; } }
    if (hit === null || hit === this.last) return;
    if (!this.visited.has(hit)) { this.visited.add(hit); audio.noteOnGrid(audio.snap(4 + hit * 2), { kind: 'glass', vel: 0.2, harm: false }); }
    if (this.last !== null) {
      const k = this.key(this.last, hit);
      if (this.edges.some(([a, b]) => this.key(a, b) === k) && !this.lit.has(k)) {
        this.lit.add(k); this.lastLit = this.G.t; const p = this.P(hit);
        burst(this.G.P, p.x, p.y, { n: Math.round(18 * this.G.pm), speed: 90, life: 1.4, s: 3.5, h: this.h + this.lit.size * 18, spread: 0.4, k: 0 });
        audio.noteOnGrid(audio.snap(5 + this.lit.size * 2), { kind: 'bell', vel: 0.36, harm: false }); this.G.haptic('soft');
        if (this.lit.size === this.edges.length) this.complete();
      }
    }
    this.last = hit;
  }
  endStroke() { this.last = null; }
  complete() {
    this.doneAt = this.G.t; const G = this.G;
    // La mélodie de la constellation : une note par étoile, dans l'ordre de ses traits.
    const order = [...new Set(this.c.chains.flat())];
    order.forEach((i, j) => audio.note(audio.snap(3 + i * 2), { kind: j % 2 ? 'harp' : 'bell', vel: 0.34, delay: 0.5 + j * 0.16, harm: false }));
    audio.swell(1, 6); G.haptic('strong');
    setTimeout(() => { for (let i = 0; i < this.c.pts.length; i++) { const p = this.P(i); burst(G.P, p.x, p.y, { n: Math.round(26 * G.pm), speed: 130, life: 2.4, s: 4, h: this.h + i * 25, spread: 0.5, k: 1 }); } }, 500);
    setTimeout(() => this.hooks.done(this), 1800);
  }
  update() {}
  draw(ctx) {
    const G = this.G; const t = G.t; const done = this.doneAt !== null ? clamp((t - this.doneAt) / 1.2, 0, 1) : 0;
    // Traits déjà rallumés (et ceux à trouver, à peine visibles une fois que l'on a commencé).
    ctx.lineCap = 'round';
    this.edges.forEach(([a, b], j) => {
      const A = this.P(a), B = this.P(b); const on = this.lit.has(this.key(a, b)); const h = this.h + j * 18;
      if (on || done) { for (const [w, al, l] of [[10, 0.12, 62], [3, 0.55, 74], [1.2, 0.95, 92]]) { ctx.globalAlpha = al * (1 + done * 0.4); ctx.strokeStyle = `hsl(${h | 0},${sat()}%,${l}%)`; ctx.lineWidth = w * (1 + done * 0.5); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); } }
      else if (G.t - this.t0 > 1.5) { ctx.globalAlpha = 0.09; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.setLineDash?.([3, 9]); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); ctx.setLineDash?.([]); }
    });
    // Indice doux après un moment sans trouver : une lueur glisse sur un trait encore éteint.
    if (!done && G.t - this.lastLit > 9) { const e = this.edges.find(([a, b]) => !this.lit.has(this.key(a, b))); if (e) { const A = this.P(e[0]), B = this.P(e[1]); const k = ((G.t - this.lastLit) % 2.2) / 2.2; glow(ctx, A.x + (B.x - A.x) * k, A.y + (B.y - A.y) * k, 14, this.h, 0.55 * Math.sin(Math.PI * k)); } }
    // Étoiles : faibles et palpitantes tant qu'on ne les a pas touchées.
    for (let i = 0; i < this.c.pts.length; i++) {
      const p = this.P(i); const v = this.visited.has(i) || done; const pul = 0.75 + 0.25 * Math.sin(t * 2.2 + i * 1.7);
      glow(ctx, p.x, p.y, (v ? 28 : 22) * pul * (1 + done * 0.6), this.h + i * 20, v ? 0.85 : 0.6);
      glow(ctx, p.x, p.y, 6, this.h + i * 20, v ? 1 : 0.85);
    }
    ctx.globalAlpha = 1;
  }
}
