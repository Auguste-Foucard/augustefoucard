import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ReadingProgress, EASE } from './components/Motion';
import { PlayerProvider } from './components/player/PlayerContext';
import { Dock } from './components/player/Dock';
import { useLang } from './i18n/lang';
import { Sky } from './components/Sky';
import { Contemplate } from './components/Contemplate';
import { LineArt } from './components/LineArt';
import { PortalSwirl } from './components/PortalSwirl';
import { MusicLines } from './components/MusicLines';
import Home from './pages/Home';

const Games = lazy(() => import('./pages/Games'));
const GameDetail = lazy(() => import('./pages/GameDetail'));
const Archives = lazy(() => import('./pages/Archives'));
const SoundDesign = lazy(() => import('./pages/SoundDesign'));
const Music = lazy(() => import('./pages/Music'));
const Lab = lazy(() => import('./pages/Lab'));
const LabDetail = lazy(() => import('./pages/LabDetail'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));

const pages = [
  { path: '/', el: <Home /> },
  { path: '/games', el: <Games /> },
  { path: '/games/:slug', el: <GameDetail /> },
  { path: '/archives', el: <Archives /> },
  { path: '/sound-design', el: <SoundDesign /> },
  { path: '/music', el: <Music /> },
  { path: '/lab', el: <Lab /> },
  { path: '/lab/:slug', el: <LabDetail /> },
  { path: '/about', el: <About /> },
  { path: '/contact', el: <Contact /> },
];

function Shell() {
  const location = useLocation();
  const reduce = useReducedMotion();
  const { t, bare } = useLang();
  useEffect(() => { document.documentElement.dataset.page = bare === '/' ? 'home' : bare.split('/')[1] || 'home'; }, [bare]);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }, []);

  return (
    <>
      <Sky />
      <MusicLines />
      <LineArt />
      <Contemplate />
      <a href="#main" className="skip-link">{t('nav.skip')}</a>
      <ReadingProgress />
      <Header />
      <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
        <motion.div
          key={location.pathname}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.992 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.9, ease: EASE } }}
          exit={reduce ? { opacity: 0, transition: { duration: 0.15 } } : { opacity: 0, scale: 1.008, transition: { duration: 0.45, ease: [0.65, 0, 0.35, 1] } }}
        >
          {!reduce && <TransitionLine />}
          <main id="main" tabIndex={-1}>
            <Suspense fallback={<div style={{ minHeight: '100svh' }} />}>
              <Routes location={location}>
                {pages.map((p) => <Route key={p.path} path={p.path} element={p.el} />)}
                {pages.map((p) => <Route key={'en' + p.path} path={p.path === '/' ? '/en' : '/en' + p.path} element={p.el} />)}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </motion.div>
      </AnimatePresence>
      <PortalSwirl />
      <Dock />
    </>
  );
}

/** Fine ligne lumineuse qui traverse l'écran à chaque changement de page. */
function TransitionLine() {
  return (
    <motion.div
      aria-hidden="true"
      className="progress"
      style={{ top: 0, height: 1, opacity: 0.9 }}
      initial={{ scaleX: 0, opacity: 1 }}
      animate={{ scaleX: 1, opacity: 0, transition: { scaleX: { duration: 0.8, ease: EASE }, opacity: { duration: 0.5, delay: 0.6 } } }}
    />
  );
}

const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Router>
        <PlayerProvider>
          <Shell />
        </PlayerProvider>
      </Router>
    </MotionConfig>
  );
}
