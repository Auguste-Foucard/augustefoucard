import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getTrack, tracks } from '../../content';
import type { Track } from '../../content/types';
import { asset } from '../../lib/util';

type PlayerState = {
  queue: string[];
  index: number;
  playing: boolean;
  duration: number;
  time: number;
  volume: number;
  muted: boolean;
  error: boolean;
  open: boolean;
  /** Son court (page Sound Design) en cours de lecture. */
  sfxId: string | null;
};

type PlayerAPI = PlayerState & {
  current: Track | null;
  audio: HTMLAudioElement | null;
  progress: () => number;
  playQueue: (ids: string[], start?: number) => void;
  playTrack: (id: string, queue?: string[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (ratio: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  close: () => void;
  playSfx: (id: string, src: string) => void;
  sfxProgress: () => number;
};

const Ctx = createContext<PlayerAPI | null>(null);

const STORAGE = 'af-player-volume';
const readVolume = () => {
  try {
    const v = Number(localStorage.getItem(STORAGE));
    return Number.isFinite(v) && v > 0 && v <= 1 ? v : 0.8;
  } catch {
    return 0.8;
  }
};

/**
 * Moteur audio unique, monté au-dessus des routes : la musique continue
 * quand on change de page. Rien ne démarre sans action de l'utilisateur.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<HTMLAudioElement | null>(null);
  const [s, setS] = useState<PlayerState>({
    queue: tracks.map((t) => t.id),
    index: 0,
    playing: false,
    duration: 0,
    time: 0,
    volume: readVolume(),
    muted: false,
    error: false,
    open: false,
    sfxId: null,
  });
  const stateRef = useRef(s);
  stateRef.current = s;

  if (typeof window !== 'undefined' && !audioRef.current) {
    const a = new Audio();
    a.preload = 'metadata';
    audioRef.current = a;
    const f = new Audio();
    f.preload = 'auto';
    sfxRef.current = f;
  }

  const current = getTrack(s.queue[s.index]) ?? null;

  // Événements du lecteur principal
  useEffect(() => {
    const a = audioRef.current!;
    const on = (patch: Partial<PlayerState>) => setS((p) => ({ ...p, ...patch }));
    const handlers: [string, () => void][] = [
      ['play', () => on({ playing: true, error: false })],
      ['pause', () => on({ playing: false })],
      ['loadedmetadata', () => on({ duration: a.duration || 0 })],
      ['durationchange', () => on({ duration: a.duration || 0 })],
      ['timeupdate', () => on({ time: a.currentTime })],
      ['error', () => on({ error: true, playing: false })],
      ['ended', () => nextRef.current()],
    ];
    handlers.forEach(([e, h]) => a.addEventListener(e, h));
    return () => handlers.forEach(([e, h]) => a.removeEventListener(e, h));
  }, []);

  useEffect(() => {
    const f = sfxRef.current!;
    const end = () => setS((p) => ({ ...p, sfxId: null }));
    f.addEventListener('ended', end);
    f.addEventListener('pause', end);
    return () => { f.removeEventListener('ended', end); f.removeEventListener('pause', end); };
  }, []);

  useEffect(() => {
    const a = audioRef.current!;
    a.volume = s.volume; // ignoré sur iOS (volume matériel), sans effet de bord
    a.muted = s.muted;
    if (sfxRef.current) { sfxRef.current.volume = s.volume; sfxRef.current.muted = s.muted; }
    try { localStorage.setItem(STORAGE, String(s.volume)); } catch { /* stockage indisponible */ }
  }, [s.volume, s.muted]);

  const load = useCallback((t: Track, autoplay: boolean) => {
    const a = audioRef.current!;
    const url = asset(t.src)!;
    if (!a.src.endsWith(url)) {
      a.src = url;
      setS((p) => ({ ...p, time: 0, duration: 0, error: false }));
    }
    if (autoplay) {
      sfxRef.current?.pause();
      a.play().catch(() => setS((p) => ({ ...p, playing: false })));
    }
  }, []);

  const playQueue = useCallback((ids: string[], start = 0) => {
    const q = ids.filter((id) => getTrack(id));
    if (!q.length) return;
    const i = Math.min(start, q.length - 1);
    setS((p) => ({ ...p, queue: q, index: i, open: true }));
    load(getTrack(q[i])!, true);
  }, [load]);

  const playTrack = useCallback((id: string, queue?: string[]) => {
    const st = stateRef.current;
    if (st.queue[st.index] === id && audioRef.current?.src) {
      const a = audioRef.current;
      if (a.paused) { sfxRef.current?.pause(); a.play().catch(() => {}); } else a.pause();
      setS((p) => ({ ...p, open: true }));
      return;
    }
    const q = queue ?? st.queue;
    const idx = q.indexOf(id);
    playQueue(idx >= 0 ? q : [id, ...q], idx >= 0 ? idx : 0);
  }, [playQueue]);

  const toggle = useCallback(() => {
    const a = audioRef.current!;
    const st = stateRef.current;
    if (!a.src) { const t = getTrack(st.queue[st.index]); if (t) load(t, true); setS((p) => ({ ...p, open: true })); return; }
    if (a.paused) { sfxRef.current?.pause(); a.play().catch(() => {}); } else a.pause();
  }, [load]);

  const go = useCallback((delta: number) => {
    const st = stateRef.current;
    if (!st.queue.length) return;
    const a = audioRef.current!;
    if (delta < 0 && a.currentTime > 3) { a.currentTime = 0; return; }
    const i = (st.index + delta + st.queue.length) % st.queue.length;
    setS((p) => ({ ...p, index: i }));
    load(getTrack(st.queue[i])!, true);
  }, [load]);
  const next = useCallback(() => go(1), [go]);
  const prev = useCallback(() => go(-1), [go]);
  const nextRef = useRef(next);
  nextRef.current = next;

  const seek = useCallback((ratio: number) => {
    const a = audioRef.current!;
    if (!a.duration) return;
    a.currentTime = ratio * a.duration;
    setS((p) => ({ ...p, time: a.currentTime }));
  }, []);

  const setVolume = useCallback((v: number) => setS((p) => ({ ...p, volume: v, muted: v === 0 })), []);
  const toggleMute = useCallback(() => setS((p) => ({ ...p, muted: !p.muted })), []);
  const close = useCallback(() => { audioRef.current?.pause(); setS((p) => ({ ...p, open: false })); }, []);
  const progress = useCallback(() => {
    const a = audioRef.current;
    return a && a.duration ? a.currentTime / a.duration : 0;
  }, []);

  const playSfx = useCallback((id: string, src: string) => {
    const f = sfxRef.current!;
    if (stateRef.current.sfxId === id && !f.paused) { f.pause(); return; }
    audioRef.current?.pause();
    f.src = asset(src)!;
    f.currentTime = 0;
    f.play().then(() => setS((p) => ({ ...p, sfxId: id }))).catch(() => {});
  }, []);
  const sfxProgress = useCallback(() => {
    const f = sfxRef.current;
    return f && f.duration ? f.currentTime / f.duration : 0;
  }, []);

  // Commandes de l'écran verrouillé / casque (Media Session)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist ?? 'Auguste Foucard',
      album: current.genre,
      artwork: current.cover ? [{ src: asset(current.cover)!, sizes: '512x512' }] : [],
    });
    ms.setActionHandler('play', () => toggle());
    ms.setActionHandler('pause', () => toggle());
    ms.setActionHandler('nexttrack', () => next());
    ms.setActionHandler('previoustrack', () => prev());
    try {
      ms.setActionHandler('seekto', (d) => { if (d.seekTime != null && audioRef.current) audioRef.current.currentTime = d.seekTime; });
    } catch { /* non supporté */ }
  }, [current, toggle, next, prev]);

  const api = useMemo<PlayerAPI>(() => ({
    ...s, current, audio: audioRef.current, progress, playQueue, playTrack, toggle, next, prev, seek, setVolume, toggleMute, close, playSfx, sfxProgress,
  }), [s, current, progress, playQueue, playTrack, toggle, next, prev, seek, setVolume, toggleMute, close, playSfx, sfxProgress]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePlayer() {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePlayer doit être utilisé dans <PlayerProvider>');
  return c;
}
