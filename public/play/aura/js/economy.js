// Économie de Lumière : formes, pouvoirs, harmonies, arbre d'évolution, niveaux.
// Module pur (sans DOM) pour pouvoir être simulé hors navigateur.

export const FORMS = [
  { id: 'line', level: 1, value: 4, name: { fr: 'Ligne', en: 'Line' }, desc: { fr: 'La ligne vibre, puis part en étincelles.', en: 'The line vibrates, then breaks into sparks.' } },
  { id: 'circle', level: 2, value: 11, name: { fr: 'Cercle', en: 'Circle' }, desc: { fr: 'L’anneau tourne et envoie des ondes.', en: 'The ring spins and sends out ripples.' } },
  { id: 'wave', level: 3, value: 16, name: { fr: 'Vague', en: 'Wave' }, desc: { fr: 'La vague se transforme en aurore boréale.', en: 'The wave turns into northern lights.' } },
  { id: 'spiral', level: 5, value: 26, name: { fr: 'Spirale', en: 'Spiral' }, desc: { fr: 'La spirale aspire les particules autour d’elle.', en: 'The spiral pulls in the particles around it.' } },
  { id: 'triangle', level: 8, value: 38, name: { fr: 'Triangle', en: 'Triangle' }, desc: { fr: 'Le triangle projette un arc-en-ciel.', en: 'The triangle casts a rainbow.' } },
  { id: 'star', level: 10, value: 55, name: { fr: 'Étoile', en: 'Star' }, desc: { fr: 'L’étoile explose comme un feu d’artifice et reste dans ton ciel.', en: 'The star bursts like a firework and stays in your sky.' } },
  { id: 'flower', level: 15, value: 85, name: { fr: 'Fleur', en: 'Flower' }, desc: { fr: 'La fleur s’ouvre, puis perd ses pétales.', en: 'The flower opens, then sheds its petals.' } },
  { id: 'heart', level: 20, value: 120, name: { fr: 'Cœur', en: 'Heart' }, desc: { fr: 'Le cœur bat, puis projette une nuée de petits cœurs.', en: 'The heart beats, then sends out a cloud of little hearts.' } },
  { id: 'infinity', level: 25, value: 160, name: { fr: 'Infini', en: 'Infinity' }, desc: { fr: 'Des points de lumière tournent sur la boucle.', en: 'Dots of light travel around the loop.' } },
  { id: 'mandala', level: 30, value: 240, name: { fr: 'Mandala', en: 'Mandala' }, desc: { fr: 'Une forme fermée tracée avec le Kaléidoscope.', en: 'A closed shape drawn with the Kaleidoscope.' } },
  { id: 'galaxy', level: 50, value: 600, name: { fr: 'Galaxie', en: 'Galaxy' }, desc: { fr: 'Une grande spirale d’au moins trois tours.', en: 'A large spiral with at least three turns.' } },
];
export const FORM = Object.fromEntries(FORMS.map((f) => [f.id, f]));

export const POWERS = [
  { id: 'filaments', level: 1, name: { fr: 'Filaments', en: 'Filaments' }, desc: { fr: 'Le pouvoir de départ : tu dessines, et les formes reconnues s’animent.', en: 'The starting power: draw, and recognised shapes come alive.' } },
  { id: 'fireworks', level: 4, name: { fr: 'Feux d’artifice', en: 'Fireworks' }, desc: { fr: 'Garde le doigt posé pour charger, lâche pour faire exploser.', en: 'Hold to charge, let go to explode.' } },
  { id: 'water', level: 7, name: { fr: 'L’eau', en: 'Water' }, desc: { fr: 'Touche pour faire une goutte. Garde le doigt posé pour une grosse vague.', en: 'Tap for a drop. Hold for a big wave.' } },
  { id: 'magnet', level: 11, name: { fr: 'Magnétisme', en: 'Magnetism' }, desc: { fr: 'Garde le doigt posé pour attirer le sable, lâche pour le faire exploser. Avec deux doigts, tu le repousses.', en: 'Hold to pull the sand in, let go to burst it. Two fingers push it away.' } },
  { id: 'kaleido', level: 14, name: { fr: 'Kaléidoscope', en: 'Kaleidoscope' }, desc: { fr: 'Ton trait est recopié en miroir tout autour du centre.', en: 'Your stroke is mirrored all around the centre.' } },
];
export const POWER = Object.fromEntries(POWERS.map((p) => [p.id, p]));

// Harmonies : combinaisons à découvrir. `need` = formes vivantes requises en même temps.
export const COMBOS = [
  { id: 'cosmic', need: { circle: 1, star: 1 }, value: 4, name: { fr: 'Explosion cosmique', en: 'Cosmic bloom' }, hint: { fr: 'Un cercle et une forme à pointes', en: 'A circle and a pointy shape' } },
  { id: 'vortex', need: { spiral: 2 }, value: 4, name: { fr: 'Vortex galactique', en: 'Galactic vortex' }, hint: { fr: 'Deux formes qui tournent', en: 'Two shapes that spin' } },
  { id: 'garden', need: { flower: 3 }, value: 5, name: { fr: 'Jardin lumineux', en: 'Garden of light' }, hint: { fr: 'Plusieurs fleurs', en: 'Several flowers' } },
  { id: 'constellation', need: { star: 3 }, value: 5, name: { fr: 'Constellation', en: 'Constellation' }, hint: { fr: 'Plusieurs étoiles', en: 'Several stars' } },
  { id: 'pulse', need: { heart: 1, circle: 1 }, value: 4, name: { fr: 'Pulsation lumineuse', en: 'Luminous pulse' }, hint: { fr: 'Un cœur et un cercle', en: 'A heart and a circle' } },
  { id: 'aurora', need: { wave: 3 }, value: 4, name: { fr: 'Aurore boréale', en: 'Northern lights' }, hint: { fr: 'Plusieurs vagues', en: 'Several waves' } },
  { id: 'tide', need: { circle: 3 }, value: 3.5, name: { fr: 'Onde géante', en: 'Great wave' }, hint: { fr: 'Plusieurs cercles', en: 'Several circles' } },
  { id: 'starburst', need: { line: 1, star: 1 }, cross: true, value: 3.5, name: { fr: 'Éclat stellaire', en: 'Star shatter' }, hint: { fr: 'Une ligne qui coupe une étoile', en: 'A line through a star' } },
  { id: 'rainbow', need: { line: 1, triangle: 1 }, cross: true, value: 3.5, name: { fr: 'Prisme arc-en-ciel', en: 'Rainbow prism' }, hint: { fr: 'Une ligne qui coupe un triangle', en: 'A line through a triangle' } },
  { id: 'eternal', need: { infinity: 1, heart: 1 }, value: 5, name: { fr: 'Lien éternel', en: 'Eternal bond' }, hint: { fr: 'Un cœur et un infini', en: 'A heart and an infinity sign' } },
];
export const COMBO = Object.fromEntries(COMBOS.map((c) => [c.id, c]));

// Arbre d'évolution. `req` : [id, niveau] requis. Chaque niveau change visiblement l'expérience.
export const UPGRADES = [
  // Le geste
  { id: 'gain', branch: 'gesture', max: 120, base: 15, growth: 1.9, req: null, name: { fr: 'Éclat', en: 'Radiance' }, desc: { fr: 'Plus de Lumière à chaque geste.', en: 'More Light from every gesture.' }, fx: { fr: '×1,22 Lumière', en: '×1.22 Light' } },
  { id: 'particles', branch: 'gesture', max: 12, base: 20, growth: 1.85, req: null, name: { fr: 'Poussière d’étoiles', en: 'Stardust' }, desc: { fr: 'Plus de particules.', en: 'More particles.' }, fx: { fr: '+30 % particules', en: '+30% particles' } },
  { id: 'trails', branch: 'gesture', max: 14, base: 45, growth: 1.9, req: ['gain', 2], name: { fr: 'Traînées', en: 'Trails' }, desc: { fr: 'Tes traits restent plus longtemps à l’écran.', en: 'Your strokes stay on screen longer.' }, fx: { fr: '+25 % longueur', en: '+25% length' } },
  // La lumière
  { id: 'colors', branch: 'light', max: 8, base: 30, growth: 2.05, req: ['particles', 1], name: { fr: 'Prisme', en: 'Prism' }, desc: { fr: 'Plus de couleurs, jusqu’à tout l’arc-en-ciel.', en: 'More colours, up to the full rainbow.' }, fx: { fr: '+ teintes', en: '+ hues' } },
  { id: 'bursts', branch: 'light', max: 14, base: 70, growth: 1.95, req: ['colors', 1], name: { fr: 'Éclosion', en: 'Bloom' }, desc: { fr: 'Des explosions plus grandes.', en: 'Bigger bursts.' }, fx: { fr: '+ ampleur', en: '+ scale' } },
  { id: 'life', branch: 'light', max: 14, base: 90, growth: 1.95, req: ['trails', 1], name: { fr: 'Persistance', en: 'Persistence' }, desc: { fr: 'Les formes restent plus longtemps.', en: 'Shapes last longer.' }, fx: { fr: '+25 % durée', en: '+25% lifetime' } },
  { id: 'bloom', branch: 'light', max: 6, base: 220, growth: 2.6, req: ['bursts', 2], name: { fr: 'Floraison', en: 'Flourish' }, desc: { fr: 'Des animations plus détaillées.', en: 'More detailed animations.' }, fx: { fr: '+ complexité', en: '+ complexity' } },
  // L'harmonie
  { id: 'resonance', branch: 'harmony', max: 8, base: 40, growth: 2.1, req: null, name: { fr: 'Résonance', en: 'Resonance' }, desc: { fr: 'Des sons plus riches.', en: 'Richer sounds.' }, fx: { fr: '+ richesse', en: '+ richness' } },
  { id: 'links', branch: 'harmony', max: 12, base: 140, growth: 2.2, req: ['resonance', 1], name: { fr: 'Affinités', en: 'Affinities' }, desc: { fr: 'Les harmonies se déclenchent plus facilement.', en: 'Harmonies trigger more easily.' }, fx: { fr: '+ réactions', en: '+ reactions' } },
  { id: 'radiance', branch: 'harmony', max: 40, base: 120, growth: 1.9, req: ['links', 1], name: { fr: 'Rayonnement', en: 'Glow' }, desc: { fr: 'Ton univers rapporte plus de Lumière quand tu ne joues pas.', en: 'Your universe earns more Light while you’re not playing.' }, fx: { fr: '+30 % passif', en: '+30% passive' } },
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
    seen: {}, lastSeen: Date.now(), dawns: 0, quests: {}, sky: [],
  };
}

// Multiplicateurs dérivés de l'état.
export const gainMult = (s) => Math.pow(1.22, s.up.gain) * (1 + 0.03 * s.up.particles) * (1 + 0.05 * s.up.resonance) * dawnMult(s) * skyBonus(s);
/** Chaque constellation rallumée : +12 % de Lumière pour toujours. */
export const skyBonus = (s) => 1 + 0.12 * (s.sky || []).length;
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
