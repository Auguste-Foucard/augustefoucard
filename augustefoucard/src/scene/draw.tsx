import type { ReactNode } from 'react';

/** Générateur pseudo-aléatoire déterministe : le paysage est identique à chaque visite. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function lattice(seed: number, i: number) {
  let h = (i * 374761393 + seed * 668265263) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** Bruit de valeur lissé 1D. */
export function vnoise(seed: number, t: number) {
  const i = Math.floor(t), f = t - i;
  const u = f * f * (3 - 2 * f);
  return lattice(seed, i) * (1 - u) + lattice(seed, i + 1) * u;
}

export type Pt = [number, number];

/** Courbe lisse (Catmull-Rom → Bézier) passant par les points. */
export function smooth(pts: Pt[]): string {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Ligne de crête : somme de bruits à plusieurs échelles. `weight(x)` module la hauteur. */
export function ridgePts(seed: number, W: number, base: number, amp: number, scale = 1, weight: (x: number) => number = () => 1): Pt[] {
  const pts: Pt[] = [];
  const step = 70;
  for (let x = -120; x <= W + 120; x += step) {
    const n = 0.62 * vnoise(seed, x / (360 * scale)) + 0.28 * vnoise(seed + 7, x / (150 * scale)) + 0.1 * vnoise(seed + 13, x / (62 * scale));
    pts.push([x, base - amp * n * weight(x)]);
  }
  return pts;
}
export const ridgePath = (pts: Pt[], bottom: number) => `${smooth(pts)}L${pts[pts.length - 1][0]} ${bottom}L${pts[0][0]} ${bottom}Z`;

export function bez(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

/** Nuage : bosses empilées, floutées par le filtre #soft du calque. */
export function Cloud({ x, y, w, h, seed, tone = 'lit', o = 1 }: { x: number; y: number; w: number; h: number; seed: number; tone?: 'lit' | 'dark' | 'mist'; o?: number }) {
  const r = rng(seed);
  const fill = tone === 'lit' ? 'url(#cl-lit)' : tone === 'dark' ? 'url(#cl-dark)' : 'url(#cl-mist)';
  const bumps: ReactNode[] = [];
  const n = 6 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const bx = x + (i / (n - 1) - 0.5) * w * 0.9 + (r() - 0.5) * w * 0.08;
    const k = Math.sin((i / (n - 1)) * Math.PI);
    const bh = h * (0.45 + 0.6 * k * (0.6 + r() * 0.5));
    bumps.push(<ellipse key={i} cx={bx} cy={y - bh * 0.25} rx={w * (0.11 + r() * 0.07)} ry={bh * 0.6} />);
  }
  return (
    <g fill={fill} opacity={o}>
      <ellipse cx={x} cy={y + h * 0.1} rx={w * 0.5} ry={h * 0.32} />
      {bumps}
    </g>
  );
}

const PINK = ['#ff4d82', '#ff6f9c', '#e8265f', '#ff8fb3', '#c4194f', '#ff5c8a'];

type Branch = { p: [Pt, Pt, Pt, Pt]; w: number; clusters: number; rad: number };

/** Arbre fleuri (espace de dessin ≈ 560 × 1000, base du tronc en bas à gauche). */
export function BlossomTree({ seed = 11 }: { seed?: number }) {
  const r = rng(seed);
  const branches: Branch[] = [
    { p: [[120, 340], [200, 250], [330, 200], [540, 150]], w: 28, clusters: 16, rad: 34 },
    { p: [[110, 330], [70, 220], [170, 110], [350, 60]], w: 22, clusters: 12, rad: 32 },
    { p: [[150, 390], [250, 360], [340, 390], [450, 450]], w: 18, clusters: 10, rad: 28 },
    { p: [[100, 360], [20, 300], [-30, 210], [20, 90]], w: 20, clusters: 8, rad: 30 },
    { p: [[300, 214], [360, 262], [410, 300], [490, 322]], w: 11, clusters: 7, rad: 26 },
    { p: [[210, 98], [240, 40], [310, 6], [400, -10]], w: 10, clusters: 7, rad: 28 },
    { p: [[70, 480], [-10, 440], [-40, 400], [-50, 340]], w: 14, clusters: 5, rad: 26 },
  ];
  const wood: ReactNode[] = [];
  const bloom: ReactNode[] = [];
  const hi: ReactNode[] = [];
  let key = 0;
  branches.forEach((b, bi) => {
    wood.push(<path key={`w${bi}`} d={`M${b.p[0]}C${b.p[1]} ${b.p[2]} ${b.p[3]}`} fill="none" stroke="#070c22" strokeWidth={b.w} strokeLinecap="round" />);
    wood.push(<path key={`r${bi}`} d={`M${b.p[0]}C${b.p[1]} ${b.p[2]} ${b.p[3]}`} fill="none" stroke="#4a5ea8" strokeOpacity=".35" strokeWidth={Math.max(1.5, b.w * 0.12)} strokeLinecap="round" transform="translate(-2 -3)" />);
    for (let i = 0; i < b.clusters; i++) {
      const t = 0.12 + (i / (b.clusters - 1)) * 0.88;
      const [cx, cy] = bez(b.p[0], b.p[1], b.p[2], b.p[3], t);
      const x = cx + (r() - 0.5) * b.rad * 1.1, y = cy + (r() - 0.5) * b.rad * 1.1;
      const R = b.rad * (0.6 + r() * 0.6);
      bloom.push(<circle key={`d${key++}`} cx={x} cy={y} r={R} fill="#3a0f3c" opacity=".55" />);
      const petals = 9 + Math.floor(r() * 5);
      for (let k = 0; k < petals; k++) {
        const a = r() * 6.283, d = Math.sqrt(r()) * R;
        bloom.push(<circle key={`p${key++}`} cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d * 0.85} r={4 + r() * 7} fill={PINK[Math.floor(r() * PINK.length)]} opacity={0.82 + r() * 0.18} />);
      }
      for (let k = 0; k < 2; k++) {
        hi.push(<circle key={`h${key++}`} cx={x + R * (0.1 + r() * 0.5)} cy={y - R * (0.1 + r() * 0.5)} r={2.5 + r() * 3.5} fill="#ffd0de" opacity={0.55 + r() * 0.35} />);
      }
    }
  });
  return (
    <g>
      <path d="M-40 1010C30 840 14 700 50 560C74 470 56 380 104 318L178 346C150 420 176 500 156 590C146 690 176 820 214 1010Z" fill="#070c22" />
      <path d="M104 318C70 380 88 470 62 560C28 700 46 840 -40 1010" fill="none" stroke="#4a5ea8" strokeOpacity=".4" strokeWidth="3" />
      {wood}
      {bloom}
      {hi}
    </g>
  );
}

/** Château au loin : silhouettes, toits pointus, fenêtres dorées. (origine : base au centre) */
export function Castle({ s = 1, lights = true }: { s?: number; lights?: boolean }) {
  const win: [number, number][] = [[-12, -64], [8, -64], [-4, -50], [-56, -56], [-48, -48], [50, -62], [58, -50], [-86, -36], [20, -26], [-26, -22], [72, -30]];
  return (
    <g transform={`scale(${s})`}>
      <g fill="#0a1230">
        <rect x="-74" y="-36" width="150" height="38" />
        <rect x="-22" y="-94" width="46" height="60" />
        <path d="M-29 -94L1 -134L31 -94Z" />
        <rect x="-62" y="-72" width="24" height="40" />
        <path d="M-67 -72L-50 -104L-33 -72Z" />
        <rect x="40" y="-82" width="26" height="50" />
        <path d="M36 -82L53 -118L70 -82Z" />
        <rect x="-96" y="-50" width="18" height="22" />
        <path d="M-100 -50L-87 -74L-74 -50Z" />
        <rect x="-5" y="-134" width="10" height="30" />
        <path d="M-9 -134L0 -166L9 -134Z" />
        <rect x="78" y="-44" width="20" height="16" />
        <path d="M74 -44L88 -62L102 -44Z" />
      </g>
      <g fill="none" stroke="#8aa0e0" strokeOpacity=".35" strokeWidth="1">
        <path d="M-29 -94L1 -134L31 -94M-67 -72L-50 -104M36 -82L53 -118M-9 -134L0 -166" />
      </g>
      {lights && (
        <g>
          {win.map(([x, y], i) => <circle key={`g${i}`} cx={x} cy={y} r="9" fill="url(#gold-glow)" opacity=".7" />)}
          {win.map(([x, y], i) => <rect key={`w${i}`} x={x - 1.6} y={y - 3} width="3.2" height="6" rx=".6" fill="#ffd27a" />)}
        </g>
      )}
    </g>
  );
}
