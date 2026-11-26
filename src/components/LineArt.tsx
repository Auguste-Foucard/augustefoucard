import { useEffect, useRef } from 'react';

/**
 * « Fil de lumière » : le curseur (ou le doigt) trace des lignes dorées fines, reliées entre elles
 * en toile, et reflétées en miroir au centre de l'écran. Les traits s'effacent doucement.
 * Une seule boucle canvas, arrêtée dès que rien ne bouge ; désactivé si mouvement réduit.
 */
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

    const frame = (now: number) => {
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = 'rgba(0,0,0,0.05)';
      g.fillRect(0, 0, w, h);
      if (now - last > 2600) { g.clearRect(0, 0, w, h); pts.length = 0; raf = 0; return; }
      raf = requestAnimationFrame(frame);
    };
    const kick = () => { last = performance.now(); if (!raf) raf = requestAnimationFrame(frame); };

    const move = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.buttons === 0 && !window.matchMedia('(hover: hover)').matches) return;
      const x = e.clientX, y = e.clientY;
      if (lx >= 0) {
        const dx = x - lx, dy = y - ly, n = Math.min(8, Math.floor(Math.hypot(dx, dy) / 14));
        for (let i = 1; i <= n; i++) add(lx + (dx * i) / (n + 1), ly + (dy * i) / (n + 1));
      }
      add(x, y); lx = x; ly = y; kick();
    };
    const up = () => { lx = ly = -1; };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up, { passive: true });
    window.addEventListener('pointercancel', up, { passive: true });
    window.addEventListener('resize', size);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('resize', size);
    };
  }, []);

  return <canvas ref={ref} className="lineart" aria-hidden="true" />;
}
