import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { getTrack } from '../../content';
import { useLang } from '../../i18n/lang';
import { formatTime, isIOS } from '../../lib/util';
import { Media } from '../Media';
import { Waveform } from '../Waveform';
import { ChevronDown, ChevronUp, Close, Mute, Next, Pause, Play, Prev, Volume } from '../Icons';
import { usePlayer } from './PlayerContext';
import { EASE } from '../Motion';

/** Lecteur flottant persistant, visible dès qu'une piste a été lancée. */
export function Dock() {
  const p = usePlayer();
  const { t } = useLang();
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ios = isIOS();
  const t0 = p.current;

  // Réserve la hauteur du lecteur en bas de page pour qu'il ne masque jamais le contenu.
  useEffect(() => {
    const root = document.documentElement;
    if (!p.open || !ref.current) { root.style.setProperty('--player-h', '0px'); return; }
    const ro = new ResizeObserver(([e]) => root.style.setProperty('--player-h', `${Math.ceil(e.contentRect.height) + 12}px`));
    ro.observe(ref.current);
    return () => { ro.disconnect(); root.style.setProperty('--player-h', '0px'); };
  }, [p.open]);

  useEffect(() => {
    if (!expanded) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setExpanded(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [expanded]);

  return (
    <AnimatePresence>
      {p.open && t0 && (
        <motion.div
          className="dock"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          role="region"
          aria-label={t('player.queue') === 'Queue' ? 'Audio player' : 'Lecteur audio'}
        >
          <div className="dock__panel" ref={ref}>
            <div className="dock__bar">
              <button className="dock__info" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} aria-label={expanded ? t('player.collapse') : t('player.expand')}>
                <span className="dock__art">
                  <Media src={t0.cover} alt="" seed={t0.id} accent={t0.accent} label={false} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="dock__title" style={{ display: 'block' }}>{t0.title}</span>
                  <span className="dock__sub" style={{ display: 'block' }}>{p.error ? t('player.error') : `${t0.artist ?? 'Auguste Foucard'} · ${t0.genre}`}</span>
                </span>
              </button>
              <div className="dock__controls">
                <button className="icon-btn dock__hide-sm" onClick={p.prev} aria-label={t('player.prev')}><Prev size={18} /></button>
                <motion.button className="icon-btn icon-btn--solid" onClick={p.toggle} whileTap={{ scale: 0.9 }} aria-label={p.playing ? t('player.pause') : t('player.play')}>
                  {p.playing ? <Pause size={18} /> : <Play size={18} />}
                </motion.button>
                <button className="icon-btn" onClick={p.next} aria-label={t('player.next')}><Next size={18} /></button>
                {!ios && (
                  <span className="dock__volume">
                    <button className="icon-btn" onClick={p.toggleMute} aria-label={p.muted ? t('player.unmute') : t('player.mute')}>
                      {p.muted || p.volume === 0 ? <Mute size={18} /> : <Volume size={18} />}
                    </button>
                    <input
                      className="range range--vol" type="range" min={0} max={1} step={0.01} aria-label={t('player.volume')}
                      value={p.muted ? 0 : p.volume}
                      style={{ ['--p' as string]: `${(p.muted ? 0 : p.volume) * 100}%` }}
                      onChange={(e) => p.setVolume(Number(e.target.value))}
                    />
                  </span>
                )}
                <button className="icon-btn dock__hide-sm" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? t('player.collapse') : t('player.expand')}>
                  {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
                <button className="icon-btn" onClick={() => { setExpanded(false); p.close(); }} aria-label={t('player.close')}><Close size={18} /></button>
              </div>
            </div>
            <div className="dock__wave">
              <span>{formatTime(p.time)}</span>
              <Waveform
                src={t0.src} seed={t0.id} progress={p.progress} live={p.playing} onSeek={p.seek}
                duration={p.duration} accent={t0.accent ?? '#c084fc'} label={t('player.seek')} bars={110} version={Math.round(p.time * 4)}
              />
              <span>{formatTime(p.duration)}</span>
            </div>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: EASE }} style={{ overflow: 'hidden' }}>
                  <div className="dock__expanded">
                    <span className="eyebrow">{t('player.queue')}</span>
                    <ul className="dock__queue">
                      {p.queue.map((id, i) => {
                        const tr = getTrack(id);
                        if (!tr) return null;
                        return (
                          <li key={id + i}>
                            <button data-current={i === p.index} onClick={() => p.playQueue(p.queue, i)}>
                              <span>{tr.title}</span>
                              <span className="dim">{tr.genre}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
