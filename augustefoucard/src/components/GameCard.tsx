import { motion, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useRef, type PointerEvent as RPE } from 'react';
import { Link } from 'react-router-dom';
import type { Game } from '../content/types';
import { useLang } from '../i18n/lang';
import type { UIKey } from '../i18n/ui';
import { useRichMotion } from '../lib/hooks';
import { asset } from '../lib/util';
import { PlaceholderBadge } from './Badge';
import { Media } from './Media';
import { Button, Reveal } from './Motion';
import { Arrow, Play } from './Icons';

export const STATUS_COLOR: Record<Game['status'], string> = {
  released: '#86efac',
  'in-development': '#c084fc',
  prototype: '#fcd34d',
  paused: '#94a3b8',
};

/** Grande carte de jeu : lumière qui suit le curseur, légère inclinaison, vidéo qui démarre au survol. */
export function GameCard({ game, index = 0 }: { game: Game; index?: number }) {
  const { t, l, to } = useLang();
  const rich = useRichMotion();
  const media = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 150, damping: 20 });
  const ry = useSpring(useMotionValue(0), { stiffness: 150, damping: 20 });
  const href = to(`/games/${game.slug}`);

  const move = (e: RPE<HTMLDivElement>) => {
    if (!rich || !media.current) return;
    const r = media.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    media.current.style.setProperty('--lx', `${px * 100}%`);
    media.current.style.setProperty('--ly', `${py * 100}%`);
    rx.set((0.5 - py) * 4);
    ry.set((px - 0.5) * 5);
  };
  const enter = () => { if (rich) video.current?.play().catch(() => {}); };
  const leave = () => { rx.set(0); ry.set(0); if (rich) video.current?.pause(); };

  // Sur écran tactile, la vidéo s'anime quand la carte est bien visible.
  useEffect(() => {
    const v = video.current;
    if (!v || rich) return;
    const saveData = (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.75 });
    io.observe(v);
    return () => io.disconnect();
  }, [rich]);

  return (
    <Reveal as="article" className="gcard" delay={(index % 2) * 0.08}>
      <motion.div
        ref={media}
        className="gcard__media"
        style={{ rotateX: rx, rotateY: ry, transformPerspective: 1200, ['--accent' as string]: game.accent }}
        onPointerMove={move}
        onPointerEnter={enter}
        onPointerLeave={leave}
      >
        <Media src={game.cover} alt={game.title} seed={game.slug} accent={game.accent} />
        {game.video && (
          <video ref={video} src={asset(game.video)!} muted loop playsInline preload="none" poster={asset(game.cover) ?? undefined} aria-hidden="true" />
        )}
        <span className="gcard__light" />
        <div className="gcard__badges">
          <span className="status" style={{ ['--c' as string]: STATUS_COLOR[game.status] }}>{t(`status.${game.status}` as UIKey)}</span>
          <PlaceholderBadge show={!!game.placeholder} />
        </div>
        <Link to={href} className="gcard__hit" aria-label={`${t('game.discover')} — ${game.title}`} tabIndex={-1} />
      </motion.div>
      <div className="gcard__body">
        <div>
          <h3 className="gcard__title"><Link to={href}>{game.title}</Link></h3>
          <dl className="gcard__meta">
            <div><dt>{t('game.genre')}</dt><dd>{l(game.genre)}</dd></div>
            <div><dt>{t('game.year')}</dt><dd>{game.year ?? t('year.tbd')}</dd></div>
            <div><dt>{t('game.role')}</dt><dd>{l(game.role)}</dd></div>
          </dl>
        </div>
        <div className="gcard__actions">
          {game.play && (
            <Button variant="ghost" size="sm" to={game.play.type === 'embed' ? `${href}#play` : undefined} href={game.play.type === 'external' ? game.play.url : undefined}>
              <Play size={14} /> {t('game.play')}
            </Button>
          )}
          <Button size="sm" to={href}>{t('game.discover')} <span className="btn__arrow"><Arrow size={16} /></span></Button>
        </div>
      </div>
    </Reveal>
  );
}
