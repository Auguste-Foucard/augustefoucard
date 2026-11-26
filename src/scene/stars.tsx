import { useEffect, useMemo, useRef } from 'react';
import { rng, smooth, type Pt } from './draw';
import { H, L } from './shared';
import { haptic } from '../lib/feel';
import { chime } from '../lib/chime';
import { Fireworks, randomType } from './fireworks';

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
  const fwc = useRef<HTMLCanvasElement>(null);

  // Interaction : les étoiles s'éveillent près du geste ; on les relie en glissant pour tracer des constellations ;
  // un tap dans le ciel vide fait naître une étoile. Avec le son activé, chaque étoile joue une note.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const NS = 'http://www.w3.org/2000/svg';
    const svg = el.querySelector<SVGSVGElement>('.cons')!;
    const fw = fwc.current && !still ? new Fireworks(fwc.current) : null;
    let hue = 42; // le trait commence doré puis change de couleur au fil du geste
    const col = (h: number, l = 78) => `hsl(${Math.round(h) % 360} 92% ${l}%)`;
    const at = (s: HTMLElement) => { const [sx, sy] = toPx(s); return fw ? fw.local(sx, sy) : [0, 0] as const; };
    let rect = el.getBoundingClientRect();
    const stars = () => Array.from(el.querySelectorAll<HTMLElement>('.jewel'));
    const pos = (s: HTMLElement) => [parseFloat(s.style.left), parseFloat(s.style.top)] as const;
    const toPx = (s: HTMLElement) => { const [x, y] = pos(s); return [rect.left + (x / 100) * rect.width, rect.top + (y / 100) * rect.height] as const; };
    const toPct = (cx: number, cy: number) => [((cx - rect.left) / rect.width) * 100, ((cy - rect.top) / rect.height) * 100] as const;
    const hit = (cx: number, cy: number, r: number, not?: HTMLElement | null) => {
      let best: HTMLElement | null = null, bd = r;
      for (const s of stars()) { if (s === not) continue; const [sx, sy] = toPx(s); const d = Math.hypot(sx - cx, sy - cy); if (d < bd) { bd = d; best = s; } }
      return best;
    };
    const ring = (s: HTMLElement, vel = 1) => {
      s.classList.remove('jewel--flare'); void s.offsetWidth; s.classList.add('jewel--flare');
      const [x, y] = pos(s); chime(y / 100, x / 100, vel); haptic(8);
      if (fw && vel >= 1) { const [lx, ly] = at(s); fw.burst(lx, ly, randomType(), Math.random() * 360, 0.9); }
    };
    const line = (g: Element, a: readonly [number, number], b: readonly [number, number], cls: string, h = hue) => {
      const l = document.createElementNS(NS, 'line');
      l.style.stroke = cls === 'cons__glow' ? `hsl(${Math.round(h) % 360} 90% 65% / .28)` : col(h, cls === 'cons__live' ? 82 : 80);
      l.setAttribute('x1', `${a[0]}%`); l.setAttribute('y1', `${a[1]}%`); l.setAttribute('x2', `${b[0]}%`); l.setAttribute('y2', `${b[1]}%`);
      l.setAttribute('pathLength', '1'); l.setAttribute('class', cls); g.appendChild(l); return l;
    };

    // — éveil à l'approche
    let raf = 0, px = -1e4, py = -1e4;
    const apply = () => {
      raf = 0; rect = el.getBoundingClientRect();
      const R = Math.max(110, Math.min(rect.width, rect.height) * 0.22);
      for (const s of stars()) { const [sx, sy] = toPx(s); const n = Math.max(0, 1 - Math.hypot(sx - px, sy - py) / R); s.style.setProperty('--near', (n * n).toFixed(3)); }
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(apply); };

    // — constellations
    type Thread = { g: SVGGElement; last: HTMLElement; chain: HTMLElement[]; hues: number[]; live: SVGLineElement; lx: number; ly: number };
    let th: Thread | null = null;
    let tap: { x: number; y: number; t: number } | null = null;
    const begin = (s: HTMLElement, cx: number, cy: number) => {
      hue = 42 + Math.random() * 30;
      const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'cons__g'); svg.appendChild(g);
      const live = line(g, pos(s), toPct(cx, cy), 'cons__live');
      th = { g, last: s, chain: [s], hues: [hue], live, lx: cx, ly: cy };
      while (svg.childElementCount > 5) svg.firstElementChild?.remove();
    };
    const link = (s: HTMLElement) => {
      if (!th) return;
      const a = pos(th.last), b = pos(s);
      th.g.insertBefore(line(th.g, a, b, 'cons__glow'), th.live);
      th.g.insertBefore(line(th.g, a, b, 'cons__line'), th.live);
      th.last = s; th.chain.push(s); th.hues.push(hue); ring(s, 0.85);
      if (fw) { const [lx, ly] = at(s); fw.spark(lx, ly, hue); }
    };
    const finish = () => {
      if (!th) return;
      const t = th; th = null; t.live.remove();
      if (t.chain.length < 2) { t.g.remove(); return; }
      // la constellation se rejoue, puis s'efface doucement
      t.g.classList.add('cons__g--done');
      if (t.chain.length >= 3) t.chain.forEach((s, i) => setTimeout(() => { const [x, y] = pos(s); chime(y / 100, x / 100, 0.55); if (fw) { const [lx, ly] = at(s); fw.burst(lx, ly, i === t.chain.length - 1 ? 'chrysanthemum' : randomType(), t.hues[i] ?? hue, i === t.chain.length - 1 ? 1.25 : 0.85); } s.classList.remove('jewel--flare'); void s.offsetWidth; s.classList.add('jewel--flare'); }, 350 + i * 260));
      setTimeout(() => t.g.classList.add('cons__g--fade'), 4200 + t.chain.length * 170);
      setTimeout(() => t.g.remove(), 7600 + t.chain.length * 170);
    };

    const spawn = (cx: number, cy: number) => {
      const born = el.querySelectorAll('.jewel--born');
      if (born.length >= 6) born[0].remove();
      const [x, y] = toPct(cx, cy);
      const j = document.createElement('span');
      j.className = 'jewel jewel--born';
      j.style.left = `${x}%`; j.style.top = `${y}%`;
      j.style.setProperty('--s', (0.8 + Math.random() * 0.5).toFixed(2));
      j.style.setProperty('--c', TINTS[Math.floor(Math.random() * TINTS.length)]);
      j.style.setProperty('--t', `${5 + Math.random() * 3}s`);
      j.innerHTML = '<span class="jewel__n"><i class="jewel__glow"></i><i class="jewel__spk"></i><i class="jewel__spk jewel__spk--d"></i><i class="jewel__core"></i></span>';
      const bloom = () => { el.appendChild(j); chime(y / 100, x / 100, 0.7); haptic(10); window.setTimeout(() => j.remove(), 12000); };
      haptic(4);
      if (fw) { const [lx, ly] = fw.local(cx, cy); fw.rocket(lx, ly, randomType(), Math.random() * 360, 1.1, bloom); } else bloom();
    };

    const down = (e: PointerEvent) => {
      px = e.clientX; py = e.clientY; wake();
      rect = el.getBoundingClientRect();
      if (e.clientY > rect.bottom - rect.height * 0.04 || e.clientY < rect.top) return;
      if ((e.target as Element | null)?.closest?.('a, button, input, textarea, select, label, [role="button"], .header, .menu, .dock')) return;
      const s = hit(e.clientX, e.clientY, e.pointerType === 'mouse' ? 30 : 44);
      if (s) { ring(s); if (!still) begin(s, e.clientX, e.clientY); return; }
      if (!still) tap = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const move = (e: PointerEvent) => {
      px = e.clientX; py = e.clientY; wake();
      if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 12) tap = null;
      if (!th) return;
      rect = el.getBoundingClientRect();
      const p = toPct(e.clientX, e.clientY);
      th.live.setAttribute('x2', `${p[0]}%`); th.live.setAttribute('y2', `${p[1]}%`);
      hue += Math.hypot(e.clientX - th.lx, e.clientY - th.ly) * 0.35; th.lx = e.clientX; th.ly = e.clientY;
      th.live.style.stroke = col(hue, 82);
      const s = hit(e.clientX, e.clientY, e.pointerType === 'mouse' ? 26 : 38, th.last);
      if (s) { link(s); const a = pos(s); th.live.setAttribute('x1', `${a[0]}%`); th.live.setAttribute('y1', `${a[1]}%`); }
    };
    const up = (e: PointerEvent) => {
      if (tap && performance.now() - tap.t < 450 && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 12) spawn(e.clientX, e.clientY);
      tap = null; finish();
    };
    const cancel = () => { tap = null; finish(); };
    const leave = () => { px = py = -1e4; wake(); };
    // pendant un tracé au doigt, on bloque le défilement de la page
    const tmove = (e: TouchEvent) => { if (th && e.cancelable) e.preventDefault(); };
    const onResize = () => { rect = el.getBoundingClientRect(); fw?.resize(); };

    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('pointerup', up, { passive: true });
    window.addEventListener('pointercancel', cancel, { passive: true });
    document.addEventListener('touchmove', tmove, { passive: false });
    document.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf); fw?.destroy();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      document.removeEventListener('touchmove', tmove);
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
          <svg className="cons" aria-hidden="true" />
          {g.jewels.map((j, i) => (
            <span key={i} className="jewel" style={{ left: `${j.x}%`, top: `${j.y}%`, ['--s' as string]: j.s, ['--d' as string]: `${j.d}s`, ['--t' as string]: `${j.t}s`, ['--c' as string]: j.c, ['--rot' as string]: `${j.r}deg` }}>
              <span className="jewel__n"><i className="jewel__glow" /><i className="jewel__spk" /><i className="jewel__spk jewel__spk--d" /><i className="jewel__core" /></span>
            </span>
          ))}
          <span className="shoot2" style={{ left: '8%', top: '10%', ['--a' as string]: '22deg', ['--sd' as string]: '4s', ['--st' as string]: '14s' }}><i /></span>
          <span className="shoot2" style={{ left: '52%', top: '4%', ['--a' as string]: '31deg', ['--sd' as string]: '11s', ['--st' as string]: '21s' }}><i /></span>
        </div>
      </div>
      <canvas ref={fwc} className="fwc" aria-hidden="true" />
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
