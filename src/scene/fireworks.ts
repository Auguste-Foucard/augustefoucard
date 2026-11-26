// Gerbes de couleur façon feu d'artifice, déclenchées par les interactions avec les étoiles.
// Particules en DOM animées en transform/opacity (Web Animations) : composées par le GPU, légères sur mobile.

const PALETTES = [
  ['#ff7ab8', '#ffc2e0'], // rose
  ['#b48cff', '#e2d4ff'], // violet
  ['#6ee7ff', '#d2f7ff'], // cyan
  ['#ffd36e', '#fff1c4'], // or
  ['#7dffc8', '#d6ffef'], // menthe
  ['#ff9a6a', '#ffd8c4'], // corail
];
let live = 0;
const still = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function burst(host: HTMLElement, xPct: number, yPct: number, power = 1) {
  if (still() || live > 260) return;
  const small = window.innerWidth < 760;
  const n = Math.round((small ? 15 : 22) * power);
  const pals = [PALETTES[Math.floor(Math.random() * PALETTES.length)], PALETTES[Math.floor(Math.random() * PALETTES.length)]];
  const R = (small ? 92 : 125) * Math.sqrt(power);
  const wrap = document.createElement('span');
  wrap.className = 'fw';
  wrap.style.left = `${xPct}%`; wrap.style.top = `${yPct}%`;
  host.appendChild(wrap);

  // éclair de couleur au centre
  const flash = document.createElement('i');
  flash.className = 'fw__flash';
  flash.style.setProperty('--c', pals[0][0]);
  wrap.appendChild(flash);
  flash.animate([{ transform: 'scale(.2)', opacity: 0.9 }, { transform: `scale(${1.6 * Math.sqrt(power)})`, opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });

  let longest = 700;
  const off = Math.random() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const pal = pals[i % 2];
    const a = off + (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const d = R * (0.65 + Math.random() * 0.45);
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d;
    const g = 18 + Math.random() * 22; // légère retombée
    const dur = 1000 + Math.random() * 700;
    const p = document.createElement('i');
    p.className = 'fw__p';
    p.style.setProperty('--c', pal[0]); p.style.setProperty('--c2', pal[1]);
    const deg = (a * 180) / Math.PI;
    p.style.rotate = `${deg}deg`;
    wrap.appendChild(p);
    // traînée : la particule s'étire au départ puis devient un point qui retombe
    // la particule est tournée dans sa direction : on exprime la gravité (vers le bas de l'écran) dans son repère
    const sa = Math.sin(a), ca = Math.cos(a);
    const at = (r: number, k: number) => `translate(${(r + g * k * sa).toFixed(1)}px, ${(g * k * ca).toFixed(1)}px)`;
    p.animate([
      { transform: `${at(0, 0)} scaleX(.4)`, opacity: 1 },
      { transform: `${at(d * 0.72, 0.05)} scaleX(2.6)`, opacity: 1, offset: 0.28 },
      { transform: `${at(d, 0.35)} scaleX(1)`, opacity: 0.85, offset: 0.6 },
      { transform: `${at(d * 1.05, 1)} scaleX(.6)`, opacity: 0 },
    ], { duration: dur, easing: 'cubic-bezier(.15,.75,.3,1)', fill: 'forwards' });
    longest = Math.max(longest, dur);
    // scintillements secondaires
    if (power >= 0.7 && i % 2 === 0) {
      const s = document.createElement('i');
      s.className = 'fw__s';
      s.style.setProperty('--c', pal[1]);
      wrap.appendChild(s);
      const sx = dx * (0.9 + Math.random() * 0.3), sy = dy * (0.9 + Math.random() * 0.3) + g;
      const delay = dur * 0.55;
      s.animate([
        { transform: `translate(${sx}px, ${sy}px) scale(0)`, opacity: 0 },
        { transform: `translate(${sx}px, ${sy}px) scale(1.4)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${sx}px, ${sy + 14}px) scale(.3)`, opacity: 0 },
      ], { duration: 700, delay, easing: 'ease-out', fill: 'both' });
      longest = Math.max(longest, delay + 700);
    }
  }
  live += n;
  window.setTimeout(() => { wrap.remove(); live -= n; }, longest + 80);
}
