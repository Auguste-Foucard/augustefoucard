// Économie de Lumière : formes, pouvoirs, harmonies, arbre d'évolution, niveaux.
// Module pur (sans DOM) pour pouvoir être simulé hors navigateur.

export const FORMS = [
  { id: 'line', level: 1, value: 4, name: { fr: 'Ligne', en: 'Line' }, desc: { fr: 'Un ruban de lumière qui vibre comme une corde.', en: 'A ribbon of light that hums like a string.' } },
  { id: 'circle', level: 2, value: 11, name: { fr: 'Cercle', en: 'Circle' }, desc: { fr: 'Un anneau d’énergie qui se propage en ondes.', en: 'A ring of energy that ripples outwards.' } },
  { id: 'wave', level: 3, value: 16, name: { fr: 'Vague', en: 'Wave' }, desc: { fr: 'Une aurore suspendue qui ondule.', en: 'A hanging aurora that sways.' } },
  { id: 'spiral', level: 5, value: 26, name: { fr: 'Spirale', en: 'Spiral' }, desc: { fr: 'Un vortex coloré qui aspire la lumière.', en: 'A colourful vortex that draws light in.' } },
  { id: 'triangle', level: 8, value: 38, name: { fr: 'Triangle', en: 'Triangle' }, desc: { fr: 'Un prisme qui déploie un arc-en-ciel.', en: 'A prism that unfolds a rainbow.' } },
  { id: 'star', level: 10, value: 55, name: { fr: 'Étoile', en: 'Star' }, desc: { fr: 'Un feu d’artifice doux, puis une étoile de ton univers.', en: 'A soft firework, then a star in your universe.' } },
  { id: 'flower', level: 15, value: 85, name: { fr: 'Fleur', en: 'Flower' }, desc: { fr: 'Des pétales qui éclosent et s’envolent.', en: 'Petals that bloom and drift away.' } },
  { id: 'heart', level: 20, value: 120, name: { fr: 'Cœur', en: 'Heart' }, desc: { fr: 'Des pulsations colorées, comme un battement.', en: 'Colourful pulses, like a heartbeat.' } },
  { id: 'infinity', level: 25, value: 160, name: { fr: 'Infini', en: 'Infinity' }, desc: { fr: 'Une boucle de lumière qui ne s’arrête jamais.', en: 'A loop of light that never ends.' } },
  { id: 'mandala', level: 30, value: 240, name: { fr: 'Mandala', en: 'Mandala' }, desc: { fr: 'Une forme fermée tracée en kaléidoscope devient composition.', en: 'A closed shape drawn in kaleidoscope becomes a composition.' } },
  { id: 'galaxy', level: 50, value: 600, name: { fr: 'Galaxie', en: 'Galaxy' }, desc: { fr: 'Une grande spirale de trois tours fait naître un univers.', en: 'A wide three-turn spiral gives birth to a universe.' } },
];
export const FORM = Object.fromEntries(FORMS.map((f) => [f.id, f]));

export const POWERS = [
  { id: 'filaments', level: 1, name: { fr: 'Filaments', en: 'Filaments' }, desc: { fr: 'Dessine des rubans lumineux. Les formes prennent vie.', en: 'Draw glowing ribbons. Shapes come alive.' } },
  { id: 'fireworks', level: 4, name: { fr: 'Feux d’artifice', en: 'Fireworks' }, desc: { fr: 'Garde le doigt posé pour accumuler, relâche pour libérer.', en: 'Hold to gather light, release to let it bloom.' } },
  { id: 'water', level: 7, name: { fr: 'L’eau', en: 'Water' }, desc: { fr: 'Touche pour une goutte, garde le doigt posé pour une grande onde. Là où les ondes se croisent, la lumière s’élève.', en: 'Tap for a drop, hold for a great wave. Where ripples cross, light rises.' } },
  { id: 'magnet', level: 11, name: { fr: 'Magnétisme', en: 'Magnetism' }, desc: { fr: 'Garde le doigt posé pour rassembler le sable cosmique, relâche pour le faire éclater. Deux doigts le repoussent.', en: 'Hold to gather the cosmic sand, release to make it burst. Two fingers push it away.' } },
  { id: 'kaleido', level: 14, name: { fr: 'Kaléidoscope', en: 'Kaleidoscope' }, desc: { fr: 'Chaque geste se multiplie en symétrie.', en: 'Every gesture multiplies in symmetry.' } },
];
export const POWER = Object.fromEntries(POWERS.map((p) => [p.id, p]));

// Harmonies : combinaisons à découvrir. `need` = formes vivantes requises en même temps.
export const COMBOS = [
  { id: 'cosmic', need: { circle: 1, star: 1 }, value: 4, name: { fr: 'Explosion cosmique', en: 'Cosmic bloom' }, hint: { fr: 'Un anneau qui rencontre une étoile…', en: 'A ring meeting a star…' } },
  { id: 'vortex', need: { spiral: 2 }, value: 4, name: { fr: 'Vortex galactique', en: 'Galactic vortex' }, hint: { fr: 'Deux tourbillons qui se cherchent…', en: 'Two whirls seeking each other…' } },
  { id: 'garden', need: { flower: 3 }, value: 5, name: { fr: 'Jardin lumineux', en: 'Garden of light' }, hint: { fr: 'Quand les fleurs ne sont plus seules…', en: 'When flowers are no longer alone…' } },
  { id: 'constellation', need: { star: 3 }, value: 5, name: { fr: 'Constellation', en: 'Constellation' }, hint: { fr: 'Plusieurs étoiles finissent par se relier…', en: 'Several stars end up linking…' } },
  { id: 'pulse', need: { heart: 1, circle: 1 }, value: 4, name: { fr: 'Pulsation lumineuse', en: 'Luminous pulse' }, hint: { fr: 'Un battement dans un anneau…', en: 'A heartbeat inside a ring…' } },
  { id: 'aurora', need: { wave: 3 }, value: 4, name: { fr: 'Aurore boréale', en: 'Northern lights' }, hint: { fr: 'Plusieurs vagues dans le ciel…', en: 'Several waves in the sky…' } },
  { id: 'tide', need: { circle: 3 }, value: 3.5, name: { fr: 'Onde géante', en: 'Great wave' }, hint: { fr: 'Les anneaux aiment se rassembler…', en: 'Rings like to gather…' } },
  { id: 'starburst', need: { line: 1, star: 1 }, cross: true, value: 3.5, name: { fr: 'Éclat stellaire', en: 'Star shatter' }, hint: { fr: 'Un fil qui traverse une étoile…', en: 'A thread crossing a star…' } },
  { id: 'rainbow', need: { line: 1, triangle: 1 }, cross: true, value: 3.5, name: { fr: 'Prisme arc-en-ciel', en: 'Rainbow prism' }, hint: { fr: 'Un rayon qui traverse un prisme…', en: 'A ray passing through a prism…' } },
  { id: 'eternal', need: { infinity: 1, heart: 1 }, value: 5, name: { fr: 'Lien éternel', en: 'Eternal bond' }, hint: { fr: 'Un cœur et l’infini…', en: 'A heart and infinity…' } },
];
export const COMBO = Object.fromEntries(COMBOS.map((c) => [c.id, c]));

// Arbre d'évolution. `req` : [id, niveau] requis. Chaque niveau change visiblement l'expérience.
export const UPGRADES = [
  // Le geste
  { id: 'gain', branch: 'gesture', max: 120, base: 15, growth: 1.9, req: null, name: { fr: 'Éclat', en: 'Radiance' }, desc: { fr: 'Chaque geste rapporte plus de Lumière, les rubans brillent davantage.', en: 'Each gesture yields more Light, ribbons shine brighter.' }, fx: { fr: '×1,22 Lumière', en: '×1.22 Light' } },
  { id: 'particles', branch: 'gesture', max: 12, base: 20, growth: 1.85, req: null, name: { fr: 'Poussière d’étoiles', en: 'Stardust' }, desc: { fr: 'Plus de particules naissent de tes gestes.', en: 'More particles are born from your gestures.' }, fx: { fr: '+30 % particules', en: '+30% particles' } },
  { id: 'trails', branch: 'gesture', max: 14, base: 45, growth: 1.9, req: ['gain', 2], name: { fr: 'Traînées', en: 'Trails' }, desc: { fr: 'Les filaments durent plus longtemps, les étincelles laissent un sillage.', en: 'Filaments linger longer, sparks leave a wake.' }, fx: { fr: '+25 % longueur', en: '+25% length' } },
  // La lumière
  { id: 'colors', branch: 'light', max: 8, base: 30, growth: 2.05, req: ['particles', 1], name: { fr: 'Prisme', en: 'Prism' }, desc: { fr: 'Les couleurs s’ouvrent peu à peu jusqu’à l’arc-en-ciel iridescent.', en: 'Colours slowly open up into an iridescent rainbow.' }, fx: { fr: '+ teintes', en: '+ hues' } },
  { id: 'bursts', branch: 'light', max: 14, base: 70, growth: 1.95, req: ['colors', 1], name: { fr: 'Éclosion', en: 'Bloom' }, desc: { fr: 'Les explosions deviennent plus amples et plus douces.', en: 'Bursts grow wider and softer.' }, fx: { fr: '+ ampleur', en: '+ scale' } },
  { id: 'life', branch: 'light', max: 14, base: 90, growth: 1.95, req: ['trails', 1], name: { fr: 'Persistance', en: 'Persistence' }, desc: { fr: 'Tes créations vivent plus longtemps avant de se transformer.', en: 'Your creations live longer before transforming.' }, fx: { fr: '+25 % durée', en: '+25% lifetime' } },
  { id: 'bloom', branch: 'light', max: 6, base: 220, growth: 2.6, req: ['bursts', 2], name: { fr: 'Floraison', en: 'Flourish' }, desc: { fr: 'Les animations se complexifient : anneaux, pétales, gerbes secondaires.', en: 'Animations deepen: extra rings, petals, secondary sprays.' }, fx: { fr: '+ complexité', en: '+ complexity' } },
  // L'harmonie
  { id: 'resonance', branch: 'harmony', max: 8, base: 40, growth: 2.1, req: null, name: { fr: 'Résonance', en: 'Resonance' }, desc: { fr: 'Les sons s’enrichissent : harmonies, échos, nappes plus profondes.', en: 'Sounds grow richer: harmonies, echoes, deeper pads.' }, fx: { fr: '+ richesse', en: '+ richness' } },
  { id: 'links', branch: 'harmony', max: 12, base: 140, growth: 2.2, req: ['resonance', 1], name: { fr: 'Affinités', en: 'Affinities' }, desc: { fr: 'Les formes se reconnaissent de plus loin et réagissent en chaîne.', en: 'Shapes sense each other from further away and chain-react.' }, fx: { fr: '+ réactions', en: '+ reactions' } },
  { id: 'radiance', branch: 'harmony', max: 40, base: 120, growth: 1.9, req: ['links', 1], name: { fr: 'Rayonnement', en: 'Glow' }, desc: { fr: 'Ton univers produit davantage de Lumière, même au repos.', en: 'Your universe produces more Light, even at rest.' }, fx: { fr: '+30 % passif', en: '+30% passive' } },
];
export const UPGRADE = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

export const upCost = (id, lvl) => Math.ceil(UPGRADE[id].base * Math.pow(UPGRADE[id].growth, lvl));

/** Lumière totale (cumulée) nécessaire pour atteindre le niveau n. */
export const xpFor = (n) => (n <= 1 ? 0 : Math.round(34 * Math.pow(n - 1, 2) * Math.pow(1.2, n - 1)));
export const MAX_LEVEL = 100;

export function newState() {
  return {
    v: 1,
    light: 0, total: 0, level: 1,
    up: Object.fromEntries(UPGRADES.map((u) => [u.id, 0])),
    forms: {}, combos: {}, power: 'filaments',
    universe: { stars: [], flowers: [], galaxies: [], loops: [], constellations: [], auroras: [], nebula: [] },
    settings: { sound: 0.7, music: 0.6, haptics: true, intensity: 1, palette: 'aurora', reduced: false, night: false, lang: null },
    stats: { strokes: 0, created: 0, time: 0, breaths: 0, sleeps: 0 },
    seen: {}, lastSeen: Date.now(), dawns: 0, quests: {},
  };
}

// Multiplicateurs dérivés de l'état.
export const gainMult = (s) => Math.pow(1.22, s.up.gain) * (1 + 0.03 * s.up.particles) * (1 + 0.05 * s.up.resonance) * dawnMult(s);
/** Bonus permanent des Nouvelles aubes : +25 % de Lumière par aube. */
export const dawnMult = (s) => 1 + 0.25 * (s.dawns || 0);
export const DAWN_LEVEL = 35;
/** Aubes gagnées en recommençant maintenant (au moins 1 dès le niveau 35). */
export const dawnGain = (s) => (s.level < DAWN_LEVEL ? 0 : Math.max(1, Math.floor(Math.sqrt(s.total / xpFor(DAWN_LEVEL)))));
export const comboMult = (s) => 1 + 0.25 * s.up.links;
export const passiveMult = (s) => gainMult(s) * (1 + 0.3 * s.up.radiance);

/** Valeur d'une forme, selon sa taille relative (0..1) et sa qualité de tracé. */
export function formValue(s, id, size = 0.5) {
  const f = FORM[id];
  const base = f ? f.value : 2;
  return base * (0.75 + 0.6 * Math.min(1, size)) * gainMult(s);
}

/** Production passive par seconde de l'univers (reste secondaire). */
export function passiveRate(s) {
  const u = s.universe;
  const raw = u.stars.length * 0.04 + u.flowers.length * 0.06 + u.loops.length * 0.25 + u.constellations.length * 0.35 + u.galaxies.length * 0.9 + u.auroras.length * 0.4;
  return raw * passiveMult(s);
}

export function reqMet(s, u) { return !u.req || s.up[u.req[0]] >= u.req[1]; }

/** Ajoute de la Lumière. Renvoie la liste des niveaux franchis. */
export function earn(s, amount) {
  s.light += amount; s.total += amount;
  const ups = [];
  while (s.level < MAX_LEVEL && s.total >= xpFor(s.level + 1)) { s.level++; ups.push(s.level); }
  return ups;
}

// ---------- Le Chemin : objectifs doux, à accomplir à son rythme ----------
// tier → récompense (×gainMult au moment de l'accomplir). `palette` : palette débloquée.
const Q = (id, tier, goal, metric, fr, en, palette = null) => ({ id, tier, goal, metric, name: { fr, en }, palette });
const formN = (f) => (s) => s.forms[f] || 0;
const totalForms = (s) => Object.values(s.forms).reduce((a, b) => a + b, 0);
const u = (k) => (s) => (s.universe[k] || []).length;
export const QUESTS = [
  Q('first', 1, 1, totalForms, 'Première lumière', 'First light'),
  Q('lines', 1, 25, formN('line'), 'Fils de lumière · 25 lignes', 'Threads of light · 25 lines'),
  Q('circles', 1, 25, formN('circle'), 'Anneaux · 25 cercles', 'Rings · 25 circles'),
  Q('waves', 2, 20, formN('wave'), 'Houle · 20 vagues', 'Swell · 20 waves'),
  Q('spirals', 2, 15, formN('spiral'), 'Tourbillons · 15 spirales', 'Whirls · 15 spirals'),
  Q('triangles', 2, 10, formN('triangle'), 'Prismes · 10 triangles', 'Prisms · 10 triangles'),
  Q('stars', 2, 10, formN('star'), 'Pluie d’étoiles · 10 étoiles', 'Starfall · 10 stars'),
  Q('flowers', 3, 10, formN('flower'), 'Bouquet · 10 fleurs', 'Bouquet · 10 flowers'),
  Q('hearts', 3, 5, formN('heart'), 'Battements · 5 cœurs', 'Heartbeats · 5 hearts'),
  Q('infinity', 3, 5, formN('infinity'), 'Boucles · 5 infinis', 'Loops · 5 infinities'),
  Q('mandala', 4, 3, formN('mandala'), 'Rosaces · 3 mandalas', 'Rosettes · 3 mandalas'),
  Q('galaxy', 5, 1, formN('galaxy'), 'Naissance d’un univers · 1 galaxie', 'Birth of a universe · 1 galaxy'),
  Q('creations100', 2, 100, (s) => s.stats.created, '100 créations', '100 creations'),
  Q('creations500', 4, 500, (s) => s.stats.created, '500 créations', '500 creations'),
  Q('strokes', 3, 1000, (s) => s.stats.strokes, '1 000 gestes', '1,000 gestures'),
  Q('combos3', 2, 3, (s) => Object.keys(s.combos).length, '3 harmonies découvertes', '3 harmonies found'),
  Q('combos6', 3, 6, (s) => Object.keys(s.combos).length, '6 harmonies découvertes', '6 harmonies found', 'nebula'),
  Q('combos10', 5, 10, (s) => Object.keys(s.combos).length, 'Toutes les harmonies', 'Every harmony', 'iris'),
  Q('stars50', 3, 50, u('stars'), 'Ciel étoilé · 50 étoiles dans ton univers', 'Starry sky · 50 stars in your universe'),
  Q('flowers20', 3, 20, u('flowers'), 'Jardin · 20 fleurs dans ton univers', 'Garden · 20 flowers in your universe', 'coral'),
  Q('galaxies3', 4, 3, u('galaxies'), 'Amas · 3 galaxies dans ton univers', 'Cluster · 3 galaxies in your universe'),
  Q('constellations3', 3, 3, u('constellations'), '3 constellations', '3 constellations'),
  Q('level10', 1, 10, (s) => s.level, 'Niveau 10', 'Level 10'),
  Q('level25', 2, 25, (s) => s.level, 'Niveau 25', 'Level 25'),
  Q('level50', 4, 50, (s) => s.level, 'Niveau 50', 'Level 50'),
  Q('level75', 5, 75, (s) => s.level, 'Niveau 75', 'Level 75'),
  Q('level100', 5, 100, (s) => s.level, 'Niveau 100', 'Level 100'),
  Q('dawn1', 3, 1, (s) => s.dawns || 0, 'Première aube', 'First dawn', 'gold'),
  Q('dawn10', 5, 10, (s) => s.dawns || 0, '10 aubes', '10 dawns'),
  Q('breath1', 1, 1, (s) => s.stats.breaths || 0, 'Une respiration guidée', 'One guided breathing'),
  Q('breath10', 3, 10, (s) => s.stats.breaths || 0, '10 respirations guidées', '10 guided breathings'),
  Q('sleep1', 1, 1, (s) => s.stats.sleeps || 0, 'Un soir en douceur', 'A gentle evening', 'frost'),
  Q('sleep7', 3, 7, (s) => s.stats.sleeps || 0, '7 soirs en douceur', '7 gentle evenings'),
  Q('time1', 2, 3600, (s) => s.stats.time, '1 heure de lumière', '1 hour of light'),
  Q('time10', 4, 36000, (s) => s.stats.time, '10 heures de lumière', '10 hours of light'),
];
export const QUEST_REWARD = [0, 40, 160, 650, 2600, 10000];
export const questReward = (s, q) => QUEST_REWARD[q.tier] * gainMult(s);
/** Palettes à débloquer sur le Chemin (id de palette → objectif). */
export const PALETTE_UNLOCK = Object.fromEntries(QUESTS.filter((q) => q.palette).map((q) => [q.palette, q.id]));
