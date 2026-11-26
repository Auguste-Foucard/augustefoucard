import type { UIKey } from '../i18n/ui';

/** Menu principal : volontairement réduit à trois entrées. */
export const NAV: { path: string; key: UIKey }[] = [
  { path: '/games', key: 'nav.games' },
  { path: '/about', key: 'nav.about' },
  { path: '/contact', key: 'nav.contact' },
];

/** Espaces secondaires (toujours accessibles, mais discrets) : pied de page et menu. */
export const MORE: { path: string; key: UIKey }[] = [
  { path: '/music', key: 'nav.music' },
  { path: '/sound-design', key: 'nav.sound' },
  { path: '/archives', key: 'nav.archives' },
  { path: '/lab', key: 'nav.lab' },
];

export const isActive = (bare: string, path: string) => (path === '/' ? bare === '/' : bare === path || bare.startsWith(path + '/'));
