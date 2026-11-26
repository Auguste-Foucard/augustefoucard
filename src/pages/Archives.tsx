import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { archives } from '../content';
import type { ArchiveKind } from '../content/types';
import { useLang } from '../i18n/lang';
import type { UIKey } from '../i18n/ui';
import { useMeta } from '../lib/hooks';
import { asset } from '../lib/util';
import { EASE, PageHead, Reveal, Button } from '../components/Motion';
import { Filter } from '../components/Filter';
import { Media } from '../components/Media';
import { PlaceholderBadge } from '../components/Badge';
import { ArrowUpRight } from '../components/Icons';

type F = 'all' | ArchiveKind;

export default function Archives() {
  const { t, l } = useLang();
  useMeta(t('nav.archives'), t('archives.intro'));
  const [f, setF] = useState<F>('all');
  const kinds = useMemo(() => Array.from(new Set(archives.map((a) => a.kind))), []);
  const list = archives.filter((a) => f === 'all' || a.kind === f);
  const years = Array.from(new Set(list.map((a) => a.year)));

  return (
    <>
      <PageHead eyebrow={t('archives.eyebrow')} title={t('archives.title')} lede={t('archives.intro')}>
        <div style={{ marginTop: '2.5rem' }}>
          <Filter label={t('archives.eyebrow')} value={f} onChange={setF} options={[{ value: 'all' as F, label: t('kind.all') }, ...kinds.map((k) => ({ value: k as F, label: t(`kind.${k}` as UIKey) }))]} />
        </div>
      </PageHead>
      <section className="wrap timeline" style={{ paddingBottom: 'var(--section)' }}>
        <AnimatePresence mode="wait">
          <motion.div key={f} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}>
            {years.map((y) => (
              <div key={y} className="tl-year">
                <div className="tl-year__label" aria-hidden="true">{y}</div>
                <h2 className="sr-only">{y}</h2>
                <div className="tl-items">
                  {list.filter((a) => a.year === y).map((a, i) => (
                    <Reveal key={a.id} as="article" className="tl-item lift" delay={i * 0.06}>
                      <div className="tl-item__media">
                        {a.video ? <video src={asset(a.video)!} poster={asset(a.cover) ?? undefined} muted loop playsInline controls preload="none" /> : <Media src={a.cover} alt={a.title} seed={a.id} label={false} />}
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span className="tag">{t(`kind.${a.kind}` as UIKey)}</span>
                          <PlaceholderBadge show={!!a.placeholder} />
                        </div>
                        <h3>{a.title}</h3>
                        <p>{l(a.description)}</p>
                        {a.links.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                            {a.links.map((lk) => <Button key={lk.url} variant="ghost" size="sm" href={lk.url} magnetic={false}>{l(lk.label)} <ArrowUpRight size={14} /></Button>)}
                          </div>
                        )}
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </section>
    </>
  );
}
