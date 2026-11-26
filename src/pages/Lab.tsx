import { Link } from 'react-router-dom';
import { experiments } from '../content';
import { useLang } from '../i18n/lang';
import { useMeta } from '../lib/hooks';
import { PageHead, Reveal } from '../components/Motion';
import { Media } from '../components/Media';
import { PlaceholderBadge } from '../components/Badge';
import { Arrow } from '../components/Icons';

export default function Lab() {
  const { t, l, to } = useLang();
  useMeta(t('nav.lab'), t('lab.intro'));
  return (
    <>
      <PageHead eyebrow={t('lab.eyebrow')} title={t('lab.title')} lede={t('lab.intro')} />
      <section className="wrap" style={{ paddingBottom: 'var(--section)' }}>
        <div className="lab-grid">
          {experiments.map((e, i) => (
            <Reveal key={e.slug} as="article" className="lab-card lift" delay={(i % 3) * 0.07}>
              <Link to={to(`/lab/${e.slug}`)} style={{ display: 'contents' }}>
                <div className="lab-card__media"><Media src={e.cover} alt={l(e.title)} seed={'lab-' + e.slug} accent={e.accent} /></div>
                <div className="lab-card__body">
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {(e.interactive || e.embed) && <span className="status">{t('lab.interactive')}</span>}
                    <PlaceholderBadge show={!!e.placeholder} />
                  </div>
                  <h3>{l(e.title)}</h3>
                  <p>{l(e.summary)}</p>
                  <div className="lab-card__tags">{e.tags.map((tg) => <span key={tg} className="tag">{tg}</span>)}</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    {e.interactive || e.embed ? t('lab.try') : t('lab.read')} <Arrow size={16} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
