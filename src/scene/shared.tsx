import type { CSSProperties } from 'react';

export const H = 1000;
export const WATER = 705;

export type Pal = {
  glow: [string, string]; haze: string;
  clLit: [string, string, string]; clDark: [string, string, string]; clMist: [string, string];
  m1: [string, string, string]; m2: [string, string]; m3: [string, string];
  lake: [string, string, string]; fg: [string, string, string];
  aur: [string, string, string, string];
};
export const MOON_PAL: Pal = {
  glow: ['#4a67b8', '#2c4287'], haze: '#8fa6e6',
  clLit: ['#a9baf0', '#4a60a8', '#1a2656'], clDark: ['#5a6fb4', '#1b2760', '#0b1235'], clMist: ['#9db0ea', '#5a70b8'],
  m1: ['#4a5ea8', '#273776', '#1a2563'], m2: ['#34478f', '#141d52'], m3: ['#1c2a68', '#0a1033'],
  lake: ['#334a92', '#1e2d6a', '#0a1236'], fg: ['#101a44', '#0a1130', '#050918'],
  aur: ['#5fe0c4', '#8f8cff', '#b48cff', '#ffd88a'],
};

export const L = (k: number): CSSProperties => ({ ['--k' as string]: k } as CSSProperties);

export function Defs({ pal = MOON_PAL }: { pal?: Pal }) {
  return (
    <svg className="land__defs" width="1" height="1" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="moon-disc" cx=".38" cy=".34" r=".8"><stop offset="0" stopColor="#fffaf0" /><stop offset=".55" stopColor="#f1e6cc" /><stop offset="1" stopColor="#c9c0b4" /></radialGradient>
        <radialGradient id="moon-halo"><stop offset="0" stopColor="#f6ecd2" stopOpacity=".55" /><stop offset=".25" stopColor="#c9d3f2" stopOpacity=".22" /><stop offset="1" stopColor="#5f7ccc" stopOpacity="0" /></radialGradient>
        <radialGradient id="sky-glow"><stop offset="0" stopColor={pal.glow[0]} stopOpacity=".55" /><stop offset=".5" stopColor={pal.glow[1]} stopOpacity=".22" /><stop offset="1" stopColor={pal.glow[1]} stopOpacity="0" /></radialGradient>
        <radialGradient id="gold-glow"><stop offset="0" stopColor="#ffd27a" stopOpacity=".9" /><stop offset="1" stopColor="#ffb34a" stopOpacity="0" /></radialGradient>
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={pal.haze} stopOpacity="0" /><stop offset=".6" stopColor={pal.haze} stopOpacity=".32" /><stop offset="1" stopColor={pal.haze} stopOpacity=".1" /></linearGradient>
        <linearGradient id="cl-lit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={pal.clLit[0]} stopOpacity=".85" /><stop offset=".5" stopColor={pal.clLit[1]} stopOpacity=".8" /><stop offset="1" stopColor={pal.clLit[2]} stopOpacity=".85" /></linearGradient>
        <linearGradient id="cl-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={pal.clDark[0]} stopOpacity=".9" /><stop offset=".4" stopColor={pal.clDark[1]} stopOpacity=".95" /><stop offset="1" stopColor={pal.clDark[2]} stopOpacity=".95" /></linearGradient>
        <linearGradient id="cl-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={pal.clMist[0]} stopOpacity=".5" /><stop offset="1" stopColor={pal.clMist[1]} stopOpacity=".08" /></linearGradient>
        <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={pal.m1[0]} /><stop offset=".5" stopColor={pal.m1[1]} /><stop offset="1" stopColor={pal.m1[2]} /></linearGradient>
        <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={pal.m2[0]} /><stop offset="1" stopColor={pal.m2[1]} /></linearGradient>
        <linearGradient id="m3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={pal.m3[0]} /><stop offset="1" stopColor={pal.m3[1]} /></linearGradient>
        <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={pal.lake[0]} /><stop offset=".25" stopColor={pal.lake[1]} /><stop offset="1" stopColor={pal.lake[2]} /></linearGradient>
        <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={pal.fg[0]} /><stop offset=".4" stopColor={pal.fg[1]} /><stop offset="1" stopColor={pal.fg[2]} /></linearGradient>
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
        <linearGradient id="aur1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={pal.aur[0]} stopOpacity="0" /><stop offset=".35" stopColor={pal.aur[0]} stopOpacity=".5" /><stop offset=".7" stopColor={pal.aur[1]} stopOpacity=".45" /><stop offset="1" stopColor={pal.aur[2]} stopOpacity="0" /></linearGradient>
        <linearGradient id="aur2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={pal.aur[3]} stopOpacity="0" /><stop offset=".5" stopColor={pal.aur[1]} stopOpacity=".38" /><stop offset="1" stopColor={pal.aur[0]} stopOpacity="0" /></linearGradient>
        <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6ecd2" stopOpacity=".26" /><stop offset="1" stopColor="#f6ecd2" stopOpacity="0" /></linearGradient>
        <clipPath id="clip-water"><rect x="-200" y={WATER} width="6000" height="400" /></clipPath>
      </defs>
    </svg>
  );
}

