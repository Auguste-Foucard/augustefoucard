/**
 * Modèle de contenu du site.
 * Tous les contenus vivent dans les fichiers JSON de ce dossier :
 * ajoute une entrée, relance le site, c'est tout.
 *
 * Champs texte bilingues : { "fr": "...", "en": "..." }.
 * Si la version anglaise est vide, la version française est affichée.
 *
 * `placeholder: true` affiche un badge « Contenu temporaire » sur l'élément.
 * Retire-le (ou passe-le à false) quand le contenu est définitif.
 */

export type Lang = 'fr' | 'en';
export type L = { fr: string; en?: string };

export type Link = { label: L; url: string };

export type GameStatus = 'released' | 'in-development' | 'prototype' | 'paused';

export type PlayConfig = {
  /** "embed" : jeu web intégré dans une iframe (avec bouton plein écran). "external" : lien sortant. */
  type: 'embed' | 'external';
  url: string;
  /** Ratio d'affichage de l'iframe, ex. "16/9" ou "9/16". */
  aspect?: string;
  /** Orientation conseillée sur mobile. */
  orientation?: 'landscape' | 'portrait';
};

export type GameCategory = 'impact' | 'mobile' | 'experiment';

export type Game = {
  slug: string;
  title: string;
  placeholder?: boolean;
  featured?: boolean;
  /** Catégories de la galerie (un jeu peut en avoir plusieurs). Vide = visible uniquement dans « Tous ». À renseigner par l'auteur. */
  categories: GameCategory[];
  /** Couleur d'accent utilisée pour les visuels génératifs et les lueurs. */
  accent: string;
  genre: L;
  year: number | null;
  role: L;
  status: GameStatus;
  /** Chemin vers l'illustration, ex. "/media/games/echoes/cover.webp". null → visuel génératif temporaire. */
  cover: string | null;
  /** Courte vidéo de gameplay muette (mp4/webm) lue au survol. */
  video: string | null;
  summary: L;
  concept: L;
  mechanics: L[];
  intentions: L;
  work: L[];
  gallery: { src: string; alt: L }[];
  play: PlayConfig | null;
  links: Link[];
};

export type ArchiveKind = 'game' | 'student' | 'jam' | 'prototype' | 'video' | 'experimental';

export type ArchiveItem = {
  id: string;
  title: string;
  placeholder?: boolean;
  year: number;
  kind: ArchiveKind;
  description: L;
  cover: string | null;
  video: string | null;
  links: Link[];
};

export type Track = {
  id: string;
  title: string;
  placeholder?: boolean;
  artist?: string;
  /** Fichier audio, ex. "/media/music/titre.mp3". */
  src: string;
  cover: string | null;
  genre: string;
  year: number | null;
  /** Contexte : jeu, projet, commande… */
  context?: L;
  /** Formes d'onde pré-calculées (optionnel, 0–1). Sinon calculées à la volée. */
  peaks?: number[];
  accent?: string;
};

export type Playlist = {
  id: string;
  title: L;
  description: L;
  trackIds: string[];
  accent?: string;
};

export type SoundCategory = 'sfx' | 'ambience' | 'ui' | 'feedback' | 'combat';

export type SoundItem = {
  id: string;
  title: L;
  placeholder?: boolean;
  category: SoundCategory;
  src: string;
  description: L;
  project?: string;
};

export type SoundComparison = {
  id: string;
  title: L;
  placeholder?: boolean;
  description: L;
  /** Deux versions synchronisées : audio ou vidéo. */
  media: 'audio' | 'video';
  without: string;
  with: string;
  poster?: string;
};

export type SoundVideo = {
  id: string;
  title: L;
  placeholder?: boolean;
  description: L;
  src: string | null;
  /** Ou un lien YouTube/Vimeo à intégrer. */
  embed?: string;
  poster?: string;
};

export type Experiment = {
  slug: string;
  title: L;
  placeholder?: boolean;
  year: number | null;
  tags: string[];
  summary: L;
  body: L;
  /** Nom d'une expérience interactive intégrée (voir src/lab/registry.ts). */
  interactive?: string;
  /** Ou une URL externe (jeu web, prototype) à intégrer. */
  embed?: string;
  cover: string | null;
  accent: string;
};

export type Social = { id: string; label: string; url: string | null };

export type Site = {
  /** Illustration d'accueil (facultative). Si renseignée, elle remplace le paysage dessiné en code. */
  hero?: { image: string | null; theme?: string };
  name: string;
  roles: string[];
  tagline: L;
  description: L;
  showreel: { src: string | null; poster: string | null };
  /** Adresse e-mail publique (laisse null pour ne rien afficher). */
  email: string | null;
  cv: { fr: string | null; en: string | null };
  socials: Social[];
  universes: { id: string; title: L; text: L; to: string; accent: string }[];
};

export type About = {
  placeholder?: boolean;
  photo: string | null;
  focus?: { icon: string; fr: string; en: string }[];
  intro: L;
  story: L;
  philosophy: L[];
  education: { period: string; title: L; place: string; detail?: L; placeholder?: boolean }[];
  experience: { period: string; title: L; place: string; detail?: L; placeholder?: boolean }[];
  skills: { group: L; items: L[] }[];
  software: { name: string; use?: L }[];
};
