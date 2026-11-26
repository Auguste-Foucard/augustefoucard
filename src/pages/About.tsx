import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { about, site } from '../content';
import { useLang } from '../i18n/lang';
import { useMeta } from '../lib/hooks';
import { asset } from '../lib/util';
import { EASE, Reveal } from '../components/Motion';
import { Doc, Gamepad, Heart, Layers, Linkedin, Mail, Note } from '../components/Icons';

const ICONS: Record<string, typeof Gamepad> = { game: Gamepad, note: Note, layers: Layers, heart: Heart };

/** À propos : un texte court, quatre domaines, trois boutons discrets. */
export default function About() {
  const { t, l, lang, to } = useLang();
  useMeta(t('nav.about'), l(about.intro));
  const cv = site.cv[lang] ?? site.cv.fr;
  const linkedin = site.socials.find((s) => s.id === 'linkedin')?.url;
  const soon = <small className="pill__soon">{t('about.soon')}</small>;
  return (
    <section className="wrap about2">
      <motion.h1 className="about2__title" initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1.2, ease: EASE }}>
        {t('nav.about')}
      </motion.h1>
      <div className="about2__cols">
        {about.photo && <Reveal className="about2__photo"><img src={asset(about.photo)!} alt={site.name} decoding="async" /></Reveal>}
        <Reveal delay={0.1} className="about2__text">
          <p>{t('about.lead')}</p>
          <p>{t('about.lead2')}</p>
        </Reveal>
        <Reveal delay={0.2} className="about2__focus">
          <ul>
            {(about.focus ?? []).map((f) => { const I = ICONS[f.icon] ?? Gamepad; return <li key={f.fr}><I size={26} />{lang === 'fr' ? f.fr : f.en}</li>; })}
          </ul>
        </Reveal>
      </div>
      <Reveal delay={0.25}>
        <div className="about2__btns">
          {cv ? <a className="pill" href={asset(cv)!} download><Doc size={18} />{t('about.cvBtn')}</a> : <span className="pill pill--off" aria-disabled="true"><Doc size={18} />{t('about.cvBtn')}{soon}</span>}
          {linkedin ? <a className="pill" href={linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={18} />LinkedIn</a> : <span className="pill pill--off" aria-disabled="true"><Linkedin size={18} />LinkedIn{soon}</span>}
          <Link className="pill" to={to('/contact')}><Mail size={18} />{t('about.contactBtn')}</Link>
        </div>
      </Reveal>
    </section>
  );
}
