import { useEffect, useRef, useState } from 'react';
import type { PlayConfig } from '../content/types';
import { useLang } from '../i18n/lang';
import { Button } from './Motion';
import { ArrowUpRight, Expand, Play, Shrink } from './Icons';
import { GenArt } from './GenArt';

/**
 * Jeu web intégré. L'iframe n'est chargée qu'au clic (performances),
 * avec plein écran natif, ou un plein écran « simulé » sur iPhone (pas d'API Fullscreen).
 */
export function GameEmbed({ play, title, seed, accent }: { play: PlayConfig; title: string; seed: string; accent: string }) {
  const { t } = useLang();
  const box = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [fs, setFs] = useState(false);
  const native = typeof document !== 'undefined' && !!document.fullscreenEnabled;

  useEffect(() => {
    const on = () => setFs(document.fullscreenElement === box.current);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  useEffect(() => {
    if (!fs || native) return;
    document.body.style.overflow = 'hidden';
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setFs(false);
    window.addEventListener('keydown', k);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', k); };
  }, [fs, native]);

  const toggleFs = async () => {
    if (!loaded) setLoaded(true);
    if (native && box.current) {
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        await box.current.requestFullscreen().catch(() => setFs(true));
        const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
        if (play.orientation && o?.lock) o.lock(play.orientation).catch(() => {});
      }
    } else setFs((v) => !v);
  };

  return (
    <div>
      <div ref={box} className={`player-embed${fs && !native ? ' is-pseudo-fs' : ''}`} data-ar-m={play.aspectMobile ? '' : undefined} style={{ aspectRatio: fs ? undefined : play.aspect ?? '16/9', ['--ar-m' as string]: play.aspectMobile }}>
        {loaded ? (
          <iframe src={play.url} title={title} allow="fullscreen; autoplay; gamepad; microphone; accelerometer; gyroscope" allowFullScreen loading="lazy" />
        ) : (
          <div className="player-embed__cover">
            <GenArt seed={seed + '-play'} accent={accent} />
            <div style={{ position: 'relative' }}>
              <Button onClick={() => setLoaded(true)}><Play size={16} /> {t('game.loadGame')}</Button>
            </div>
          </div>
        )}
        {fs && !native && (
          <button className="icon-btn icon-btn--solid" style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)', right: 12, zIndex: 2 }} onClick={() => setFs(false)} aria-label={t('game.exitFullscreen')}>
            <Shrink size={18} />
          </button>
        )}
      </div>
      <div className="player-embed__bar">
        {play.orientation === 'landscape' ? <span className="dim" style={{ fontSize: '0.875rem' }}>{t('game.rotate')}</span> : <span />}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" onClick={toggleFs} magnetic={false}>{fs ? <Shrink size={16} /> : <Expand size={16} />} {fs ? t('game.exitFullscreen') : t('game.fullscreen')}</Button>
          <Button variant="ghost" size="sm" href={play.url} magnetic={false}>{t('game.openNew')} <ArrowUpRight size={14} /></Button>
        </div>
      </div>
    </div>
  );
}
