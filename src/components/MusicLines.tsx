import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { bus } from '../lib/sky';
import { usePlayer } from './player/PlayerContext';

const isHome = (p: string) => p === '/' || p === '/en' || p === '/en/';

/**
 * « Musique qui dessine » : pendant l'écoute, des anneaux de lignes fines (reliés en toile) respirent
 * autour de la lune au rythme du son. Invisible à l'arrêt ; une seule boucle canvas, stoppée au silence.
 */
export function MusicLines() {
  const { playing } = usePlayer();
  const { pathname } = useLocation();
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef({ playing, home: isHome(pathname) });
  live.current = { playing, home: isHome(pathname) };
  const wake = useRef<() => void>(() => {});

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = ref.current!;
    const g = c.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0, h = 0, raf = 0, amp = 0, last = performance.now(), cx = 0, cy = 0;
    const size = () => {
      w = window.innerWidth; h = window.innerHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    const RINGS = 13, N = 96, B = bus.bins.length;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const { playing: on, home } = live.current;
      amp += ((on ? 1 : 0) - amp) * Math.min(1, dt * (on ? 1.6 : 1.1));
      g.clearRect(0, 0, w, h);
      if (amp < 0.012 && !on) { raf = 0; return; }

      // centre : la lune sur l'accueil, sinon le centre de l'écran (glissement doux)
      let tx = w * 0.5, ty = h * 0.46;
      if (home) {
        const W = Math.round(Math.min(2600, Math.max(420, (1000 * w) / h)));
        const narrow = W < 900, k = (1.06 * h) / 1000;
        tx = -0.03 * w + (W - Math.max(104, 0.2125 * W)) * k;
        ty = -0.03 * h + (narrow ? 262 : 250) * k;
      }
      if (!cx) { cx = tx; cy = ty; }
      cx += (tx - cx) * Math.min(1, dt * 2); cy += (ty - cy) * Math.min(1, dt * 2);

      const m = Math.min(w, h), r0 = m * 0.17, gap = m * 0.032, t = now / 1000;
      g.globalCompositeOperation = 'lighter';
      g.lineWidth = 1;
      const ring: [number, number][][] = [];
      for (let k = 0; k < RINGS; k++) {
        const pts: [number, number][] = [];
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2 + t * 0.05 * (k % 2 ? 1 : -1);
          const kk = i < N / 2 ? i : N - i; // miroir : anneau symétrique
          const v = Math.min(1, bus.bins[Math.min(B - 1, Math.floor(Math.pow(kk / (N / 2), 0.6) * (B - 1) * 0.65))] * 1.3);
          const d = amp * (v * (14 + k * 4.5) + Math.sin(a * 3 + t * 0.7 + k) * 2.2);
          const r = r0 + k * gap + d;
          pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.94]);
        }
        ring.push(pts);
        const mix = k / (RINGS - 1);
        g.strokeStyle = `rgba(${Math.round(243 - mix * 70)},${Math.round(217 - mix * 20)},${Math.round(160 + mix * 90)},${((0.78 - mix * 0.5) * amp).toFixed(3)})`;
        g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.closePath(); g.stroke();
      }
      g.lineWidth = 0.6;
      g.strokeStyle = `rgba(190,205,255,${(0.22 * amp).toFixed(3)})`;
      g.beginPath();
      for (let k = 0; k < RINGS - 1; k++) for (let i = 0; i < N; i += 8) { g.moveTo(ring[k][i][0], ring[k][i][1]); g.lineTo(ring[k + 1][(i + 4) % N][0], ring[k + 1][(i + 4) % N][1]); }
      g.stroke();
      raf = requestAnimationFrame(frame);
    };
    wake.current = () => { if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const vis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else wake.current(); };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('resize', size);
    wake.current();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis); window.removeEventListener('resize', size); };
  }, []);

  useEffect(() => { if (playing) wake.current(); }, [playing]);

  return <canvas ref={ref} className="musiclines" aria-hidden="true" />;
}
