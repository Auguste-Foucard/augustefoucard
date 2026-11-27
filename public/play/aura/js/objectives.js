// Le fil des objectifs : un seul objectif à la fois, qui fait découvrir le jeu pas à pas
// jusqu'à rallumer tout le ciel. Les objectifs « relatifs » comptent à partir du moment où ils apparaissent.
import { SKY } from './sky.js';

const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
const F = (type, n, fr, en, tab = null) => ({ kind: 'form', type, n, name: { fr, en }, rel: true, metric: (s) => s.forms[type] || 0, tab });
const LV = (n, fr, en) => ({ kind: 'level', n, name: { fr, en }, metric: (s) => s.level, tab: null });
const SK = (id) => { const c = SKY.find((x) => x.id === id); return { kind: 'sky', id, n: 1, name: { fr: 'Réveille ' + c.name.fr, en: 'Awaken ' + c.name.en }, metric: (s) => ((s.sky || []).includes(id) ? 1 : 0), tab: 'sky' }; };
const PW = (id, fr, en) => ({ kind: 'power', id, n: 1, name: { fr, en }, rel: true, metric: (s) => (s.stats.powers || {})[id] || 0, tab: 'powers' });
const X = (kind, n, metric, fr, en, tab = null, rel = true) => ({ kind, n, metric, name: { fr, en }, rel, tab });

export const OBJECTIVES = [
  F('line', 1, 'Trace une ligne de lumière', 'Draw a line of light'),
  F('line', 3, 'Trace 3 lignes', 'Draw 3 lines'),
  LV(2, 'Atteins le niveau 2', 'Reach level 2'),
  F('circle', 1, 'Dessine un cercle', 'Draw a circle'),
  X('buy', 1, (s) => sum(s.up), 'Éveille une amélioration (Évolution)', 'Awaken an upgrade (Evolve)', 'evolve'),
  SK('plume'),
  LV(3, 'Atteins le niveau 3', 'Reach level 3'),
  F('wave', 1, 'Dessine une vague', 'Draw a wave'),
  PW('fireworks', 'Essaie les Feux d’artifice (Pouvoirs)', 'Try Fireworks (Powers)'),
  SK('oiseau'),
  X('combo', 1, (s) => Object.keys(s.combos).length, 'Découvre une harmonie : 3 cercles d’affilée', 'Discover a harmony: 3 circles in a row', null),
  F('spiral', 1, 'Dessine une spirale', 'Draw a spiral'),
  SK('barque'),
  PW('water', 'Essaie l’Eau (Pouvoirs)', 'Try Water (Powers)'),
  F('triangle', 1, 'Dessine un triangle', 'Draw a triangle'),
  SK('couronne'),
  F('star', 1, 'Dessine une étoile', 'Draw a star'),
  X('cosmic', 1, (s) => s.combos.cosmic || 0, 'Fais naître une explosion cosmique : un cercle et une étoile', 'Make a cosmic bloom: a circle and a star'),
  PW('magnet', 'Essaie le Magnétisme (Pouvoirs)', 'Try Magnetism (Powers)'),
  SK('lanterne'),
  PW('kaleido', 'Essaie le Kaléidoscope (Pouvoirs)', 'Try the Kaleidoscope (Powers)'),
  F('flower', 1, 'Dessine une fleur', 'Draw a flower'),
  SK('phare'),
  X('breathe', 1, (s) => s.stats.breaths || 0, 'Respire avec la fleur de lumière (Sérénité)', 'Breathe with the flower of light (Serenity)', 'calm'),
  SK('cle'),
  F('heart', 1, 'Dessine un cœur', 'Draw a heart'),
  SK('arbre'),
  F('infinity', 1, 'Dessine un infini', 'Draw an infinity sign'),
  SK('cerf'),
  F('mandala', 1, 'Dessine une forme fermée en Kaléidoscope', 'Draw a closed shape in Kaleidoscope'),
  SK('harpe'),
  X('dawn', 1, (s) => s.dawns || 0, 'Fais naître une Nouvelle aube (Évolution)', 'Bring a New dawn (Evolve)', 'evolve'),
  SK('baleine'),
  SK('coeur'),
];

/** Objectif en cours (ou null quand tout est accompli). */
export function currentObjective(s) {
  const i = s.obj?.i ?? 0; const o = OBJECTIVES[i]; if (!o) return null;
  const base = o.rel ? (s.obj?.base ?? 0) : 0; const v = Math.max(0, o.metric(s) - base);
  return { i, o, v: Math.min(v, o.n), done: v >= o.n };
}
/** Passe à l'objectif suivant en mémorisant le point de départ des objectifs « relatifs ». */
export function advanceObjective(s) {
  const i = (s.obj?.i ?? 0) + 1; const o = OBJECTIVES[i];
  s.obj = { i, base: o && o.rel ? o.metric(s) : 0 };
}
