import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPE } from 'react';
import { useReducedMotion } from 'motion/react';
import { fakePeaks, getPeaks } from '../lib/peaks';
import { clamp, formatTime } from '../lib/util';

type Props = {
  src: string | null;
  seed: string;
  /** Renvoie la progression 0–1 (lu à chaque image quand `live`). */
  progress: () => number;
  live?: boolean;
  onSeek?: (ratio: number) => void;
  duration?: number;
  accent?: string;
  bars?: number;
  label?: string;
  className?: string;
  /** Change cette valeur pour forcer un redessin (ex. après un déplacement en pause). */
  version?: number;
};

/** Forme d'onde dessinée sur canvas : apparition des barres, progression fluide, lueur au point de lecture. */
export function Waveform({ src, seed, progress, live, onSeek, duration = 0, accent = '#c084fc', bars = 140, label, className = 'wave', version = 0 }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [peaks, setPeaks] = useState<number[]>(() => fakePeaks(seed, bars));
  const born = useRef(performance.now());
  const hover = useRef<number | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    let alive = true;
    born.current = performance.now();
    setPeaks(fakePeaks(seed, bars));
    if (src) getPeaks(src, bars).then((p) => alive && setPeaks(p));
    return () => { alive = false; };
  }, [src, seed, bars]);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const g = c.getContext('2d');
    if (!g) return;
    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const r = c.getBoundingClientRect();
      w = r.width; h = r.height;
      c.width = Math.max(1, Math.round(w * dpr));
      c.height = Math.max(1, Math.round(h * dpr));
      draw();
    };
    const draw = () => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      const n = peaks.length;
      const gap = w / n > 4 ? 2 : 1;
      const bw = Math.max(1, w / n - gap);
      const p = clamp(progress(), 0, 1);
      const age = reduce ? 1 : clamp((performance.now() - born.current) / 700, 0, 1);
      const px = p * w;
      for (let i = 0; i < n; i++) {
        const x = i * (bw + gap);
        const local = reduce ? 1 : clamp(age * 1.6 - (i / n) * 0.6, 0, 1);
        const e = 1 - Math.pow(1 - local, 3);
        let bh = Math.max(2, peaks[i] * h * 0.9) * e;
        const near = Math.abs(x - px);
        if (live && !reduce && near < 24) bh *= 1 + 0.12 * (1 - near / 24);
        const y = (h - bh) / 2;
        const played = x + bw <= px;
        const hov = hover.current !== null && x <= hover.current * w;
        g.fillStyle = played ? accent : hov ? 'rgba(237,233,226,0.45)' : 'rgba(237,233,226,0.18)';
        g.beginPath();
        if (g.roundRect) g.roundRect(x, y, bw, bh, Math.min(1.5, bw / 2));
        else g.rect(x, y, bw, bh);
        g.fill();
      }
      if (p > 0 && p < 1) {
        const grad = g.createRadialGradient(px, h / 2, 0, px, h / 2, 26);
        grad.addColorStop(0, `${accent}66`);
        grad.addColorStop(1, `${accent}00`);
        g.fillStyle = grad;
        g.fillRect(px - 26, 0, 52, h);
      }
      if (live || age < 1) raf = requestAnimationFrame(draw);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    resize();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [peaks, live, progress, accent, reduce, version]);

  const ratioFrom = (e: RPE) => {
    const r = e.currentTarget.getBoundingClientRect();
    return clamp((e.clientX - r.left) / r.width, 0, 1);
  };
  const onKey = (e: KeyboardEvent) => {
    if (!onSeek) return;
    const step = duration ? 5 / duration : 0.05;
    if (e.key === 'ArrowRight') { e.preventDefault(); onSeek(clamp(progress() + step, 0, 1)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); onSeek(clamp(progress() - step, 0, 1)); }
  };
  const interactive = !!onSeek;
  const now = progress() * duration;

  return (
    <div
      className={className}
      role={interactive ? 'slider' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={label}
      aria-valuemin={interactive ? 0 : undefined}
      aria-valuemax={interactive ? Math.round(duration) : undefined}
      aria-valuenow={interactive ? Math.round(now) : undefined}
      aria-valuetext={interactive ? formatTime(now) : undefined}
      onKeyDown={onKey}
      onPointerDown={(e) => {
        if (!interactive) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        onSeek!(ratioFrom(e));
      }}
      onPointerMove={(e) => {
        if (!interactive) return;
        if (e.pointerType === 'mouse') hover.current = ratioFrom(e);
        if (e.buttons === 1) onSeek!(ratioFrom(e));
      }}
      onPointerLeave={() => { hover.current = null; }}
    >
      <canvas ref={canvas} />
    </div>
  );
}
