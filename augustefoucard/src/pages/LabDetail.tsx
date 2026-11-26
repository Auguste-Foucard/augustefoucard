import { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getExperiment } from '../content';
import { useLang } from '../i18n/lang';
import { useMeta } from '../lib/hooks';
import { LAB_REGISTRY } from '../lab/registry';
import { PageHead, Reveal } from '../components/Motion';
import { PlaceholderBadge } from '../components/Badge';
import NotFound from './NotFound';

export default function LabDetail() {
  const { slug } = useParams();
  const e = getExperiment(slug);
  const { t, l, to } = useLang();
  useMeta(e ? l(e.title) : t('lab.notFound'), e ? l(e.summary) : undefined);
  if (!e) return <NotFound />;
  const Interactive = e.interactive ? LAB_REGISTRY[e.interactive] : null;

  return (
    <article>
      <PageHead eyebrow={t('lab.eyebrow')} title={l(e.title)} lede={l(e.summary)}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '2rem' }}>
          <Link to={to('/lab')} className="eyebrow">{t('lab.back')}</Link>
          <PlaceholderBadge show={!!e.placeholder} />
          {e.tags.map((tg) => <span key={tg} className="tag">{tg}</span>)}
        </div>
      </PageHead>
      <section className="wrap" style={{ paddingBottom: 'var(--section)' }}>
        {Interactive && (
          <Reveal>
            <Suspense fallback={<div className="lab-stage" style={{ aspectRatio: '16/9' }} />}>
              <Interactive />
            </Suspense>
          </Reveal>
        )}
        {e.embed && (
          <Reveal>
            <div className="player-embed" style={{ aspectRatio: '16/9' }}>
              <iframe src={e.embed} title={l(e.title)} allow="fullscreen; microphone; gamepad" loading="lazy" />
            </div>
          </Reveal>
        )}
        <Reveal className="prose-block" >
          <h2>Notes</h2>
          <div className="content"><p>{l(e.body)}</p></div>
        </Reveal>
      </section>
    </article>
  );
}
