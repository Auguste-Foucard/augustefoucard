import { useEffect, useMemo, useRef } from 'react';
import { rng, smooth, type Pt } from './draw';
import { H, L } from './shared';
import { haptic } from '../lib/feel';

type Jewel = { x: number; y: number; s: number; d: number; t: number; c: string; r: number };
const TINTS = ['#ffffff', '#dfe8ff', '#cfdcff', '#fff1d6', '#ffe6c2', '#e8f0ff'];

/** Décor « ciel étoilé » : nuit profonde, beaucoup d'espace, quelques étoiles qui scintillent et répondent au geste. */
export function StarScene({ W, narrow }: { W: number; narrow: boolean }) {
  const g = useMemo(() => {
    const r = rng(73);
    // fines poussières d'étoiles, immobiles et discrètes
    const dust = Array.from({ length: narrow ? 70 : 150 }, () => ({ x: r() * W, y: r() * 900, r: 0.3 + Math.pow(r(), 3) * 0.9, o: 0.15 + r() * 0.4, g: Math.floor(r() * 3) }));
    // étoiles « bijoux » : on laisse le centre libre pour que le texte respire
    const jewels: Jewel[] = [];
    const want = narrow ? 11 : 17;
    let guard = 0;
    while (jewels.length < want && guard++ < 2000) {
      const x = 4 + r() * 92, y = 5 + r() * 78;
      const inCenter = narrow ? y > 24 && y < 70 && x > 6 && x < 94 : x > 20 && x < 80 && y > 26 && y < 70;
      if (inCenter) continue;
      if (jewels.some((j) => Math.hypot((j.x - x) * (narrow ? 0.5 : 1), j.y - y) < (narrow ? 9 : 11))) continue;
      const big = r();
      jewels.push({ x, y, s: big > 0.8 ? 1.35 : big > 0.45 ? 1 : 0.7, d: -r() * 9, t: 4.5 + r() * 5.5, c: TINTS[Math.floor(r() * TINTS.length)], r: Math.round(r() * 40 - 20) });
    }
    const hillPts: Pt[] = [[-80, 968], [W * 0.2, 948], [W * 0.42, 966], [W * 0.63, 952], [W * 0.84, 970], [W + 80, 950]];
    return { dust, jewels, hill: smooth(hillPts), hillFill: `${smooth(hillPts)}L${W + 80} 1100L-80 1100Z` };
  }, [W, narrow]);

  const box = useRef<HTMLDivElement>(null);

  // Interaction : les étoiles proches du doigt / de la souris s'éveillent ; un tap dans le ciel en fait naître une.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rect = el.getBoundingClientRect();
    const stars = () => Array.from(el.querySelectorAll<HTMLElement>('.jewel'));
    const onResize = () => { rect = el.getBoundingClientRect(); };
    let raf = 0, px = -1e4, py = -1e4;
    const apply = () => {
      raf = 0;
      const R = Math.max(110, Math.min(rect.width, rect.height) * 0.22);
      for (const s of stars()) {
        const sx = rect.left + (parseFloat(s.style.left) / 100) * rect.width;
        const sy = rect.top + (parseFloat(s.style.top) / 100) * rect.height;
        const n = Math.max(0, 1 - Math.hypot(sx - px, sy - py) / R);
        s.style.setProperty('--near', (n * n).toFixed(3));
      }
    };
    const move = (e: PointerEvent) => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(apply); };
    const leave = () => { px = py = -1e4; if (!raf) raf = requestAnimationFrame(apply); };
    const down = (e: PointerEvent) => {
      rect = el.getBoundingClientRect();
      if (e.clientY > rect.bottom || e.clientY < rect.top) return;
      if ((e.target as Element | null)?.closest?.('a, button, input, textarea, select, label, [role="button"], .header, .menu')) return;
      // une étoile touchée s'embrase
      for (const s of stars()) {
        const sx = rect.left + (parseFloat(s.style.left) / 100) * rect.width;
        const sy = rect.top + (parseFloat(s.style.top) / 100) * rect.height;
        if (Math.hypot(sx - e.clientX, sy - e.clientY) < 44) {
          s.classList.remove('jewel--flare'); void s.offsetWidth; s.classList.add('jewel--flare'); haptic(10); return;
        }
      }
      if (still) return;
      // sinon, une nouvelle étoile éclot là où l'on a touché, puis s'efface doucement
      const born = el.querySelectorAll('.jewel--born');
      if (born.length >= 6) born[0].remove();
      const j = document.createElement('span');
      j.className = 'jewel jewel--born';
      j.style.left = `${((e.clientX - rect.left) / rect.width) * 100}%`;
      j.style.top = `${((e.clientY - rect.top) / rect.height) * 100}%`;
      j.style.setProperty('--s', (0.8 + Math.random() * 0.5).toFixed(2));
      j.style.setProperty('--c', TINTS[Math.floor(Math.random() * TINTS.length)]);
      j.style.setProperty('--t', `${5 + Math.random() * 3}s`);
      j.innerHTML = '<span class="jewel__n"><i class="jewel__glow"></i><i class="jewel__spk"></i><i class="jewel__spk jewel__spk--d"></i><i class="jewel__core"></i></span>';
      el.appendChild(j);
      haptic(6);
      window.setTimeout(() => j.remove(), 9000);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, { passive: true });
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', move, { passive: true });
    window.addEventListener('pointerdown', down, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', move);
      window.removeEventListener('pointerdown', down);
      document.removeEventListener('pointerleave', leave);
    };
  }, [g]);

  const vb = `0 0 ${W} ${H}`;
  return (
    <>
      <svg className="land__defs" width="1" height="1" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000107" /><stop offset=".6" stopColor="#020617" /><stop offset="1" stopColor="#061237" /></linearGradient>
          <radialGradient id="st-neb"><stop offset="0" stopColor="#4a66e0" stopOpacity=".16" /><stop offset=".55" stopColor="#2a3ca0" stopOpacity=".06" /><stop offset="1" stopColor="#1a2a80" stopOpacity="0" /></radialGradient>
          <linearGradient id="st-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f44b0" stopOpacity="0" /><stop offset="1" stopColor="#1f44b0" stopOpacity=".22" /></linearGradient>
          <filter id="st-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60" /></filter>
        </defs>
      </svg>
      <div className="land__layer" style={L(1.5)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <rect x="-300" y="-300" width={W + 600} height="1600" fill="url(#st-sky)" />
          <g filter="url(#st-blur)" transform={`rotate(-24 ${W / 2} 520)`}>
            <ellipse cx={W * 0.55} cy="520" rx={W * 0.6} ry="130" fill="url(#st-neb)" />
          </g>
          {[0, 1, 2].map((gi) => (
            <g key={gi} className={`twk twk--${gi}`}>
              {g.dust.filter((s) => s.g === gi).map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#eef2ff" opacity={s.o} />)}
            </g>
          ))}
        </svg>
      </div>
      <div className="land__layer" style={L(6)}>
        <div ref={box} className="jewels">
          {g.jewels.map((j, i) => (
            <span key={i} className="jewel" style={{ left: `${j.x}%`, top: `${j.y}%`, ['--s' as string]: j.s, ['--d' as string]: `${j.d}s`, ['--t' as string]: `${j.t}s`, ['--c' as string]: j.c, ['--rot' as string]: `${j.r}deg` }}>
              <span className="jewel__n"><i className="jewel__glow" /><i className="jewel__spk" /><i className="jewel__spk jewel__spk--d" /><i className="jewel__core" /></span>
            </span>
          ))}
          <span className="shoot2" style={{ left: '8%', top: '10%', ['--a' as string]: '22deg', ['--sd' as string]: '4s', ['--st' as string]: '14s' }}><i /></span>
          <span className="shoot2" style={{ left: '52%', top: '4%', ['--a' as string]: '31deg', ['--sd' as string]: '11s', ['--st' as string]: '21s' }}><i /></span>
        </div>
      </div>
      <div className="land__layer" style={L(22)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <rect x="-200" y="760" width={W + 400} height="240" fill="url(#st-hz)" />
          <path d={g.hillFill} fill="#000207" />
          <path d={g.hill} fill="none" stroke="#7a96ff" strokeOpacity=".18" strokeWidth="1.4" />
        </svg>
      </div>
    </>
  );
}
