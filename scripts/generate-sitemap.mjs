// Génère public/sitemap.xml à partir des contenus (lancé automatiquement avant chaque build).
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('..', import.meta.url);
const read = (f) => JSON.parse(readFileSync(new URL(`src/content/${f}`, root), 'utf8'));
const ORIGIN = 'https://augustefoucard.fr';
const paths = ['/', '/games', '/archives', '/sound-design', '/music', '/lab', '/about', '/contact',
  ...read('games.json').map((g) => `/games/${g.slug}`),
  ...read('lab.json').map((e) => `/lab/${e.slug}`)];
const en = (p) => (p === '/' ? '/en' : `/en${p}`);
const today = new Date().toISOString().slice(0, 10);
const entry = (loc, p) => `  <url>
    <loc>${ORIGIN}${loc}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="fr" href="${ORIGIN}${p}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}${en(p)}"/>
  </url>`;
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${paths.flatMap((p) => [entry(p, p), entry(en(p), p)]).join('\n')}
</urlset>
`;
writeFileSync(new URL('public/sitemap.xml', root), xml);
console.log(`sitemap.xml : ${paths.length * 2} URL`);
