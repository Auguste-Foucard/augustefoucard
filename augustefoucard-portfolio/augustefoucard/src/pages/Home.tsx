import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { games, site } from '../content';
import { useLang } from '../i18n/lang';
import { useMeta, useRichMotion } from '../lib/hooks';
import { asset } from '../lib/util';
import { Button, EASE, Reveal } from '../components/Motion';
import { GameCard } from '../components/GameCard';
import { Arrow, ArrowUpRight } from '../components/Icons';

const INTRO_KEY = 'af-intro-seen';

export default function Home() {
  const { t, l, to } = useLang();
  useMeta(null);
  const featured = games.filter((g) => g.featured);
  return (
    <>
      <Hero />
      <section className="section wrap" aria-labelledby="sel-title">
        <Reveal className="section-title">
          <span className="eyebrow">{t('home.selected')}</span>
          <h2 id="sel-title">{t('home.selected.title')}</h2>
        </Reveal>
        <div className="games-grid">
          {featured.map((g, i) => <GameCard key={g.slug} game={g} index={i} />)}
        </div>
        <Reveal className="" delay={0.1}>
          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
            <Button variant="ghost" to={to('/games')}>{t('nav.games')} <span className="btn__arrow"><Arrow size={16} /></span></Button>
          </div>
        </Reveal>
      </section>

      <section className="section wrap" aria-labelledby="uni-title" style={{ paddingTop: 0 }}>
        <Reveal className="section-title">
          <span className="eyebrow">{t('home.universes')}</span>
          <h2 id="uni-title">{t('home.universes.title')}</h2>
        </Reveal>
        <Reveal>
          <div className="universes">
            {site.universes.map((u, i) => (
              <Link key={u.id} to={to(u.to)} className="uni" style={{ ['--accent' as string]: u.accent }}>
                <span className="uni__n">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{l(u.title)}</h3>
                  <p>{l(u.text)}</p>
                </div>
                <span className="uni__go" aria-hidden="true"><ArrowUpRight size={18} /></span>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="section--tight wrap" style={{ paddingBottom: 'var(--section)' }}>
        <Reveal className="cta-band">
          <h2>{t('home.cta.title')}</h2>
          <Button to={to('/contact')}>{t('home.cta.button')} <span className="btn__arrow"><Arrow size={16} /></span></Button>
        </Reveal>
      </section>
    </>
  );
}

function Hero() {
  const { t, l, to } = useLang();
  const reduce = useReducedMotion();
  const rich = useRichMotion();
  const ref = useRef<HTMLElement>(null);
  const [first] = useState(() => {
    try { return !sessionStorage.getItem(INTRO_KEY); } catch { return true; }
  });
  useEffect(() => { try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* ignore */ } }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const nameY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -120]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const glowScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.25]);

  // Lueur qui suit doucement le curseur (souris uniquement)
  const gx = useSpring(useMotionValue(0), { stiffness: 40, damping: 20 });
  const gy = useSpring(useMotionValue(0), { stiffness: 40, damping: 20 });
  const onMove = (e: React.PointerEvent) => {
    if (!rich) return;
    gx.set((e.clientX / window.innerWidth - 0.5) * 120);
    gy.set((e.clientY / window.innerHeight - 0.5) * 80);
  };

  const showVideo = !!site.showreel.src && !reduce && !(navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
  const base = first ? 0.25 : 0.05;
  const step = first ? 0.045 : 0.02;
  const [w1, w2] = site.name.toUpperCase().split(' ');

  const chars = (word: string, offset: number) =>
    word.split('').map((c, i) => (
      <motion.span
        key={i}
        className="hero__char"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: '70%', filter: 'blur(14px)' }}
        animate={{ opacity: 1, y: '0%', filter: 'blur(0px)' }}
        transition={{ duration: first ? 1.1 : 0.7, ease: EASE, delay: base + (offset + i) * step }}
      >
        {c}
      </motion.span>
    ));
  const after = base + (w1.length + w2.length) * step + 0.2;

  return (
    <section ref={ref} className="hero" onPointerMove={onMove} aria-label={site.name}>
      <div className="hero__bg" aria-hidden="true">
        {showVideo && (
          <video src={asset(site.showreel.src)!} poster={asset(site.showreel.poster) ?? undefined} autoPlay muted loop playsInline preload="metadata" />
        )}
        <motion.div className="hero__glow" style={{ x: gx, y: gy, scale: glowScale }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2.4, delay: base }} />
      </div>
      <motion.div className="wrap hero__inner" style={{ opacity: fade }}>
        <motion.h1 className="hero__name" style={{ y: nameY }} aria-label={site.name}>
          <span className="hero__line" aria-hidden="true">{chars(w1, 0)}</span>
          <span className="hero__line outline" aria-hidden="true">{chars(w2, w1.length)}</span>
        </motion.h1>
        <motion.p className="hero__roles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: after }}>
          {site.roles.map((r, i) => (
            <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem' }}>
              {i > 0 && <i aria-hidden="true" />}{r}
            </span>
          ))}
        </motion.p>
        <motion.p className="hero__tagline" initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE, delay: after + 0.15 }}>
          « {l(site.tagline)} »
        </motion.p>
        <motion.div className="hero__cta" initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: after + 0.3 }}>
          <Button to={to('/games')}>{t('home.discover')} <span className="btn__arrow"><Arrow size={16} /></span></Button>
          <Button variant="ghost" to={to('/music')}>{t('nav.music')}</Button>
        </motion.div>
      </motion.div>
      <motion.div className="hero__scroll" style={{ opacity: fade }} aria-hidden="true">
        <span />{t('home.scroll')}
      </motion.div>
      {!site.showreel.src && (
        <motion.div className="hero__slot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: after + 0.6 }}>
          <span className="badge">{t('home.showreel.slot')}</span>
        </motion.div>
      )}
    </section>
  );
}
