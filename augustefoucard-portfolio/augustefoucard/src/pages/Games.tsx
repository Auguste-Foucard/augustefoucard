import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { games } from '../content';
import type { GameStatus } from '../content/types';
import { useLang } from '../i18n/lang';
import type { UIKey } from '../i18n/ui';
import { useMeta } from '../lib/hooks';
import { PageHead, EASE } from '../components/Motion';
import { GameCard } from '../components/GameCard';
import { Filter } from '../components/Filter';

type F = 'all' | GameStatus;

export default function Games() {
  const { t } = useLang();
  useMeta(t('nav.games'), t('games.intro'));
  const [f, setF] = useState<F>('all');
  const present = useMemo(() => Array.from(new Set(games.map((g) => g.status))), []);
  const list = games.filter((g) => f === 'all' || g.status === f);
  const opts = [{ value: 'all' as F, label: t('games.all') }, ...present.map((s) => ({ value: s as F, label: t(`status.${s}` as UIKey) }))];

  return (
    <>
      <PageHead eyebrow={t('games.eyebrow')} title={t('games.title')} lede={t('games.intro')}>
        {opts.length > 2 && <div style={{ marginTop: '2.5rem' }}><Filter options={opts} value={f} onChange={setF} label={t('game.status')} /></div>}
      </PageHead>
      <section className="wrap" style={{ paddingBottom: 'var(--section)' }}>
        <AnimatePresence mode="wait">
          <motion.div key={f} className="games-grid" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease: EASE }}>
            {list.map((g, i) => <GameCard key={g.slug} game={g} index={i} />)}
          </motion.div>
        </AnimatePresence>
      </section>
    </>
  );
}
