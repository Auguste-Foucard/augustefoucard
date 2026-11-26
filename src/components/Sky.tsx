import { LITE } from '../lib/feel';
import { useEffect, useRef } from 'react';
import { bus, sky } from '../lib/sky';

/**
 * Ciel nocturne — un canvas fixe derrière tout le site, volontairement sobre :
 *  - étoiles fines, naturelles, qui scintillent lentement (plus denses en haut, effacées vers l'horizon)
 *  - très rares étoiles filantes
 *  - voile bleu nuit très doux, parallaxe légère
 * La lune et l'horizon sont des éléments SVG/CSS (voir <Sky/> plus bas).
 * Performances : 3 paliers choisis selon l'appareil, abaissés si la fluidité chute.
 * Image fixe si « réduire les animations ». Pause quand l'onglet est caché.
 */

type Star = { x: number; y: number; r: number; b: number; sp: number; ph: number; d: number; c: number; big: boolean };
type Mote = { x: number; y: number; r: number; a: number; vx: number; vy: number; ph: number; d: number };
type Shoot = { x: number; y: number; vx: number; vy: number; t: number; dur: number; len: number };

const TIERS = [
  { stars: 220, motes: 0, shoot: false, dpr: 1 },
  { stars: 340, motes: 0, shoot: true, dpr: 1.25 },
  { stars: 460, motes: 0, shoot: true, dpr: 1.5 },
];
const COLORS = ['226,232,255', '190,208,255', '255,240,228', '206,216,255'];

function rand(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function pickTier(): number {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const cores = nav.hardwareConcurrency || 4;
  const mem = nav.deviceMemory || 4;
  if (nav.connection?.saveData) return 0;
  if (coarse) return cores >= 6 && mem >= 4 ? 1 : 0;
  return cores >= 8 && mem >= 8 ? 2 : 1;
}

function sprite(size: number, rgb: string, core = 0.9) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, `rgba(${rgb},${core})`);
  gr.addColorStop(0.25, `rgba(${rgb},${core * 0.35})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return c;
}

export function Sky() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let tier = reduce ? 1 : LITE ? 0 : pickTier();
    let W = 0, H = 0, dpr = 1;
    let raf = 0, running = false;
    let last = performance.now();
    let scrollY = window.scrollY;
    let px = 0, py = 0, tx = 0, ty = 0;
    let slow = 0, frames = 0, acc = 0;
    let nextShoot = performance.now() + 20000;
    let shoot: Shoot | null = null;
    const tint: [number, number, number] = [...sky.tintTarget] as [number, number, number];
    let boost = 0;

    const r = rand(20261125);
    const stars: Star[] = Array.from({ length: TIERS[2].stars }, () => {
      const k = r();
      const big = k > 0.992;
      return {
        x: r(), y: Math.pow(r(), 1.35) * 0.86,
        r: big ? 1.1 + r() * 0.7 : 0.4 + Math.pow(r(), 2.6) * 0.75,
        b: 0.34 + Math.pow(r(), 1.4) * 0.66,
        sp: 0.12 + r() * 0.5, ph: r() * 6.28,
        d: [0.25, 0.55, 1][Math.floor(r() * 3)],
        c: r() < 0.55 ? 0 : r() < 0.6 ? 1 : r() < 0.85 ? 3 : 2,
        big,
      };
    });
    const motes: Mote[] = Array.from({ length: TIERS[2].motes }, () => ({
      x: r(), y: r(), r: 1 + r() * 2.2, a: 0.1 + r() * 0.22,
      vx: (r() - 0.5) * 0.004, vy: -0.002 - r() * 0.005, ph: r() * 6.28, d: 0.4 + r() * 0.8,
    }));
    const glow = COLORS.map((c) => sprite(64, c));
    const moteSprite = sprite(48, '215,205,255', 1);

    // Nébuleuses : pré-rendues à basse résolution, redessinées seulement quand la teinte change.
    const neb = document.createElement('canvas');
    neb.width = 360; neb.height = 360;
    const nctx = neb.getContext('2d')!;
    const drawNebula = () => {
      const R = Math.round(34 + tint[0] * 0.12), G = Math.round(58 + tint[1] * 0.1), B = Math.round(130 + tint[2] * 0.12);
      nctx.clearRect(0, 0, 360, 360);
      const blob = (x: number, y: number, rad: number, rgb: string, a: number) => {
        const gr = nctx.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, `rgba(${rgb},${a})`);
        gr.addColorStop(0.5, `rgba(${rgb},${a * 0.35})`);
        gr.addColorStop(1, `rgba(${rgb},0)`);
        nctx.fillStyle = gr;
        nctx.fillRect(0, 0, 360, 360);
      };
      blob(120, 80, 220, `${R},${G},${B}`, 0.13);
      blob(280, 200, 170, '26,48,120', 0.11);
    };
    drawNebula();

    const resize = (force = false) => {
      const w = document.documentElement.clientWidth;
      const h = window.innerHeight;
      // Sur mobile la barre d'adresse fait varier la hauteur : on ignore les petits écarts.
      if (!force && Math.abs(w - W) < 2 && Math.abs(h - H) < 140) return;
      W = w; H = Math.max(h, Math.round(h * 1.0));
      dpr = Math.min(window.devicePixelRatio || 1, TIERS[tier].dpr);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      if (!running) draw(performance.now(), true);
    };

    const onScroll = () => { scrollY = window.scrollY; };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    };
    const onTint = () => { if (!running) { for (let i = 0; i < 3; i++) tint[i] = sky.tintTarget[i]; drawNebula(); draw(performance.now(), true); } };

    function spawnShoot(now: number) {
      const ang = (18 + Math.random() * 22) * (Math.PI / 180);
      const dir = Math.random() < 0.5 ? 1 : -1;
      const sp = 150 + Math.random() * 120;
      shoot = {
        x: dir === 1 ? Math.random() * W * 0.5 : W * 0.5 + Math.random() * W * 0.5,
        y: Math.random() * H * 0.45,
        vx: Math.cos(ang) * sp * dir, vy: Math.sin(ang) * sp,
        t: 0, dur: 1.9 + Math.random() * 0.9, len: 110 + Math.random() * 100,
      };
      nextShoot = now + (sky.contemplative ? 9000 + Math.random() * 9000 : 38000 + Math.random() * 32000);
    }

    function draw(now: number, still = false) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = still ? 0 : now / 1000;
      const T = TIERS[tier];
      const energy = still ? 0 : sky.energy;
      boost += ((sky.contemplative ? 1 : 0) - boost) * Math.min(1, dt * 1.5);

      // teinte → cible (≈1,5 s)
      let moved = false;
      for (let i = 0; i < 3; i++) {
        const d = sky.tintTarget[i] - tint[i];
        if (Math.abs(d) > 0.5) { tint[i] += d * Math.min(1, dt * 2.2); moved = true; }
      }
      if (moved) drawNebula();

      px += (tx - px) * Math.min(1, dt * 2.5);
      py += (ty - py) * Math.min(1, dt * 2.5);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // nébuleuses (parallaxe lente)
      const nebA = 0.7 + energy * 0.35 + boost * 0.3;
      ctx.globalAlpha = Math.min(1, nebA);
      const ns = Math.max(W, H) * 1.5;
      ctx.drawImage(neb, -ns * 0.2 + px * -26 , -ns * 0.25 - scrollY * 0.03 + py * -18, ns, ns);
      ctx.globalAlpha = 1;

      // étoiles
      const n = Math.min(stars.length, T.stars + Math.round(boost * 90 * (tier > 0 ? 1 : 0)));
      for (let i = 0; i < n; i++) {
        const s = stars[i];
        const ox = px * 16 * s.d;
        const oy = -(scrollY * 0.06 + py * 12) * s.d;
        const x = (((s.x * W + ox) % W) + W) % W;
        const y = (((s.y * H + oy) % H) + H) % H;
        const tw = still ? 1 : 0.62 + 0.38 * Math.sin(t * s.sp * (1 + energy * 0.8) + s.ph);
        const hz = Math.max(0, Math.min(1, (0.82 - y / H) / 0.22));
        const a = Math.min(1, s.b * tw * hz * (1 + energy * 0.35 + boost * 0.25));
        if (s.big) {
          const sz = s.r * 9;
          ctx.globalAlpha = a * 0.9;
          ctx.drawImage(glow[s.c], x - sz, y - sz, sz * 2, sz * 2);
          ctx.globalAlpha = Math.min(1, a + 0.15);
          ctx.fillStyle = `rgb(${COLORS[s.c]})`;
          ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
        } else {
          ctx.globalAlpha = a;
          ctx.fillStyle = `rgb(${COLORS[s.c]})`;
          ctx.fillRect(x, y, s.r, s.r);
        }
      }

      // particules lumineuses
      if (T.motes && !still) {
        for (let i = 0; i < T.motes; i++) {
          const m = motes[i];
          m.x += (m.vx + Math.sin(t * 0.4 + m.ph) * 0.0009) * dt * 12;
          m.y += m.vy * dt * 12;
          if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); }
          if (m.x < -0.05) m.x = 1.05; else if (m.x > 1.05) m.x = -0.05;
          const x = m.x * W + px * 30 * m.d;
          const y = m.y * H - scrollY * 0.12 * m.d;
          const yy = (((y % H) + H) % H);
          const pulse = 0.6 + 0.4 * Math.sin(t * 0.8 + m.ph);
          ctx.globalAlpha = m.a * pulse * (1 + energy * 0.9);
          const sz = m.r * 5;
          ctx.drawImage(moteSprite, x - sz, yy - sz, sz * 2, sz * 2);
        }
      }

      // étoile filante
      if (T.shoot && !still) {
        if (!shoot && now > nextShoot) spawnShoot(now);
        if (shoot) {
          shoot.t += dt;
          const k = shoot.t / shoot.dur;
          if (k >= 1) shoot = null;
          else {
            const e = Math.sin(Math.PI * k);
            const hx = shoot.x + shoot.vx * shoot.t, hy = shoot.y + shoot.vy * shoot.t;
            const L = shoot.len * (0.4 + 0.6 * e);
            const sp = Math.hypot(shoot.vx, shoot.vy);
            const tx2 = hx - (shoot.vx / sp) * L, ty2 = hy - (shoot.vy / sp) * L;
            const g = ctx.createLinearGradient(hx, hy, tx2, ty2);
            g.addColorStop(0, `rgba(240,236,255,${0.85 * e})`);
            g.addColorStop(1, 'rgba(180,170,255,0)');
            ctx.globalAlpha = 1;
            ctx.strokeStyle = g; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx2, ty2); ctx.stroke();
            ctx.globalAlpha = 0.7 * e;
            ctx.drawImage(glow[0], hx - 9, hy - 9, 18, 18);
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    // Boucle + auto-adaptation
    const loop = (now: number) => {
      if (!running) return;
      const dt = now - last;
      draw(now);
      acc += dt; frames++;
      if (frames >= 90) {
        const avg = acc / frames;
        if (avg > 24 && tier > 0) {
          slow++;
          if (slow >= 1) { tier--; slow = 0; resize(true); }
        } else slow = 0;
        acc = 0; frames = 0;
      }
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (running || reduce || LITE) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    const onVis = () => (document.hidden ? stop() : start());

    resize(true);
    if (reduce || LITE) draw(performance.now(), true); else start();
    window.addEventListener('resize', () => resize());
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('af-sky-tint', onTint);
    document.addEventListener('visibilitychange', onVis);
    if (reduce) window.addEventListener('scroll', () => draw(performance.now(), true), { passive: true });
    void bus;
    return () => {
      stop();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('af-sky-tint', onTint);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div className="sky" aria-hidden="true">
      <canvas ref={ref} />
      <div className="sky__moon" />
      <svg className="sky__horizon" viewBox="0 0 1440 360" preserveAspectRatio="none" focusable="false">
        <defs>
          <linearGradient id="hz-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a2a58" /><stop offset="1" stopColor="#0b1331" /></linearGradient>
          <linearGradient id="hz-mid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0d1633" /><stop offset="1" stopColor="#060a1c" /></linearGradient>
          <linearGradient id="hz-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#060a18" /><stop offset="1" stopColor="#03050d" /></linearGradient>
          <linearGradient id="hz-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6f8ad8" stopOpacity="0" /><stop offset="0.55" stopColor="#6f8ad8" stopOpacity="0.16" /><stop offset="1" stopColor="#6f8ad8" stopOpacity="0" /></linearGradient>
        </defs>
        <path d="M0 210 C120 170 230 150 340 180 C450 208 520 160 640 142 C760 124 840 176 960 186 C1080 196 1180 150 1290 160 C1360 166 1410 182 1440 176 V360 H0Z" fill="url(#hz-far)" />
        <rect x="0" y="170" width="1440" height="90" fill="url(#hz-mist)" />
        <path d="M0 262 C140 232 260 226 380 250 C500 274 600 236 740 228 C880 220 980 262 1110 256 C1240 250 1340 226 1440 240 V360 H0Z" fill="url(#hz-mid)" />
        <path d="M0 312 C160 292 300 290 440 306 C580 322 700 296 840 292 C980 288 1100 316 1240 312 C1330 310 1390 300 1440 302 V360 H0Z" fill="url(#hz-near)" />
      </svg>
    </div>
  );
}
