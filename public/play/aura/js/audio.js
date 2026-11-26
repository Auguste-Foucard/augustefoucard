// Moteur sonore génératif : tout est synthétisé (aucun fichier), toujours dans une gamme pentatonique,
// avec une progression d'accords lente pour que même un dessin aléatoire reste musical.
import { clamp, rand, pick } from './util.js';

// Ré majeur pentatonique, sur plusieurs octaves (demi-tons depuis La 440).
const PENTA = [0, 2, 4, 7, 9]; // ré mi fa# la si
const ROOT = 62; // ré4 en MIDI
const CHORDS = [ // accords de la nappe (MIDI) : D, Bm7, Gmaj9, A6sus
  [50, 57, 62, 66, 69],
  [47, 54, 59, 62, 66],
  [43, 50, 57, 59, 66],
  [45, 52, 57, 59, 64],
];
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const degreeToMidi = (d) => { const o = Math.floor(d / 5); const i = ((d % 5) + 5) % 5; return ROOT + o * 12 + PENTA[i]; };

class Audio {
  constructor() {
    this.ctx = null; this.ok = false; this.vol = 0.8; this.musicVol = 0.55; this.richness = 0; this.night = false;
    this.voices = 0; this.lastNote = 0; this.chordIx = 0; this.padNodes = []; this.started = false;
  }

  /** À appeler dans un geste utilisateur (exigence iOS). */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC({ latencyHint: 'interactive' });
      this.build();
    }
    if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
    if (!this.started) {
      // Petit tampon silencieux : déverrouille réellement la sortie sur iOS.
      const b = this.ctx.createBuffer(1, 1, 22050); const s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.ctx.destination); s.start(0);
      this.started = true; this.startPad();
    }
    this.ok = true;
  }

  build() {
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = this.vol;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -18; comp.knee.value = 24; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.4;
    this.master.connect(comp); comp.connect(c.destination);
    // Filtre global (adouci en mode nuit).
    this.tone = c.createBiquadFilter(); this.tone.type = 'lowpass'; this.tone.frequency.value = 12000; this.tone.connect(this.master);
    this.dry = c.createGain(); this.dry.gain.value = 0.8; this.dry.connect(this.tone);
    // Réverbération (réponse impulsionnelle générée).
    this.verb = c.createConvolver(); this.verb.buffer = this.impulse(4.2, 2.6);
    this.verbIn = c.createGain(); this.verbIn.gain.value = 0.45; this.verbIn.connect(this.verb);
    const verbOut = c.createGain(); verbOut.gain.value = 0.9; this.verb.connect(verbOut); verbOut.connect(this.tone);
    // Écho doux (scintillement), plus présent avec la Résonance.
    this.delay = c.createDelay(2); this.delay.delayTime.value = 0.42;
    this.fb = c.createGain(); this.fb.gain.value = 0.32;
    const dLp = c.createBiquadFilter(); dLp.type = 'lowpass'; dLp.frequency.value = 3200;
    this.delayIn = c.createGain(); this.delayIn.gain.value = 0.12;
    this.delayIn.connect(this.delay); this.delay.connect(dLp); dLp.connect(this.fb); this.fb.connect(this.delay); dLp.connect(this.verbIn); dLp.connect(this.dry);
    // Bus des nappes.
    this.padBus = c.createGain(); this.padBus.gain.value = this.musicVol * 0.32;
    this.padLp = c.createBiquadFilter(); this.padLp.type = 'lowpass'; this.padLp.frequency.value = 900; this.padLp.Q.value = 0.4;
    this.padBus.connect(this.padLp); this.padLp.connect(this.verbIn); this.padLp.connect(this.dry);
    // LFO lent sur le filtre de la nappe : respiration.
    const lfo = c.createOscillator(); lfo.frequency.value = 0.05; const lg = c.createGain(); lg.gain.value = 380; lfo.connect(lg); lg.connect(this.padLp.frequency); lfo.start();
  }

  impulse(sec, decay) {
    const c = this.ctx; const len = Math.floor(c.sampleRate * sec); const b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * (i < 400 ? i / 400 : 1); }
    return b;
  }

  setVolume(v) { this.vol = v; if (this.master) this.master.gain.setTargetAtTime(v * (this.night ? 0.55 : 1), this.ctx.currentTime, 0.1); }
  setMusic(v) { this.musicVol = v; if (this.padBus) this.padBus.gain.setTargetAtTime(v * 0.32 * (this.night ? 0.7 : 1), this.ctx.currentTime, 0.3); }
  setNight(n) {
    this.night = n; if (!this.ctx) return;
    this.tone.frequency.setTargetAtTime(n ? 2600 : 12000, this.ctx.currentTime, 0.5);
    this.setVolume(this.vol); this.setMusic(this.musicVol);
  }
  setRichness(r) {
    this.richness = r; if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.delayIn.gain.setTargetAtTime(0.1 + r * 0.035, t, 0.4);
    this.fb.gain.setTargetAtTime(0.3 + r * 0.025, t, 0.4);
    this.verbIn.gain.setTargetAtTime(0.42 + r * 0.04, t, 0.4);
  }
  /** Gonfle doucement la nappe (respiration guidée, réactions). */
  swell(amount, dur = 3) {
    if (!this.ctx) return; const t = this.ctx.currentTime; const g = this.padBus.gain; const base = this.musicVol * 0.32 * (this.night ? 0.7 : 1);
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(base * (1 + amount), t + dur * 0.4); g.linearRampToValueAtTime(base, t + dur);
    this.padLp.frequency.setTargetAtTime(900 + amount * 900, t, dur * 0.25); this.padLp.frequency.setTargetAtTime(900, t + dur * 0.5, dur * 0.4);
  }

  // ---------- Nappe ----------
  startPad() {
    this.nextChord();
    this.padTimer = setInterval(() => this.nextChord(), 13000);
  }
  nextChord() {
    if (!this.ctx) return;
    const c = this.ctx; const t = c.currentTime; const chord = CHORDS[this.chordIx % CHORDS.length]; this.chordIx++;
    for (const n of this.padNodes) { n.g.gain.cancelScheduledValues(t); n.g.gain.setValueAtTime(n.g.gain.value, t); n.g.gain.linearRampToValueAtTime(0, t + 5); n.o.stop(t + 5.2); }
    this.padNodes = [];
    const layers = 1 + Math.min(3, Math.floor(this.richness / 2));
    const notes = chord.slice(0, 3 + Math.min(2, layers - 1));
    if (this.richness >= 5) notes.push(chord[0] - 12);
    if (this.richness >= 7) notes.push(chord[2] + 12);
    for (const m of notes) {
      for (let k = 0; k < 2; k++) {
        const o = c.createOscillator(); o.type = k ? 'triangle' : 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = (k ? 7 : -7) + rand(-3, 3);
        const g = c.createGain(); g.gain.value = 0; const peak = (k ? 0.11 : 0.05) / Math.sqrt(notes.length);
        g.gain.linearRampToValueAtTime(peak, t + 5.5);
        o.connect(g); g.connect(this.padBus); o.start(t);
        this.padNodes.push({ o, g });
      }
    }
    this.currentChord = chord;
  }

  // ---------- Notes ----------
  /** Joue une note pentatonique. kind : kalimba | harp | crystal | piano | bell | drop | glass */
  note(degree, { kind = 'kalimba', vel = 0.6, pan = 0, delay = 0, dur = 1 } = {}) {
    if (!this.ok || this.vol <= 0 || !this.ctx || this.ctx.state !== 'running') return;
    if (this.voices > 26) return;
    const c = this.ctx; const t = c.currentTime + 0.005 + delay;
    const f = mtof(degreeToMidi(degree));
    const out = c.createGain(); out.gain.value = 0;
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    if (p) { p.pan.value = clamp(pan, -0.9, 0.9); out.connect(p); p.connect(this.dry); p.connect(this.verbIn); p.connect(this.delayIn); }
    else { out.connect(this.dry); out.connect(this.verbIn); out.connect(this.delayIn); }
    const v = vel * (this.night ? 0.6 : 1);
    const parts = { // [ratio, gain, type, decayFactor]
      kalimba: [[1, 1, 'sine', 1], [5.4, 0.16, 'sine', 0.08], [2, 0.12, 'sine', 0.5]],
      harp: [[1, 0.8, 'triangle', 1], [2, 0.25, 'sine', 0.6], [3, 0.08, 'sine', 0.4]],
      crystal: [[2, 0.7, 'sine', 1], [5.52, 0.18, 'sine', 0.5], [8.9, 0.06, 'sine', 0.3]],
      glass: [[4, 0.4, 'sine', 1], [10.8, 0.1, 'sine', 0.4]],
      piano: [[1, 0.9, 'sine', 1], [2, 0.35, 'sine', 0.7], [3, 0.14, 'sine', 0.5], [4.01, 0.06, 'sine', 0.35]],
      bell: [[1, 0.8, 'sine', 1], [2.76, 0.32, 'sine', 0.7], [5.4, 0.14, 'sine', 0.5], [0.5, 0.25, 'sine', 1.1]],
      drop: [[1, 1, 'sine', 1]],
    }[kind] || [[1, 1, 'sine', 1]];
    const decay = { kalimba: 1.4, harp: 2.2, crystal: 2.6, glass: 1.8, piano: 2.4, bell: 4.5, drop: 0.5 }[kind] * dur;
    const atk = kind === 'harp' ? 0.004 : kind === 'bell' ? 0.003 : 0.002;
    out.gain.linearRampToValueAtTime(v * 0.22, t + atk);
    out.gain.setTargetAtTime(0, t + atk, decay / 4);
    const oscs = [];
    for (const [r, gn, type, df] of parts) {
      const o = c.createOscillator(); o.type = type; o.frequency.value = f * r;
      if (kind === 'drop') { o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06); }
      const g = c.createGain(); g.gain.value = gn; g.gain.setTargetAtTime(0, t, (decay * df) / 4);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + decay * 1.3 + 0.1); oscs.push(o);
    }
    this.voices++;
    oscs[0].onended = () => { this.voices--; out.disconnect(); };
    // Avec la Résonance, une harmonie douce (tierce/quinte pentatonique) accompagne certaines notes.
    if (this.richness >= 3 && kind !== 'drop' && Math.random() < 0.15 + this.richness * 0.05 && delay === 0) {
      this.note(degree + (Math.random() < 0.5 ? 2 : 5), { kind: kind === 'kalimba' ? 'harp' : kind, vel: vel * 0.35, pan: -pan, delay: 0.09 });
    }
  }

  /** Note jouée pendant le tracé : hauteur selon la position, timbre selon la vitesse. */
  gesture(yNorm, speed, pan, power = 'filaments') {
    if (!this.ctx) return;
    const now = performance.now(); const gap = speed > 1.4 ? 70 : speed > 0.6 ? 110 : 170;
    if (now - this.lastNote < gap) return;
    this.lastNote = now;
    let d = Math.round((1 - yNorm) * 12) + 2; // 3 octaves sur la hauteur de l'écran
    // Attirance douce vers les notes de l'accord en cours.
    if (this.currentChord && Math.random() < 0.35) d += Math.random() < 0.5 ? 0 : 5 * (Math.random() < 0.5 ? 1 : -1);
    const kind = power === 'water' ? 'drop' : power === 'kaleido' ? 'harp' : speed > 1.6 ? 'crystal' : speed > 0.7 ? 'kalimba' : 'harp';
    this.note(d, { kind, vel: clamp(0.35 + speed * 0.25, 0.3, 0.85), pan });
  }

  /** Signature sonore d'une forme qui prend vie. */
  form(id, pan = 0) {
    const seqs = {
      line: [[7, 0], [9, 0.09]],
      circle: [[5, 0], [7, 0.08], [9, 0.16], [12, 0.24]],
      wave: [[4, 0], [6, 0.12], [5, 0.24], [7, 0.36], [6, 0.48]],
      spiral: [[14, 0], [12, 0.07], [10, 0.14], [8, 0.21], [6, 0.28], [4, 0.35]],
      triangle: [[5, 0], [9, 0.1], [12, 0.2], [17, 0.3]],
      star: [[10, 0], [12, 0.05], [15, 0.1], [17, 0.15], [20, 0.2]],
      flower: [[7, 0], [9, 0.15], [11, 0.3], [14, 0.45], [12, 0.6]],
      heart: [[5, 0], [5, 0.22], [9, 0.5], [7, 0.7]],
      infinity: [[7, 0], [10, 0.12], [12, 0.24], [10, 0.36], [7, 0.48], [10, 0.6]],
      mandala: [[5, 0], [10, 0.1], [12, 0.2], [15, 0.3], [17, 0.4], [20, 0.5]],
      galaxy: [[0, 0], [5, 0.2], [10, 0.4], [15, 0.6], [20, 0.8]],
    }[id] || [[7, 0]];
    const kind = { line: 'kalimba', circle: 'crystal', wave: 'harp', spiral: 'glass', triangle: 'crystal', star: 'bell', flower: 'harp', heart: 'piano', infinity: 'kalimba', mandala: 'harp', galaxy: 'bell' }[id] || 'kalimba';
    for (const [d, dl] of seqs) this.note(d, { kind, vel: 0.55, pan: pan * 0.6, delay: dl });
    if (id === 'heart') this.thump();
  }

  thump(delay = 0) {
    if (!this.ok || !this.ctx) return; const c = this.ctx; const t = c.currentTime + delay;
    for (const dt of [0, 0.22]) {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(90, t + dt); o.frequency.exponentialRampToValueAtTime(48, t + dt + 0.25);
      const g = c.createGain(); g.gain.setValueAtTime(0, t + dt); g.gain.linearRampToValueAtTime(0.25 * (this.night ? 0.5 : 1), t + dt + 0.01); g.gain.setTargetAtTime(0, t + dt + 0.02, 0.09);
      o.connect(g); g.connect(this.dry); o.start(t + dt); o.stop(t + dt + 0.6);
    }
  }

  /** Harmonie découverte / réaction : accord arpégé et nappe qui s'ouvre. */
  reaction(big = false) {
    const base = pick([0, 2, 3]);
    const seq = big ? [0, 2, 4, 5, 7, 9, 10, 12, 14] : [0, 2, 4, 5, 7];
    seq.forEach((d, i) => this.note(base + d + 5, { kind: i % 2 ? 'crystal' : 'bell', vel: 0.45, pan: Math.sin(i) * 0.6, delay: i * 0.07 }));
    this.swell(big ? 0.9 : 0.5, big ? 5 : 3);
  }

  levelUp() {
    [0, 4, 7, 9, 12, 14].forEach((d, i) => this.note(d + 3, { kind: 'bell', vel: 0.5, pan: (i - 2.5) * 0.25, delay: i * 0.12 }));
    this.swell(1, 6);
  }

  ui(kind = 'tap') { this.note(kind === 'buy' ? 12 : 10, { kind: kind === 'buy' ? 'bell' : 'glass', vel: kind === 'buy' ? 0.5 : 0.25 }); if (kind === 'buy') this.note(14, { kind: 'crystal', vel: 0.35, delay: 0.08 }); }

  /** Charge des feux d'artifice : un son cristallin qui monte. */
  charge(level) { const d = Math.floor(level * 10); if (d !== this._lastCharge) { this._lastCharge = d; this.note(d + 5, { kind: 'glass', vel: 0.25 + level * 0.2 }); } }

  /** Souffle doux (sable, magnétisme) : bruit filtré bref. */
  breath(vel = 0.3, freq = 1800) {
    if (!this.ok || !this.ctx) return; const c = this.ctx; const t = c.currentTime;
    if (!this._noise) { const len = c.sampleRate; const b = c.createBuffer(1, len, c.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; this._noise = b; }
    const s = c.createBufferSource(); s.buffer = this._noise; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 2.5;
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * 0.15, t + 0.25); g.gain.linearRampToValueAtTime(0, t + 0.9);
    s.connect(f); f.connect(g); g.connect(this.verbIn); g.connect(this.dry); s.start(t); s.stop(t + 1);
  }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {}); }
  resume() { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {}); }
}

export const audio = new Audio();
