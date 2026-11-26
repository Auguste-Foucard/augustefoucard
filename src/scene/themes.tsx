import { useMemo, type ReactNode } from 'react';
import { Cloud, Gate, rng, ridgePath, ridgePts, smooth, type Pt } from './draw';
import { Defs, H, L, MOON_PAL, WATER, type Pal } from './shared';

export type Theme = 'moon' | 'aurora' | 'milkyway' | 'sunrise';
export const THEMES: Theme[] = ['moon', 'aurora', 'milkyway', 'sunrise'];

type Cfg = { pal: Pal; sky: [string, string, string]; water: boolean; aurora: number; milky: boolean; sun: boolean; pines: boolean; rim: string; seed: number };

const CFG: Record<Exclude<Theme, 'moon'>, Cfg> = {
  aurora: {
    pal: { ...MOON_PAL, glow: ['#2fbfa0', '#14566e'], haze: '#7fd6e6', clLit: ['#a8e8e8', '#3f7f9a', '#12304a'], clDark: ['#4f8aa8', '#143450', '#07162a'], clMist: ['#9fe0e8', '#4f8fa8'],
      m1: ['#8fb4d4', '#365a80', '#183050'], m2: ['#5e86ae', '#1a3358'], m3: ['#1c3758', '#0a1830'], lake: ['#2e6a84', '#183f5e', '#081528'], fg: ['#0c1c30', '#08121f', '#040a14'], aur: ['#5fe0c4', '#8f8cff', '#b48cff', '#7dffc8'] },
    sky: ['#020a1a', '#093048', '#15506a'], water: true, aurora: 1, milky: false, sun: false, pines: true, rim: '#d6f4ff', seed: 5,
  },
  milkyway: {
    pal: { ...MOON_PAL, glow: ['#8a4aa0', '#3a1f6a'], haze: '#d08aa0', clLit: ['#d6a8d0', '#6a3f8a', '#2a1650'], clDark: ['#6a4a8a', '#2a1650', '#120a30'], clMist: ['#d6a0c0', '#7a4a8a'],
      m1: ['#8a5a8e', '#4a2a6a', '#2a1a50'], m2: ['#6a3f78', '#2a1a50'], m3: ['#2e1c52', '#120a30'], lake: ['#4a2f58', '#25163f', '#0e0826'], fg: ['#1a1030', '#0e0a22', '#07051a'], aur: ['#9a7aff', '#ff9ad0', '#7ad0ff', '#ffd88a'] },
    sky: ['#070718', '#1b1040', '#5a2a56'], water: false, aurora: 0.25, milky: true, sun: false, pines: false, rim: '#ffcfa0', seed: 9,
  },
  sunrise: {
    pal: { ...MOON_PAL, glow: ['#e0784a', '#7a2f60'], haze: '#ffb888', clLit: ['#ffd2a8', '#c0607a', '#3a1c5a'], clDark: ['#a0507a', '#3a1c5a', '#160c36'], clMist: ['#ffc8a0', '#b0587a'],
      m1: ['#c06a7e', '#6a3a78', '#341f5e'], m2: ['#8a4a7e', '#341f5e'], m3: ['#2e1c52', '#120a30'], lake: ['#d8804e', '#7a3868', '#1c1034'], fg: ['#1c1034', '#0e0a24', '#060418'], aur: ['#ffb070', '#ff7aa0', '#ffd88a', '#ffe0a0'] },
    sky: ['#1a1444', '#6a2f70', '#f08a58'], water: true, aurora: 0, milky: false, sun: true, pines: false, rim: '#ffe0b8', seed: 13,
  },
};

const pine = (x: number, y: number, h: number) => {
  const tiers = 7, w = h * 0.26;
  const L: string[] = [], R: string[] = [];
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers, t1 = (i + 0.95) / tiers;
    const ty0 = y - h + t0 * h * 0.94, ty1 = y - h + t1 * h * 0.94;
    const tw = w * (0.18 + 0.82 * t1);
    L.push(`${x - tw * 0.45} ${ty0 + (ty1 - ty0) * 0.2}`, `${x - tw} ${ty1}`, `${x - tw * 0.35} ${ty1 - h * 0.012}`);
    R.unshift(`${x + tw * 0.35} ${ty1 - h * 0.012}`, `${x + tw} ${ty1}`, `${x + tw * 0.45} ${ty0 + (ty1 - ty0) * 0.2}`);
  }
  return `M${x} ${y - h}L${L.join('L')}L${x - 4} ${y}L${x + 4} ${y}L${R.join('L')}Z`;
};

export function AltScene({ theme, W, narrow }: { theme: Exclude<Theme, 'moon'>; W: number; narrow: boolean }) {
  const cfg = CFG[theme];
  const g = useMemo(() => {
    const r = rng(cfg.seed);
    const castleX = W * (narrow ? 0.8 : 0.835), gateS = narrow ? 1.15 : 1.7, hillTop = WATER - 26;
    const flat = !cfg.water;
    const m1p = ridgePts(cfg.seed, W, flat ? 640 : 600, flat ? 70 : 150, flat ? 1.5 : 1);
    const m2p = ridgePts(cfg.seed + 6, W, flat ? 676 : 665, flat ? 50 : 92, flat ? 1.2 : 0.8);
    const m3p = ridgePts(cfg.seed + 18, W, 690, flat ? 60 : 190, 1.1, (x) => (flat ? 1 : Math.max(0.12, 1 - x / (W * (narrow ? 1.05 : 0.7)))));
    const hill = `M${castleX - 230} ${WATER + 6}C${castleX - 170} ${WATER - 2} ${castleX - 110} ${WATER - 22} ${castleX - 50} ${WATER - 27}C${castleX - 10} ${WATER - 30} ${castleX + 20} ${WATER - 30} ${castleX + 56} ${WATER - 26}C${castleX + 110} ${WATER - 20} ${castleX + 170} ${WATER - 2} ${castleX + 240} ${WATER + 6}L${castleX + 240} ${WATER + 30}L${castleX - 230} ${WATER + 30}Z`;
    const stars = Array.from({ length: (cfg.milky ? 520 : 170) * (narrow ? 0.55 : 1) }, () => {
      const band = cfg.milky && r() < 0.62;
      const t = r(), n = (r() + r() + r() - 1.5) * 90;
      const x = band ? W * (t * 1.3 - 0.15) : r() * W;
      const y = band ? 330 - (x - W / 2) * 0.42 + n : r() * 560;
      return { x, y, r: 0.4 + Math.pow(r(), 3) * (band ? 1.2 : 1.8), o: 0.3 + r() * 0.7, g: Math.floor(r() * 3), warm: r() < 0.3 };
    });
    // rayons d'aurore
    const rays: { x: number; y: number; h: number; w: number; o: number }[] = [];
    if (cfg.aurora) for (let b = 0; b < 3; b++) {
      for (let x = -40; x < W + 40; x += 11) {
        const base = 300 + b * 70 + Math.sin(x / 190 + b * 2) * 55 + Math.sin(x / 71 + b) * 14;
        rays.push({ x, y: base, h: 120 + Math.abs(Math.sin(x / 83 + b * 3)) * 190 + r() * 50, w: 9 + r() * 4, o: (0.5 - b * 0.12) * (0.5 + 0.5 * Math.sin(x / 130 + b)) });
      }
    }
    const sunX = W * (narrow ? 0.56 : 0.64), sunY = 560, sunR = narrow ? 64 : 84;
    const rr = rng(8);
    const refl = Array.from({ length: 15 }, (_, i) => ({ y: WATER + 22 + i * 17.5, w: 26 + i * 9 + rr() * 22, h: 2.6 + i * 0.28, d: rr() * 5, o: 0.7 - i * 0.034 }));
    const stones = Array.from({ length: 9 }, (_, i) => { const t = i / 8; return { x: castleX - 70 - Math.pow(1 - t, 1.5) * 420 * (narrow ? 0.6 : 1), y: WATER + 86 - t * 66, o: 0.9 - t * 0.35, w: 36 - t * 26 }; });
    // premier plan
    const fgPts: Pt[] = [[-80, 790], [130, 772], [320, 802], [500, 850], [680, 905], [860, 960], [1010, 1020]];
    const fgTop = (x: number) => { for (let i = 0; i < fgPts.length - 1; i++) if (x >= fgPts[i][0] && x <= fgPts[i + 1][0]) { const t = (x - fgPts[i][0]) / (fgPts[i + 1][0] - fgPts[i][0]); return fgPts[i][1] + t * (fgPts[i + 1][1] - fgPts[i][1]); } return 1100; };
    const fg = `${smooth(fgPts)}L1010 1100L-80 1100Z`;
    const fgR: Pt[] = [[W + 90, 900], [W - 150, 915], [W - 380, 955], [W - 560, 1010]];
    const fgRight = `${smooth(fgR)}L${W - 560} 1100L${W + 90} 1100Z`;
    const blades = Array.from({ length: narrow ? 60 : 110 }, () => { const x = -40 + r() * 760, y = fgTop(x) + 6, hg = 14 + r() * 30, lean = (r() - 0.5) * 14; return `M${x.toFixed(0)} ${y.toFixed(0)}q${(lean / 2).toFixed(1)} ${(-hg * 0.6).toFixed(1)} ${lean.toFixed(1)} ${(-hg).toFixed(1)}q${(2 + r() * 3).toFixed(1)} ${(hg * 0.5).toFixed(1)} 6 ${hg.toFixed(1)}Z`; }).join('');
    const flowers = Array.from({ length: narrow ? 6 : 11 }, (_, i) => { const x = 20 + r() * 560; return { x, y: fgTop(x) - 8 - r() * 22, c: i % 3 === 0 ? '#ffae4a' : '#ffd860', r: 3 + r() * 3.2, d: r() * 5 }; });
    const pines: string[] = [];
    if (cfg.pines) {
      const s = narrow ? 0.62 : 1;
      [[40, 1000, 560], [150, 1010, 430], [-30, 1010, 640], [250, 1000, 340], [W - 90, 1010, 470], [W - 210, 1015, 330], [W + 20, 1010, 600]].forEach(([x, y, h]) => pines.push(pine(x, y, h * s)));
    }
    return { castleX, gateS, hillTop, m1p, m2p, m3p, m1: ridgePath(m1p, 760), m2: ridgePath(m2p, 760), m3: ridgePath(m3p, 760), m1r: smooth(m1p), m2r: smooth(m2p), m3r: smooth(m3p), hill, stars, rays, sunX, sunY, sunR, refl, stones, fg, fgRight, blades, flowers, pines };
  }, [cfg, W, narrow]);

  const vb = `0 0 ${W} ${H}`;
  const flat = !cfg.water;
  const floor = `M-200 ${WATER - 20}L${W + 200} ${WATER - 20}L${W + 200} 1100L-200 1100Z`;
  const gx = g.castleX;
  const reflect = (ch: ReactNode) => <g transform={`translate(0 ${WATER * 2}) scale(1 -1)`}>{ch}</g>;

  return (
    <>
      <Defs pal={cfg.pal} />
      <svg className="land__defs" width="1" height="1" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="skybg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={cfg.sky[0]} /><stop offset=".6" stopColor={cfg.sky[1]} /><stop offset="1" stopColor={cfg.sky[2]} /></linearGradient>
          <linearGradient id="aur-ray" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={cfg.pal.aur[0]} stopOpacity=".85" /><stop offset=".5" stopColor={cfg.pal.aur[1]} stopOpacity=".35" /><stop offset="1" stopColor={cfg.pal.aur[2]} stopOpacity="0" /></linearGradient>
          <radialGradient id="mw"><stop offset="0" stopColor="#ffe6dc" stopOpacity=".5" /><stop offset=".45" stopColor="#d8a8e8" stopOpacity=".2" /><stop offset="1" stopColor="#8a6ad0" stopOpacity="0" /></radialGradient>
          <radialGradient id="sun-disc" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fffbe8" /><stop offset=".7" stopColor="#ffe0a0" /><stop offset="1" stopColor="#ffb870" /></radialGradient>
          <radialGradient id="sun-halo"><stop offset="0" stopColor="#ffd08a" stopOpacity=".9" /><stop offset=".3" stopColor="#ff9a6a" stopOpacity=".4" /><stop offset="1" stopColor="#c0507a" stopOpacity="0" /></radialGradient>
          <linearGradient id="sun-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe0a8" stopOpacity=".5" /><stop offset="1" stopColor="#ffe0a8" stopOpacity="0" /></linearGradient>
        </defs>
      </svg>

      {/* 0 — ciel : dégradé, étoiles, voie lactée */}
      <div className="land__layer" style={L(1.5)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <rect x="-300" y="-300" width={W + 600} height="1500" fill="url(#skybg)" />
          {cfg.milky && (
            <g transform={`rotate(-22 ${W / 2} 330)`}>
              <ellipse cx={W / 2} cy="330" rx={W * 0.8} ry="95" fill="url(#mw)" filter="url(#bl)" />
              <ellipse cx={W * 0.4} cy="350" rx={W * 0.25} ry="16" fill="#120a2a" opacity=".35" filter="url(#bl)" />
              <ellipse cx={W * 0.68} cy="310" rx={W * 0.2} ry="12" fill="#120a2a" opacity=".3" filter="url(#bl)" />
            </g>
          )}
          {[0, 1, 2].map((gi) => (
            <g key={gi} className={`twk twk--${gi}`}>
              {g.stars.filter((s) => s.g === gi).map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.warm ? '#ffd8b8' : '#fff6e4'} opacity={s.o * Math.max(0.15, 1 - s.y / 760)} />)}
            </g>
          ))}
        </svg>
      </div>

      {/* 1 — ciel : aurores, soleil, nuages */}
      <div className="land__layer land__drift land__drift--a" style={L(3)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <rect x="-200" y="540" width={W + 400} height="190" fill="url(#haze)" />
          {cfg.aurora > 0 && (
            <g filter="url(#soft2)" className="aur aur--a" opacity={cfg.aurora}>
              {g.rays.map((q, i) => <rect key={i} x={q.x} y={q.y - q.h} width={q.w} height={q.h} fill="url(#aur-ray)" opacity={q.o} />)}
            </g>
          )}
          {theme === 'milkyway' && (
            <g filter="url(#bl)" className="aur aur--b" opacity=".6"><rect x="-200" y="540" width={W + 400} height="90" fill="url(#sun-halo)" opacity=".35" /></g>
          )}
          {cfg.sun && (
            <g>
              <circle cx={g.sunX} cy={g.sunY} r={g.sunR * 6} fill="url(#sun-halo)" />
              <g className="rays" filter="url(#bl)">
                {[-150, -80, -25, 30, 95, 160].map((dx, i) => <path key={i} d={`M${g.sunX - 8} ${g.sunY}L${g.sunX + dx * 3.4 - 30} -120L${g.sunX + dx * 3.4 + 30} -120L${g.sunX + 8} ${g.sunY}Z`} fill="url(#sun-ray)" opacity={0.45 - Math.abs(dx) / 450} />)}
              </g>
              <circle cx={g.sunX} cy={g.sunY} r={g.sunR} fill="url(#sun-disc)" />
            </g>
          )}
          <g filter="url(#soft)">
            <Cloud x={W * 0.3} y={330} w={W * 0.36} h={80} seed={12} tone="lit" o={cfg.sun ? 0.85 : 0.5} />
            <Cloud x={W * 0.74} y={440} w={W * 0.3} h={70} seed={15} tone="lit" o={cfg.sun ? 0.8 : 0.45} />
            {cfg.sun && <Cloud x={W * 0.12} y={470} w={W * 0.3} h={70} seed={14} tone="lit" o={0.7} />}
          </g>
        </svg>
      </div>

      {/* 2 — montagnes / dunes lointaines */}
      <div className="land__layer" style={L(6)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <path d={g.m1} fill="url(#m1)" />
          <path d={g.m1r} fill="none" stroke={cfg.rim} strokeOpacity=".42" strokeWidth="1.6" />
          <rect x="-200" y="560" width={W + 400} height="200" fill="url(#hz-up)" />
          <path d={g.m2} fill="url(#m2)" />
          <path d={g.m2r} fill="none" stroke={cfg.rim} strokeOpacity=".32" strokeWidth="1.4" />
        </svg>
      </div>
      <div className="land__layer land__drift land__drift--b" style={L(7)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <g filter="url(#soft)">
            <Cloud x={W * 0.3} y={620} w={W * 0.5} h={70} seed={31} tone="mist" o={cfg.sun ? 1 : 0.8} />
            <Cloud x={W * 0.78} y={645} w={W * 0.45} h={60} seed={33} tone="mist" o={cfg.sun ? 0.95 : 0.7} />
          </g>
        </svg>
      </div>

      {/* 3 — plan proche + porte de pierre */}
      <div className="land__layer" style={L(10)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <path d={g.m3} fill="url(#m3)" />
          <path d={g.m3r} fill="none" stroke={cfg.rim} strokeOpacity=".24" strokeWidth="1.3" />
          <path d={g.hill} fill="#0b1334" />
          <g transform={`translate(${gx} ${g.hillTop + 6})`}><Gate s={g.gateS} /></g>
        </svg>
      </div>

      {/* 4 — lac (ou sable) et reflets */}
      <div className="land__layer" style={L(12)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          {flat ? (
            <path d={floor} fill="url(#lake)" />
          ) : (
            <>
              <rect x="-200" y={WATER} width={W + 400} height="400" fill="url(#lake)" />
              <g clipPath="url(#clip-water)">
                <g mask="url(#refl-mask)">
                  <g filter="url(#ripple)" opacity=".5">
                    {reflect(<><path d={g.m1} fill={cfg.pal.m1[0]} /><path d={g.m2} fill={cfg.pal.m2[0]} /><path d={g.m3} fill={cfg.pal.m3[0]} /></>)}
                    <g transform={`translate(${gx} ${WATER * 2 - g.hillTop - 6}) scale(${g.gateS} ${-g.gateS})`}><Gate s={1} lights /></g>
                  </g>
                </g>
                {cfg.sun && g.refl.map((s, i) => <ellipse key={i} className="shim" style={{ animationDelay: `${(i % 5) * 0.9}s` }} cx={g.sunX} cy={s.y} rx={s.w} ry={s.h} fill="#ffe0a8" opacity={s.o} />)}
                {theme === 'aurora' && g.refl.slice(0, 9).map((s, i) => <ellipse key={i} className="shim" style={{ animationDelay: `${(i % 5) * 0.9}s` }} cx={W * 0.45} cy={s.y} rx={s.w * 1.8} ry={s.h * 1.2} fill="#7dffc8" opacity={s.o * 0.35} />)}
              </g>
              <rect x="-200" y={WATER - 4} width={W + 400} height="70" fill="url(#hz)" />
              {g.stones.map((p, i) => <g key={i} className="stone" style={{ animationDelay: `${i * 0.5}s` }}><ellipse cx={p.x} cy={p.y} rx={p.w * 1.7} ry={p.w * 0.38} fill="url(#gold-glow)" opacity={p.o * 0.55} /><ellipse cx={p.x} cy={p.y} rx={p.w * 0.6} ry={p.w * 0.14} fill="#ffe2a0" opacity={p.o} /></g>)}
            </>
          )}
        </svg>
      </div>

      {/* 5 — avant-plan */}
      <div className="land__layer" style={L(22)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          {g.pines.map((d, i) => <path key={i} d={d} fill="#04101c" stroke={cfg.rim} strokeOpacity=".18" strokeWidth="1.4" />)}
          <path d={g.fgRight} fill="url(#fg)" />
          <path d={g.fg} fill="url(#fg)" />
          <path d={g.fg} fill="none" stroke={cfg.rim} strokeOpacity=".22" strokeWidth="2" />
          <path d={g.blades} fill="#060b20" />
          {g.flowers.map((f, i) => (
            <g key={i} className="glint" style={{ animationDelay: `${f.d}s` }}>
              <circle cx={f.x} cy={f.y} r={f.r * 6} fill="url(#gold-glow)" opacity=".55" />
              <path d={`M${f.x} ${f.y}V${f.y + 26}`} stroke="#060b20" strokeWidth="1.6" />
              <circle cx={f.x} cy={f.y} r={f.r} fill={f.c} />
            </g>
          ))}
        </svg>
      </div>
    </>
  );
}
