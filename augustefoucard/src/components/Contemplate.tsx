import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/lang';
import { setContemplative, useContemplative } from '../lib/sky';
import { formatTime } from '../lib/util';
import { EASE } from './Motion';
import { Media } from './Media';
import { Visualizer } from './Visualizer';
import { Close, Expand, Next, Pause, Play, Prev } from './Icons';
import { usePlayer } from './player/PlayerContext';

/**
 * Mode contemplatif : le site disparaît, il ne reste que le ciel étoilé en plein écran,
 * la pochette entourée d'une couronne qui respire avec la musique, et trois boutons.
 */
export function Contemplate() {
  const on = useContemplative();
  const p = usePlayer();
  const { t, lang } = useLang();
  const [idle, setIdle] = useState(false);
  const timer = useRef<number>(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const tr = p.current;

  const wake = useCallback(() => {
    setIdle(false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setIdle(true), 4500);
  }, []);

  const close = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setContemplative(false);
  }, []);

  useEffect(() => {
    if (!on) { window.clearTimeout(timer.current); return; }
    wake();
    const opener = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => closeRef.current?.focus());
    const key = (e: KeyboardEvent) => {
      wake();
      if (e.key === 'Escape') close();
      if (e.key === ' ' && document.activeElement?.tagName !== 'BUTTON') { e.preventDefault(); p.toggle(); }
    };
    const fs = () => { if (!document.fullscreenElement) { /* sortie du plein écran natif : on reste en mode contemplatif */ } };
    window.addEventListener('keydown', key);
    document.addEventListener('fullscreenchange', fs);
    return () => { window.removeEventListener('keydown', key); document.removeEventListener('fullscreenchange', fs); opener?.focus?.(); };
  }, [on]); // eslint-disable-line react-hooks/exhaustive-deps

  const goFull = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };
  const canFs = typeof document !== 'undefined' && !!document.fullscreenEnabled;

  return (
    <AnimatePresence>
      {on && (
        <motion.div
          className="contemplate" data-idle={idle}
          role="dialog" aria-modal="true" aria-label={lang === 'fr' ? 'Mode contemplatif' : 'Contemplative mode'}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: EASE }}
          onPointerMove={wake} onPointerDown={wake}
        >
          <div className="contemplate__top">
            <span className="contemplate__label">{lang === 'fr' ? 'Mode contemplatif' : 'Contemplative mode'}</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {canFs && <button className="icon-btn" onClick={goFull} aria-label={t('game.fullscreen')}><Expand size={18} /></button>}
              <button ref={closeRef} className="icon-btn" onClick={close} aria-label={t('nav.close')}><Close size={20} /></button>
            </div>
          </div>

          <div className="contemplate__center">
            {tr ? (
              <>
                <div className="contemplate__cover">
                  <Visualizer mode="ring" size={Math.min(380, typeof window !== 'undefined' ? window.innerWidth - 40 : 360)} accent="#d9d2ff" className="contemplate__ring" />
                  <div className="contemplate__art"><Media src={tr.cover} alt="" seed={tr.id} accent={tr.accent} label={false} /></div>
                </div>
                <h2 className="contemplate__title">{tr.title}</h2>
                <p className="contemplate__sub">{tr.artist ?? 'Auguste Foucard'} · {tr.genre}</p>
              </>
            ) : (
              <p className="contemplate__sub">{lang === 'fr' ? 'Lance un morceau pour commencer.' : 'Start a track to begin.'}</p>
            )}
          </div>

          <div className="contemplate__bottom">
            <div className="contemplate__bar" aria-hidden="true"><i style={{ width: `${p.duration ? (p.time / p.duration) * 100 : 0}%` }} /></div>
            <div className="contemplate__controls">
              <span className="contemplate__time">{formatTime(p.time)}</span>
              <button className="icon-btn" onClick={p.prev} aria-label={t('player.prev')}><Prev size={20} /></button>
              <motion.button className="icon-btn icon-btn--solid contemplate__play" onClick={p.toggle} whileTap={{ scale: 0.92 }} aria-label={p.playing ? t('player.pause') : t('player.play')}>
                {p.playing ? <Pause size={20} /> : <Play size={20} />}
              </motion.button>
              <button className="icon-btn" onClick={p.next} aria-label={t('player.next')}><Next size={20} /></button>
              <span className="contemplate__time">{formatTime(p.duration)}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
