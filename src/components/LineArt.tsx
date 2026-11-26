import { useEffect, useRef } from 'react';

/**
 * « Fil de lumière » : le curseur (souris) ou le doigt (téléphone) trace des lignes dorées fines,
 * reliées en toile et reflétées en miroir au centre de l'écran, puis effacées doucement.
 * Chaque toucher d'un bouton ou d'une carte déclenche une onde dorée et des étincelles.
 * Une seule boucle canvas, arrêtée dès que rien ne bouge ; désactivé si mouvement réduit.
 */
type Burst = { x: number; y: number; t0: number; strong: boolean; a0: number };

export function LineArt() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = ref.current!;
    const g = c.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0, h = 0;
    const size = () => {
      w = window.innerWidth; h = window.innerHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    const MAX = 24, REACH = 200;
    const pts: { x: number; y: number }[] = [];
    const bursts: Burst[] = [];
    let raf = 0, last = 0, lx = -1, ly = -1;

    const seg = (x1: number, y1: number, x2: number, y2: number) => {
      g.beginPath();
      g.moveTo(x1, y1); g.lineTo(x2, y2);
      g.moveTo(w - x1, y1); g.lineTo(w - x2, y2);
      g.stroke();
    };
    const add = (x: number, y: number) => {
      pts.push({ x, y });
      if (pts.length > MAX) pts.shift();
      g.globalCompositeOperation = 'lighter';
      g.lineWidth = 0.75;
      for (let i = 0; i < pts.length - 1; i++) {
        const p = pts[i];
        const d = Math.hypot(x - p.x, y - p.y);
        if (d < 8 || d > REACH) continue;
        g.strokeStyle = `rgba(243,217,160,${((1 - d / REACH) * 0.38 * (0.3 + i / pts.length)).toFixed(3)})`;
        seg(p.x, p.y, x, y);
      }
      g.fillStyle = 'rgba(255,236,190,.55)';
      g.beginPath(); g.arc(x, y, 1.6, 0, 6.283); g.arc(w - x, y, 1.6, 0, 6.283); g.fill();
    };

    const drawBursts = (now: number) => {
      g.globalCompositeOperation = 'lighter';
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        const u = (now - b.t0) / (b.strong ? 900 : 650);
        if (u >= 1) { bursts.splice(i, 1); continue; }
        const e = 1 - Math.pow(1 - u, 3), R = (b.strong ? 86 : 56) * e, a = (1 - u) * (b.strong ? 0.75 : 0.55);
        g.lineWidth = 1.2 * (1 - u) + 0.4;
        g.strokeStyle = `rgba(243,217,160,${a.toFixed(3)})`;
        g.beginPath(); g.arc(b.x, b.y, R, 0, 6.283); g.stroke();
        g.strokeStyle = `rgba(190,205,255,${(a * 0.6).toFixed(3)})`;
        g.beginPath(); g.arc(b.x, b.y, R * 0.62, 0, 6.283); g.stroke();
        const n = b.strong ? 14 : 9;
        g.strokeStyle = `rgba(255,236,190,${(a * 1.1).toFixed(3)})`;
        g.beginPath();
        for (let k = 0; k < n; k++) {
          const th = b.a0 + (k / n) * 6.283, r1 = R * 0.55 + 4, r2 = R * (0.85 + 0.25 * ((k * 7) % 3) / 3) + 6;
          g.moveTo(b.x + Math.cos(th) * r1, b.y + Math.sin(th) * r1);
          g.lineTo(b.x + Math.cos(th) * r2, b.y + Math.sin(th) * r2);
        }
        g.stroke();
      }
    };

    const frame = (now: number) => {
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = 'rgba(0,0,0,0.08)';
      g.fillRect(0, 0, w, h);
      drawBursts(now);
      if (now - last > 2200 && !bursts.length) { g.clearRect(0, 0, w, h); pts.length = 0; raf = 0; return; }
      raf = requestAnimationFrame(frame);
    };
    const kick = () => { last = performance.now(); if (!raf) raf = requestAnimationFrame(frame); };

    const trail = (x: number, y: number) => {
      if (lx >= 0) {
        const dx = x - lx, dy = y - ly, n = Math.min(8, Math.floor(Math.hypot(dx, dy) / 14));
        for (let i = 1; i <= n; i++) add(lx + (dx * i) / (n + 1), ly + (dy * i) / (n + 1));
      }
      add(x, y); lx = x; ly = y; kick();
    };
    // souris / stylet : pointer events ; doigt : touch events (continuent de tirer pendant le défilement)
    const move = (e: PointerEvent) => { if (e.pointerType !== 'touch') trail(e.clientX, e.clientY); };
    const tmove = (e: TouchEvent) => { const t = e.touches[0]; if (t) trail(t.clientX, t.clientY); };
    const tstart = (e: TouchEvent) => { lx = ly = -1; const t = e.touches[0]; if (t) { pts.length = 0; trail(t.clientX, t.clientY); } };
    const end = () => { lx = ly = -1; };
    const tap = (e: Event) => {
      const d = (e as CustomEvent).detail as { x: number; y: number; strong: boolean };
      bursts.push({ x: d.x, y: d.y, t0: performance.now(), strong: d.strong, a0: Math.random() * 6.283 });
      kick();
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', end, { passive: true });
    window.addEventListener('touchstart', tstart, { passive: true });
    window.addEventListener('touchmove', tmove, { passive: true });
    window.addEventListener('touchend', end, { passive: true });
    window.addEventListener('touchcancel', end, { passive: true });
    window.addEventListener('af:tap', tap);
    window.addEventListener('resize', size);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('touchstart', tstart);
      window.removeEventListener('touchmove', tmove);
      window.removeEventListener('touchend', end);
      window.removeEventListener('touchcancel', end);
      window.removeEventListener('af:tap', tap);
      window.removeEventListener('resize', size);
    };
  }, []);

  return <canvas ref={ref} className="lineart" aria-hidden="true" />;
}
