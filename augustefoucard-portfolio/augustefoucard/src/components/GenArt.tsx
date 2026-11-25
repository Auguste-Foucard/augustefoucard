import { useId, useMemo } from 'react';
import { seeded } from '../lib/util';

/**
 * Visuel génératif TEMPORAIRE, affiché tant qu'aucune vraie image n'est fournie.
 * Il est stable (même graine → même image) et porte la mention « Visuel à venir ».
 */
export function GenArt({ seed, accent = '#8b5cf6', label, variant }: { seed: string; accent?: string; label?: string; variant?: 'orbit' | 'grid' | 'wave' }) {
  const uid = useId().replace(/:/g, '');
  const art = useMemo(() => {
    const r = seeded(seed);
    const kind = variant ?? (['orbit', 'grid', 'wave'] as const)[Math.floor(r() * 3)];
    const blobs = Array.from({ length: 3 }, (_, i) => ({ cx: 20 + r() * 60, cy: 20 + r() * 60, rad: 25 + r() * 30, o: 0.35 + r() * 0.35 - i * 0.08 }));
    const rings = Array.from({ length: 5 + Math.floor(r() * 4) }, (_, i) => 8 + i * (5 + r() * 4));
    const cx = 30 + r() * 40;
    const cy = 35 + r() * 30;
    const waves = Array.from({ length: 9 }, (_, i) => {
      const amp = 2 + r() * 6;
      const ph = r() * Math.PI * 2;
      const y0 = 30 + i * 6;
      let d = `M0 ${y0}`;
      for (let x = 0; x <= 100; x += 4) d += ` L${x} ${(y0 + Math.sin(x / 9 + ph + i * 0.4) * amp).toFixed(2)}`;
      return d;
    });
    const tilt = -20 + r() * 40;
    return { kind, blobs, rings, cx, cy, waves, tilt };
  }, [seed, variant]);

  return (
    <div className="gen" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id={`b${uid}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
          <radialGradient id={`g${uid}`}>
            <stop offset="0" stopColor={accent} stopOpacity="1" />
            <stop offset="1" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`f${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.55" stopColor="#0d0b11" stopOpacity="0" />
            <stop offset="1" stopColor="#0d0b11" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <g filter={`url(#b${uid})`}>
          {art.blobs.map((b, i) => (
            <circle key={i} cx={b.cx} cy={b.cy} r={b.rad} fill={`url(#g${uid})`} opacity={b.o} />
          ))}
        </g>
        <g fill="none" stroke="#ede9e2" strokeWidth="0.18" opacity="0.5" transform={`rotate(${art.tilt} 50 50)`}>
          {art.kind === 'orbit' &&
            art.rings.map((rr, i) => <ellipse key={i} cx={art.cx} cy={art.cy} rx={rr * 1.6} ry={rr * 0.55} opacity={1 - i * 0.09} />)}
          {art.kind === 'wave' && art.waves.map((d, i) => <path key={i} d={d} opacity={0.3 + i * 0.07} />)}
          {art.kind === 'grid' &&
            Array.from({ length: 11 }, (_, i) => (
              <g key={i}>
                <line x1={i * 10} y1="0" x2={50 + (i * 10 - 50) * 2.2} y2="100" opacity={0.5} />
                <line x1="-20" y1={50 + i * i * 0.45} x2="120" y2={50 + i * i * 0.45} opacity={0.15 + i * 0.05} />
              </g>
            ))}
        </g>
        {art.kind === 'orbit' && <circle cx={art.cx} cy={art.cy} r="3.2" fill="#ede9e2" opacity="0.9" />}
        <rect width="100" height="100" fill={`url(#f${uid})`} />
      </svg>
      {label && <span className="gen__label">{label}</span>}
    </div>
  );
}
