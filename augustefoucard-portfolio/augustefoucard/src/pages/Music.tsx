import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { getTrack, playlists, tracks } from '../content';
import { useLang } from '../i18n/lang';
import { useMeta } from '../lib/hooks';
import { asset, formatTime } from '../lib/util';
import { Button, EASE, PageHead, Reveal } from '../components/Motion';
import { Filter } from '../components/Filter';
import { Media } from '../components/Media';
import { PlaceholderBadge } from '../components/Badge';
import { Pause, Play } from '../components/Icons';
import { usePlayer } from '../components/player/PlayerContext';

/** Lit uniquement les métadonnées (durée) de chaque piste, sans télécharger l'audio complet. */
function useDurations(srcs: string[]) {
  const [d, setD] = useState<Record<string, number>>({});
  useEffect(() => {
    const els = srcs.map((src) => {
      const a = new Audio();
      a.preload = 'metadata';
      a.onloadedmetadata = () => setD((p) => ({ ...p, [src]: a.duration }));
      a.src = asset(src)!;
      return a;
    });
    return () => els.forEach((a) => { a.onloadedmetadata = null; a.src = ''; });
  }, [srcs.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  return d;
}

export default function Music() {
  const { t, l } = useLang();
  useMeta(t('nav.music'), t('music.intro'));
  const p = usePlayer();
  const [plId, setPl] = useState(playlists[0]?.id ?? '');
  const [genre, setGenre] = useState('all');
  const pl = playlists.find((x) => x.id === plId);
  const base = useMemo(() => (pl ? pl.trackIds.map(getTrack).filter((x) => !!x) : tracks), [pl]);
  const genres = useMemo(() => Array.from(new Set(base.map((x) => x.genre))), [base]);
  const list = base.filter((x) => genre === 'all' || x.genre === genre);
  const ids = list.map((x) => x.id);
  const durations = useDurations(tracks.map((x) => x.src));

  useEffect(() => setGenre('all'), [plId]);

  return (
    <>
      <PageHead eyebrow={t('music.eyebrow')} title={t('music.title')} lede={t('music.intro')} />

      {playlists.length > 0 && (
        <section className="wrap" aria-labelledby="pls">
          <Reveal className="section-title" ><h2 id="pls" className="eyebrow">{t('music.playlists')}</h2></Reveal>
          <Reveal>
            <div className="playlists">
              {playlists.map((x) => (
                <motion.button key={x.id} className="pl-card lift" aria-pressed={x.id === plId} onClick={() => setPl(x.id)} whileTap={{ scale: 0.98 }}>
                  <span className="pl-card__art"><Media src={null} alt="" seed={'pl-' + x.id} accent={x.accent} label={false} /></span>
                  <span>
                    <h3>{l(x.title)}</h3>
                    <p>{l(x.description)} · {x.trackIds.length}</p>
                  </span>
                </motion.button>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      <section className="wrap section--tight" aria-labelledby="trk" style={{ paddingBottom: 'var(--section)' }}>
        <Reveal className="section-title">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 id="trk" style={{ fontSize: 'clamp(1.75rem, 1.3rem + 2vw, 3rem)' }}>{pl ? l(pl.title) : t('music.tracks')}</h2>
            <Button onClick={() => p.playQueue(ids, 0)} disabled={!ids.length}><Play size={14} /> {t('music.playAll')}</Button>
          </div>
          {genres.length > 1 && (
            <Filter label="Genre" value={genre} onChange={setGenre} options={[{ value: 'all', label: t('music.genre.all') }, ...genres.map((g) => ({ value: g, label: g }))]} />
          )}
        </Reveal>
        <AnimatePresence mode="wait">
          <motion.ol key={plId + genre} className="tracklist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}>
            {list.map((tr, i) => {
              const isCur = p.current?.id === tr.id && p.open;
              return (
                <li key={tr.id}>
                  <button className="track" data-current={isCur} onClick={() => p.playTrack(tr.id, ids)} aria-label={`${isCur && p.playing ? t('player.pause') : t('player.play')} — ${tr.title}`}>
                    <span className="track__n">
                      {isCur ? <span className="eq" data-paused={!p.playing} aria-hidden="true"><i /><i /><i /></span> : String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="track__art">
                      <Media src={tr.cover} alt="" seed={tr.id} accent={tr.accent} label={false} />
                      <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(9,8,11,0.35)' }} aria-hidden="true">
                        {isCur && p.playing ? <Pause size={16} /> : <Play size={16} />}
                      </span>
                    </span>
                    <span className="track__main">
                      <span className="track__title" style={{ display: 'block' }}>{tr.title}</span>
                      <span className="track__sub">
                        <span>{tr.genre}</span>
                        {tr.year && <span>{tr.year}</span>}
                      </span>
                    </span>
                    <span className="track__dur">{durations[tr.src] ? formatTime(durations[tr.src]) : '—'}</span>
                  </button>
                </li>
              );
            })}
          </motion.ol>
        </AnimatePresence>
        {list.some((x) => x.placeholder) && (
          <p className="dim" style={{ marginTop: '1.5rem', fontSize: '0.875rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <PlaceholderBadge /> {l(list.find((x) => x.placeholder)?.context)}
          </p>
        )}
      </section>
    </>
  );
}
