import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { games } from '../content';
import type { Game, GameCategory } from '../content/types';
import { useLang } from '../i18n/lang';
import type { UIKey } from '../i18n/ui';
import { asset } from '../lib/util';
import { EASE, Reveal } from './Motion';
import { Media } from './Media';
import { Flask, Gamepad, Heart, Phone, Swords } from './Icons';

type F = 'all' | GameCategory;
const CATS: F[] = ['all', 'impact', 'rpg', 'mobile', 'experiment'];
export const CAT_ICON = { all: Gamepad, impact: Heart, rpg: Swords, mobile: Phone, experiment: Flask };

export function CategoryChips({ list }: { list: GameCategory[] }) {
  const { t } = useLang();
  return (
    <span className="chips-row">
      {list.map((c) => { const I = CAT_ICON[c]; return <span key={c} className="cchip"><I size={13} />{t(`cat.${c}` as UIKey)}</span>; })}
    </span>
  );
}

/** Carte de jeu : une grande miniature, le titre, la catégorie. Rien de plus. */
function Card({ game, i }: { game: Game; i: number }) {
  const { t, to } = useLang();
  return (
    <Reveal as="article" delay={(i % 3) * 0.08} y={36} className="gcard2">
      <Link to={to(`/games/${game.slug}`)} className="gcard2__link" aria-label={`${t('game.discover')} — ${game.title}`}>
        <span className="gcard2__img"><Media src={game.cover} alt="" seed={game.slug} accent={game.accent} label={false} /></span>
        {game.video && <video className="gcard2__video" src={asset(game.video)!} muted loop playsInline preload="none" aria-hidden="true" onMouseEnter={(e) => e.currentTarget.play().catch(() => {})} onMouseLeave={(e) => e.currentTarget.pause()} />}
        <span className="gcard2__veil" />
        <span className="gcard2__txt">
          <span className="gcard2__title">{game.title}</span>
          <CategoryChips list={game.categories} />
        </span>
      </Link>
    </Reveal>
  );
}

/** Emplacement réservé : l'endroit où apparaîtra un futur jeu. */
function Slot({ i }: { i: number }) {
  const { t } = useLang();
  return (
    <Reveal as="div" delay={(i % 3) * 0.08} y={36} className="gcard2 gcard2--slot">
      <div className="gcard2__link" role="img" aria-label={`${t('slot.label')} — ${t('slot.hint')}`}>
        <span className="gcard2__slot-bg" />
        <span className="gcard2__slot-in"><Gamepad size={28} /><span>{t('slot.label')}</span><small>{t('slot.hint')}</small></span>
      </div>
    </Reveal>
  );
}

/** Section « Mes créations » : titre, cinq filtres, grille. Utilisée sur l'accueil et sur /games. */
export function Collection({ id, as: H = 'h2' }: { id?: string; as?: 'h1' | 'h2' }) {
  const { t } = useLang();
  const [f, setF] = useState<F>('all');
  const uid = useId();
  const list = games.filter((g) => f === 'all' || g.categories.includes(f as GameCategory));
  const empty = games.length === 0;
  const slots = f === 'all' ? 6 : 3;

  return (
    <section className="wrap collection" id={id} aria-labelledby={`${uid}-t`}>
      <div className="collection__head">
        <Reveal><H id={`${uid}-t`} className="collection__title">{t('home.creations')}</H></Reveal>
        <Reveal delay={0.08}><p className="collection__sub">{t('home.creations.sub')}</p></Reveal>
        <Reveal delay={0.14}>
          <div className="filters2" role="group" aria-label={t('cat.label')}>
            {CATS.map((c) => {
              const I = CAT_ICON[c];
              return (
                <button key={c} className="filter2" aria-pressed={f === c} onClick={() => setF(c)}>
                  {f === c && <motion.span layoutId={`f2-${uid}`} className="filter2__bg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                  <span className="filter2__in">{c !== 'all' && <I size={15} />}{t(`cat.${c}` as UIKey)}</span>
                </button>
              );
            })}
          </div>
        </Reveal>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={f} className="cgrid" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: EASE }} aria-live="polite">
          {empty
            ? Array.from({ length: slots }, (_, i) => <Slot key={i} i={i} />)
            : list.map((g, i) => <Card key={g.slug} game={g} i={i} />)}
          {!empty && list.length === 0 && <p className="gallery__empty">{t('cat.empty')}</p>}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
