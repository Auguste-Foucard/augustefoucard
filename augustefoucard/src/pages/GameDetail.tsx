import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getGame } from '../content';
import { useLang } from '../i18n/lang';
import { useMeta } from '../lib/hooks';
import { asset } from '../lib/util';
import { Media } from '../components/Media';
import { Button, EASE, Reveal } from '../components/Motion';
import { CategoryChips } from '../components/Collection';
import { GameEmbed } from '../components/GameEmbed';
import { Back, ChevronDown, ArrowUpRight, Play } from '../components/Icons';
import { useSkyTint } from '../lib/sky';
import NotFound from './NotFound';

const clean = (s: string) => s.replace(/\s*\[[^\]]*\]\s*/g, ' ').trim();

/** Page d'un jeu : grande image ou vidéo, titre, courte description, rôle, jouer, captures. */
export default function GameDetail() {
  const { slug } = useParams();
  const game = getGame(slug);
  const { t, l, to } = useLang();
  const reduce = useReducedMotion();
  const [shot, setShot] = useState(0);
  const [more, setMore] = useState(false);
  useMeta(game?.title ?? t('game.notFound'), game ? clean(l(game.summary)) : undefined);
  useSkyTint(game?.accent ?? null);

  useEffect(() => {
    if (location.hash === '#play') setTimeout(() => document.getElementById('play')?.scrollIntoView({ behavior: 'smooth' }), 900);
  }, []);

  if (!game) return <NotFound />;
  const shots = game.gallery;
  const mainSrc = shots[shot]?.src ?? game.cover;
  const slots = Math.max(0, 3 - shots.length);
  const hasMore = !!(l(game.concept) || game.mechanics.length || l(game.intentions) || game.work.length);

  return (
    <article className="gd wrap">
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}>
        <Link to={to('/games')} className="gd__back"><Back size={18} /> {t('game.backAll')}</Link>
      </motion.div>

      <div className="gd__grid">
        <motion.div className="gd__media-col"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.03, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.3, ease: EASE, delay: 0.1 }}>
          <div className="gd__main" style={{ ['--accent' as string]: game.accent }}>
            <AnimatePresence mode="wait">
              <motion.div key={shot + String(mainSrc)} className="gd__main-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
                {game.video && shot === 0 ? (
                  <video src={asset(game.video)!} poster={asset(game.cover) ?? undefined} autoPlay={!reduce} muted loop playsInline controls preload="metadata" />
                ) : (
                  <Media src={mainSrc} alt={game.title} seed={game.slug} accent={game.accent} label={false} eager />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="gd__thumbs">
            {shots.map((g, i) => (
              <button key={g.src} className="gd__thumb" aria-pressed={i === shot} aria-label={l(g.alt)} onClick={() => setShot(i)}>
                <img src={asset(g.src)!} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
            {Array.from({ length: slots }, (_, i) => <span key={`s${i}`} className="gd__thumb gd__thumb--slot" role="img" aria-label={t('game.shot')}><Play size={16} /></span>)}
          </div>
        </motion.div>

        <div className="gd__info">
          <motion.h1 className="gd__title" initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1.1, ease: EASE, delay: 0.3 }}>{game.title}</motion.h1>
          <Reveal><CategoryChips list={game.categories} /></Reveal>
          <Reveal delay={0.06}><p className="gd__desc">{clean(l(game.summary))}</p></Reveal>
          {clean(l(game.role)) && <Reveal delay={0.1}><p className="gd__role"><span>{t('game.role')}</span> {clean(l(game.role))}</p></Reveal>}
          <Reveal delay={0.14}>
            <div className="gd__actions">
              {game.play?.type === 'embed' && <Button variant="glow" onClick={() => document.getElementById('play')?.scrollIntoView({ behavior: 'smooth' })}><Play size={16} /> {t('game.play')}</Button>}
              {game.play?.type === 'external' && <Button variant="glow" href={game.play.url}><Play size={16} /> {t('game.play')} <ArrowUpRight size={14} /></Button>}
              {hasMore && (
                <button className="gd__more" aria-expanded={more} onClick={() => setMore((v) => !v)}>
                  {t('game.more')} <ChevronDown size={16} />
                </button>
              )}
            </div>
          </Reveal>
          <AnimatePresence initial={false}>
            {more && (
              <motion.div className="gd__extra" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                <div>
                  {clean(l(game.concept)) && <p>{clean(l(game.concept))}</p>}
                  {game.mechanics.length > 0 && <ul>{game.mechanics.map((m, i) => <li key={i}>{clean(l(m))}</li>)}</ul>}
                  {clean(l(game.intentions)) && <p>{clean(l(game.intentions))}</p>}
                  {game.work.length > 0 && <ul>{game.work.map((m, i) => <li key={i}>{clean(l(m))}</li>)}</ul>}
                  {game.links.map((lk) => <p key={lk.url}><a href={lk.url} target="_blank" rel="noopener noreferrer">{l(lk.label)} ↗</a></p>)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {game.play?.type === 'embed' && (
        <section id="play" className="gd__play">
          <GameEmbed play={game.play} title={game.title} seed={game.slug} accent={game.accent} />
        </section>
      )}
    </article>
  );
}
