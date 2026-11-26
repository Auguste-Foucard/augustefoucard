import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const isHome = (p: string) => p === '/' || p === '/en' || p === '/en/';

/**
 * « Portail tourbillon » : à chaque changement de page, des spirales de lignes dorées jaillissent
 * de la porte de pierre (ou du centre) et se referment en toile fine pendant le fondu de la page.
 */
export function PortalSwirl() {
  const { pathname } = useLocation();
  const ref = useRef<HTMLCanvasElement>(null);
  const prev = useRef(pathname);
  const raf = useRef(0);

  // changement de page → tourbillon ; le bouton d'accueil le déclenche aussi (événement « af:swirl »)
  useEffect(() => {
    const from = prev.current;
    prev.current = pathname;
    if (from !== pathname) window.dispatchEvent(new CustomEvent('af:swirl', { detail: { home: isHome(from) } }));
  }, [pathname]);

  useEffect(() => {
    const play = (fromHome: boolean) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = ref.current!;
    const g = c.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const cw = window.innerWidth, ch = window.innerHeight;
    c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    // origine : la porte de pierre quand on quitte l'accueil, sinon le centre
    let ox = cw / 2, oy = ch * 0.46;
    if (fromHome) {
      const W = Math.round(Math.min(2600, Math.max(420, (1000 * cw) / ch)));
      const narrow = W < 900, k = (1.06 * ch) / 1000, s = narrow ? 1.15 : 1.7;
      ox = -0.03 * cw + W * (narrow ? 0.8 : 0.835) * k;
      oy = -0.03 * ch + (685 - 62 * s) * k;
    }
    const maxR = Math.hypot(Math.max(ox, cw - ox), Math.max(oy, ch - oy)) * 1.05;
    const ARMS = 9, STEPS = 130, TH = Math.PI * 5.2, DUR = 1300;
    const t0 = performance.now();
    c.style.display = 'block';

    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / DUR);
      const p = ease(Math.min(1, t / 0.8));
      const alpha = t < 0.5 ? 1 : 1 - (t - 0.5) / 0.5;
      g.clearRect(0, 0, cw, ch);
      g.globalCompositeOperation = 'lighter';

      const fl = g.createRadialGradient(ox, oy, 0, ox, oy, maxR * 0.45);
      fl.addColorStop(0, `rgba(255,222,150,${(0.32 * alpha * (1 - p * 0.6)).toFixed(3)})`);
      fl.addColorStop(1, 'rgba(255,200,110,0)');
      g.fillStyle = fl; g.fillRect(0, 0, cw, ch);

      const arms: [number, number][][] = [];
      for (let a = 0; a < ARMS; a++) {
        const pts: [number, number][] = [];
        for (let i = 0; i <= STEPS; i++) {
          const u = (i / STEPS) * p;
          const th = u * TH + (a * Math.PI * 2) / ARMS + t * 0.9;
          const r = maxR * Math.pow(u, 1.15);
          pts.push([ox + Math.cos(th) * r, oy + Math.sin(th) * r]);
        }
        arms.push(pts);
      }
      g.lineWidth = 1;
      g.shadowColor = 'rgba(255,200,110,.7)'; g.shadowBlur = 8;
      g.strokeStyle = `rgba(243,217,160,${(0.55 * alpha).toFixed(3)})`;
      for (const pts of arms) {
        g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.stroke();
      }
      g.shadowBlur = 0;
      g.lineWidth = 0.7;
      g.strokeStyle = `rgba(190,205,255,${(0.2 * alpha).toFixed(3)})`;
      g.beginPath();
      for (let a = 0; a < ARMS; a++) {
        const A = arms[a], B = arms[(a + 1) % ARMS];
        for (let i = 10; i <= STEPS; i += 9) { g.moveTo(A[i][0], A[i][1]); g.lineTo(B[i][0], B[i][1]); }
      }
      g.stroke();

      if (t < 1) raf.current = requestAnimationFrame(frame);
      else { g.clearRect(0, 0, cw, ch); c.style.display = 'none'; }
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(frame);
    };
    const on = (e: Event) => play(!!(e as CustomEvent).detail?.home);
    window.addEventListener('af:swirl', on);
    return () => { window.removeEventListener('af:swirl', on); cancelAnimationFrame(raf.current); };
  }, []);

  return <canvas ref={ref} className="swirl" aria-hidden="true" />;
}
