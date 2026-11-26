import type { About, ArchiveItem, Experiment, Game, Playlist, Site, SoundComparison, SoundItem, SoundVideo, Track } from './types';
import siteJson from './site.json';
import gamesJson from './games.json';
import archivesJson from './archives.json';
import musicJson from './music.json';
import soundJson from './sound.json';
import labJson from './lab.json';
import aboutJson from './about.json';

// Point d'entrée unique des contenus. Les JSON sont typés ici :
// si un champ manque ou est mal écrit, `npm run build` le signale.
export const site = siteJson as Site;
export const games = gamesJson as Game[];
export const archives = (archivesJson as ArchiveItem[]).slice().sort((a, b) => b.year - a.year);
export const tracks = musicJson.tracks as Track[];
export const playlists = musicJson.playlists as Playlist[];
export const sounds = soundJson.items as SoundItem[];
export const comparisons = soundJson.comparisons as SoundComparison[];
export const soundVideos = soundJson.videos as SoundVideo[];
export const experiments = labJson as Experiment[];
export const about = aboutJson as About;

export const getGame = (slug?: string) => games.find((g) => g.slug === slug);
export const getExperiment = (slug?: string) => experiments.find((e) => e.slug === slug);
export const getTrack = (id: string) => tracks.find((t) => t.id === id);
