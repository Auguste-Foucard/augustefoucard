import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { BlossomTree, Castle, Cloud, rng, ridgePath, ridgePts, smooth, type Pt } from './draw';
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
    const castleS = narrow ? 1.05 : 1.55;

    const m1 = ridgePath(ridgePts(3, W, 600, 150, 1), 760);
    const m2 = ridgePath(ridgePts(9, W, 665, 92, 0.8, (x) => 0.55 + 0.45 * Math.min(1, x / (W * 0.4))), 760);
    const m3 = ridgePath(ridgePts(21, W, 690, 190, 1.1, (x) => Math.max(0.12, 1 - x / (W * (narrow ? 1.05 : 0.7)))), 760);

    const hill = `M${castleX - 360} ${WATER + 4}C${castleX - 270} ${WATER - 14} ${castleX - 190} ${WATER - 58} ${castleX - 100} ${WATER - 80}C${castleX - 40} ${WATER - 96} ${castleX + 20} ${WATER - 100} ${castleX + 90} ${WATER - 92}C${castleX + 170} ${WATER - 82} ${castleX + 240} ${WATER - 40} ${castleX + 380} ${WATER + 4}L${castleX + 380} ${WATER + 30}L${castleX - 360} ${WATER + 30}Z`;
    const hillTop = WATER - 99;

    // lumières le long de la rive (pont et village)
    const r = rng(5);
    const shore: { x: number; y: number; o: number }[] = [];
    for (let i = 0; i < 34; i++) {
      const x = castleX - 520 + i * 15 + (r() - 0.5) * 6;
      shore.push({ x, y: WATER - 6 + (r() - 0.5) * 5, o: 0.55 + r() * 0.45 });
    }
    // arches du pont
    let arches = '';
    for (let i = 0; i < 9; i++) { const ax = castleX - 520 + i * 52; arches += `M${ax} ${WATER + 6}q26 -26 52 0`; }

    // reflets de lune
    const rr = rng(8);
    const refl = Array.from({ length: 15 }, (_, i) => ({
      y: WATER + 22 + i * 17.5, w: 26 + i * 9 + rr() * 22, h: 2.6 + i * 0.28, d: rr() * 5, o: 0.78 - i * 0.035,
    }));
    const gold = Array.from({ length: 18 }, () => ({ x: castleX + (rr() - 0.5) * 190, y: WATER + 12 + rr() * 90, h: 6 + rr() * 16, d: rr() * 6 }));

    // tronc de l'arbre et colline d'avant-plan
    const s = narrow ? 0.72 : 1;
    const tree = { s, tx: narrow ? -26 : -10, ty: narrow ? 92 : -34 };
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
    return { moonX, moonY, moonR, castleX, castleS, m1, m2, m3, hill, hillTop, shore, arches, refl, gold, tree, fg, fgRight, blades, flowers };
  }, [W, narrow]);

  const vb = `0 0 ${W} ${H}`;
  const clouds = useMemo(() => ({ W }), [W]);
  void clouds;

  return (
    <>
      <Defs />
      {/* 1 — ciel : halo, lune, nuages éclairés */}
      <div className="land__layer land__drift land__drift--a" style={L(3)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <circle cx={g.moonX} cy={g.moonY + 60} r={W * 0.55} fill="url(#sky-glow)" />
          <rect x="-200" y="560" width={W + 400} height="170" fill="url(#haze)" />
          <circle cx={g.moonX} cy={g.moonY} r={g.moonR * 5.2} fill="url(#moon-halo)" />
          <circle cx={g.moonX} cy={g.moonY} r={g.moonR * 1.9} fill="url(#moon-halo)" />
          <circle cx={g.moonX} cy={g.moonY} r={g.moonR} fill="url(#moon-disc)" />
          <g fill="#b9b0a2" opacity=".28">
            <ellipse cx={g.moonX - g.moonR * 0.3} cy={g.moonY - g.moonR * 0.25} rx={g.moonR * 0.22} ry={g.moonR * 0.17} />
            <ellipse cx={g.moonX + g.moonR * 0.28} cy={g.moonY + g.moonR * 0.1} rx={g.moonR * 0.3} ry={g.moonR * 0.22} />
            <ellipse cx={g.moonX - g.moonR * 0.1} cy={g.moonY + g.moonR * 0.45} rx={g.moonR * 0.2} ry={g.moonR * 0.12} />
            <ellipse cx={g.moonX + g.moonR * 0.5} cy={g.moonY - g.moonR * 0.45} rx={g.moonR * 0.12} ry={g.moonR * 0.1} />
          </g>
          <g filter="url(#soft)">
            <Cloud x={g.moonX - g.moonR * 1.1} y={g.moonY + g.moonR * 0.95} w={g.moonR * 3.6} h={g.moonR * 0.9} seed={4} tone="dark" />
            <Cloud x={g.moonX + g.moonR * 1.5} y={g.moonY + g.moonR * 0.4} w={g.moonR * 2.4} h={g.moonR * 0.7} seed={6} tone="dark" />
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
          <path d={g.m2} fill="url(#m2)" />
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
          <path d={g.hill} fill="#0b1334" />
          <g transform={`translate(${g.castleX} ${g.hillTop + 8})`}><Castle s={g.castleS} /></g>
          <path d={g.arches} fill="none" stroke="#0a1230" strokeWidth="6" transform={`translate(0 -6)`} />
          <rect x={g.castleX - 520} y={WATER - 12} width="470" height="8" fill="#0a1230" />
          {g.shore.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="6" fill="url(#gold-glow)" opacity={p.o * 0.6} /><circle cx={p.x} cy={p.y} r="1.7" fill="#ffd27a" opacity={p.o} /></g>)}
        </svg>
      </div>
      {/* 4 — lac et reflets */}
      <div className="land__layer" style={L(12)}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
          <rect x="-200" y={WATER} width={W + 400} height="400" fill="url(#lake)" />
          <g clipPath="url(#clip-water)">
            <g transform={`translate(0 ${WATER * 2}) scale(1 -1)`} opacity=".3"><path d={g.m1} fill="#4a5fa8" /><path d={g.m2} fill="#2b3b85" /></g>
            <g transform={`translate(${g.castleX} ${WATER * 2 - g.hillTop - 8}) scale(${g.castleS} ${-g.castleS})`} opacity=".25"><Castle s={1} lights={false} /></g>
            {g.refl.map((s, i) => <ellipse key={i} className="shim" style={{ animationDelay: `${s.d}s` }} cx={g.moonX} cy={s.y} rx={s.w} ry={s.h} fill="#f6ecd2" opacity={s.o} />)}
            {g.gold.map((s, i) => <rect key={i} className="shim shim--gold" style={{ animationDelay: `${s.d}s` }} x={s.x} y={s.y} width="2.4" height={s.h} rx="1" fill="#ffcf70" opacity=".55" />)}
            <rect x="-200" y={WATER} width={W + 400} height="26" fill="#8fa6e6" opacity=".1" />
          </g>
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
