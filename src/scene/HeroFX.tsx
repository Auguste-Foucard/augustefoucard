import { useEffect, useRef } from 'react';

type Petal = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; s: number; ph: number; c: string; life: number };
type Fly = { x: number; y: number; ph: number; sp: number; r: number; ox: number; oy: number };
const PETAL = ['#fbd3df', '#f6b4c9', '#ffe8ef', '#f4a0bb'];

/**
 * Effets vivants du paysage : pétales qui quittent l'arbre, lucioles près des fleurs.
 * Une seule boucle canvas, en pause hors écran / onglet caché ; densité réduite sur mobile.
 */
export function HeroFX({ W, narrow, cw, ch, tree }: { W: number; narrow: boolean; cw: number; ch: number; tree: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr);
    const k = (1.06 * ch) / 1000; // même échelle que les calques (surdimensionnés de 3 %)
    const map = (x: number, y: number): [number, number] => [-0.03 * cw + x * k, -0.03 * ch + y * k];
    const s = narrow ? 0.72 : 1, tx = narrow ? -26 : -46, ty = narrow ? 92 : 46;
    const gx = W * (narrow ? 0.8 : 0.835), gs = narrow ? 1.15 : 1.7, gy = 679;
    type Mote = { x: number; y: number; vy: number; ph: number; r: number; life: number; max: number };
    const nM = narrow ? 9 : 18;
    const mote = (m?: Mote, init = false): Mote => {
      const o = m ?? ({} as Mote);
      const [x, y] = map(gx + (Math.random() - 0.5) * 70 * gs, gy - Math.random() * 120 * gs);
      o.x = x; o.y = y; o.vy = 8 + Math.random() * 18; o.ph = Math.random() * 6.28; o.r = 0.9 + Math.random() * 1.4; o.max = 5 + Math.random() * 6; o.life = init ? Math.random() * o.max : 0;
      return o;
    };
    const motes: Mote[] = Array.from({ length: nM }, () => mote(undefined, true));

    const nP = narrow ? 7 : 14, nF = narrow ? 7 : 14;
    const spawn = (p?: Petal, init = false): Petal => {
      const [x, y] = map(tx + (40 + Math.random() * 480) * s, ty + (80 + Math.random() * 380) * s);
      const o = p ?? ({} as Petal);
      o.x = x; o.y = init ? y + Math.random() * ch * 0.5 : y; o.vx = 6 + Math.random() * 14; o.vy = 14 + Math.random() * 20;
      o.rot = Math.random() * 6.28; o.vr = (Math.random() - 0.5) * 1.6; o.s = 3 + Math.random() * 3.2; o.ph = Math.random() * 6.28;
      o.c = PETAL[Math.floor(Math.random() * PETAL.length)]; o.life = 0;
      return o;
    };
    const petals: Petal[] = tree ? Array.from({ length: nP }, () => spawn(undefined, true)) : [];
    const flies: Fly[] = Array.from({ length: nF }, () => {
      const [x, y] = map(Math.random() * W * 0.62, 780 + Math.random() * 190);
      return { x, y, ph: Math.random() * 6.28, sp: 0.25 + Math.random() * 0.5, r: 1.2 + Math.random() * 1.2, ox: 10 + Math.random() * 26, oy: 6 + Math.random() * 16 };
    });
    const glow = document.createElement('canvas'); glow.width = glow.height = 48;
    const gg = glow.getContext('2d')!;
    const gr = gg.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, 'rgba(255,225,140,1)'); gr.addColorStop(0.25, 'rgba(255,205,100,.45)'); gr.addColorStop(1, 'rgba(255,190,80,0)');
    gg.fillStyle = gr; gg.fillRect(0, 0, 48, 48);

    let raf = 0, last = performance.now(), on = true;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const t = now / 1000;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, cw, ch);
      for (const p of petals) {
        p.life += dt;
        p.x += (p.vx + Math.sin(t * 0.9 + p.ph) * 10) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.y > ch * 0.97 || p.x > cw + 20) spawn(p);
        const a = Math.min(1, p.life * 0.8) * Math.max(0, Math.min(1, (ch * 0.97 - p.y) / (ch * 0.12)));
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(t * 1.3 + p.ph)));
        g.globalAlpha = a * 0.9; g.fillStyle = p.c;
        g.beginPath(); g.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 6.283); g.fill();
        g.restore();
      }
      g.globalAlpha = 1;
      for (const f of flies) {
        const x = f.x + Math.sin(t * f.sp + f.ph) * f.ox, y = f.y + Math.cos(t * f.sp * 0.8 + f.ph * 1.3) * f.oy;
        const a = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(t * (0.7 + f.sp) + f.ph), 2);
        g.globalAlpha = a; const R = f.r * 9;
        g.drawImage(glow, x - R, y - R, R * 2, R * 2);
      }
      for (const m of motes) {
        m.life += dt; m.y -= m.vy * dt; if (m.life > m.max) mote(m);
        const u = m.life / m.max; const x = m.x + Math.sin(t * 0.8 + m.ph) * 9;
        g.globalAlpha = Math.sin(Math.PI * u) * 0.95; const R = m.r * 7;
        g.drawImage(glow, x - R, m.y - R, R * 2, R * 2);
      }
      g.globalAlpha = 1;
      raf = on && !document.hidden ? requestAnimationFrame(frame) : 0;
    };
    const io = new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } });
    io.observe(c);
    const vis = () => { if (!document.hidden && on && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    document.addEventListener('visibilitychange', vis);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener('visibilitychange', vis); };
  }, [W, narrow, cw, ch, tree]);

  return <canvas ref={ref} className="land__fx" style={{ width: cw, height: ch }} />;
}
