import { useEffect, useRef } from 'react';
import { bus } from '../lib/sky';

/** Visualiseur discret : barres fines (lecteur) ou couronne autour d'une pochette (mode contemplatif). */
export function Visualizer({ mode = 'bars', size = 28, accent = '#c9bfff', className }: { mode?: 'bars' | 'ring'; size?: number; accent?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext('2d')!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cssW = mode === 'ring' ? size : size * 1.6;
    const cssH = size;
    c.width = Math.round(cssW * dpr); c.height = Math.round(cssH * dpr);
    c.style.width = cssW + 'px'; c.style.height = cssH + 'px';
    let raf = 0;
    const N = bus.bins.length;
    const draw = () => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, cssW, cssH);
      g.strokeStyle = accent; g.lineCap = 'round';
      if (mode === 'bars') {
        const n = 9; const gap = cssW / n;
        g.lineWidth = Math.max(1.5, gap * 0.38);
        for (let i = 0; i < n; i++) {
          const v = reduce ? 0.3 : Math.min(1, bus.bins[Math.floor((i / n) * N * 0.7)] * 1.25);
          const h = Math.max(2, v * cssH);
          g.globalAlpha = 0.45 + v * 0.55;
          g.beginPath(); g.moveTo(gap * (i + 0.5), cssH / 2 - h / 2); g.lineTo(gap * (i + 0.5), cssH / 2 + h / 2); g.stroke();
        }
      } else {
        const cx = cssW / 2, cy = cssH / 2, r0 = cssW * 0.3, span = cssW * 0.2;
        const n = 72;
        g.lineWidth = 1.4;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          // miroir pour une couronne symétrique et continue
          const k = i < n / 2 ? i : n - i;
          const raw = bus.bins[Math.floor(Math.pow(k / (n / 2), 0.55) * (N - 1) * 0.6)];
          const v = reduce ? 0.2 : Math.min(1, 0.1 + raw * 1.25);
          const r1 = r0 + 3 + v * span;
          g.globalAlpha = 0.35 + v * 0.6;
          g.beginPath(); g.moveTo(cx + Math.cos(a) * (r0 + 3), cy + Math.sin(a) * (r0 + 3)); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden && !reduce) raf = requestAnimationFrame(draw); };
    if (reduce) draw(); else raf = requestAnimationFrame(draw);
    document.addEventListener('visibilitychange', vis);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis); };
  }, [mode, size, accent]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
