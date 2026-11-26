import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useLang } from '../i18n/lang';
import { chimeOn, onChime, setChime } from '../lib/chime';

/** Petit interrupteur « étoiles sonores » + indice discret sur l'interaction. Son coupé par défaut. */
export function ChimeToggle({ delay }: { delay: number }) {
  const { t } = useLang();
  const [on, setOn] = useState(chimeOn());
  useEffect(() => onChime(setOn), []);
  return (
    <motion.div className="chime" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay, duration: 1.4 }}>
      <button type="button" className={`chime__btn${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => setChime(!on)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
          <path d="M8 3.5l1.2 3.3 3.3 1.2-3.3 1.2L8 12.5 6.8 9.2 3.5 8l3.3-1.2z" fill="currentColor" stroke="none" />
          <path className="chime__w1" d="M15 9.5c1.2 1.4 1.2 3.6 0 5" />
          <path className="chime__w2" d="M18 7c2.4 2.8 2.4 7.2 0 10" />
          {!on && <path d="M14 18.5L21 5.5" />}
        </svg>
        <span>{t('home.chime')}</span>
      </button>
      <p className="chime__hint">{t('home.hint')}</p>
    </motion.div>
  );
}
