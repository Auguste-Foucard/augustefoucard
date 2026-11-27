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
const version = h.digest('hex').slice(0, 10);
for (const f of ['sw.js', 'index.html']) { const p = join(dir, f); writeFileSync(p, readFileSync(p, 'utf8').replaceAll('__AURA_VERSION__', version)); }
writeFileSync(join(dir, 'version.json'), JSON.stringify({ version, built: new Date().toISOString() }) + '\n');
console.log(`AURA version ${version}`);
