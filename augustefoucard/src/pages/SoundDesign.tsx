import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { comparisons, sounds, soundVideos } from '../content';
import type { SoundCategory, SoundComparison } from '../content/types';
import { useLang } from '../i18n/lang';
import type { UIKey } from '../i18n/ui';
import { useMeta } from '../lib/hooks';
import { asset } from '../lib/util';
import { EASE, PageHead, Reveal } from '../components/Motion';
import { Filter } from '../components/Filter';
import { PlaceholderBadge } from '../components/Badge';
import { Waveform } from '../components/Waveform';
import { Pause, Play } from '../components/Icons';
import { usePlayer } from '../components/player/PlayerContext';

type F = 'all' | SoundCategory;

export default function SoundDesign() {
  const { t, l } = useLang();
  useMeta(t('nav.sound'), t('sound.intro'));
  const p = usePlayer();
  const [f, setF] = useState<F>('all');
  const cats = useMemo(() => Array.from(new Set(sounds.map((s) => s.category))), []);
  const list = sounds.filter((s) => f === 'all' || s.category === f);

  return (
    <>
      <PageHead eyebrow={t('sound.eyebrow')} title={t('sound.title')} lede={t('sound.intro')} />

      <section className="wrap section--tight" aria-labelledby="lib" style={{ paddingTop: 0 }}>
        <Reveal className="section-title">
          <h2 id="lib" className="eyebrow">{t('sound.library')}</h2>
          <Filter label={t('sound.library')} value={f} onChange={setF} options={[{ value: 'all' as F, label: t('cat.all') }, ...cats.map((c) => ({ value: c as F, label: t(`cat.${c}` as UIKey) }))]} />
        </Reveal>
        <motion.div layout className="sound-grid">
          <AnimatePresence mode="popLayout">
            {list.map((s) => {
              const on = p.sfxId === s.id;
              return (
                <motion.button
                  layout key={s.id} className="sound-card" data-playing={on} onClick={() => p.playSfx(s.id, s.src)}
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: EASE }} whileTap={{ scale: 0.98 }}
                  aria-pressed={on} aria-label={`${on ? t('player.pause') : t('player.play')} — ${l(s.title)}`}
                >
                  <div className="sound-card__top">
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      <span className="tag">{t(`cat.${s.category}` as UIKey)}</span>
                      <h3>{l(s.title)}</h3>
                    </div>
                    <span className="play-dot" aria-hidden="true">{on ? <Pause size={16} /> : <Play size={16} />}</span>
                  </div>
                  <Waveform src={asset(s.src)} seed={s.id} progress={on ? p.sfxProgress : zero} live={on} bars={60} className="wave wave-mini" />
                  <p>{l(s.description)}</p>
                  {s.placeholder && <span><PlaceholderBadge /></span>}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </section>

      {comparisons.length > 0 && (
        <section className="wrap section--tight" aria-labelledby="ab">
          <Reveal className="section-title"><h2 id="ab" className="eyebrow">{t('sound.compare')}</h2></Reveal>
          <div className="grid-2">{comparisons.map((c) => <Reveal key={c.id}><Compare c={c} /></Reveal>)}</div>
        </section>
      )}

      {soundVideos.length > 0 && (
        <section className="wrap section--tight" aria-labelledby="vids" style={{ paddingBottom: 'var(--section)' }}>
          <Reveal className="section-title"><h2 id="vids" className="eyebrow">{t('sound.videos')}</h2></Reveal>
          <div className="grid-2">
            {soundVideos.map((v) => (
              <Reveal key={v.id}>
                <div className="video-slot">
                  {v.src ? <video src={asset(v.src)!} poster={asset(v.poster) ?? undefined} controls playsInline preload="none" />
                    : v.embed ? <iframe src={v.embed} title={l(v.title)} allow="fullscreen; picture-in-picture" loading="lazy" />
                    : <span>{t('sound.videoSlot')}</span>}
                </div>
                <div style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}><h3 style={{ fontSize: '1.2rem' }}>{l(v.title)}</h3><PlaceholderBadge show={!!v.placeholder} /></div>
                  <p className="muted">{l(v.description)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

const zero = () => 0;

/** Comparaison A/B : deux pistes synchronisées, on bascule de l'une à l'autre sans couper. */
function Compare({ c }: { c: SoundComparison }) {
  const { t, l } = useLang();
  const p = usePlayer();
  const [mode, setMode] = useState<'without' | 'with'>('with');
  const [playing, setPlaying] = useState(false);
  const a = useRef<HTMLMediaElement | null>(null);
  const b = useRef<HTMLMediaElement | null>(null);

  useEffect(() => {
    if (!a.current || !b.current) return;
    a.current.muted = mode !== 'without';
    b.current.muted = mode !== 'with';
  }, [mode]);

  useEffect(() => {
    // La musique du site se met en pause si on lance la comparaison.
    if (playing && p.playing) p.toggle();
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    const A = a.current!, B = b.current!;
    if (playing) { A.pause(); B.pause(); setPlaying(false); return; }
    B.currentTime = A.currentTime;
    Promise.all([A.play(), B.play()]).then(() => setPlaying(true)).catch(() => {});
  };
  const onEnded = () => setPlaying(false);

  return (
    <div className="ab">
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.25rem' }}>{l(c.title)}</h3>
        <PlaceholderBadge show={!!c.placeholder} />
      </div>
      <p className="muted">{l(c.description)}</p>
      {c.media === 'video' ? (
        <div style={{ position: 'relative' }}>
          <video ref={(el) => { a.current = el; }} src={asset(c.without)!} poster={asset(c.poster) ?? undefined} playsInline preload="metadata" onEnded={onEnded} style={{ display: mode === 'without' ? 'block' : 'none' }} />
          <video ref={(el) => { b.current = el; }} src={asset(c.with)!} poster={asset(c.poster) ?? undefined} playsInline preload="metadata" onEnded={onEnded} style={{ display: mode === 'with' ? 'block' : 'none' }} />
        </div>
      ) : (
        <>
          <audio ref={(el) => { a.current = el; }} src={asset(c.without)!} preload="auto" onEnded={onEnded} />
          <audio ref={(el) => { b.current = el; }} src={asset(c.with)!} preload="auto" onEnded={onEnded} />
        </>
      )}
      <div className="ab__row">
        <motion.button className="icon-btn icon-btn--solid" onClick={toggle} whileTap={{ scale: 0.9 }} aria-label={playing ? t('player.pause') : t('player.play')}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </motion.button>
        <div className="ab__switch" role="group" aria-label={t('sound.compare')}>
          <motion.span className="ab__thumb" animate={{ x: mode === 'without' ? 0 : '100%' }} transition={{ type: 'spring', stiffness: 420, damping: 34 }} style={{ left: 4 }} />
          <button aria-pressed={mode === 'without'} onClick={() => setMode('without')}>{t('sound.without')}</button>
          <button aria-pressed={mode === 'with'} onClick={() => setMode('with')}>{t('sound.with')}</button>
        </div>
      </div>
    </div>
  );
}
