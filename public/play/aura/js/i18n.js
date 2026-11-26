// Textes du jeu (français par défaut, anglais si l'appareil est en anglais ou ?lang=en).
const S = {
  fr: {
    light: 'Lumière', level: 'Niveau',
    tabEvolve: 'Évolution', tabPowers: 'Pouvoirs', tabCodex: 'Collection', tabCalm: 'Sérénité', tabSettings: 'Réglages',
    start: 'Pose ton doigt et dessine', start2: 'Chaque geste crée de la Lumière',
    tapToBegin: 'Touche pour commencer',
    close: 'Fermer', buy: 'Éveiller', maxed: 'Accompli', locked: 'Endormi', requires: 'Demande',
    levelUp: 'Niveau {n}', formAwake: '{f} s’éveille', drawHint: 'Essaie de dessiner : {f}',
    powerAwake: 'Nouveau pouvoir : {p}', comboFound: 'Harmonie découverte', sleepingForm: '{f} sommeille encore… (niveau {n})',
    offline: 'Ton univers a rayonné en ton absence', welcome: 'Ton univers t’attendait',
    branchGesture: 'Le geste', branchLight: 'La lumière', branchHarmony: 'L’harmonie',
    forms: 'Formes', combos: 'Harmonies', unknown: '???', atLevel: 'niveau {n}',
    sound: 'Sons', music: 'Nappes', haptics: 'Vibrations', intensity: 'Intensité visuelle', palette: 'Palette',
    reduced: 'Mouvements réduits', night: 'Mode avant de dormir', lang: 'Langue', reset: 'Recommencer un univers',
    resetConfirm: 'Effacer tout ton univers et repartir de zéro ?', on: 'Oui', off: 'Non',
    free: 'Mode libre', freeDesc: 'Sans interface, sans score, sans objectif. Touche le coin en haut à droite pour revenir.',
    contemplate: 'Contempler', contemplateDesc: 'Ton univers s’anime tout seul. Laisse-toi porter.',
    breathe: 'Respirer', breatheDesc: 'Une lumière guide ta respiration, aussi longtemps que tu veux.',
    inhale: 'Inspire', hold: 'Garde', exhale: 'Expire', stop: 'Terminer',
    calmNote: 'Des moments facultatifs, pour le simple plaisir de ralentir.',
    silentHint: 'Pas de son ? Vérifie le mode silencieux de ton iPhone.',
    install: 'Installer AURA : Partager → Sur l’écran d’accueil',
    stats: '{s} gestes · {c} créations · {u} lumières dans ton univers',
    passive: '{v} / s en rayonnement',
    perLevel: 'par niveau',
  },
  en: {
    light: 'Light', level: 'Level',
    tabEvolve: 'Evolve', tabPowers: 'Powers', tabCodex: 'Collection', tabCalm: 'Serenity', tabSettings: 'Settings',
    start: 'Touch and draw', start2: 'Every gesture creates Light',
    tapToBegin: 'Tap to begin',
    close: 'Close', buy: 'Awaken', maxed: 'Complete', locked: 'Asleep', requires: 'Needs',
    levelUp: 'Level {n}', formAwake: '{f} awakens', drawHint: 'Try drawing: {f}',
    powerAwake: 'New power: {p}', comboFound: 'Harmony discovered', sleepingForm: '{f} is still asleep… (level {n})',
    offline: 'Your universe kept shining while you were away', welcome: 'Your universe was waiting',
    branchGesture: 'Gesture', branchLight: 'Light', branchHarmony: 'Harmony',
    forms: 'Shapes', combos: 'Harmonies', unknown: '???', atLevel: 'level {n}',
    sound: 'Sounds', music: 'Pads', haptics: 'Haptics', intensity: 'Visual intensity', palette: 'Palette',
    reduced: 'Reduced motion', night: 'Bedtime mode', lang: 'Language', reset: 'Start a new universe',
    resetConfirm: 'Erase your whole universe and start over?', on: 'On', off: 'Off',
    free: 'Free mode', freeDesc: 'No interface, no score, no goal. Touch the top-right corner to come back.',
    contemplate: 'Contemplate', contemplateDesc: 'Your universe moves on its own. Let it carry you.',
    breathe: 'Breathe', breatheDesc: 'A light guides your breathing, for as long as you like.',
    inhale: 'Breathe in', hold: 'Hold', exhale: 'Breathe out', stop: 'Finish',
    calmNote: 'Optional moments, simply for the pleasure of slowing down.',
    silentHint: 'No sound? Check your iPhone’s silent switch.',
    install: 'Install AURA: Share → Add to Home Screen',
    stats: '{s} gestures · {c} creations · {u} lights in your universe',
    passive: '{v} / s radiance',
    perLevel: 'per level',
  },
};

const q = new URLSearchParams(location.search).get('lang');
export let lang = q === 'en' || q === 'fr' ? q : (navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en';
export const setLang = (l) => { lang = l; document.documentElement.lang = l; };
export const t = (k, vars) => {
  let s = (S[lang] && S[lang][k]) ?? S.fr[k] ?? k;
  if (vars) for (const v in vars) s = s.replace('{' + v + '}', vars[v]);
  return s;
};
/** Texte bilingue embarqué dans les données : { fr, en }. */
export const L = (o) => (typeof o === 'string' ? o : o[lang] ?? o.fr);
