import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { site } from '../content';
import { useLang } from '../i18n/lang';
import { NAV, isActive } from '../lib/nav';
import { EASE, Magnetic } from './Motion';
import { Close } from './Icons';

export function Header() {
  const { t, to, bare, switchTo, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const last = useRef(0);

  useMotionValueEvent(scrollY, 'change', (y) => {
    const d = y - last.current;
    last.current = y;
    setScrolled(y > 24);
    if (Math.abs(d) > 6) setHidden(d > 0 && y > 240);
  });

  useEffect(() => setOpen(false), [bare, lang]);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <header className="header" data-hidden={hidden && !open} data-scrolled={scrolled}>
        <div className="wrap header__bar">
          <Link to={to('/')} className="logo" aria-label={`${site.name} — ${t('nav.home')}`}>
            <span className="logo__dot" />
            AUGUSTE FOUCARD
          </Link>
          <nav className="header__links" aria-label="Navigation principale">
            {NAV.filter((n) => n.short).map((n) => (
              <Magnetic key={n.path} strength={0.2}>
                <Link to={to(n.path)} className="navlink" aria-current={isActive(bare, n.path) ? 'page' : undefined}>{t(n.key)}</Link>
              </Magnetic>
            ))}
          </nav>
          <div className="header__right">
            <Link to={switchTo} className="lang-btn" hrefLang={lang === 'fr' ? 'en' : 'fr'} aria-label={t('lang.switch')}>{t('lang.code')}</Link>
            <Magnetic strength={0.2}>
              <button className="menu-btn" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="site-menu">
                <span>{t('nav.menu')}</span>
                <span className="menu-btn__icon" aria-hidden="true"><span /><span /></span>
              </button>
            </Magnetic>
          </div>
        </div>
      </header>
      <Menu open={open} onClose={close} />
    </>
  );
}

function Menu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, to, bare, switchTo } = useLang();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const opener = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => closeRef.current?.focus());
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a, button');
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener('keydown', key); opener?.focus?.(); };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="site-menu" ref={panel} className="menu" role="dialog" aria-modal="true" aria-label={t('nav.menu')}
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="wrap menu__top">
            <Link to={to('/')} className="logo"><span className="logo__dot" />AUGUSTE FOUCARD</Link>
            <button ref={closeRef} className="menu-btn" onClick={onClose}>
              <span>{t('nav.close')}</span><Close size={16} />
            </button>
          </div>
          <nav className="wrap" aria-label="Menu">
            <ul className="menu__list">
              {NAV.map((n, i) => (
                <motion.li key={n.path} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }} transition={{ duration: 0.8, ease: EASE, delay: 0.18 + i * 0.045 }}>
                  <Link to={to(n.path)} className="menu__link" aria-current={isActive(bare, n.path) ? 'page' : undefined} onClick={onClose}>
                    <small>{String(i + 1).padStart(2, '0')}</small>
                    {t(n.key)}
                    <span className="menu__arrow">→</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>
          <motion.div className="wrap menu__foot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <span>{site.roles.join(' · ')}</span>
            <Link to={switchTo} className="navlink" onClick={onClose}>{t('lang.switch')}</Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
