import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/lang';
import { Button } from '../components/Motion';
import { Mic } from '../components/Icons';
import { usePlayer } from '../components/player/PlayerContext';

/**
 * LAB — Déplacement à la voix (version web de démonstration).
 * - Hauteur de la voix au-dessus de ta note de référence → droite, en dessous → gauche.
 * - Son fort et bref → saut.
 * - Clavier (← → espace) et boutons tactiles en secours.
 * Tout le traitement audio reste dans le navigateur : rien n'est enregistré ni envoyé.
 */

type Phase = 'idle' | 'asking' | 'calibrating' | 'playing' | 'denied' | 'keyboard';

const TXT = {
  fr: {
    start: 'Activer le micro', keyboard: 'Jouer au clavier', denied: 'Micro refusé ou indisponible. Tu peux jouer au clavier ou avec les boutons.',
    calib: 'Calibrage : tiens un « aaa » d’une voix normale…', intro: 'Ta voix pilote le personnage. Le son reste dans ton navigateur : rien n’est enregistré.',
    level: 'Volume', pitch: 'Hauteur', ref: 'Référence', recal: 'Recalibrer', stop: 'Couper le micro', score: 'Étoiles',
    h1: 'Voix plus aiguë que ta référence', h1b: 'avance à droite', h2: 'Voix plus grave', h2b: 'recule à gauche', h3: 'Son fort et bref (« Hop ! »)', h3b: 'saute',
    left: 'Gauche', right: 'Droite', jump: 'Saut',
  },
  en: {
    start: 'Enable microphone', keyboard: 'Play with keyboard', denied: 'Microphone blocked or unavailable. You can play with the keyboard or buttons.',
    calib: 'Calibrating: hold an “aaa” in your normal voice…', intro: 'Your voice drives the character. Audio stays in your browser: nothing is recorded.',
    level: 'Level', pitch: 'Pitch', ref: 'Reference', recal: 'Recalibrate', stop: 'Turn mic off', score: 'Stars',
    h1: 'Voice higher than your reference', h1b: 'moves right', h2: 'Lower voice', h2b: 'moves left', h3: 'Loud short sound (“Hop!”)', h3b: 'jumps',
    left: 'Left', right: 'Right', jump: 'Jump',
  },
};

function detectPitch(buf: Float32Array, sr: number): number {
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < 0.012) return -1;
  const minLag = Math.floor(sr / 900), maxLag = Math.floor(sr / 70);
  let best = -1, bestCorr = 0;
  const n = buf.length - maxLag;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let c = 0, e1 = 0, e2 = 0;
    for (let i = 0; i < n; i += 2) { c += buf[i] * buf[i + lag]; e1 += buf[i] * buf[i]; e2 += buf[i + lag] * buf[i + lag]; }
    const r = c / Math.sqrt(e1 * e2 || 1);
    if (r > bestCorr) { bestCorr = r; best = lag; }
  }
  return bestCorr > 0.82 && best > 0 ? sr / best : -1;
}

export default function VoiceMove() {
  const { lang } = useLang();
  const T = TXT[lang];
  const player = usePlayer();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [hud, setHud] = useState({ level: 0, pitch: 0, ref: 0, score: 0 });

  const audio = useRef<{ ctx: AudioContext; an: AnalyserNode; stream: MediaStream; buf: Float32Array<ArrayBuffer> } | null>(null);
  const input = useRef({ dir: 0, jump: false, keys: { l: false, r: false } });
  const calib = useRef<{ samples: number[]; rms: number[]; until: number }>({ samples: [], rms: [], until: 0 });
  const voice = useRef({ ref: 0, base: 0.02, lastLevel: 0 });
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  const stopMic = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    a.stream.getTracks().forEach((t) => t.stop());
    a.ctx.close().catch(() => {});
    audio.current = null;
  }, []);

  const startMic = async () => {
    setPhase('asking');
    if (player.playing) player.toggle(); // la musique du site gênerait la détection
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } });
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      await ctx.resume();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      src.connect(an);
      audio.current = { ctx, an, stream, buf: new Float32Array(new ArrayBuffer(an.fftSize * 4)) };
      calib.current = { samples: [], rms: [], until: performance.now() + 2200 };
      setPhase('calibrating');
    } catch {
      setPhase('denied');
    }
  };

  const recalibrate = () => {
    calib.current = { samples: [], rms: [], until: performance.now() + 2200 };
    setPhase('calibrating');
  };

  useEffect(() => () => stopMic(), [stopMic]);

  // Clavier
  useEffect(() => {
    const set = (e: KeyboardEvent, v: boolean) => {
      if (phaseRef.current !== 'playing' && phaseRef.current !== 'keyboard') return;
      if (e.key === 'ArrowLeft') input.current.keys.l = v;
      else if (e.key === 'ArrowRight') input.current.keys.r = v;
      else if ((e.key === ' ' || e.key === 'ArrowUp') && v) input.current.jump = true;
      else return;
      e.preventDefault();
    };
    const d = (e: KeyboardEvent) => set(e, true), u = (e: KeyboardEvent) => set(e, false);
    window.addEventListener('keydown', d);
    window.addEventListener('keyup', u);
    return () => { window.removeEventListener('keydown', d); window.removeEventListener('keyup', u); };
  }, []);

  // Boucle de jeu
  useEffect(() => {
    const c = canvas.current!;
    const g = c.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, last = performance.now(), hudT = 0;
    let W = 0, H = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { const r = c.getBoundingClientRect(); W = r.width; H = r.height; c.width = W * dpr; c.height = H * dpr; };
    const ro = new ResizeObserver(resize); ro.observe(c); resize();

    const P = { x: 0.2, y: 0, vx: 0, vy: 0, sx: 1, sy: 1, ground: true, face: 1 };
    let star = { x: 0.75, y: 0.35, t: 0 };
    let score = 0;
    const particles: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    let pitch = -1, level = 0, cooldown = 0;

    const burst = (x: number, y: number, n: number) => {
      if (reduce) return;
      for (let i = 0; i < n; i++) particles.push({ x, y, vx: (Math.random() - 0.5) * 0.6, vy: -Math.random() * 0.5, life: 1 });
    };

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const ph = phaseRef.current;
      const a = audio.current;

      if (a && (ph === 'calibrating' || ph === 'playing')) {
        a.an.getFloatTimeDomainData(a.buf);
        let s = 0; for (let i = 0; i < a.buf.length; i++) s += a.buf[i] * a.buf[i];
        level = Math.sqrt(s / a.buf.length);
        pitch = detectPitch(a.buf, a.ctx.sampleRate);
        if (ph === 'calibrating') {
          if (pitch > 0) calib.current.samples.push(pitch);
          calib.current.rms.push(level);
          if (now > calib.current.until) {
            const sm = calib.current.samples.sort((x, y) => x - y);
            voice.current.ref = sm.length > 8 ? sm[Math.floor(sm.length / 2)] : 180;
            const rm = calib.current.rms.sort((x, y) => x - y);
            voice.current.base = Math.max(0.02, rm[Math.floor(rm.length * 0.8)] || 0.03);
            setPhase('playing');
          }
        } else {
          const ref = voice.current.ref;
          let dir = 0;
          if (pitch > 0) {
            const ratio = Math.log2(pitch / ref) * 12; // demi-tons
            if (ratio > 1.5) dir = Math.min(1, (ratio - 1.5) / 4 + 0.4);
            else if (ratio < -1.5) dir = -Math.min(1, (-ratio - 1.5) / 4 + 0.4);
          }
          input.current.dir = dir;
          const spike = level > Math.max(0.12, voice.current.base * 2.6) && level - voice.current.lastLevel > 0.04;
          if (spike && cooldown <= 0) { input.current.jump = true; cooldown = 0.45; }
        }
        voice.current.lastLevel = level;
      }
      cooldown -= dt;

      // Physique
      const keys = input.current.keys;
      const dir = keys.l || keys.r ? (keys.r ? 1 : 0) - (keys.l ? 1 : 0) : input.current.dir;
      P.vx += (dir * 0.55 - P.vx) * Math.min(1, dt * 8);
      if (dir) P.face = Math.sign(dir);
      if (input.current.jump && P.ground) { P.vy = 1.15; P.ground = false; P.sx = 0.7; P.sy = 1.35; burst(P.x, 0, 8); }
      input.current.jump = false;
      P.vy -= 3.2 * dt;
      P.x += P.vx * dt; P.y += P.vy * dt;
      if (P.x < 0.04) { P.x = 0.04; P.vx = 0; } if (P.x > 0.96) { P.x = 0.96; P.vx = 0; }
      if (P.y <= 0) { if (!P.ground && P.vy < -0.4) { P.sx = 1.35; P.sy = 0.7; burst(P.x, 0, 6); } P.y = 0; P.vy = 0; P.ground = true; }
      P.sx += (1 - P.sx) * Math.min(1, dt * 10); P.sy += (1 - P.sy) * Math.min(1, dt * 10);

      // Étoile à ramasser
      star.t += dt;
      const dx = (P.x - star.x) * W, dy = (P.y - star.y) * H * 0.7;
      if (Math.hypot(dx, dy) < 38) {
        score++; burst(star.x, star.y, 18);
        star = { x: 0.1 + Math.random() * 0.8, y: Math.random() < 0.5 ? 0.06 : 0.3 + Math.random() * 0.25, t: 0 };
      }

      // Rendu
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      const gy = H * 0.8; const scaleY = H * 0.7;
      const bg = g.createRadialGradient(W * 0.5, gy, 10, W * 0.5, gy, W * 0.7);
      bg.addColorStop(0, 'rgba(139,92,246,0.18)'); bg.addColorStop(1, 'rgba(139,92,246,0)');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(237,233,226,0.06)'; g.lineWidth = 1;
      for (let i = 0; i < 14; i++) { const x = ((i / 13) * W); g.beginPath(); g.moveTo(x, gy); g.lineTo(W / 2 + (x - W / 2) * 2.6, H); g.stroke(); }
      g.strokeStyle = 'rgba(237,233,226,0.35)'; g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke();

      // étoile
      const sx = star.x * W, sy = gy - star.y * scaleY - 30 + Math.sin(star.t * 3) * 6;
      const sg = g.createRadialGradient(sx, sy, 0, sx, sy, 34); sg.addColorStop(0, 'rgba(252,211,77,0.55)'); sg.addColorStop(1, 'rgba(252,211,77,0)');
      g.fillStyle = sg; g.beginPath(); g.arc(sx, sy, 34, 0, 7); g.fill();
      g.fillStyle = '#fde68a'; g.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 5 : 12; const an = (i / 10) * Math.PI * 2 + star.t; g.lineTo(sx + Math.cos(an) * r, sy + Math.sin(an) * r); }
      g.closePath(); g.fill();

      // particules
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]; p.life -= dt * 1.8; p.x += p.vx * dt * 0.3; p.y += p.vy * dt; p.vy -= dt * 1.5;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        g.fillStyle = `rgba(192,132,252,${p.life})`; g.beginPath(); g.arc(p.x * W, gy - Math.max(0, p.y) * scaleY - 4, 2.5 * p.life + 0.5, 0, 7); g.fill();
      }

      // personnage (squash & stretch)
      const px = P.x * W, py = gy - P.y * scaleY;
      const s = Math.max(26, Math.min(44, W * 0.045));
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(px, gy + 3, s * 0.7 * (1 - Math.min(0.6, P.y)), 5, 0, 0, 7); g.fill();
      g.save(); g.translate(px, py); g.scale(P.sx, P.sy);
      const body = g.createLinearGradient(0, -s * 2, 0, 0); body.addColorStop(0, '#c084fc'); body.addColorStop(1, '#7c3aed');
      g.shadowColor = 'rgba(139,92,246,0.8)'; g.shadowBlur = 24;
      g.fillStyle = body; g.beginPath(); g.roundRect(-s / 2, -s * 1.5, s, s * 1.5, s * 0.45); g.fill();
      g.shadowBlur = 0; g.fillStyle = '#ede9e2';
      g.beginPath(); g.ellipse(P.face * s * 0.12 - s * 0.14, -s * 0.95, s * 0.08, s * 0.13, 0, 0, 7); g.ellipse(P.face * s * 0.12 + s * 0.14, -s * 0.95, s * 0.08, s * 0.13, 0, 0, 7); g.fill();
      g.restore();

      if (now - hudT > 80) { hudT = now; setHud({ level, pitch: pitch > 0 ? pitch : 0, ref: voice.current.ref, score }); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  const hold = (k: 'l' | 'r', v: boolean) => { input.current.keys[k] = v; };
  const showOverlay = phase === 'idle' || phase === 'asking' || phase === 'denied' || phase === 'calibrating';
  const usingMic = phase === 'playing' || phase === 'calibrating';
  const pitchPos = hud.ref && hud.pitch ? Math.max(0, Math.min(1, 0.5 + Math.log2(hud.pitch / hud.ref) * 0.6)) : 0.5;

  return (
    <div>
      <div className="lab-stage">
        <canvas ref={canvas} aria-label="Zone de jeu" role="img" />
        {showOverlay && (
          <motion.div className="lab-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div>
              {phase === 'calibrating' ? (
                <>
                  <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="icon-btn icon-btn--solid" aria-hidden="true"><Mic size={20} /></motion.span>
                  <p aria-live="polite">{T.calib}</p>
                </>
              ) : (
                <>
                  <p className="muted">{phase === 'denied' ? T.denied : T.intro}</p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {phase !== 'denied' && <Button onClick={startMic} disabled={phase === 'asking'}><Mic size={16} /> {T.start}</Button>}
                    <Button variant="ghost" onClick={() => setPhase('keyboard')}>{T.keyboard}</Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <div className="lab-hud">
        <div className="meter"><label>{T.level}</label><div className="meter__track"><i style={{ width: `${Math.min(100, hud.level * 400)}%` }} /></div></div>
        <div className="meter"><label>{T.pitch} {hud.pitch ? `· ${Math.round(hud.pitch)} Hz` : ''}</label><div className="meter__track"><b style={{ left: '50%', opacity: 0.4 }} /><i style={{ left: `calc(${pitchPos * 100}% - 4px)`, width: 8, opacity: hud.pitch ? 1 : 0.2 }} /></div></div>
        <span className="tag">{T.score} · {hud.score}</span>
        {usingMic && <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button size="sm" variant="ghost" onClick={recalibrate} magnetic={false}>{T.recal}{hud.ref ? ` (${Math.round(hud.ref)} Hz)` : ''}</Button>
          <Button size="sm" variant="ghost" onClick={() => { stopMic(); setPhase('keyboard'); }} magnetic={false}>{T.stop}</Button>
        </div>}
      </div>

      {(phase === 'keyboard' || phase === 'denied') && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
          {(['l', 'r'] as const).map((k) => (
            <button key={k} className="btn btn--ghost" style={{ flex: 1, maxWidth: '10rem', touchAction: 'none' }}
              onPointerDown={() => hold(k, true)} onPointerUp={() => hold(k, false)} onPointerLeave={() => hold(k, false)} onPointerCancel={() => hold(k, false)}>
              {k === 'l' ? '←' : '→'} <span className="sr-only">{k === 'l' ? T.left : T.right}</span>
            </button>
          ))}
          <button className="btn btn--primary" style={{ flex: 1, maxWidth: '10rem' }} onPointerDown={() => { input.current.jump = true; }}>{T.jump}</button>
        </div>
      )}

      <ul className="lab-help">
        <li><kbd>↑</kbd> {T.h1} → {T.h1b}</li>
        <li><kbd>↓</kbd> {T.h2} → {T.h2b}</li>
        <li><kbd>!</kbd> {T.h3} → {T.h3b}</li>
      </ul>
    </div>
  );
}
