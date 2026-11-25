import { motion, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { games, getGame } from '../content';
import { useLang } from '../i18n/lang';
import type { UIKey } from '../i18n/ui';
import { useMeta } from '../lib/hooks';
import { asset } from '../lib/util';
import { Media } from '../components/Media';
import { PlaceholderBadge } from '../components/Badge';
import { Button, EASE, Reveal, SplitTitle } from '../components/Motion';
import { GameEmbed } from '../components/GameEmbed';
import { STATUS_COLOR } from '../components/GameCard';
import { Arrow, ArrowUpRight } from '../components/Icons';
import NotFound from './NotFound';

export default function GameDetail() {
  const { slug } = useParams();
  const game = getGame(slug);
  const { t, l, to } = useLang();
  const reduce = useReducedMotion();
  useMeta(game?.title ?? t('game.notFound'), game ? l(game.summary) : undefined);

  useEffect(() => {
    if (location.hash === '#play') setTimeout(() => document.getElementById('play')?.scrollIntoView({ behavior: 'smooth' }), 700);
  }, []);

  if (!game) return <NotFound />;
  const i = games.indexOf(game);
  const next = games[(i + 1) % games.length];

  return (
    <article>
      <header className="detail-hero wrap">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <Link to={to('/games')} className="eyebrow">{t('game.back')}</Link>
          <PlaceholderBadge show={!!game.placeholder} />
        </motion.div>
        <SplitTitle text={game.title} />
        <motion.p className="muted" style={{ marginTop: '1.5rem', maxWidth: '40rem', fontSize: 'clamp(1.05rem, 1rem + 0.4vw, 1.3rem)' }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}>
          {l(game.summary)}
        </motion.p>
        <motion.div
          className="detail-hero__media"
          style={{ ['--accent' as string]: game.accent }}
          initial={reduce ? { opacity: 0 } : { clipPath: 'inset(18% 30% 18% 30% round 20px)', opacity: 0.4, scale: 1.04 }}
          animate={{ clipPath: 'inset(0% 0% 0% 0% round 20px)', opacity: 1, scale: 1 }}
          transition={{ duration: 1.3, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
        >
          {game.video ? (
            <video src={asset(game.video)!} poster={asset(game.cover) ?? undefined} autoPlay={!reduce} muted loop playsInline preload="metadata" />
          ) : (
            <Media src={game.cover} alt={game.title} seed={game.slug} accent={game.accent} eager />
          )}
        </motion.div>
      </header>

      <section className="wrap" style={{ marginTop: 'clamp(2.5rem, 6vw, 4rem)' }}>
        <Reveal>
          <dl className="facts">
            <div><dt>{t('game.genre')}</dt><dd>{l(game.genre)}</dd></div>
            <div><dt>{t('game.year')}</dt><dd>{game.year ?? t('year.tbd')}</dd></div>
            <div><dt>{t('game.role')}</dt><dd>{l(game.role)}</dd></div>
            <div><dt>{t('game.status')}</dt><dd><span className="status" style={{ ['--c' as string]: STATUS_COLOR[game.status] }}>{t(`status.${game.status}` as UIKey)}</span></dd></div>
          </dl>
        </Reveal>
        {(game.play || game.links.length > 0) && (
          <Reveal>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '2rem' }}>
              {game.play?.type === 'embed' && <Button onClick={() => document.getElementById('play')?.scrollIntoView({ behavior: 'smooth' })}>{t('game.play')}</Button>}
              {game.play?.type === 'external' && <Button href={game.play.url}>{t('game.play')} <ArrowUpRight size={14} /></Button>}
              {game.links.map((lk) => <Button key={lk.url} variant="ghost" href={lk.url}>{l(lk.label)} <ArrowUpRight size={14} /></Button>)}
            </div>
          </Reveal>
        )}

        <Block title={t('game.concept')}><p>{l(game.concept)}</p></Block>
        <Block title={t('game.mechanics')}><ul>{game.mechanics.map((m, k) => <li key={k}><span>{l(m)}</span></li>)}</ul></Block>
        <Block title={t('game.intentions')}><p>{l(game.intentions)}</p></Block>
        <Block title={t('game.work')}><ul>{game.work.map((m, k) => <li key={k}><span>{l(m)}</span></li>)}</ul></Block>

        {game.play?.type === 'embed' && (
          <section id="play" style={{ paddingBlock: 'clamp(3rem, 7vw, 6rem)', scrollMarginTop: '5rem' }}>
            <Reveal className="section-title"><span className="eyebrow">{t('game.playHere')}</span></Reveal>
            <GameEmbed play={game.play} title={game.title} seed={game.slug} accent={game.accent} />
          </section>
        )}

        {game.gallery.length > 0 && (
          <section style={{ paddingBlock: 'clamp(3rem, 7vw, 6rem)' }}>
            <Reveal className="section-title"><span className="eyebrow">{t('game.gallery')}</span></Reveal>
            <div className="grid-2">
              {game.gallery.map((g, k) => (
                <Reveal key={g.src} delay={(k % 2) * 0.08}>
                  <img src={asset(g.src)!} alt={l(g.alt)} loading="lazy" decoding="async" style={{ borderRadius: 'var(--radius)', width: '100%', border: '1px solid var(--line)' }} />
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </section>

      {next && next.slug !== game.slug && (
        <Link to={to(`/games/${next.slug}`)} className="next-project wrap">
          <span className="dim">{t('game.next')}</span>
          <h3>{next.title}</h3>
          <span style={{ display: 'inline-flex', marginTop: '1.5rem' }} className="uni__go"><Arrow size={18} /></span>
        </Link>
      )}
    </article>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal className="prose-block">
      <h2>{title}</h2>
      <div className="content">{children}</div>
    </Reveal>
  );
}
