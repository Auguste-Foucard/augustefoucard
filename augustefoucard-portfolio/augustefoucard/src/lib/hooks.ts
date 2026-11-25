import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { site } from '../content';
import { useLang } from '../i18n/lang';

/** Pointeur précis (souris) : on active les effets magnétiques et de survol uniquement dans ce cas. */
export function useFinePointer() {
  const [fine, setFine] = useState(() => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const on = () => setFine(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return fine;
}

/** Effets « riches » autorisés : souris + pas de préférence de réduction des animations. */
export function useRichMotion() {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  return fine && !reduce;
}

const ORIGIN = 'https://augustefoucard.fr';

/** Titre, description, canonique et alternates hreflang pour chaque page. */
export function useMeta(title: string | null, description?: string) {
  const { lang, bare, l } = useLang();
  useEffect(() => {
    const full = title ? `${title} — ${site.name}` : `${site.name} — ${site.roles.join(' · ')}`;
    document.title = full;
    document.documentElement.lang = lang;
    const desc = description || l(site.description);
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:locale', lang === 'fr' ? 'fr_FR' : 'en_US');
    const frUrl = ORIGIN + bare;
    const enUrl = ORIGIN + (bare === '/' ? '/en' : '/en' + bare);
    setMeta('property', 'og:url', lang === 'fr' ? frUrl : enUrl);
    setLink('canonical', lang === 'fr' ? frUrl : enUrl);
    setLink('alternate', frUrl, 'fr');
    setLink('alternate', enUrl, 'en');
    setLink('alternate', frUrl, 'x-default');
  }, [title, description, lang, bare, l]);
}

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

function setLink(rel: string, href: string, hreflang?: string) {
  const sel = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(sel);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    if (hreflang) el.hreflang = hreflang;
    document.head.appendChild(el);
  }
  el.href = href;
}
