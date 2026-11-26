import { motion, useMotionValue, useSpring, useReducedMotion, useScroll, useTransform, type Variants } from 'motion/react';
import { useRef, type ReactNode, type PointerEvent as RPE, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useRichMotion } from '../lib/hooks';

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Effet magnétique subtil (souris uniquement). */
export function Magnetic({ children, strength = 0.25, className, style }: { children: ReactNode; strength?: number; className?: string; style?: CSSProperties }) {
  const rich = useRichMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 });
  const move = (e: RPE) => {
    if (!rich || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const leave = () => { x.set(0); y.set(0); };
  return (
    <motion.span ref={ref} className={className} style={{ display: 'inline-flex', x, y, ...style }} onPointerMove={move} onPointerLeave={leave}>
      {children}
    </motion.span>
  );
}

const MLink = motion.create(Link);

type BtnProps = {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'glow';
  size?: 'sm';
  to?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  magnetic?: boolean;
  ariaLabel?: string;
  download?: boolean;
};

/** Bouton réactif : lueur qui suit le curseur, micro-rebond au clic, magnétisme optionnel. */
export function Button({ children, variant = 'primary', size, to, href, onClick, disabled, type = 'button', magnetic = true, ariaLabel, download }: BtnProps) {
  const cls = `btn btn--${variant}${size ? ' btn--sm' : ''}`;
  const track = (e: RPE<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const common = { className: cls, onPointerMove: track, whileTap: { scale: 0.96 }, transition: { type: 'spring' as const, stiffness: 500, damping: 30 }, 'aria-label': ariaLabel };
  let el: ReactNode;
  if (to && !disabled) el = <MLink to={to} {...common}>{children}</MLink>;
  else if (href && !disabled) el = <motion.a href={href} target={download ? undefined : '_blank'} rel="noopener noreferrer" download={download || undefined} {...common}>{children}</motion.a>;
  else el = <motion.button type={type} onClick={onClick} disabled={disabled} aria-disabled={disabled || undefined} {...common}>{children}</motion.button>;
  return magnetic ? <Magnetic strength={0.18}>{el}</Magnetic> : el;
}

/** Apparition douce à l'entrée dans l'écran. */
export function Reveal({ children, delay = 0, y = 28, className, as = 'div' }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: 'div' | 'li' | 'section' | 'article' }) {
  const reduce = useReducedMotion();
  const C = motion[as];
  return (
    <C
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: reduce ? 0.2 : 0.9, ease: EASE, delay }}
    >
      {children}
    </C>
  );
}

const wordV: Variants = {
  hidden: { y: '105%', opacity: 0 },
  show: (i: number) => ({ y: '0%', opacity: 1, transition: { duration: 0.9, ease: EASE, delay: 0.08 + i * 0.06 } }),
};

/** Titre dont les mots montent un à un. */
export function SplitTitle({ text, as: Tag = 'h1', className, style }: { text: string; as?: 'h1' | 'h2' | 'h3'; className?: string; style?: CSSProperties }) {
  const reduce = useReducedMotion();
  const words = text.split(' ');
  return (
    <Tag className={className} style={style} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true" style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.06em' }}>
          <motion.span style={{ display: 'inline-block' }} custom={i} variants={reduce ? undefined : wordV} initial={reduce ? false : 'hidden'} animate="show">
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

export function PageHead({ eyebrow, title, lede, children }: { eyebrow: string; title: string; lede?: string; children?: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <header className="page-head wrap">
      <motion.span className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.05 }}>{eyebrow}</motion.span>
      <SplitTitle text={title} />
      {lede && (
        <motion.p className="lede" initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}>
          {lede}
        </motion.p>
      )}
      {children}
    </header>
  );
}

/** Léger effet de profondeur au défilement. */
export function Parallax({ children, amount = 60, className }: { children: ReactNode; amount?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [amount, -amount]);
  return <motion.div ref={ref} className={className} style={{ y }}>{children}</motion.div>;
}

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return <motion.div className="progress" style={{ scaleX }} aria-hidden="true" />;
}
