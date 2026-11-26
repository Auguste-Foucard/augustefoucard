import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { BlossomTree, Gate, Cloud, rng, ridgePath, ridgePts, smooth, type Pt } from './draw';
import { HeroFX } from './HeroFX';

const H = 1000;
const WATER = 705;

/**
 * Paysage nocturne illustré (SVG vectoriel dessiné pour le site) :
 * lune, nuages, montagnes, château éclairé, lac avec reflets, arbre fleuri.
 * Calques séparés → parallaxe douce à la souris ; seuls les calques sont déplacés (composités GPU).
 * Si `image` est fourni (illustration finale en .webp/.jpg), elle remplace le dessin vectoriel.
 */
export function Landscape({ image }: { image?: string | null }) {
  const box = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 1440, h: 900 });
  const [still, setStill] = useState(false);

  useEffect(() => {
    setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const el = box.current!;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setDim((d) => (Math.abs(d.w - r.width) > 2 || Math.abs(d.h - r.height) > 90 ? { w: Math.round(r.width), h: Math.round(r.height) } : d));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Parallaxe : un seul rAF, interpolé, uniquement sur pointeur précis.
  useEffect(() => {
    if (still || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const el = box.current!;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const loop = () => {
      x += (tx - x) * 0.06; y += (ty - y) * 0.06;
      el.style.setProperty('--mx', x.toFixed(3));
      el.style.setProperty('--my', y.toFixed(3));
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(loop) : 0;
    };
    const move = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', move); };
  }, [still]);

  const W = Math.round(Math.min(2600, Math.max(420, (H * dim.w) / dim.h)));
  const narrow = W < 900;

  return (
    <div ref={box} className={`land${still ? ' land--still' : ''}`} aria-hidden="true">
      {image ? (
        <div className="land__layer" style={{ ['--k' as string]: 8 } as CSSProperties}><img className="land__img" src={image} alt="" decoding="async" fetchPriority="high" /></div>
      ) : (
        <Scene W={W} narrow={narrow} />
      )}
      <div className="land__fade" />
      {!still && <HeroFX W={W} narrow={narrow} cw={dim.w} ch={dim.h} tree={!image} />}
    </div>
  );
}

const L = (k: number): CSSProperties => ({ ['--k' as string]: k } as CSSProperties);

function Defs() {
  return (
    <svg className="land__defs" width="1" height="1" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="moon-disc" cx=".38" cy=".34" r=".8"><stop offset="0" stopColor="#fffaf0" /><stop offset=".55" stopColor="#f1e6cc" /><stop offset="1" stopColor="#c9c0b4" /></radialGradient>
        <radialGradient id="moon-halo"><stop offset="0" stopColor="#f6ecd2" stopOpacity=".55" /><stop offset=".25" stopColor="#c9d3f2" stopOpacity=".22" /><stop offset="1" stopColor="#5f7ccc" stopOpacity="0" /></radialGradient>
        <radialGradient id="sky-glow"><stop offset="0" stopColor="#4a67b8" stopOpacity=".55" /><stop offset=".5" stopColor="#2c4287" stopOpacity=".22" /><stop offset="1" stopColor="#1a2a66" stopOpacity="0" /></radialGradient>
        <radialGradient id="gold-glow"><stop offset="0" stopColor="#ffd27a" stopOpacity=".9" /><stop offset="1" stopColor="#ffb34a" stopOpacity="0" /></radialGradient>
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7d95dd" stopOpacity="0" /><stop offset=".6" stopColor="#8fa6e6" stopOpacity=".32" /><stop offset="1" stopColor="#6f86c8" stopOpacity=".1" /></linearGradient>
        <linearGradient id="cl-lit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a9baf0" stopOpacity=".85" /><stop offset=".5" stopColor="#4a60a8" stopOpacity=".8" /><stop offset="1" stopColor="#1a2656" stopOpacity=".85" /></linearGradient>
        <linearGradient id="cl-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a6fb4" stopOpacity=".9" /><stop offset=".4" stopColor="#1b2760" stopOpacity=".95" /><stop offset="1" stopColor="#0b1235" stopOpacity=".95" /></linearGradient>
        <linearGradient id="cl-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9db0ea" stopOpacity=".5" /><stop offset="1" stopColor="#5a70b8" stopOpacity=".08" /></linearGradient>
        <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a5ea8" /><stop offset=".5" stopColor="#273776" /><stop offset="1" stopColor="#1a2563" /></linearGradient>
        <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34478f" /><stop offset="1" stopColor="#141d52" /></linearGradient>
        <linearGradient id="m3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1c2a68" /><stop offset="1" stopColor="#0a1033" /></linearGradient>
        <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#334a92" /><stop offset=".25" stopColor="#1e2d6a" /><stop offset="1" stopColor="#0a1236" /></linearGradient>
        <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#101a44" /><stop offset=".4" stopColor="#0a1130" /><stop offset="1" stopColor="#050918" /></linearGradient>
        <linearGradient id="refl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6ecd2" stopOpacity=".7" /><stop offset="1" stopColor="#f6ecd2" stopOpacity=".04" /></linearGradient>
        <filter id="soft" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="9" /></filter>
        <filter id="soft2" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id="ripple" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.0035 0.09" numOctaves="2" seed="4" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="26" /><feGaussianBlur stdDeviation="1.6 3.2" /></filter>
        <linearGradient id="fade-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="1" /><stop offset=".55" stopColor="#fff" stopOpacity=".45" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <mask id="refl-mask" maskUnits="userSpaceOnUse" x="-400" y={WATER} width="6000" height="320"><rect x="-400" y={WATER} width="6000" height="320" fill="url(#fade-v)" /></mask>
        <linearGradient id="hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a9bcf2" stopOpacity=".38" /><stop offset="1" stopColor="#a9bcf2" stopOpacity="0" /></linearGradient>
        <linearGradient id="hz-up" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#8ea5ea" stopOpacity=".34" /><stop offset="1" stopColor="#8ea5ea" stopOpacity="0" /></linearGradient>
        <radialGradient id="portal-halo"><stop offset="0" stopColor="#ffd88a" stopOpacity=".55" /><stop offset=".45" stopColor="#7f9cf0" stopOpacity=".22" /><stop offset="1" stopColor="#5a78d6" stopOpacity="0" /></radialGradient>
        <linearGradient id="portal-core" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#fff1c8" stopOpacity=".95" /><stop offset=".5" stopColor="#ffd27a" stopOpacity=".7" /><stop offset="1" stopColor="#9db6ff" stopOpacity=".55" /></linearGradient>
        <linearGradient id="portal-beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#ffe3a8" stopOpacity=".3" /><stop offset=".6" stopColor="#9db6ff" stopOpacity=".08" /><stop offset="1" stopColor="#9db6ff" stopOpacity="0" /></linearGradient>
        <linearGradient id="aur1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#5fe0c4" stopOpacity="0" /><stop offset=".35" stopColor="#6fe8d0" stopOpacity=".5" /><stop offset=".7" stopColor="#8f8cff" stopOpacity=".45" /><stop offset="1" stopColor="#b48cff" stopOpacity="0" /></linearGradient>
        <linearGradient id="aur2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffd88a" stopOpacity="0" /><stop offset=".5" stopColor="#8fb0ff" stopOpacity=".38" /><stop offset="1" stopColor="#7de3ff" stopOpacity="0" /></linearGradient>
        <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6ecd2" stopOpacity=".26" /><stop offset="1" stopColor="#f6ecd2" stopOpacity="0" /></linearGradient>
        <clipPath id="clip-water"><rect x="-200" y={WATER} width="6000" height="400" /></clipPath>
      </defs>
    </svg>
  );
}

function Scene({ W, narrow }: { W: number; narrow: boolean }) {
  const g = useMemo(() => {
    const moonX = W - Math.max(104, 0.2125 * W);
    const moonY = narrow ? 262 : 250;
    const moonR = narrow ? 62 : 80;
    const castleX = W * (narrow ? 0.8 : 0.835);
    const castleS = narrow ? 1.15 : 1.7;

    const m1p = ridgePts(3, W, 600, 150, 1); const m1 = ridgePath(m1p, 760);
    const m2p = ridgePts(9, W, 665, 92, 0.8, (x) => 0.55 + 0.45 * Math.min(1, x / (W * 0.4))); const m2 = ridgePath(m2p, 760);
    const m3p = ridgePts(21, W, 690, 190, 1.1, (x) => Math.max(0.12, 1 - x / (W * (narrow ? 1.05 : 0.7)))); const m3 = ridgePath(m3p, 760);
    const m1r = smooth(m1p), m2r = smooth(m2p), m3r = smooth(m3p);

    const hillTop = WATER - 26;
    const hill = `M${castleX - 230} ${WATER + 6}C${castleX - 170} ${WATER - 2} ${castleX - 110} ${WATER - 22} ${castleX - 50} ${WATER - 27}C${castleX - 10} ${WATER - 30} ${castleX + 20} ${WATER - 30} ${castleX + 56} ${WATER - 26}C${castleX + 110} ${WATER - 20} ${castleX + 170} ${WATER - 2} ${castleX + 240} ${WATER + 6}L${castleX + 240} ${WATER + 30}L${castleX - 230} ${WATER + 30}Z`;

    // lumières le long de la rive (pont et village)
    const r = rng(5);
    // pierres lumineuses qui mènent au seuil
    const shore: { x: number; y: number; o: number; w: number }[] = [];
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      shore.push({ x: castleX - 70 - (1 - t) * 0 - Math.pow(1 - t, 1.5) * 420 * (narrow ? 0.6 : 1), y: WATER + 86 - t * 66 + (r() - 0.5) * 3, o: 0.9 - t * 0.35, w: 36 - t * 26 });
    }
    const arches = '';

    // reflets de lune
    const rr = rng(8);
    const refl = Array.from({ length: 15 }, (_, i) => ({
      y: WATER + 22 + i * 17.5, w: 26 + i * 9 + rr() * 22, h: 2.6 + i * 0.28, d: rr() * 5, o: 0.78 - i * 0.035,
    }));
    const gold = Array.from({ length: 18 }, () => ({ x: castleX + (rr() - 0.5) * 190, y: WATER + 12 + rr() * 90, h: 6 + rr() * 16, d: rr() * 6 }));

    // tronc de l'arbre et colline d'avant-plan
    const s = narrow ? 0.72 : 1;
    const tree = { s, tx: narrow ? -26 : -46, ty: narrow ? 92 : 46 };
    const fgPts: Pt[] = [[-80, 790], [130, 772], [320, 802], [500, 850], [680, 905], [860, 960], [1010, 1020]];
    const fgTop = (x: number) => {
      for (let i = 0; i < fgPts.length - 1; i++) if (x >= fgPts[i][0] && x <= fgPts[i + 1][0]) { const t = (x - fgPts[i][0]) / (fgPts[i + 1][0] - fgPts[i][0]); return fgPts[i][1] + t * (fgPts[i + 1][1] - fgPts[i][1]); }
      return 1100;
    };
    const fg = `${smooth(fgPts)}L1010 1100L-80 1100Z`;
    const fgR: Pt[] = [[W + 90, 900], [W - 150, 915], [W - 380, 955], [W - 560, 1010]];
    const fgRight = `${smooth(fgR)}L${W - 560} 1100L${W + 90} 1100Z`;
    const rb = rng(17);
    const blades = Array.from({ length: narrow ? 60 : 110 }, () => {
      const x = -40 + rb() * 760; const y = fgTop(x) + 6; const hgt = 14 + rb() * 30; const lean = (rb() - 0.5) * 14;
      return `M${x.toFixed(0)} ${y.toFixed(0)}q${(lean / 2).toFixed(1)} ${(-hgt * 0.6).toFixed(1)} ${lean.toFixed(1)} ${(-hgt).toFixed(1)}q${(2 + rb() * 3).toFixed(1)} ${(hgt * 0.5).toFixed(1)} 6 ${hgt.toFixed(1)}Z`;
    }).join('');
    const flowers = Array.from({ length: narrow ? 6 : 11 }, (_, i) => {
      const x = 20 + rb() * 560; return { x, y: fgTop(x) - 8 - rb() * 22, c: i % 3 === 0 ? '#ffae4a' : '#ffd860', r: 3 + rb() * 3.2, d: rb() * 5 };
    });
    const rs = rng(77);
    const stars = Array.from({ length: narrow ? 70 : 150 }, () => ({ x: rs() * W, y: rs() * 560, r: 0.5 + Math.pow(rs(), 3) * 1.7, o: 0.35 + rs() * 0.65, g: Math.floor(rs() * 3) }));
    return { stars, m1r, m2r, m3r, moonX, moonY, moonR, castleX, castleS, m1, m2, m3, hill, hillTop, shore, arches, refl, gold, tree, fg, fgRight, blades, flowers };
  }, [W, narrow]);

  const vb = `0 0 ${W} ${H}`;
  const clouds = useMemo(() => ({ W }), [W]);
  void clouds;

  return (
    <>
      <Defs />
      {/* 0 — étoiles */}
      <div className="land__layer" style={L(1.5)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          {[0, 1, 2].map((gi) => (
            <g key={gi} className={`twk twk--${gi}`} fill="#fff6e4">
              {g.stars.filter((s) => s.g === gi).map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o * (1 - s.y / 760)} />)}
            </g>
          ))}
        </svg>
      </div>
      {/* 1 — ciel : halo, lune, nuages éclairés */}
      <div className="land__layer land__drift land__drift--a" style={L(3)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <circle cx={g.moonX} cy={g.moonY + 60} r={W * 0.55} fill="url(#sky-glow)" />
          <rect x="-200" y="560" width={W + 400} height="170" fill="url(#haze)" />
          <g filter="url(#bl)" className="aur aur--a" opacity=".85">
            <path d={`M${-200} 330C${W * 0.15} 190 ${W * 0.3} 330 ${W * 0.5} 220S${W * 0.8} 150 ${W + 200} 250L${W + 200} 330C${W * 0.8} 260 ${W * 0.55} 340 ${W * 0.4} 300S${W * 0.1} 420 -200 400Z`} fill="url(#aur1)" />
          </g>
          <g filter="url(#bl)" className="aur aur--b" opacity=".7">
            <path d={`M${W * 0.05} 150C${W * 0.25} 70 ${W * 0.4} 200 ${W * 0.6} 110S${W * 0.9} 90 ${W + 100} 160L${W + 100} 205C${W * 0.9} 140 ${W * 0.7} 190 ${W * 0.55} 165S${W * 0.2} 130 ${W * 0.05} 210Z`} fill="url(#aur2)" />
          </g>
          <g className="rays" filter="url(#bl)">
            {[-120, -60, -10, 40, 95].map((dx, i) => <path key={i} d={`M${g.moonX - 6} ${g.moonY + 10}L${g.moonX + dx * 3 - 24} 760L${g.moonX + dx * 3 + 24} 760L${g.moonX + 6} ${g.moonY + 10}Z`} fill="url(#ray)" opacity={0.38 - Math.abs(dx) / 500} />)}
          </g>
          <circle cx={g.moonX} cy={g.moonY} r={g.moonR * 5.2} fill="url(#moon-halo)" />
          <g className="ring" style={{ transformOrigin: `${g.moonX}px ${g.moonY}px` }} fill="none" stroke="#f6ecd2" strokeLinecap="round">
            <circle cx={g.moonX} cy={g.moonY} r={g.moonR * 1.55} strokeOpacity=".22" strokeWidth="1" strokeDasharray="2 14" />
            <circle cx={g.moonX} cy={g.moonY} r={g.moonR * 2.05} strokeOpacity=".15" strokeWidth="1" strokeDasharray="60 40 8 40" />
          </g>
          <circle cx={g.moonX} cy={g.moonY} r={g.moonR * 1.9} fill="url(#moon-halo)" />
          <circle cx={g.moonX} cy={g.moonY} r={g.moonR} fill="url(#moon-disc)" />
          <g fill="#a89f94" opacity=".3" filter="url(#soft2)">
            <ellipse cx={g.moonX - g.moonR * 0.3} cy={g.moonY - g.moonR * 0.25} rx={g.moonR * 0.22} ry={g.moonR * 0.17} />
            <ellipse cx={g.moonX + g.moonR * 0.28} cy={g.moonY + g.moonR * 0.1} rx={g.moonR * 0.3} ry={g.moonR * 0.22} />
            <ellipse cx={g.moonX - g.moonR * 0.1} cy={g.moonY + g.moonR * 0.45} rx={g.moonR * 0.2} ry={g.moonR * 0.12} />
            <ellipse cx={g.moonX + g.moonR * 0.5} cy={g.moonY - g.moonR * 0.45} rx={g.moonR * 0.12} ry={g.moonR * 0.1} />
          </g>
          <g filter="url(#soft)">
            <Cloud x={g.moonX - g.moonR * 1.3} y={g.moonY + g.moonR * 1.5} w={g.moonR * 3.8} h={g.moonR * 0.8} seed={4} tone="dark" o={0.85} />
            <Cloud x={g.moonX + g.moonR * 2.1} y={g.moonY + g.moonR * 0.9} w={g.moonR * 2.4} h={g.moonR * 0.6} seed={6} tone="dark" o={0.8} />
            <Cloud x={W * 0.36} y={300} w={W * 0.34} h={90} seed={12} tone="lit" o={0.8} />
            <Cloud x={W * 0.12} y={470} w={W * 0.3} h={80} seed={14} tone="lit" o={0.65} />
            <Cloud x={W * 0.62} y={420} w={W * 0.28} h={70} seed={15} tone="lit" o={0.6} />
          </g>
        </svg>
      </div>
      {/* 2 — montagnes lointaines + bande de nuages */}
      <div className="land__layer" style={L(6)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <path d={g.m1} fill="url(#m1)" />
          <path d={g.m1r} fill="none" stroke="#b9c8f6" strokeOpacity=".32" strokeWidth="1.6" />
          <rect x="-200" y="560" width={W + 400} height="200" fill="url(#hz-up)" />
          <path d={g.m2} fill="url(#m2)" />
          <path d={g.m2r} fill="none" stroke="#9db0ea" strokeOpacity=".3" strokeWidth="1.4" />
        </svg>
      </div>
      <div className="land__layer land__drift land__drift--b" style={L(7)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <g filter="url(#soft)">
            <Cloud x={W * 0.3} y={610} w={W * 0.5} h={70} seed={31} tone="mist" o={0.9} />
            <Cloud x={W * 0.78} y={640} w={W * 0.45} h={60} seed={33} tone="mist" o={0.8} />
          </g>
        </svg>
      </div>
      {/* 3 — montagnes proches, colline du château */}
      <div className="land__layer" style={L(10)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <path d={g.m3} fill="url(#m3)" />
          <path d={g.m3r} fill="none" stroke="#8ea5ea" strokeOpacity=".22" strokeWidth="1.3" />
          <path d={g.hill} fill="#0b1334" />
          <g transform={`translate(${g.castleX} ${g.hillTop + 6})`}><Gate s={g.castleS} /></g>
        </svg>
      </div>
      {/* 4 — lac et reflets */}
      <div className="land__layer" style={L(12)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <rect x="-200" y={WATER} width={W + 400} height="400" fill="url(#lake)" />
          <g clipPath="url(#clip-water)">
            <g mask="url(#refl-mask)">
              <g filter="url(#ripple)" opacity=".5">
                <g transform={`translate(0 ${WATER * 2}) scale(1 -1)`}><path d={g.m1} fill="#4a5fa8" /><path d={g.m2} fill="#2b3b85" /><path d={g.m3} fill="#16205a" /></g>
                <g transform={`translate(${g.castleX} ${WATER * 2 - g.hillTop - 6}) scale(${g.castleS} ${-g.castleS})`}><Gate s={1} lights={true} /></g>
              </g>
            </g>
            {g.refl.map((s, i) => <ellipse key={i} className="shim" style={{ animationDelay: `${s.d}s` }} cx={g.moonX} cy={s.y} rx={s.w} ry={s.h} fill="#f6ecd2" opacity={s.o} />)}
            {g.gold.map((s, i) => <rect key={i} className="shim shim--gold" style={{ animationDelay: `${s.d}s` }} x={s.x} y={s.y} width="2.4" height={s.h} rx="1" fill="#ffcf70" opacity=".5" />)}
          </g>
          <rect x="-200" y={WATER - 4} width={W + 400} height="70" fill="url(#hz)" />
          {g.shore.map((p, i) => <g key={i} className="stone" style={{ animationDelay: `${i * 0.5}s` }}><ellipse cx={p.x} cy={p.y} rx={p.w * 1.7} ry={p.w * 0.38} fill="url(#gold-glow)" opacity={p.o * 0.55} /><ellipse cx={p.x} cy={p.y} rx={p.w * 0.6} ry={p.w * 0.14} fill="#ffe2a0" opacity={p.o} /></g>)}
        </svg>
      </div>
      {/* 5 — avant-plan : arbre fleuri, colline, herbes et fleurs lumineuses */}
      <div className="land__layer" style={L(22)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <g transform={`translate(${g.tree.tx} ${g.tree.ty}) scale(${g.tree.s})`}><BlossomTree /></g>
          <path d={g.fgRight} fill="url(#fg)" />
          <path d={g.fg} fill="url(#fg)" />
          <path d={g.fg} fill="none" stroke="#6f86c8" strokeOpacity=".2" strokeWidth="2" />
          <path d={g.blades} fill="#060b20" />
          <ellipse cx="360" cy="928" rx="70" ry="30" fill="#070c22" />
          <ellipse cx="610" cy="990" rx="90" ry="34" fill="#060a1c" />
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
