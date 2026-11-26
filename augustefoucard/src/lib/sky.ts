import { useEffect, useSyncExternalStore } from 'react';

/**
 * État partagé du ciel : teinte (couleur d'ambiance du projet visité),
 * mode contemplatif, énergie de la musique.
 * Ce n'est pas du state React : le canvas le lit à chaque image sans re-render.
 */
type RGB = [number, number, number];

export const DEFAULT_TINT = '#3a56b0';

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const sky = {
  tintTarget: hexToRgb(DEFAULT_TINT) as RGB,
  contemplative: false,
  /** 0–1, lissé, alimenté par le lecteur audio. */
  energy: 0,
  bass: 0,
};

const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function setSkyTint(hex: string | null | undefined) {
  sky.tintTarget = hexToRgb(hex || DEFAULT_TINT);
  window.dispatchEvent(new Event('af-sky-tint'));
}

export function setContemplative(v: boolean) {
  if (sky.contemplative === v) return;
  sky.contemplative = v;
  document.documentElement.toggleAttribute('data-contemplate', v);
  emit();
}

export function useContemplative() {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => { subs.delete(f); }; },
    () => sky.contemplative,
    () => false,
  );
}

/** Teinte le ciel pendant que le composant est affiché. */
export function useSkyTint(hex: string | null | undefined) {
  useEffect(() => {
    setSkyTint(hex);
    return () => setSkyTint(null);
  }, [hex]);
}

/** Données audio partagées (barres du visualiseur) : lecteur → composants graphiques. */
export const bus = {
  bins: new Float32Array(48),
  playing: false,
};
