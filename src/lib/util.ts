/** Générateur pseudo-aléatoire déterministe à partir d'une chaîne (visuels temporaires stables). */
export function seeded(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/** Préfixe une URL de média avec la base Vite (utile si le site est servi dans un sous-dossier). */
export const asset = (p: string | null | undefined) => {
  if (!p) return null;
  if (/^(https?:|data:|blob:)/.test(p)) return p;
  return import.meta.env.BASE_URL.replace(/\/$/, '') + p;
};
