// Après le build : donne à AURA un numéro de version calculé à partir de son contenu.
// Le jeu installé sur l'écran d'accueil compare ce numéro à celui en ligne et se met à jour tout seul.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const dir = 'dist/play/aura';
if (!existsSync(dir)) process.exit(0);
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f !== 'version.json') files.push(p); } };
walk(dir); files.sort();
const h = createHash('sha256'); for (const f of files) { h.update(relative(dir, f)); h.update(readFileSync(f)); }
h.update(readFileSync(new URL(import.meta.url))); // une évolution de cette étape change aussi la version
const version = h.digest('hex').slice(0, 10);
for (const f of ['sw.js', 'index.html']) { const p = join(dir, f); writeFileSync(p, readFileSync(p, 'utf8').replaceAll('__AURA_VERSION__', version)); }

// Adresses uniques par version (?v=…) pour le code et le style : iOS garde parfois en mémoire d'anciens
// fichiers JavaScript même quand la page est neuve. Avec une adresse nouvelle, il est obligé de les recharger.
const tag = (url) => `${url}?v=${version}`;
const bust = (text) => text
  .replace(/(from\s+['"])(\.\/[\w-]+\.js)(['"])/g, (_, a, u, b) => a + tag(u) + b)
  .replace(/(import\(\s*['"])(\.\/[\w-]+\.js)(['"])/g, (_, a, u, b) => a + tag(u) + b);
for (const f of files.filter((f) => f.endsWith('.js') && f.includes('/js/'))) writeFileSync(f, bust(readFileSync(f, 'utf8')));
{ const p = join(dir, 'index.html'); writeFileSync(p, readFileSync(p, 'utf8').replace('./js/main.js"', `${tag('./js/main.js')}"`).replace('./aura.css"', `${tag('./aura.css')}"`)); }
{ const p = join(dir, 'sw.js'); writeFileSync(p, readFileSync(p, 'utf8').replace(/'(\.\/(?:js\/[\w-]+\.js|aura\.css))'/g, (_, u) => `'${tag(u)}'`)); }
writeFileSync(join(dir, 'version.json'), JSON.stringify({ version, built: new Date().toISOString() }) + '\n');
console.log(`AURA version ${version}`);
