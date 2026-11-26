/** Ressenti de jeu : vibration légère, ondes au toucher, aimant des boutons, inclinaison des cartes, profondeur au défilement. */
const INTERACTIVE = 'button, a, [role="button"], .gcard2__link';
const MAGNET = '.btn--glow, .filter2, .music-btn';
const TILT = '.gcard2:not(.gcard2--slot) .gcard2__link';

export const haptic = (ms = 6) => { try { navigator.vibrate?.(ms); } catch { /* non supporté */ } };

export function initFeel() {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const down = (e: PointerEvent) => {
    const el = (e.target as Element | null)?.closest?.(INTERACTIVE);
    if (!el) return;
    haptic(6);
    if (!still) window.dispatchEvent(new CustomEvent('af:tap', { detail: { x: e.clientX, y: e.clientY, strong: el.matches('.btn--glow, .filter2') } }));
  };
  document.addEventListener('pointerdown', down, { passive: true });

  // profondeur au défilement : l'accueil se dissout doucement, le paysage glisse par couches
  let raf = 0;
  const scroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const hero = document.querySelector<HTMLElement>('.hero2');
      if (hero) hero.style.setProperty('--sy', Math.min(1.4, Math.max(0, window.scrollY / window.innerHeight)).toFixed(3));
    });
  };
  if (!still) { window.addEventListener('scroll', scroll, { passive: true }); scroll(); }

  let magnet: HTMLElement | null = null, tilt: HTMLElement | null = null;
  const reset = (el: HTMLElement | null, kind: 'm' | 't') => {
    if (!el) return;
    if (kind === 'm') el.style.translate = ''; else { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); }
  };
  const move = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || still) return;
    const t = e.target as Element | null;
    const m = (t?.closest?.(MAGNET) as HTMLElement | null) ?? null;
    if (m !== magnet) { reset(magnet, 'm'); magnet = m; }
    if (m) {
      const r = m.getBoundingClientRect();
      const dx = Math.max(-9, Math.min(9, (e.clientX - (r.left + r.width / 2)) * 0.22));
      const dy = Math.max(-7, Math.min(7, (e.clientY - (r.top + r.height / 2)) * 0.22));
      m.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
    }
    const c = (t?.closest?.(TILT) as HTMLElement | null) ?? null;
    if (c !== tilt) { reset(tilt, 't'); tilt = c; }
    if (c) {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--rx', (((e.clientX - r.left) / r.width - 0.5) * 9).toFixed(2));
      c.style.setProperty('--ry', (-((e.clientY - r.top) / r.height - 0.5) * 7).toFixed(2));
    }
  };
  if (fine) document.addEventListener('pointermove', move, { passive: true });
  return () => { document.removeEventListener('pointerdown', down); window.removeEventListener('scroll', scroll); document.removeEventListener('pointermove', move); };
}
