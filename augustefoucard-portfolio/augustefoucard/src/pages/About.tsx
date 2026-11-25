import { about, site } from '../content';
import { useLang } from '../i18n/lang';
import { useMeta } from '../lib/hooks';
import { asset } from '../lib/util';
import { Button, Parallax, Reveal, SplitTitle } from '../components/Motion';
import { PlaceholderBadge } from '../components/Badge';
import { Download } from '../components/Icons';

export default function About() {
  const { t, l, lang } = useLang();
  useMeta(t('nav.about'), l(about.intro));
  const cv = site.cv[lang] ?? site.cv.fr;
  return (
    <>
      <section className="wrap" style={{ paddingTop: 'clamp(8rem, 16vw, 12rem)' }}>
        <div className="about-top">
          <Parallax amount={30}>
            <div className="portrait">
              {about.photo ? <img src={asset(about.photo)!} alt={site.name} loading="eager" /> : <div className="portrait__slot">{t('about.photo')}</div>}
            </div>
          </Parallax>
          <div style={{ display: 'grid', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="eyebrow">{t('about.eyebrow')}</span>
              <PlaceholderBadge show={!!about.placeholder} />
            </div>
            <SplitTitle text={t('about.title')} style={{ fontSize: 'clamp(2.75rem, 1.5rem + 5.5vw, 7rem)', textTransform: 'uppercase', fontVariationSettings: "'wdth' 118" }} />
            <Reveal><p className="about-intro">{l(about.intro)}</p></Reveal>
            <Reveal>
              {cv ? <Button href={asset(cv)!} download><Download size={16} /> {t('about.cv')}</Button> : <Button disabled>{t('about.cvSoon')}</Button>}
            </Reveal>
          </div>
        </div>
      </section>

      <section className="wrap">
        <Reveal className="prose-block"><h2>{t('about.story')}</h2><div className="content"><p>{l(about.story)}</p></div></Reveal>

        <Reveal className="prose-block">
          <h2>{t('about.experience')}</h2>
          <ul className="cv-list" style={{ display: 'block' }}>
            {about.experience.map((x, i) => (
              <li key={i} style={{ display: 'grid' }}>
                <span className="period">{x.period}</span>
                <div><h3>{l(x.title)}</h3><span className="place">{x.place}</span>{x.detail && <p className="muted">{l(x.detail)}</p>}</div>
                <PlaceholderBadge show={!!x.placeholder} />
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="prose-block">
          <h2>{t('about.education')}</h2>
          <ul className="cv-list" style={{ display: 'block' }}>
            {about.education.map((x, i) => (
              <li key={i} style={{ display: 'grid' }}>
                <span className="period">{x.period}</span>
                <div><h3>{l(x.title)}</h3><span className="place">{x.place}</span>{x.detail && <p className="muted">{l(x.detail)}</p>}</div>
                <PlaceholderBadge show={!!x.placeholder} />
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="prose-block">
          <h2>{t('about.skills')}</h2>
          <div className="skill-cols">
            {about.skills.map((s, i) => (
              <div key={i}><h3>{l(s.group)}</h3><ul>{s.items.map((it, k) => <li key={k}>{l(it)}</li>)}</ul></div>
            ))}
          </div>
        </Reveal>

        <Reveal className="prose-block">
          <h2>{t('about.software')}</h2>
          <ul className="soft">{about.software.map((s) => <li key={s.name}>{s.name}</li>)}</ul>
        </Reveal>
      </section>

      <section className="wrap section">
        <Reveal className="section-title"><span className="eyebrow">{t('about.philosophy')}</span></Reveal>
        <Reveal>
          <div className="philo">
            {about.philosophy.map((p, i) => (
              <div key={i}><span className="n">{String(i + 1).padStart(2, '0')}</span><p style={{ fontSize: '1.15rem' }}>{l(p)}</p></div>
            ))}
          </div>
        </Reveal>
      </section>
    </>
  );
}
