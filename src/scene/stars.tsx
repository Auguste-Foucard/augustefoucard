import { useMemo } from 'react';
import { rng, smooth, type Pt } from './draw';
import { H, L } from './shared';

/** Décor « ciel étoilé » : bleu nuit profond, rien que le ciel. */
export function StarScene({ W, narrow }: { W: number; narrow: boolean }) {
  const g = useMemo(() => {
    const r = rng(41);
    const n = narrow ? 420 : 900;
    const mk = (count: number, big: number) => Array.from({ length: count }, () => {
      const band = r() < 0.35;
      const x = r() * (W + 200) - 100;
      const y = band ? 520 - (x - W / 2) * 0.5 + (r() + r() + r() - 1.5) * 150 : r() * 1000;
      const t = r();
      return { x, y, r: 0.35 + Math.pow(r(), 4) * big, o: 0.35 + r() * 0.65, g: Math.floor(r() * 3), c: t < 0.18 ? '#bcd0ff' : t < 0.28 ? '#ffe6c8' : '#f4f7ff' };
    });
    const far = mk(n, 1.1), mid = mk(Math.round(n * 0.3), 2);
    const bright = Array.from({ length: narrow ? 7 : 12 }, () => ({ x: r() * W, y: 60 + r() * 640, r: 1.6 + r() * 1.4, d: r() * 6 }));
    // constellation inventée (aucune figure réelle)
    const cx = W * (narrow ? 0.5 : 0.74), cy = narrow ? 200 : 230, s = narrow ? 0.7 : 1;
    const cons: Pt[] = ([[-150, 30], [-70, -30], [10, 0], [80, -60], [160, -20], [60, 70], [10, 0]] as Pt[]).map(([x, y]) => [cx + x * s, cy + y * s]);
    const hillPts: Pt[] = [[-80, 965], [W * 0.18, 940], [W * 0.38, 962], [W * 0.6, 948], [W * 0.82, 968], [W + 80, 945]];
    return { far, mid, bright, cons, hill: smooth(hillPts), hillFill: `${smooth(hillPts)}L${W + 80} 1100L-80 1100Z` };
  }, [W, narrow]);
  const vb = `0 0 ${W} ${H}`;
  const grp = (arr: typeof g.far) => [0, 1, 2].map((gi) => (
    <g key={gi} className={`twk twk--${gi}`}>
      {arr.filter((s) => s.g === gi).map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.c} opacity={s.o} />)}
    </g>
  ));
  return (
    <>
      <svg className="land__defs" width="1" height="1" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#01030b" /><stop offset=".55" stopColor="#030a22" /><stop offset="1" stopColor="#0a1c4e" /></linearGradient>
          <radialGradient id="st-neb"><stop offset="0" stopColor="#5a7cff" stopOpacity=".34" /><stop offset=".5" stopColor="#2a48c0" stopOpacity=".14" /><stop offset="1" stopColor="#1a2a80" stopOpacity="0" /></radialGradient>
          <radialGradient id="st-neb2"><stop offset="0" stopColor="#8a9cff" stopOpacity=".22" /><stop offset="1" stopColor="#3a3aa0" stopOpacity="0" /></radialGradient>
          <radialGradient id="st-glow"><stop offset="0" stopColor="#ffffff" stopOpacity=".9" /><stop offset=".25" stopColor="#a8c0ff" stopOpacity=".35" /><stop offset="1" stopColor="#6a8cff" stopOpacity="0" /></radialGradient>
          <linearGradient id="st-shoot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity=".95" /></linearGradient>
          <linearGradient id="st-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a56c8" stopOpacity="0" /><stop offset="1" stopColor="#2a56c8" stopOpacity=".38" /></linearGradient>
          <filter id="st-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="46" /></filter>
        </defs>
      </svg>
      <div className="land__layer" style={L(1.5)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <rect x="-300" y="-300" width={W + 600} height="1600" fill="url(#st-sky)" />
          <g filter="url(#st-blur)" className="aur aur--b">
            <g transform={`rotate(-27 ${W / 2} 520)`}>
              <ellipse cx={W / 2} cy="520" rx={W * 0.75} ry="150" fill="url(#st-neb)" />
              <ellipse cx={W * 0.36} cy="540" rx={W * 0.3} ry="70" fill="url(#st-neb2)" />
              <ellipse cx={W * 0.6} cy="505" rx={W * 0.22} ry="26" fill="#01030b" opacity=".5" />
            </g>
          </g>
          {grp(g.far)}
        </svg>
      </div>
      <div className="land__layer" style={L(5)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          {grp(g.mid)}
          <path d={`M${g.cons.map((p) => p.join(' ')).join('L')}`} fill="none" stroke="#bcd0ff" strokeOpacity=".22" strokeWidth="1" />
          {g.cons.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.2" fill="#fff" />)}
        </svg>
      </div>
      <div className="land__layer" style={L(9)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          {g.bright.map((b, i) => (
            <g key={i} className="glint" style={{ animationDelay: `${b.d}s` }}>
              <circle cx={b.x} cy={b.y} r={b.r * 9} fill="url(#st-glow)" opacity=".7" />
              <path d={`M${b.x - b.r * 7} ${b.y}H${b.x + b.r * 7}M${b.x} ${b.y - b.r * 7}V${b.y + b.r * 7}`} stroke="#fff" strokeOpacity=".55" strokeWidth=".7" />
              <circle cx={b.x} cy={b.y} r={b.r} fill="#fff" />
            </g>
          ))}
          <g transform={`translate(${W * 0.2} 150) rotate(24)`}><rect className="shoot shoot--a" x="0" y="-1" width="170" height="2" rx="1" fill="url(#st-shoot)" /></g>
          <g transform={`translate(${W * 0.55} 90) rotate(32)`}><rect className="shoot shoot--b" x="0" y="-1" width="130" height="2" rx="1" fill="url(#st-shoot)" /></g>
        </svg>
      </div>
      <div className="land__layer" style={L(22)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <rect x="-200" y="700" width={W + 400} height="300" fill="url(#st-hz)" />
          <path d={g.hillFill} fill="#010409" />
          <path d={g.hill} fill="none" stroke="#6a8cff" strokeOpacity=".25" strokeWidth="1.5" />
        </svg>
      </div>
    </>
  );
}
