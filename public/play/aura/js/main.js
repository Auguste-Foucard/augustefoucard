// AURA — boucle de jeu, gestes, progression, sauvegarde.
import { TAU, clamp, rand, smooth, easeOut, dist } from './util.js';
import { Particles, setPalette, palette, hue, hueAt, glow, ribbon, burst } from './fx.js';
import { analyze, glyph } from './shapes.js';
import { Creation, Filament, Ghost } from './creations.js';
import { findReaction, Reaction } from './reactions.js';
import { Universe } from './universe.js';
import { Charge, Ripples, Sand } from './powers.js';
import { audio } from './audio.js';
import { haptic, setHaptics } from './haptics.js';
import { FORM, FORMS, POWER, POWERS, newState, earn as earnState, formValue, gainMult, comboMult, passiveRate, UPGRADE, upCost, reqMet } from './economy.js';
import { t, L, setLang, lang } from './i18n.js';
import { UI } from './ui.js';
import { playIntro } from './intro.js';
import { Breath, Sleep } from './serenity.js';

const SAVE_KEY = 'aura.save.v1';
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: false });

// ---------- État ----------
function load() {
  const base = newState();
  try {
    const raw = localStorage.getItem(SAVE_KEY); if (!raw) return base;
    const s = JSON.parse(raw);
    return { ...base, ...s, up: { ...base.up, ...s.up }, settings: { ...base.settings, ...s.settings }, universe: { ...base.universe, ...s.universe }, stats: { ...base.stats, ...s.stats }, seen: s.seen || {}, forms: s.forms || {}, combos: s.combos || {} };
  } catch { return base; }
}
const DEMO = new URLSearchParams(location.search).has('demo');
const HQ = new URLSearchParams(location.search).has('hq'); // captures : qualité fixe
const PROF = new URLSearchParams(location.search).has('prof');
let state = DEMO ? newState() : load();
if (!localStorage.getItem(SAVE_KEY) && matchMedia('(prefers-reduced-motion: reduce)').matches) state.settings.reduced = true;
let dirty = false;
function save() { if (DEMO) return; state.lastSeen = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); dirty = false; } catch { /* stockage indisponible : le jeu continue */ } }
if (state.settings.lang) setLang(state.settings.lang); else setLang(lang);

// ---------- Contexte partagé ----------
const G = {
  P: new Particles(6000), W: 1, H: 1, dpr: 1, t: 0, state, creations: [], effects: [], filaments: [], motes: [],
  prof: {}, exposure: 1, mode: 'play', quality: 1, intensity: 1, reduced: false, audioOn: false,
  pm: 1, lifeMult: 1, trailMult: 1, burstMult: 1, bloom: 0, bursts: 0, colors: 0, strands: 1, reactWindow: 8, reactDist: 200, chain: 0, lastReact: -99,
  get level() { return state.level; },
  formLevel: (type) => FORM[type]?.level ?? 1,
  attract(x, y, r, str, swirl = 0) { this.P.attractors.push({ x, y, r, str, swirl }); },
  haptic: (k) => haptic(k),
  twinkle(x, y, h) { glowsQ.push({ x, y, h, t: G.t }); },
  earn: (a, x, y, src, quiet) => earn(a, x, y, src, quiet),
};
const glowsQ = [];
G.universe = new Universe(state);

function refresh() {
  const s = state; const set = s.settings; const u = s.up;
  G.reduced = set.reduced;
  const sleeping = G.mode === 'sleep';
  G.intensity = set.intensity * (set.night ? 0.72 : 1) * (sleeping ? 0.5 : 1);
  G.pm = (1 + 0.3 * u.particles) * (0.45 + 0.55 * set.intensity) * G.quality * (set.reduced ? 0.55 : 1) * (set.night ? 0.75 : 1) * (sleeping ? 0.5 : 1);
  G.lifeMult = 1 + 0.25 * u.life; G.trailMult = 1 + 0.25 * u.trails; G.burstMult = 1 + 0.12 * u.bursts; G.bloom = u.bloom; G.bursts = u.bursts; G.colors = u.colors;
  G.strands = Math.min(4, 1 + Math.floor(u.trails / 3) + (u.particles >= 6 ? 1 : 0));
  G.reactWindow = 8 + 1.2 * u.links; G.reactDist = Math.min(G.W, G.H) * (0.28 + 0.04 * u.links);
  G.P.trail = G.trailMult; G.P.timeScale = (set.reduced ? 0.7 : 1) * (set.night ? 0.8 : 1) * (sleeping ? 0.55 : 1);
  setPalette(set.palette, u.colors, set.night, sleeping);
  audio.setVolume(set.sound); audio.setMusic(set.music); audio.setRichness(u.resonance); audio.setNight(set.night);
  setHaptics(set.haptics && !sleeping);
  document.documentElement.classList.toggle('night', set.night);
}

// ---------- Écran ----------
/** Taille réelle de l'écran. Sur iPhone (app installée), iOS peut annoncer une hauteur trop courte :
 *  on prend la plus grande des mesures fiables, et l'écran physique quand l'app est en plein écran. */
function viewport() {
  const vv = window.visualViewport;
  let w = Math.max(document.documentElement.clientWidth || 0, innerWidth || 0, vv ? vv.width : 0);
  let h = Math.max(document.documentElement.clientHeight || 0, innerHeight || 0, vv ? vv.height : 0);
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
  if (standalone && screen && screen.width && screen.height) {
    const portrait = h >= w; const sw = portrait ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height); const sh = portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
    if (Math.abs(sw - w) < 2 && sh > h && sh - h < 140) h = sh; // seulement si c'est bien le même écran (pas un iPad en fenêtre)
  }
  return { w: Math.round(w), h: Math.round(h) };
}
function resize() {
  const { w: vw, h: vh } = viewport(); G.dpr = Math.min(devicePixelRatio || 1, G.quality < 0.6 ? 1.25 : 2);
  document.documentElement.style.setProperty('--vh', vh + 'px'); scrollTo(0, 0);
  canvas.width = Math.round(vw * G.dpr); canvas.height = Math.round(vh * G.dpr); canvas.style.width = vw + 'px'; canvas.style.height = vh + 'px';
  G.W = vw; G.H = vh; G.universe.resize(vw, vh); refresh();
}
addEventListener('resize', resize); resize();
addEventListener('orientationchange', () => setTimeout(resize, 350));
addEventListener('scroll', () => { if (scrollY || scrollX) scrollTo(0, 0); }, { passive: true }); // la page ne doit jamais défiler
window.visualViewport?.addEventListener('resize', resize);
setTimeout(resize, 400); // iOS finit parfois de mesurer après le premier affichage

// ---------- Lumière ----------
const ui = new UI(G, { buy, setPower, setSetting, startMode, reset, save: () => (dirty = true) });

function earn(amount, x = 0, y = 0, src = '', quiet = false) {
  if (!(amount > 0)) return;
  const ups = earnState(state, amount); dirty = true;
  if (!quiet && G.mode === 'play') {
    const n = Math.min(7, 1 + Math.floor(Math.log10(amount + 1) * 2));
    for (let i = 0; i < n; i++) G.motes.push({ x0: x + rand(-14, 14), y0: y + rand(-14, 14), t0: G.t + i * 0.05, d: rand(0.9, 1.4), h: hue(Math.random()) });
  }
  for (const lv of ups) onLevel(lv);
}

function onLevel(lv) {
  if (G.mode === 'sleep') { ui.render(); return; } // jamais de fanfare pendant l'endormissement
  audio.levelUp(); haptic('strong');
  G.effects.push(new LevelRing(G));
  const forms = FORMS.filter((f) => f.level === lv); const powers = POWERS.filter((p) => p.level === lv);
  let sub = '';
  if (forms.length) sub = t('formAwake', { f: L(forms[0].name) });
  if (powers.length) sub = (sub ? sub + ' · ' : '') + t('powerAwake', { p: L(powers[0].name) });
  ui.toast(t('levelUp', { n: lv }), sub, 3400, 3);
  for (const f of forms) if (f.id !== 'mandala') setTimeout(() => G.effects.push(new Ghost(G, f.id)), 1400);
  ui.render();
}

/** Anneau iridescent qui s'élargit lentement à chaque niveau. */
class LevelRing {
  constructor(G) { this.G = G; this.born = G.t; this.dead = false; this.h = hue(Math.random()); }
  update() { if (this.G.t - this.born > 3.2) this.dead = true; }
  draw(c) { const a = this.G.t - this.born; const R = easeOut(a / 3.2) * Math.hypot(this.G.W, this.G.H) * 0.6; for (let i = 0; i < 5; i++) { c.globalAlpha = (1 - a / 3.2) * 0.22; c.strokeStyle = `hsl(${(this.h + i * 50) % 360},80%,75%)`; c.lineWidth = 3; c.beginPath(); c.arc(this.G.W / 2, this.G.H / 2, Math.max(1, R - i * 14), 0, TAU); c.stroke(); } c.globalAlpha = 1; }
}

// ---------- Achats & réglages ----------
function buy(id) {
  const u = UPGRADE[id]; const lvl = state.up[id]; if (lvl >= u.max || !reqMet(state, u)) return false;
  const c = upCost(id, lvl); if (state.light < c) return false;
  state.light -= c; state.up[id]++; dirty = true; refresh();
  audio.ui('buy'); haptic('soft');
  // Démonstration immédiate de ce qui vient de changer.
  const x = G.W / 2, y = G.H * 0.2;
  burst(G.P, x, y, { n: Math.round(50 * G.pm * G.burstMult), speed: 150 * G.burstMult, life: 2.4, k: id === 'trails' ? 1 : 0 });
  if (id === 'resonance') audio.reaction(false);
  return true;
}
function setPower(id) { if (POWER[id] && state.level >= POWER[id].level) { state.power = id; dirty = true; audio.ui(); ui.render(); ui.flashPower(); } }
function setSetting(k, v) {
  state.settings[k] = v; if (k === 'lang') setLang(v); dirty = true;
  if (k === 'night' || k === 'palette') { G.universe.bg = null; G.universe.dirty = true; G.universe.galaxySprites.clear(); }
  refresh(); ui.render();
}
function reset() { localStorage.removeItem(SAVE_KEY); state = newState(); location.reload(); }

// ---------- Modes ----------
let breath = null; let sleep = null; let autoT = 0;
function startMode(m, opt) {
  if (breath) { breath.stop(); breath = null; if (m !== 'sleep') audio.bed(false); }
  if (sleep && m !== 'sleep') { sleep.stop(); sleep = null; }
  const wasCalm = G.mode === 'sleep';
  G.mode = m; document.body.dataset.mode = m; ui.closeSheet();
  if (m === 'breathe' || m === 'sleep') for (const c of G.creations) c.life = Math.min(c.life, c.age + 1.2);
  if (m === 'breathe') breath = new Breath(G, opt || 'calm', {
    label: (id, sub) => ui.breath(t(id), sub),
    done: (n) => { earn(n * 3 * gainMult(state), G.W / 2, G.H / 2, 'breath', true); ui.toast(t('breathDone', { n }), t('constellationBorn'), 4200, 3); setTimeout(() => G.mode === 'breathe' && startMode('play'), 600); },
  });
  if (m === 'sleep') { sleep = new Sleep(G, opt || 30, { end: () => {} }); ui.breath('', ''); }
  if (m === 'sleep' || wasCalm) { G.universe.sleep = m === 'sleep'; G.universe.bg = null; G.universe.dirty = true; G.universe.galaxySprites.clear(); refresh(); }
  autoT = m === 'sleep' ? 8 : 1.5; ui.render();
}

// ---------- Gestes ----------
const ptrs = new Map(); const ripples = new Ripples(G); const sand = new Sand(G);
const kCenter = () => ({ x: G.W / 2, y: G.H / 2 });
const symCount = () => 6 + (G.bloom >= 3 ? 2 : 0);

function firstTouch() {
  audio.unlock(); G.audioOn = true;
  if (!state.seen.intro) { state.seen.intro = true; ui.hideIntro(); }
}

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault(); firstTouch(); if (skipIntro) { skipIntro(); haptic('soft'); }
  if (sleep && sleep.ended) { startMode('play'); return; }
  if ((G.mode === 'free') && e.clientX > G.W - 64 && e.clientY < 64) { startMode('play'); return; }
  canvas.setPointerCapture?.(e.pointerId);
  const p = { id: e.pointerId, x: e.clientX, y: e.clientY, raw: [{ x: e.clientX, y: e.clientY }], vis: [], t0: G.t, last: performance.now(), lx: e.clientX, ly: e.clientY, dist: 0, power: state.power, h: nextHue(), hapD: 0 };
  ptrs.set(e.pointerId, p); ui.drawing(true);
  if (p.power === 'fireworks') p.charge = new Charge(G, p.x, p.y, p.id);
  if (p.power === 'water') ripples.add(p.x, p.y, 1);
  addVis(p, p.x, p.y, 0);
}, { passive: false });

canvas.addEventListener('pointermove', (e) => {
  const p = ptrs.get(e.pointerId); if (!p) return; e.preventDefault();
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const ev of evs) {
    const x = ev.clientX, y = ev.clientY; const d = dist(p.lx, p.ly, x, y); if (d < 2.5) continue;
    const now = performance.now(); const dt = Math.max(1, now - p.last); const speed = d / dt; // px/ms
    p.last = now; p.lx = x; p.ly = y; p.x = x; p.y = y; p.dist += d; p.raw.push({ x, y });
    addVis(p, x, y, speed);
    if (p.power === 'filaments' || p.power === 'kaleido') {
      // Particules qui naissent du geste.
      const n = d * 0.05 * G.pm; for (let i = 0; i < n || Math.random() < n; i++) { if (i > 8) break; const a = rand(TAU); const v = rand(10, 40) + speed * 25; G.P.add(x, y, Math.cos(a) * v, Math.sin(a) * v, { k: Math.random() < 0.3 + G.trailMult * 0.05 ? 1 : 0, life: rand(0.8, 1.8) * (0.8 + G.trailMult * 0.2), s: rand(2, 4.5), h: p.h + rand(-20, 20) + G.t * 30, grav: -8, tur: 16 }); }
      audio.gesture(y / G.H, speed, (x / G.W) * 2 - 1, p.power);
      earn(d * 0.0016 * gainMult(state), x, y, 'stroke', true);
    } else if (p.power === 'fireworks' && p.charge) p.charge.move(x, y);
    else if (p.power === 'water') { p.wd = (p.wd || 0) + d; if (p.wd > 70) { p.wd = 0; ripples.add(x, y, 0.6); } }
    p.hapD += d; if (p.hapD > 140) { p.hapD = 0; haptic('tick'); }
  }
}, { passive: false });

let lastHuePos = Math.random();
/** Teinte du prochain geste : toujours assez différente de la précédente. */
function nextHue() { lastHuePos = (lastHuePos + 0.22 + Math.random() * 0.56) % 1; return hueAt(lastHuePos); }

function addVis(p, x, y, speed) {
  const w = clamp(1.25 - speed * 0.35, 0.55, 1.3);
  p.vis.push({ x, y, h: p.h + p.vis.length * 1.6 * (0.3 + palette.spread) + G.t * 20, w, f: 1, t: G.t });
}

function endPointer(e) {
  const p = ptrs.get(e.pointerId); if (!p) return; ptrs.delete(e.pointerId); if (!ptrs.size) ui.drawing(false);
  if (p.power === 'fireworks') { p.charge.release(); return; }
  if (p.power === 'water' || p.power === 'magnet') return;
  const dur = G.t - p.t0;
  if (p.dist < 14) { // simple touche : une pluie d'étincelles et une note
    burst(G.P, p.x, p.y, { n: Math.round(14 * G.pm), speed: 70, life: 1.4, s: 3.5, k: 0, h: p.h, spread: 0.6 });
    audio.note(Math.round((1 - p.y / G.H) * 12) + 2, { kind: 'kalimba', vel: 0.4, pan: (p.x / G.W) * 2 - 1 }); earn(0.5 * gainMult(state), p.x, p.y, 'tap', true); return;
  }
  state.stats.strokes++;
  const kal = p.power === 'kaleido'; const opts = kal ? { sym: symCount(), center: kCenter() } : {};
  let { type, info } = analyze(p.raw);
  if (type === 'galaxy' && state.level < FORM.galaxy.level) type = 'spiral';
  if (kal && type && state.level >= FORM.mandala.level && info.closed) type = 'mandala';
  if (type && state.level < FORM[type].level) {
    if (!G._hinted?.[type]) { (G._hinted ||= {})[type] = 1; ui.toast(t('sleepingForm', { f: L(FORM[type].name), n: FORM[type].level }), '', 2600); }
    type = null;
  }
  if (!type) {
    G.filaments.push(new Filament(G, p.vis, { ...opts, lifeK: kal ? 1.2 : 1 }));
    const v = Math.max(1, (p.dist / Math.hypot(G.W, G.H)) * 6) * gainMult(state) * (kal ? 1.4 : 1);
    earn(v, p.x, p.y, 'free');
    return;
  }
  const c = new Creation(G, type, info, opts); G.creations.push(c); state.stats.created++;
  audio.form(type, (c.cx / G.W) * 2 - 1); haptic('soft');
  const size = info.size / Math.min(G.W, G.H);
  earn(formValue(state, type, size) * (kal ? 1.5 : 1), c.cx, c.cy, type);
  const first = !state.forms[type]; state.forms[type] = (state.forms[type] || 0) + 1;
  if (first && type !== 'line') ui.toast(L(FORM[type].name), L(FORM[type].desc), 3200);
  if (type === 'flower') G.universe.addFlower(c.cx, c.cy, c.h0, c.petals, 1);
  // Harmonies.
  const r = findReaction(G, c);
  if (r) {
    G.effects.push(new Reaction(G, r.combo, r.parts));
    G.chain = G.t - G.lastReact < 6 ? G.chain + 1 : 0; G.lastReact = G.t;
    const sum = r.parts.reduce((s, o) => s + (FORM[o.type]?.value || 4), 0);
    const isNew = !state.combos[r.combo.id]; state.combos[r.combo.id] = (state.combos[r.combo.id] || 0) + 1;
    earn(sum * r.combo.value * comboMult(state) * gainMult(state) * (1 + 0.2 * G.chain) * (isNew ? 3 : 1), c.cx, c.cy, 'combo');
    audio.reaction(isNew || G.chain > 1);
    if (isNew) ui.toast(L(r.combo.name), t('comboFound'), 3600, 2);
    ui.render();
  }
}
canvas.addEventListener('pointerup', (e) => { audio.unlock(); endPointer(e); });
document.addEventListener('touchend', () => audio.unlock(), { passive: true }); canvas.addEventListener('pointercancel', endPointer);
document.addEventListener('gesturestart', (e) => e.preventDefault());
addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (G.mode !== 'play') startMode('play'); else ui.closeSheet(); } });
document.addEventListener('touchmove', (e) => { if (e.target === canvas) e.preventDefault(); }, { passive: false });
document.addEventListener('dblclick', (e) => e.preventDefault());

// ---------- Contemplation : le monde se dessine tout seul ----------
const AUTO = () => FORMS.filter((f) => f.level <= state.level && f.id !== 'mandala' && f.id !== 'galaxy').map((f) => f.id);
function autoCreate() {
  let types = AUTO(); if (sleep) types = types.filter((t) => ['line', 'circle', 'wave', 'flower', 'infinity'].includes(t)); // seulement des formes calmes
  const type = types[(Math.random() * types.length) | 0]; const m = Math.min(G.W, G.H) * rand(0.12, 0.22);
  const cx = rand(G.W * 0.2, G.W * 0.8), cy = rand(G.H * 0.2, G.H * 0.8); const rot = rand(-0.4, 0.4);
  const pts = glyph(type, 0, 0, 1).map((q) => ({ x: cx + (q.x * Math.cos(rot) - q.y * Math.sin(rot)) * m, y: cy + (q.x * Math.sin(rot) + q.y * Math.cos(rot)) * m }));
  const { type: tp, info } = analyze(pts); if (!tp || state.level < FORM[tp].level) return;
  G.creations.push(new Creation(G, tp, info)); audio.form(tp, (cx / G.W) * 2 - 1);
}

// ---------- Boucle ----------
let last = performance.now(); let perfAcc = 0, perfN = 0, perfGood = 0; let hudT = 0, saveT = 0, passiveVisT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000; last = now; if (dt > 0.1) dt = 0.1; if (dt <= 0) return;
  G.t += dt; state.stats.time += dt;
  palette.base = (palette.base + dt * 0.016) % 1;

  // Qualité adaptative : on vise 60 i/s en ajustant le nombre de particules.
  perfAcc += dt; perfN++;
  if (perfAcc > 1) { const avg = perfAcc / perfN; perfAcc = 0; perfN = 0;
    if (HQ) {} else if (avg > 0.0195 && G.quality > 0.3) { G.quality *= 0.85; perfGood = 0; refresh(); }
    else if (avg < 0.0172) { if (++perfGood > 3 && G.quality < 1) { G.quality = Math.min(1, G.quality * 1.08); perfGood = 0; refresh(); } }
    G.P.budget = Math.round(G.P.cap * clamp(G.quality, 0.25, 1));
    // Appareil à la peine : on réduit aussi la résolution de rendu (et on la rend quand ça va mieux).
    const wantDpr = Math.min(devicePixelRatio || 1, G.quality < 0.6 ? 1.25 : 2); if (Math.abs(wantDpr - G.dpr) > 0.01 && (G.quality < 0.6 || G.quality > 0.85)) resize();
  }

  // Production passive (secondaire) et lueurs qui en témoignent.
  const pr = passiveRate(state); if (pr > 0) { earn(pr * dt, 0, 0, 'passive', true); passiveVisT -= dt; if (passiveVisT < 0 && G.mode === 'play') { passiveVisT = rand(2, 4); const s = G.universe.randomSource(); if (s) G.motes.push({ x0: s.x, y0: s.y, t0: G.t, d: 1.8, h: s.h, soft: true }); } }

  // Mise à jour.
  G.P.attractors.length = 0;
  for (const p of ptrs.values()) { if (p.charge) p.charge.update(dt); if (p.power === 'filaments' || p.power === 'kaleido') G.attract(p.x, p.y, 120, -40, 0.8); }
  sand.active = state.power === 'magnet' && G.mode !== 'breathe'; sand.update(dt, [...ptrs.values()].filter((p) => p.power === 'magnet'));
  for (const list of [G.creations, G.effects, G.filaments]) { for (const o of list) o.update(dt); }
  G.creations = G.creations.filter((o) => !o.dead);
  // Exposition automatique : beaucoup de lumière superposée ne doit jamais éblouir.
  const live = G.creations.length + G.effects.length * 2; G.exposure += (clamp(1.6 / Math.sqrt(Math.max(1, live / 3)), 0.45, 1) * (sleep ? 0.45 : 1) - G.exposure) * Math.min(1, dt * 2);
  if (G.creations.length > 12) { const old = G.creations.find((c) => !c.reacted && c.life > c.age + 1); if (old) old.life = old.age + 1; } G.effects = G.effects.filter((o) => !o.dead); G.filaments = G.filaments.filter((o) => !o.dead);
  ripples.update(dt);
  if (breath) breath.update(dt);
  if (sleep) sleep.update(dt);
  if (G.mode === 'contemplate' || (sleep && !sleep.ended)) { autoT -= dt; if (autoT < 0) { autoT = sleep ? rand(12, 18) : rand(3.5, 6.5); autoCreate(); } }
  const T = PROF ? performance.now : null; let t0 = T && T.call(performance);
  const mark = (k) => { if (!T) return; const t1 = performance.now(); G.prof[k] = (G.prof[k] || 0) * 0.95 + (t1 - t0) * 0.05; t0 = t1; };
  G.P.update(dt, G.t); mark('particles.update');

  // Rendu.
  ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
  G.universe.draw(ctx, G.t, G); mark('universe');
  ctx.globalCompositeOperation = 'lighter';
  for (const g of glowsQ) { const a = G.t - g.t; if (a < 1.6) glow(ctx, g.x, g.y, 18 + a * 20, g.h, 0.5 * (1 - a / 1.6)); }
  for (let i = glowsQ.length - 1; i >= 0; i--) if (G.t - glowsQ[i].t > 1.6) glowsQ.splice(i, 1);
  sand.draw(ctx);
  ripples.draw(ctx);
  for (const o of G.filaments) o.draw(ctx);
  for (const o of G.creations) o.draw(ctx); mark('creations');
  for (const o of G.effects) o.draw(ctx); mark('effects');
  drawLive();
  G.P.draw(ctx, G.intensity); mark('particles.draw');
  if (breath) breath.draw(ctx);
  if (sleep) sleep.draw(ctx);
  drawMotes(dt);
  if (sleep) sleep.drawDark(ctx);
  else if (state.settings.night) { ctx.globalCompositeOperation = 'color'; ctx.globalAlpha = 0.35; ctx.fillStyle = '#ff9b5c'; ctx.fillRect(0, 0, G.W, G.H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; } // filtre la lumière bleue
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

  hudT -= dt; if (hudT < 0) { hudT = 0.12; ui.hud(); }
  saveT -= dt; if (saveT < 0) { saveT = 4; if (dirty) save(); }
}

function drawLive() {
  for (const p of ptrs.values()) {
    if (p.power === 'fireworks') { p.charge?.draw(ctx); continue; }
    if (p.power !== 'filaments' && p.power !== 'kaleido') { glow(ctx, p.x, p.y, 30, p.h, 0.5); continue; }
    const tail = 1.5 + 0.35 * (G.trailMult - 1) * 4; const v = p.vis;
    for (const q of v) q.f = smooth(0, 0.6, 1 - (G.t - q.t) / tail);
    while (v.length > 2 && G.t - v[0].t > tail && v.length > 400) v.shift();
    const copies = p.power === 'kaleido' ? symCount() : 1; const c = kCenter();
    for (let k = 0; k < copies; k++) {
      if (k) { const half = k % 2 === 1; const ang = Math.floor(k / 2) * (TAU / (copies / 2)); ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); ctx.translate(c.x, c.y); ctx.rotate(half ? -ang : ang); if (half) ctx.scale(1, -1); ctx.translate(-c.x, -c.y); }
      ribbon(ctx, v, { width: 2.4, alpha: 1, t: G.t, strands: G.strands, glowK: 1 + G.state.up.gain * 0.04 });
      glow(ctx, p.x, p.y, 22, p.h + G.t * 30, 0.7);
    }
    if (copies > 1) ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
  }
}

/** Petites lueurs qui volent vers le compteur de Lumière : la récolte, sans chiffres à l'écran. */
function drawMotes() {
  const tgt = ui.counterPos();
  for (let i = G.motes.length - 1; i >= 0; i--) {
    const m = G.motes[i]; const k = (G.t - m.t0) / m.d; if (k < 0) continue;
    if (k >= 1) { G.motes.splice(i, 1); if (!m.soft) ui.pulse(); continue; }
    const e = k * k * (3 - 2 * k); const cx = (m.x0 + tgt.x) / 2 + (m.y0 - tgt.y) * 0.25, cy = Math.min(m.y0, tgt.y) - 40;
    const x = (1 - e) * (1 - e) * m.x0 + 2 * (1 - e) * e * cx + e * e * tgt.x, y = (1 - e) * (1 - e) * m.y0 + 2 * (1 - e) * e * cy + e * e * tgt.y;
    glow(ctx, x, y, m.soft ? 5 : 8, m.h, (m.soft ? 0.35 : 0.8) * Math.sin(Math.PI * Math.min(1, k * 1.2)));
  }
  if (G.motes.length > 80) G.motes.splice(0, G.motes.length - 80);
}

// ---------- Cycle de vie ----------
document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); audio.suspend(); } else { audio.resume(); last = performance.now(); } });
addEventListener('pagehide', save);

// Rayonnement pendant l'absence : un cadeau, jamais une pénalité.
{
  const away = (Date.now() - (state.lastSeen || Date.now())) / 1000;
  if (state.seen.intro && away > 90) {
    const gift = Math.min(away, 8 * 3600) * passiveRate(state) * 0.5;
    setTimeout(() => { if (gift > 1) { earn(gift, G.W / 2, G.H / 2, 'offline'); ui.toast(t('offline'), '+ ' + ui.fmt(gift) + ' ' + t('light').toLowerCase(), 4200); } else ui.toast(t('welcome'), '', 2800); }, 900);
  }
}

refresh(); ui.render();
document.body.dataset.mode = 'play';

// ---------- Entrée dans la bulle ----------
const QS = new URLSearchParams(location.search);
let quickIntro = false; try { quickIntro = sessionStorage.getItem('aura.quick') === '1'; sessionStorage.removeItem('aura.quick'); } catch { /* indisponible */ }
let skipIntro = null;
if (DEMO || QS.has('nointro')) { document.body.classList.remove('entering'); document.getElementById('boot')?.remove(); if (!state.seen.intro) ui.showIntro(); }
else skipIntro = playIntro({
  still: QS.has('splash'), quick: quickIntro, reduced: state.settings.reduced,
  onEnter: () => { if (G.audioOn) audio.enter(); },
  onDone: () => { skipIntro = null; if (!state.seen.intro) setTimeout(() => ui.showIntro(), 300); },
});
requestAnimationFrame((n) => { last = n; frame(n); });

// Démo automatique pour les captures (?demo=1) : quelques formes dessinées seules.
if (DEMO) {
  const q = new URLSearchParams(location.search); state.level = +q.get('demo') || 20; state.seen.intro = true; ui.hideIntro();
  for (const k in state.up) state.up[k] = Math.min(UPGRADE[k].max, +(q.get('up') ?? 4)); refresh(); ui.render();
  if (!q.has('still')) setInterval(autoCreate, +(q.get('every') || 900));
  if (q.has('clean')) startMode('free');
}

// ---------- Mises à jour ----------
// L'app installée sur l'écran d'accueil reste souvent ouverte en arrière-plan : à chaque retour,
// on compare sa version à celle en ligne et on recharge en douceur (la progression est sauvegardée avant).
const VERSION = document.querySelector('meta[name="aura-version"]')?.content || '';
const VERSIONED = /^[0-9a-f]{10}$/.test(VERSION);
let swReg = null; let updating = false; let lastCheck = 0;
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((r) => (swReg = r)).catch(() => {});
async function checkUpdate(force = false) {
  if (!VERSIONED || updating || DEMO || !navigator.onLine) return;
  const now = Date.now(); if (!force && now - lastCheck < 60_000) return; lastCheck = now;
  try {
    swReg?.update().catch(() => {});
    const r = await fetch('./version.json?t=' + now, { cache: 'no-store' }); if (!r.ok) return;
    const { version } = await r.json();
    let tried = null; try { tried = sessionStorage.getItem('aura.upd'); } catch { /* indisponible */ }
    // Déjà rechargé pour cette version sans la recevoir (cache réseau en retard) : on n'insiste pas en boucle.
    if (version && version !== VERSION && version !== tried) applyUpdate(version);
  } catch { /* hors ligne : on réessaiera plus tard */ }
}
function applyUpdate(target) {
  if (ptrs.size || G.mode === 'breathe' || G.mode === 'sleep') { setTimeout(() => applyUpdate(target), 1500); return; } // jamais au milieu d'un geste
  try { sessionStorage.setItem('aura.upd', target); sessionStorage.setItem('aura.quick', '1'); } catch { /* indisponible */ }
  updating = true; save(); ui.toast(t('updating'), '', 1400, 4);
  document.body.classList.add('leaving'); setTimeout(() => location.reload(), 900);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(true); });
addEventListener('focus', () => checkUpdate());
addEventListener('online', () => checkUpdate(true));
setInterval(() => { if (!document.hidden) checkUpdate(); }, 10 * 60_000);
setTimeout(() => checkUpdate(true), 4000);
window.__aura = { G, version: VERSION, screenInfo: () => `${innerWidth}×${innerHeight} · ${screen.width}×${screen.height} · ${G.W}×${G.H} · ${navigator.standalone ? 'app' : 'web'}`, get state() { return state; }, get sleep() { return sleep; }, get breath() { return breath; } };
