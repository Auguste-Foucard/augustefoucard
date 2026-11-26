import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import type { L, Lang } from '../content/types';
import { ui, type UIKey } from './ui';

/** La langue est déduite de l'URL : /en/... → anglais, sinon français. */
export function langFromPath(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'fr';
}

/** Retire le préfixe de langue : "/en/games" → "/games". */
export function stripLang(pathname: string) {
  const p = pathname.replace(/^\/en(?=\/|$)/, '');
  return p === '' ? '/' : p;
}

export function withLang(path: string, lang: Lang) {
  if (lang === 'fr') return path;
  return path === '/' ? '/en' : `/en${path}`;
}

export function useLang() {
  const { pathname } = useLocation();
  const lang = langFromPath(pathname);
  const t = useCallback((k: UIKey) => ui[lang][k], [lang]);
  const l = useCallback((v: L | undefined | null) => (v ? (lang === 'en' && v.en ? v.en : v.fr) : ''), [lang]);
  const to = useCallback((p: string) => withLang(p, lang), [lang]);
  const other: Lang = lang === 'fr' ? 'en' : 'fr';
  const switchTo = withLang(stripLang(pathname), other);
  return { lang, t, l, to, other, switchTo, bare: stripLang(pathname) };
}
