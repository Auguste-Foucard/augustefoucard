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


const PET = ['#fde4ec', '#f9c6d6', '#f4a8c0', '#ee8aab', '#e5708f'];
const PET_DARK = ['#d9759a', '#c85d86', '#b34c78'];

type Branch = { p: [Pt, Pt, Pt, Pt]; w: number; clusters: number; rad: number };

/** Arbre fleuri (espace de dessin ≈ 560 × 1000, base du tronc en bas à gauche).
 *  Pétales fins en nuées denses : lumière de lune côté haut-droit, ombres rosées côté bas-gauche. */
export function BlossomTree({ seed = 11 }: { seed?: number }) {
  const r = rng(seed);
  const branches: Branch[] = [
    { p: [[120, 340], [200, 250], [330, 200], [500, 160]], w: 28, clusters: 15, rad: 36 },
    { p: [[110, 330], [70, 220], [170, 120], [330, 80]], w: 22, clusters: 12, rad: 34 },
    { p: [[150, 390], [250, 360], [340, 390], [440, 440]], w: 18, clusters: 10, rad: 30 },
    { p: [[100, 360], [20, 300], [-30, 210], [20, 100]], w: 20, clusters: 8, rad: 32 },
    { p: [[300, 214], [360, 262], [410, 300], [480, 322]], w: 11, clusters: 7, rad: 28 },
    { p: [[210, 108], [240, 56], [300, 24], [380, 6]], w: 10, clusters: 7, rad: 30 },
    { p: [[70, 480], [-10, 440], [-40, 400], [-50, 340]], w: 14, clusters: 5, rad: 28 },
  ];
  const wood: ReactNode[] = [];
  const mass: ReactNode[] = [];
  const shade = PET_DARK.map(() => '');
  const lit = PET.map(() => '');
  const spark: string[] = [];
  let key = 0;
  const dot = (x: number, y: number, rr: number) => `M${(x - rr).toFixed(1)} ${y.toFixed(1)}a${rr.toFixed(1)} ${(rr * 0.8).toFixed(1)} 0 1 0 ${(rr * 2).toFixed(1)} 0a${rr.toFixed(1)} ${(rr * 0.8).toFixed(1)} 0 1 0 ${(-rr * 2).toFixed(1)} 0`;

  branches.forEach((b, bi) => {
    const d = `M${b.p[0]}C${b.p[1]} ${b.p[2]} ${b.p[3]}`;
    wood.push(<path key={`w${bi}`} d={d} fill="none" stroke="#070c22" strokeWidth={b.w} strokeLinecap="round" />);
    wood.push(<path key={`r${bi}`} d={d} fill="none" stroke="#7f95d8" strokeOpacity=".32" strokeWidth={Math.max(1.5, b.w * 0.1)} strokeLinecap="round" transform="translate(2 -3)" />);
    // brindilles fines
    for (let i = 0; i < 4; i++) {
      const t = 0.2 + r() * 0.5;
      const [x, y] = bez(b.p[0], b.p[1], b.p[2], b.p[3], t);
      const a = -0.5 - r() * 2.2, l = 14 + r() * 26;
      wood.push(<path key={`t${key++}`} d={`M${x.toFixed(0)} ${y.toFixed(0)}q${(Math.cos(a) * l * 0.5).toFixed(0)} ${(Math.sin(a) * l * 0.7).toFixed(0)} ${(Math.cos(a) * l).toFixed(0)} ${(Math.sin(a) * l).toFixed(0)}`} fill="none" stroke="#070c22" strokeWidth={1.6 + r() * 2} strokeLinecap="round" />);
    }
    for (let i = 0; i < b.clusters; i++) {
      const t = 0.1 + (i / (b.clusters - 1)) * 0.9;
      const [cx, cy] = bez(b.p[0], b.p[1], b.p[2], b.p[3], t);
      const x = cx + (r() - 0.5) * b.rad * 1.0, y = cy + (r() - 0.5) * b.rad * 1.0;
      const R = b.rad * (0.7 + r() * 0.6);
      mass.push(<circle key={`m${key++}`} cx={x} cy={y + R * 0.15} r={R * 1.25} fill="#7a2d58" opacity=".28" />);
      mass.push(<circle key={`l${key++}`} cx={x + R * 0.18} cy={y - R * 0.2} r={R * 0.95} fill="#f7a9c4" opacity=".26" />);
      const n = 46;
      for (let k = 0; k < n; k++) {
        const a = r() * 6.283, dd = Math.sqrt(r()) * R;
        const px = x + Math.cos(a) * dd, py = y + Math.sin(a) * dd * 0.85;
        // éclairage : haut/droite = lune
        const light = (Math.cos(a) * 0.55 - Math.sin(a) * 0.8) * (dd / R) + (r() - 0.5) * 0.9;
        const rr = 2.2 + r() * 3.6;
        if (light < -0.35) { const si = Math.floor(r() * PET_DARK.length); shade[si] += dot(px, py, rr); }
        else { const li = light > 0.55 ? (r() < 0.5 ? 0 : 1) : light > 0.1 ? 1 + Math.floor(r() * 2) : 2 + Math.floor(r() * 3); lit[Math.min(li, PET.length - 1)] += dot(px, py, rr); }
        if (light > 0.7 && r() < 0.25) spark.push(dot(px + 1, py - 1, 1 + r() * 1.4));
      }
    }
  });
  return (
    <g>
      <path d="M-40 1010C30 840 14 700 50 560C74 470 56 380 104 318L178 346C150 420 176 500 156 590C146 690 176 820 214 1010Z" fill="#070c22" />
      <path d="M104 318C70 380 88 470 62 560C28 700 46 840 -40 1010" fill="none" stroke="#7f95d8" strokeOpacity=".4" strokeWidth="2.5" />
      {wood}
      <g filter="url(#bl)">{mass}</g>
      {shade.map((d, i) => <path key={`s${i}`} d={d} fill={PET_DARK[i]} opacity=".9" />)}
      {lit.map((d, i) => <path key={`p${i}`} d={d} fill={PET[i]} opacity={i < 2 ? 0.96 : 0.9} />)}
      <path d={spark.join('')} fill="#fffafc" opacity=".9" />
    </g>
  );
}

/** Château au loin : donjon, tours effilées, remparts crénelés, fenêtres en ogive dorées. (origine : base au centre) */
export function Castle({ s = 1, lights = true }: { s?: number; lights?: boolean }) {
  const win: [number, number][] = [[-10, -78], [10, -78], [0, -58], [-58, -64], [-58, -46], [56, -70], [56, -52], [-92, -42], [-30, -18], [30, -18], [82, -34], [0, -112]];
  const wall = 'M-104 0V-30h8v-6h8v6h8v-6h8v6h8V-30h8v-6h8v6h8V-30h8v-6h8v6h8V-30h8v-6h8v6h8V-30h8v-6h8v6h8V-30h8v-6h8v6h8V-30h8v-6h8v6h8V0Z';
  return (
    <g transform={`scale(${s})`}>
      {lights && <ellipse cx="0" cy="-8" rx="150" ry="26" fill="url(#gold-glow)" opacity=".22" />}
      <g fill="#091030">
        <path d={wall} />
        <rect x="-76" y="-66" width="152" height="40" />
        <rect x="-26" y="-112" width="52" height="86" />
        <path d="M-34 -112Q-8 -126 0 -168Q8 -126 34 -112Z" />
        <rect x="-72" y="-82" width="26" height="56" />
        <path d="M-80 -82Q-62 -92 -59 -128Q-56 -92 -38 -82Z" />
        <rect x="46" y="-92" width="28" height="66" />
        <path d="M38 -92Q58 -102 60 -142Q62 -102 82 -92Z" />
        <rect x="-102" y="-58" width="18" height="30" />
        <path d="M-108 -58L-93 -86L-78 -58Z" />
        <rect x="78" y="-50" width="20" height="24" />
        <path d="M74 -50L88 -74L102 -50Z" />
        <rect x="-1.2" y="-198" width="2.4" height="32" />
        <path d="M1 -198l16 5l-16 6Z" />
        <rect x="-50" y="-104" width="3" height="22" />
      </g>
      <g fill="none" stroke="#a9bcf2" strokeOpacity=".45" strokeWidth="1.1" strokeLinecap="round">
        <path d="M0 -168Q8 -126 34 -112M60 -142Q62 -102 82 -92M-59 -128Q-56 -92 -38 -82M88 -74L102 -50M26 -112V-30M74 -92V-30" />
      </g>
      {lights && (
        <g>
          {win.map(([x, y], i) => <circle key={`g${i}`} cx={x} cy={y} r="10" fill="url(#gold-glow)" opacity=".62" />)}
          {win.map(([x, y], i) => <path key={`w${i}`} d={`M${x - 2} ${y + 4}V${y - 1}a2 2.6 0 0 1 4 0V${y + 4}Z`} fill="#ffd886" />)}
          <path d="M-8 0V-12a8 8 0 0 1 16 0V0Z" fill="#ffc660" opacity=".9" />
        </g>
      )}
    </g>
  );
}

/** Porte de pierre ancienne dressée sur l'eau : un seuil vers d'autres mondes. (origine : base au centre) */
export function Gate({ s = 1, lights = true }: { s?: number; lights?: boolean }) {
  return (
    <g transform={`scale(${s})`}>
      {lights && <ellipse cx="0" cy="-70" rx="120" ry="110" fill="url(#portal-halo)" className="portal-pulse" />}
      {lights && (
        <g filter="url(#soft2)">
          <path d="M-24 -118L-52 -330L52 -330L24 -118Z" fill="url(#portal-beam)" className="portal-beam" />
          <path d="M-28 0V-100a28 30 0 0 1 56 0V0Z" fill="url(#portal-core)" className="portal-pulse" />
        </g>
      )}
      <g fill="#091030">
        <rect x="-50" y="-132" width="20" height="132" rx="2" />
        <rect x="30" y="-132" width="20" height="132" rx="2" />
        <rect x="-58" y="-8" width="36" height="8" rx="2" />
        <rect x="22" y="-8" width="36" height="8" rx="2" />
        <path d="M-72 -128Q0 -164 72 -128L66 -112Q0 -142 -66 -112Z" />
        <rect x="-60" y="-146" width="120" height="9" rx="2" transform="translate(0 -4)" />
        <rect x="-6" y="-166" width="12" height="20" rx="2" />
      </g>
      <g fill="none" stroke="#a9bcf2" strokeOpacity=".5" strokeWidth="1.1" strokeLinecap="round">
        <path d="M30 -130V-4M50 -130V-4M-72 -128Q0 -164 72 -128M-60 -150H60" />
      </g>
      {lights && (
        <g fill="#ffe2a0">
          <circle cx="0" cy="-166" r="2.4" className="portal-pulse" />
          {[-96, -82, -68, -54, -40, -26, -12].map((y, i) => <rect key={i} x={i % 2 ? 35 : -37} y={y} width="2" height="6" rx="1" opacity=".75" className="portal-pulse" style={{ animationDelay: `${i * 0.35}s` }} />)}
        </g>
      )}
    </g>
  );
}
