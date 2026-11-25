import type { UIKey } from '../i18n/ui';

export const NAV: { path: string; key: UIKey; short?: boolean }[] = [
  { path: '/', key: 'nav.home' },
  { path: '/games', key: 'nav.games', short: true },
  { path: '/archives', key: 'nav.archives' },
  { path: '/sound-design', key: 'nav.sound', short: true },
  { path: '/music', key: 'nav.music', short: true },
  { path: '/lab', key: 'nav.lab', short: true },
  { path: '/about', key: 'nav.about' },
  { path: '/contact', key: 'nav.contact' },
];

export const isActive = (bare: string, path: string) => (path === '/' ? bare === '/' : bare === path || bare.startsWith(path + '/'));
