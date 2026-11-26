// Génère les sons et musiques de DÉMONSTRATION (clairement temporaires)
// pour tester le lecteur et la page Sound Design.
// Usage : npm run audio:demo   (nécessite ffmpeg)
// Remplace ensuite les fichiers de public/media/ par tes vraies créations.
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const SR = 44100;
const root = new URL('..', import.meta.url).pathname;
const tmp = join(tmpdir(), 'af-audio');
mkdirSync(tmp, { recursive: true });

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

function writeWav(path, L, R = L) {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak > 0 ? 0.89 / peak : 1;
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4);
  }
  writeFileSync(path, buf);
}

function encode(name, dir, L, R) {
  const wav = join(tmp, name + '.wav');
  writeWav(wav, L, R);
  const out = join(root, 'public/media', dir, name + '.mp3');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '128k', out]);
  console.log('✓', out.replace(root, ''));
}

// Réverbération simple (peignes + passe-tout) pour donner de l'espace.
function reverb(x, mix = 0.3, size = 1) {
  const combs = [1557, 1617, 1491, 1422].map((d) => Math.round(d * size));
  const y = new Float32Array(x.length);
  for (const d of combs) {
    const b = new Float32Array(d); let i = 0, lp = 0;
    for (let n = 0; n < x.length; n++) {
      const o = b[i]; lp = o * 0.8 + lp * 0.2; b[i] = x[n] + lp * 0.84; i = (i + 1) % d; y[n] += o / combs.length;
    }
  }
  return x.map((v, n) => v * (1 - mix) + y[n] * mix);
}

const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

// ---------- MUSIQUES ----------
function pad(seconds, chords, { bpm = 60, bright = 0.3, pulse = false, bell = false } = {}) {
  const n = seconds * SR; const L = new Float32Array(n); const R = new Float32Array(n);
  const barLen = (60 / bpm) * 4;
  for (let i = 0; i < n; i++) {
    const t = i / SR; const bar = Math.floor(t / barLen); const tb = t - bar * barLen;
    const chord = chords[bar % chords.length];
    let l = 0, r = 0;
    chord.forEach((m, k) => {
      const f = mtof(m);
      const s = Math.sin(2 * Math.PI * f * t) + bright * Math.sin(2 * Math.PI * f * 2.003 * t) + 0.15 * Math.sin(2 * Math.PI * f * 0.5 * t);
      const lfo = 0.7 + 0.3 * Math.sin(2 * Math.PI * (0.1 + k * 0.03) * t);
      const pan = (k / (chord.length - 1 || 1)) * 0.6 + 0.2;
      l += s * lfo * (1 - pan); r += s * lfo * pan;
    });
    const fade = Math.min(1, t / 3, (seconds - t) / 3);
    let p = 0;
    if (pulse) {
      const beat = 60 / bpm / 2; const tt = t % beat;
      const step = Math.floor(t / beat);
      const note = chord[step % chord.length] - 12;
      p = Math.sign(Math.sin(2 * Math.PI * mtof(note) * t)) * 0.18 * Math.exp(-tt * 9);
      if (step % 4 === 0) p += Math.sin(2 * Math.PI * (55 + 80 * Math.exp(-tt * 30)) * tt) * Math.exp(-tt * 7) * 0.9;
    }
    let b = 0;
    if (bell) {
      const beat = 60 / bpm; const tt = t % beat; const step = Math.floor(t / beat);
      const note = chord[(step * 2) % chord.length] + 12;
      b = Math.sin(2 * Math.PI * mtof(note) * t) * Math.exp(-tt * 2.5) * 0.35;
    }
    L[i] = (l * 0.12 + p + b) * fade; R[i] = (r * 0.12 + p + b * 0.8) * fade;
  }
  return [reverb(L, 0.35, 1.1), reverb(R, 0.35, 1.13)];
}

encode('demo-nebula', 'music', ...pad(36, [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 60]], { bpm: 52, bright: 0.25 }));
encode('demo-pulse', 'music', ...pad(32, [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 55]], { bpm: 112, bright: 0.4, pulse: true }));
encode('demo-lullaby', 'music', ...pad(36, [[48, 55, 60, 64], [53, 57, 60, 65], [45, 52, 57, 60], [43, 50, 55, 59]], { bpm: 66, bright: 0.15, bell: true }));

// ---------- SONS ----------
function sfx(seconds, fn, rev = 0.15) {
  const n = Math.round(seconds * SR); const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = fn(i / SR);
  const y = reverb(x, rev, 0.6);
  return [y, y];
}
encode('ui-select', 'sound', ...sfx(0.35, (t) => Math.sin(2 * Math.PI * (1200 + 600 * Math.exp(-t * 60)) * t) * env(t, 0.002, 0.04)));
encode('ui-confirm', 'sound', ...sfx(0.7, (t) =>
  (Math.sin(2 * Math.PI * mtof(76) * t) * env(t, 0.003, 0.09) + (t > 0.08 ? Math.sin(2 * Math.PI * mtof(83) * t) * env(t - 0.08, 0.003, 0.18) : 0))));
encode('fb-pickup', 'sound', ...sfx(0.6, (t) => {
  const f = 600 + 1400 * Math.min(1, t / 0.12);
  return (Math.sin(2 * Math.PI * f * t) * 0.6 + Math.sin(2 * Math.PI * f * 1.5 * t) * 0.3) * env(t, 0.005, 0.12);
}, 0.3));
let lp = 0;
encode('cb-hit', 'sound', ...sfx(0.8, (t) => {
  lp = lp * 0.7 + noise() * 0.3;
  return (Math.sin(2 * Math.PI * (40 + 160 * Math.exp(-t * 25)) * t) * env(t, 0.001, 0.12) * 1.2 + lp * env(t, 0.001, 0.05) * 2);
}, 0.2));
lp = 0;
encode('sfx-whoosh', 'sound', ...sfx(0.9, (t) => {
  const c = 0.02 + 0.5 * Math.sin(Math.PI * Math.min(1, t / 0.9));
  lp = lp * (1 - c) + noise() * c;
  return lp * Math.sin(Math.PI * Math.min(1, t / 0.9)) ** 2;
}, 0.1));
lp = 0;
encode('amb-cave', 'sound', ...sfx(12, (t) => {
  lp = lp * 0.985 + noise() * 0.015;
  const drop = (t * 1.3) % 1; const dropOn = Math.floor(t * 1.3) % 3 === 0;
  return lp * 3 * Math.min(1, t, 12 - t) + (dropOn ? Math.sin(2 * Math.PI * (900 + 900 * Math.exp(-drop * 40)) * drop) * env(drop, 0.001, 0.03) * 0.3 : 0)
    + Math.sin(2 * Math.PI * 55 * t) * 0.05;
}, 0.5));
encode('ab-hit-without', 'sound', ...sfx(1.2, (t) => (t < 0.06 ? noise() * env(t, 0.001, 0.01) * 0.5 : 0), 0));
lp = 0;
encode('ab-hit-with', 'sound', ...sfx(1.2, (t) => {
  lp = lp * 0.6 + noise() * 0.4;
  return Math.sin(2 * Math.PI * (45 + 200 * Math.exp(-t * 30)) * t) * env(t, 0.001, 0.15)
    + lp * env(t, 0.001, 0.04) * 1.5
    + (t > 0.03 ? Math.sin(2 * Math.PI * mtof(88) * t) * env(t - 0.03, 0.001, 0.25) * 0.25 : 0);
}, 0.35));

rmSync(tmp, { recursive: true, force: true });
