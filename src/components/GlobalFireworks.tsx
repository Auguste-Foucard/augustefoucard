import { useEffect, useRef } from 'react';
import { Fireworks, type FwType } from '../scene/fireworks';

const TAP: FwType[] = ['rainbow', 'rainbow', 'crackle', 'chrysanthemum', 'peony'];

/** Feux d'artifice crépitants partout sur le site quand on touche un bouton, une carte, un filtre… */
export function GlobalFireworks() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const fw = new Fireworks(c);
    const tap = (e: Event) => {
      const d = (e as CustomEvent).detail as { x: number; y: number; strong: boolean };
      fw.burst(d.x, d.y, TAP[Math.floor(Math.random() * TAP.length)], Math.random() * 360, d.strong ? 0.85 : 0.55);
    };
    const resize = () => fw.resize();
    window.addEventListener('af:tap', tap);
    window.addEventListener('resize', resize);
    return () => { fw.destroy(); window.removeEventListener('af:tap', tap); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="gfw" aria-hidden="true" />;
}
