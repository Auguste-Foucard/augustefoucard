// Étoiles sonores : petites cloches de verre en Web Audio, accordées sur une gamme pentatonique.
// Désactivé par défaut ; l'état est mémorisé dans le navigateur.

const KEY = 'af-chime';
let on = false;
try { on = localStorage.getItem(KEY) === '1'; } catch { /* stockage indisponible */ }
const subs = new Set<(v: boolean) => void>();

export const chimeOn = () => on;
export function setChime(v: boolean) {
  on = v;
  try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* ignoré */ }
  subs.forEach((f) => f(v));
  if (v) { ensure(); [0.62, 0.72, 0.86].forEach((y, i) => setTimeout(() => chime(y, 0.5, 0.7), i * 140)); }
}
export function onChime(f: (v: boolean) => void) { subs.add(f); return () => { subs.delete(f); }; }

// ré majeur pentatonique, sur deux octaves et demie
const SCALE = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.51];

let ctx: AudioContext | null = null;
let out: GainNode | null = null;
let send: GainNode | null = null;

function ensure() {
  if (ctx) { if (ctx.state === 'suspended') void ctx.resume(); return ctx; }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 4;
  out = ctx.createGain(); out.gain.value = 0.22;
  out.connect(comp); comp.connect(ctx.destination);
  // réverbération légère : deux échos filtrés qui se répondent
  send = ctx.createGain(); send.gain.value = 0.5;
  const mk = (t: number, fb: number, pan: number) => {
    const d = ctx!.createDelay(1); d.delayTime.value = t;
    const g = ctx!.createGain(); g.gain.value = fb;
    const lp = ctx!.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    const p = ctx!.createStereoPanner(); p.pan.value = pan;
    send!.connect(d); d.connect(lp); lp.connect(g); g.connect(d); lp.connect(p); p.connect(out!);
  };
  mk(0.231, 0.42, -0.5); mk(0.347, 0.38, 0.5);
  return ctx;
}

/** y : position verticale 0 (haut) → 1 (bas) ; x : 0 → 1 pour la stéréo. */
export function chime(y: number, x = 0.5, vel = 1) {
  if (!on) return;
  const c = ensure();
  if (!c || !out || !send) return;
  const i = Math.max(0, Math.min(SCALE.length - 1, Math.round((1 - y) * (SCALE.length - 1))));
  const f = SCALE[i], t = c.currentTime + 0.005;
  const pan = c.createStereoPanner(); pan.pan.value = (x - 0.5) * 1.2;
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.5 * vel, t + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
  env.connect(pan); pan.connect(out); pan.connect(send);
  // partiels de cloche de verre
  ([[1, 1], [2.0, 0.32], [3.01, 0.14], [4.23, 0.06]] as const).forEach(([r, a], k) => {
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * r;
    const g = c.createGain(); g.gain.value = a;
    if (k) { g.gain.setValueAtTime(a, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2 / k); }
    o.connect(g); g.connect(env); o.start(t); o.stop(t + 3);
  });
}
