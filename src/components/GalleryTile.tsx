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

export type Variant = 'full' | 'wide' | 'tall' | 'center';

/** Une œuvre dans la galerie : grande illustration, titre, quelques mots, deux actions. */
export function GalleryTile({ game, variant, index }: { game: Game; variant: Variant; index: number }) {
  const { t, l, to } = useLang();
  const rich = useRichMotion();
  const media = useRef<HTMLAnchorElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const href = to(`/games/${game.slug}`);

  // Profondeur très légère : l'image se décale à l'opposé du curseur.
  const move = (e: RPE<HTMLAnchorElement>) => {
    if (!rich || !media.current) return;
    const r = media.current.getBoundingClientRect();
    media.current.style.setProperty('--px', `${((e.clientX - r.left) / r.width - 0.5) * -14}px`);
    media.current.style.setProperty('--py', `${((e.clientY - r.top) / r.height - 0.5) * -10}px`);
  };
  const enter = () => { if (rich) video.current?.play().catch(() => {}); };
  const leave = () => {
    media.current?.style.setProperty('--px', '0px');
    media.current?.style.setProperty('--py', '0px');
    if (rich) video.current?.pause();
  };

  useEffect(() => {
    const v = video.current;
    if (!v || rich) return;
    const saveData = (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.8 });
    io.observe(v);
    return () => io.disconnect();
  }, [rich]);

  const cats = game.categories.map((c) => t(`cat.${c}` as UIKey)).join(' · ');

  return (
    <Reveal as="article" className={`tile tile--${variant}${game.cover ? '' : ' tile--gen'}`} delay={(index % 2) * 0.1} y={40}>
      <Link
        ref={media} to={href} className="tile__media" style={{ ['--accent' as string]: game.accent }}
        aria-label={`${t('game.discover')} — ${game.title}`}
        onPointerMove={move} onPointerEnter={enter} onPointerLeave={leave}
      >
        <span className="tile__img"><Media src={game.cover} alt="" seed={game.slug} accent={game.accent} label={false} /></span>
        {game.video && <video ref={video} className="tile__video" src={asset(game.video)!} muted loop playsInline preload="none" poster={asset(game.cover) ?? undefined} aria-hidden="true" />}
        <span className="tile__veil" />
        {game.placeholder && <span className="tile__badge"><PlaceholderBadge /></span>}
      </Link>
      <div className="tile__body">
        <div className="tile__text">
          {cats && <span className="tile__cats">{cats}</span>}
          <h3 className="tile__title"><Link to={href}>{game.title}</Link></h3>
          <p className="tile__sum">{l(game.summary).replace(/\s*\[[^\]]*\]\s*$/, '')}</p>
        </div>
        <div className="tile__actions">
          {game.play && (
            <Button variant="ghost" size="sm" to={game.play.type === 'embed' ? `${href}#play` : undefined} href={game.play.type === 'external' ? game.play.url : undefined}>
              <Play size={14} /> {t('game.play')}
            </Button>
          )}
          <Button variant="ghost" size="sm" to={href}>{t('game.discover')} <span className="btn__arrow"><Arrow size={16} /></span></Button>
        </div>
      </div>
    </Reveal>
  );
}
