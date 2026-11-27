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
// Niveau général volontairement doux : le jeu se joue souvent au casque ou au calme.
const MASTER = 0.55; const PAD = 0.2;
// Tempo commun à tout ce qui se joue en dessinant : la musique reste posée, même quand le geste est rapide.
const BPM = 80; const STEP = 60 / BPM / 2; // une croche ≈ 0,375 s
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
    this.gridT0 = c.currentTime;
    this.master = c.createGain(); this.master.gain.value = this.vol * this.vol * MASTER;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -24; comp.knee.value = 18; comp.ratio.value = 6; comp.attack.value = 0.01; comp.release.value = 0.4;
    this.master.connect(comp); comp.connect(c.destination);
    // Filtre global (adouci en mode nuit).
    this.tone = c.createBiquadFilter(); this.tone.type = 'lowpass'; this.tone.frequency.value = 12000;
    this.sleepBus = c.createGain(); this.sleepBus.gain.value = 1; this.tone.connect(this.sleepBus); this.sleepBus.connect(this.master);
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
    this.padBus = c.createGain(); this.padBus.gain.value = this.musicVol * this.musicVol * PAD;
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

  setVolume(v) { this.vol = v; if (this.master) this.master.gain.setTargetAtTime(v * v * MASTER * (this.night ? 0.55 : 1), this.ctx.currentTime, 0.1); }
  setMusic(v) { this.musicVol = v; if (this.padBus) this.padBus.gain.setTargetAtTime(v * v * PAD * (this.night ? 0.7 : 1), this.ctx.currentTime, 0.3); }
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
    if (!this.ctx) return; const t = this.ctx.currentTime; const g = this.padBus.gain; const base = this.musicVol * this.musicVol * PAD * (this.night ? 0.7 : 1);
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(base * (1 + amount * 0.6), t + dur * 0.4); g.linearRampToValueAtTime(base, t + dur);
    this.padLp.frequency.setTargetAtTime(900 + amount * 900, t, dur * 0.25); this.padLp.frequency.setTargetAtTime(900, t + dur * 0.5, dur * 0.4);
  }

  // ---------- Nappe ----------
  startPad() {
    this.nextChord();
    const loop = () => { this.nextChord(); this.padTimer = setTimeout(loop, this.sleepMode ? 24000 : 13000); };
    this.padTimer = setTimeout(loop, 13000);
  }
  nextChord() {
    if (!this.ctx) return;
    const c = this.ctx; const t = c.currentTime; const chord = CHORDS[this.chordIx % CHORDS.length]; this.chordIx++;
    for (const n of this.padNodes) { n.g.gain.cancelScheduledValues(t); n.g.gain.setValueAtTime(n.g.gain.value, t); n.g.gain.linearRampToValueAtTime(0, t + 5); n.o.stop(t + 5.2); }
    this.padNodes = [];
    const layers = 1 + Math.min(3, Math.floor(this.richness / 2));
    let notes = chord.slice(0, 3 + Math.min(2, layers - 1));
    if (this.sleepMode) notes = chord.slice(0, 3).map((m) => m - 12); // berceuse : trois notes graves
    if (this.richness >= 5) notes.push(chord[0] - 12);
    if (this.richness >= 7) notes.push(chord[2] + 12);
    for (const m of notes) {
      for (let k = 0; k < 2; k++) {
        const o = c.createOscillator(); o.type = k || this.sleepMode ? 'triangle' : 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = (k ? 7 : -7) + rand(-3, 3);
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
  note(degree, { kind = 'kalimba', vel = 0.6, pan = 0, delay = 0, dur = 1, at = 0, harm = true } = {}) {
    if (!this.ok || this.vol <= 0 || !this.ctx || this.ctx.state !== 'running') return;
    if (this.voices > 18) return;
    if (this.sleepMode) { degree -= 5; vel *= 0.55; if (kind === 'crystal' || kind === 'glass' || kind === 'bell') kind = 'harp'; dur *= 1.4; }
    const c = this.ctx; const t = at ? Math.max(at, c.currentTime + 0.005) + delay : c.currentTime + 0.005 + delay;
    const f = mtof(degreeToMidi(degree));
    const out = c.createGain(); out.gain.value = 0;
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    if (p) { p.pan.value = clamp(pan, -0.9, 0.9); out.connect(p); p.connect(this.dry); p.connect(this.verbIn); p.connect(this.delayIn); }
    else { out.connect(this.dry); out.connect(this.verbIn); out.connect(this.delayIn); }
    const v = vel * (this.night ? 0.6 : 1);
    const parts = { // [ratio, gain, type, decayFactor]
      kalimba: [[1, 1, 'sine', 1], [5.4, 0.16, 'sine', 0.08], [2, 0.12, 'sine', 0.5]],
      keys: [[1, 1, 'sine', 1], [2, 0.3, 'sine', 0.55], [3, 0.09, 'sine', 0.35], [4, 0.035, 'sine', 0.22], [0.5, 0.12, 'sine', 1.2]], // boîte à musique feutrée
      harp: [[1, 0.8, 'triangle', 1], [2, 0.25, 'sine', 0.6], [3, 0.08, 'sine', 0.4]],
      crystal: [[2, 0.7, 'sine', 1], [5.52, 0.18, 'sine', 0.5], [8.9, 0.06, 'sine', 0.3]],
      glass: [[4, 0.4, 'sine', 1], [10.8, 0.1, 'sine', 0.4]],
      piano: [[1, 0.9, 'sine', 1], [2, 0.35, 'sine', 0.7], [3, 0.14, 'sine', 0.5], [4.01, 0.06, 'sine', 0.35]],
      bell: [[1, 0.8, 'sine', 1], [2.76, 0.32, 'sine', 0.7], [5.4, 0.14, 'sine', 0.5], [0.5, 0.25, 'sine', 1.1]],
      drop: [[1, 1, 'sine', 1]],
    }[kind] || [[1, 1, 'sine', 1]];
    const decay = { kalimba: 1.4, keys: 2.1, harp: 2.2, crystal: 2.6, glass: 1.8, piano: 2.4, bell: 4.5, drop: 0.5 }[kind] * dur;
    const atk = kind === 'keys' ? 0.007 : kind === 'harp' ? 0.004 : kind === 'bell' ? 0.003 : 0.002;
    out.gain.linearRampToValueAtTime(v * 0.16, t + atk);
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
    if (harm && this.richness >= 3 && kind !== 'drop' && Math.random() < 0.15 + this.richness * 0.05 && delay === 0) {
      this.note(degree + (Math.random() < 0.5 ? 2 : 5), { kind: kind === 'kalimba' ? 'harp' : kind, vel: vel * 0.35, pan: -pan, delay: 0.09 });
    }
  }

  // ---------- Son du dessin : une mélodie qui suit le doigt ----------
  /** Prochain temps de la grille rythmique (div = 2 pour les doubles croches). */
  nextTick(div = 1, ahead = 0.03) { const step = STEP / div; const now = this.ctx.currentTime + ahead; const n = Math.ceil((now - this.gridT0) / step); return { t: this.gridT0 + n * step, n }; }
  chordPcs() { return new Set((this.currentChord || CHORDS[0]).map((m) => ((m % 12) + 12) % 12)); }
  /** Rapproche une note de l'accord en cours (temps forts, fins de phrase). */
  snap(deg) { const pcs = this.chordPcs(); for (const o of [0, -1, 1, -2, 2]) if (pcs.has(degreeToMidi(deg + o) % 12)) return deg + o; return deg; }
  heightDeg(yNorm) { return clamp(Math.round((1 - yNorm) * 10) + 3, 2, 13); }
  padBase() { return this.musicVol * this.musicVol * PAD * (this.night ? 0.7 : 1); }

  /** Début d'un geste : la mélodie part de la hauteur du doigt, les nappes s'effacent un peu. */
  strokeStart(yNorm, power) {
    if (!this.ok || !this.ctx) return; const t = this.ctx.currentTime;
    this.stroke = { deg: this.snap(this.heightDeg(yNorm)), lastN: -1, dy: 0, power, count: 0, yNorm };
    this.padBus.gain.setTargetAtTime(this.padBase() * 0.55, t, 0.3);
    if (power === 'filaments' || power === 'kaleido') this.voiceStart(this.stroke.deg);
  }
  /** Pendant le geste : une note par croche au plus, par petits pas qui suivent la hauteur du doigt. */
  gesture(yNorm, speed, pan, power = 'filaments', dy = 0) {
    const s = this.stroke; if (!s || !this.ok || !this.ctx) return;
    s.dy += dy; s.yNorm = yNorm; this.voiceSpeed(speed);
    const { t, n } = this.nextTick(); if (n <= s.lastN) return;
    if (speed < 0.05) return; // doigt presque immobile : on laisse sonner
    if (speed < 0.2 && n % 2) return; // geste lent : seulement sur les temps
    const target = this.heightDeg(yNorm); let step = clamp(target - s.deg, -2, 2);
    if (step === 0 && s.count % 3 === 2) step = Math.abs(s.dy) > 20 ? -Math.sign(s.dy) : (n % 4 < 2 ? 1 : -1); // petite broderie
    let deg = clamp(s.deg + step, 1, 14);
    if (n % 2 === 0) deg = this.snap(deg); // temps fort : note de l'accord
    s.deg = deg; s.lastN = n; s.dy = 0; s.count++;
    const accent = n % 4 === 0 ? 1 : n % 2 === 0 ? 0.88 : 0.74;
    this.note(deg, { kind: power === 'kaleido' ? 'harp' : 'keys', vel: clamp(0.56 + speed * 0.1, 0.56, 0.74) * accent, pan: pan * 0.6, at: t, harm: false });
    this.voiceTo(deg, t);
  }
  /** Fin du geste : la phrase se pose sur une note de repos, au temps suivant. */
  strokeEnd() {
    const s = this.stroke; this.stroke = null; if (!this.ctx) return; const t = this.ctx.currentTime;
    this.padBus.gain.setTargetAtTime(this.padBase(), t + 0.4, 0.8); this.voiceStop();
    if (!s || !this.ok) return;
    let { t: at, n } = this.nextTick(); if (n <= s.lastN) { at += (s.lastN + 1 - n) * STEP; n = s.lastN + 1; } if (n % 2) at += STEP; // toujours après la dernière note, sur un temps
    const root = (this.currentChord || CHORDS[0])[0] % 12; let d = s.count ? s.deg : this.heightDeg(s.yNorm);
    for (const o of [0, -1, 1, -2, 2, -3, 3]) if (degreeToMidi(d + o) % 12 === root) { d += o; break; }
    this.note(d, { kind: s.power === 'kaleido' ? 'harp' : 'keys', vel: s.count ? 0.62 : 0.55, at, dur: 1.5, harm: false });
    if (s.count > 2) this.note(d - 5, { kind: 'harp', vel: 0.26, at: at + 0.02, dur: 1.3, harm: false }); // octave grave : repos
  }

  // Voix continue sous le doigt : un verre qui chante et glisse d'une note à l'autre.
  voiceStart(deg) {
    this.voiceStop(); const c = this.ctx; const t = c.currentTime; const f = mtof(degreeToMidi(deg - (this.sleepMode ? 5 : 0)) - 12);
    const g = c.createGain(); g.gain.value = 0; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 0.4;
    const o1 = c.createOscillator(); o1.type = 'triangle'; o1.frequency.value = f;
    const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2; o2.detune.value = 5; const g2 = c.createGain(); g2.gain.value = 0.3;
    const lfo = c.createOscillator(); lfo.frequency.value = 4.4; const lg = c.createGain(); lg.gain.value = 4; lfo.connect(lg); lg.connect(o1.detune); lg.connect(o2.detune);
    o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(this.dry); g.connect(this.verbIn);
    o1.start(t); o2.start(t); lfo.start(t); this.voice = { o1, o2, lfo, g, lp };
  }
  voiceSpeed(speed) { const v = this.voice; if (!v) return; const t = this.ctx.currentTime; v.g.gain.setTargetAtTime(clamp(0.012 + speed * 0.035, 0.012, 0.05) * (this.sleepMode ? 0.6 : 1), t, 0.15); v.lp.frequency.setTargetAtTime(800 + Math.min(speed, 1.5) * 700, t, 0.25); }
  voiceTo(deg, at) { const v = this.voice; if (!v) return; const f = mtof(degreeToMidi(deg - (this.sleepMode ? 5 : 0)) - 12); v.o1.frequency.setTargetAtTime(f, at, 0.07); v.o2.frequency.setTargetAtTime(f * 2, at, 0.07); }
  voiceStop() { const v = this.voice; if (!v) return; this.voice = null; const t = this.ctx.currentTime; v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.setTargetAtTime(0, t, 0.3); for (const o of [v.o1, v.o2, v.lfo]) o.stop(t + 2); }

  /** Lumière du repos qui arrive : un « ting » cristallin très doux, calé sur le rythme, jamais trop souvent. */
  passiveChime() {
    if (!this.ok || !this.ctx || this.sleepMode) return; const now = this.ctx.currentTime; if (now - (this._chimeT || 0) < 4) return; this._chimeT = now;
    this._chimeDeg = this.snap(12 + ((this._chimeDeg || 0) + 1) % 3); this.noteOnGrid(this._chimeDeg, { kind: 'glass', vel: 0.13, harm: false });
  }
  /** Note calée sur la grille (gouttes d'eau, etc.). */
  noteOnGrid(degree, opts = {}, div = 2) { if (!this.ctx) return; this.note(degree, { ...opts, at: this.nextTick(div).t }); }

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
    const at = this.ctx ? this.nextTick(2).t : 0;
    for (const [d, dl] of seqs) this.note(d, { kind, vel: 0.42, pan: pan * 0.6, delay: dl, at });
    if (id === 'heart') this.thump();
  }

  thump(delay = 0) {
    if (!this.ok || !this.ctx) return; const c = this.ctx; const t = c.currentTime + delay;
    for (const dt of [0, 0.22]) {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(90, t + dt); o.frequency.exponentialRampToValueAtTime(48, t + dt + 0.25);
      const g = c.createGain(); g.gain.setValueAtTime(0, t + dt); g.gain.linearRampToValueAtTime(0.13 * (this.night ? 0.5 : 1), t + dt + 0.01); g.gain.setTargetAtTime(0, t + dt + 0.02, 0.09);
      o.connect(g); g.connect(this.dry); o.start(t + dt); o.stop(t + dt + 0.6);
    }
  }

  /** Harmonie découverte / réaction : accord arpégé et nappe qui s'ouvre. */
  reaction(big = false) {
    const base = pick([0, 2, 3]);
    const seq = big ? [0, 2, 4, 5, 7, 9, 10, 12, 14] : [0, 2, 4, 5, 7];
    seq.forEach((d, i) => this.note(base + d + 5, { kind: i % 2 ? 'crystal' : 'bell', vel: 0.32, pan: Math.sin(i) * 0.6, delay: i * 0.07 }));
    this.swell(big ? 0.9 : 0.5, big ? 5 : 3);
  }

  /** Entrée dans la bulle : un souffle qui s'ouvre et une gamme cristalline qui monte. */
  enter() {
    [0, 2, 4, 7, 9, 12].forEach((d, i) => this.note(d + 2, { kind: i % 2 ? 'crystal' : 'bell', vel: 0.3, pan: (i - 2.5) * 0.2, delay: i * 0.06 }));
    this.breath(0.6, 1400); this.swell(0.9, 4);
  }

  levelUp() {
    [0, 4, 7, 9, 12, 14].forEach((d, i) => this.note(d + 3, { kind: 'bell', vel: 0.36, pan: (i - 2.5) * 0.25, delay: i * 0.12 }));
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
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * 0.08, t + 0.25); g.gain.linearRampToValueAtTime(0, t + 0.9);
    s.connect(f); f.connect(g); g.connect(this.verbIn); g.connect(this.dry); s.start(t); s.stop(t + 1);
  }

  // ---------- Fond de vagues (sommeil, respiration) ----------
  /** Bruit brun filtré : un ressac lointain. Son volume suit la respiration. */
  bed(on) {
    if (!this.ctx) return; const c = this.ctx; const t = c.currentTime;
    if (on && !this.bedSrc) {
      const len = c.sampleRate * 4; const b = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let last = 0; for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; } }
      this.bedSrc = c.createBufferSource(); this.bedSrc.buffer = b; this.bedSrc.loop = true;
      this.bedLp = c.createBiquadFilter(); this.bedLp.type = 'lowpass'; this.bedLp.frequency.value = 420; this.bedLp.Q.value = 0.3;
      this.bedGain = c.createGain(); this.bedGain.gain.value = 0;
      this.bedSrc.connect(this.bedLp); this.bedLp.connect(this.bedGain); this.bedGain.connect(this.verbIn); this.bedGain.connect(this.dry); this.bedSrc.start();
    }
    if (!on && this.bedSrc) { const src = this.bedSrc; this.bedGain.gain.setTargetAtTime(0, t, 1.2); setTimeout(() => { try { src.stop(); } catch { /* déjà arrêté */ } }, 5000); this.bedSrc = null; }
  }
  /** Fait monter ou redescendre le ressac (0..1) en `dur` secondes. */
  wave(level, dur = 4) {
    if (!this.bedGain) return; const t = this.ctx.currentTime; const v = level * 0.5 * this.musicVol;
    this.bedGain.gain.cancelScheduledValues(t); this.bedGain.gain.setValueAtTime(this.bedGain.gain.value, t); this.bedGain.gain.linearRampToValueAtTime(v, t + dur);
    this.bedLp.frequency.cancelScheduledValues(t); this.bedLp.frequency.setValueAtTime(this.bedLp.frequency.value, t); this.bedLp.frequency.linearRampToValueAtTime(260 + level * 520, t + dur);
  }

  // ---------- Mode sommeil ----------
  /** Sons graves, lents et feutrés ; tout est filtré plus fort. */
  setSleep(on) {
    this.sleepMode = on; if (!this.ctx) return; const t = this.ctx.currentTime;
    this.tone.frequency.setTargetAtTime(on ? 1100 : this.night ? 2600 : 12000, t, 1.5);
    this.bed(on); if (on) this.wave(0.4, 3);
    this.nextChord();
  }
  /** Niveau global de la séance (0..1) : s'abaisse lentement jusqu'au silence. */
  sleepLevel(v, dur = 2) { if (this.sleepBus) this.sleepBus.gain.setTargetAtTime(Math.max(0, v), this.ctx.currentTime, dur); }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {}); }
  resume() { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {}); }
}

export const audio = new Audio();
