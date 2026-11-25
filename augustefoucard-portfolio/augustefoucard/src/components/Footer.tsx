import { Link } from 'react-router-dom';
import { site } from '../content';
import { useLang } from '../i18n/lang';
import { NAV } from '../lib/nav';

export function Footer() {
  const { t, to } = useLang();
  const socials = site.socials.filter((s) => s.url);
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__big" aria-hidden="true">Auguste<br />Foucard</div>
        <div className="footer__row">
          <span>© {new Date().getFullYear()} {site.name}. {t('footer.rights')}</span>
          <nav aria-label="Pied de page">
            {NAV.slice(1).map((n) => <Link key={n.path} to={to(n.path)}>{t(n.key)}</Link>)}
            {socials.map((s) => <a key={s.id} href={s.url!} target="_blank" rel="noopener noreferrer">{s.label}</a>)}
          </nav>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{t('footer.top')} ↑</button>
        </div>
      </div>
    </footer>
  );
}
