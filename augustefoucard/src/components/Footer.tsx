import { Link } from 'react-router-dom';
import { site } from '../content';
import { useLang } from '../i18n/lang';
import { MORE, NAV } from '../lib/nav';

export function Footer() {
  const { t, to } = useLang();
  const socials = site.socials.filter((s) => s.url);
  return (
    <footer className="footer">
      <div className="wrap footer__inner">
        <Link to={to('/')} className="footer__name">Auguste Foucard</Link>
        <nav aria-label="Pied de page" className="footer__nav">
          {NAV.map((n) => <Link key={n.path} to={to(n.path)}>{t(n.key)}</Link>)}
          <span className="footer__sep" aria-hidden="true" />
          {MORE.map((n) => <Link key={n.path} to={to(n.path)} className="dim">{t(n.key)}</Link>)}
          {socials.map((s) => <a key={s.id} href={s.url!} target="_blank" rel="noopener noreferrer" className="dim">{s.label}</a>)}
        </nav>
        <span className="footer__legal">© {new Date().getFullYear()} {site.name}</span>
      </div>
    </footer>
  );
}
