import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { site } from '../content';
import { useLang } from '../i18n/lang';
import { useMeta } from '../lib/hooks';
import { Button, EASE } from '../components/Motion';
import { Collection } from '../components/Collection';
import { Gamepad, ChevronRight } from '../components/Icons';
import { Landscape } from '../scene/Landscape';
import { asset } from '../lib/util';

const INTRO_KEY = 'af-intro-seen';

/** Accueil : le paysage plein écran, un nom, un métier, une phrase, un bouton — puis les créations. */
export default function Home() {
  const { t } = useLang();
  const reduce = useReducedMotion();
  useMeta(null);
  const ref = useRef<HTMLElement>(null);
  const [first] = useState(() => { try { return !sessionStorage.getItem(INTRO_KEY); } catch { return true; } });
  useEffect(() => { try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* ignore */ } }, []);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -70]);
  const o = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const k = first ? 1 : 0.35;
  const D = (a: number, b: number) => (first ? a : b);
  const words = ['Auguste', 'Foucard'];
  let n = 0;

  return (
    <>
      <section className="hero2" ref={ref}>
        <Landscape image={site.hero?.image ? asset(site.hero.image) : null} />
        <motion.div className="hero2__inner" style={{ y, opacity: o }}>
          <h1 className="hero2__name" aria-label="Auguste Foucard">
            {words.map((w, wi) => (
              <span key={w} className="hero2__word" aria-hidden="true">
                {w.split('').map((ch) => {
                  const i = n++;
                  return (
                    <motion.span key={i} className="hero2__char"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: '0.3em', filter: 'blur(14px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 1.7 * k, ease: EASE, delay: D(0.6, 0.05) + i * 0.09 * k }}
                    >{ch}</motion.span>
                  );
                })}
                {wi === 0 && ' '}
              </span>
            ))}
          </h1>
          <motion.p className="hero2__roles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: D(2.0, 0.4) }}>
            <i /><span>{t('home.roles').replace('&', '&')}</span><i />
          </motion.p>
          <motion.p className="hero2__tag" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5, ease: EASE, delay: D(2.5, 0.6) }}>
            {t('home.tagline')}
          </motion.p>
          <motion.div className="hero2__cta" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.3, ease: EASE, delay: D(3.0, 0.8) }}>
            <Button variant="glow" onClick={() => document.getElementById('creations')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })}>
              <Gamepad size={20} /> {t('home.discover')} <span className="btn__arrow"><ChevronRight size={18} /></span>
            </Button>
          </motion.div>
        </motion.div>
        <motion.button className="hero2__down" aria-label={t('home.discover')} onClick={() => document.getElementById('creations')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D(3.6, 1.2), duration: 1.2 }}>
          <svg width="30" height="22" viewBox="0 0 30 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 3l11 8 11-8M4 11l11 8 11-8" /></svg>
        </motion.button>
      </section>
      <Collection id="creations" />
    </>
  );
}
