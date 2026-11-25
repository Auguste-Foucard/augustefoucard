import { motion } from 'motion/react';
import { useId } from 'react';

/** Rangée de filtres : la pastille active glisse d'un choix à l'autre. */
export function Filter<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  const id = useId();
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => (
        <motion.button key={o.value} className="chip" aria-pressed={value === o.value} onClick={() => onChange(o.value)} whileTap={{ scale: 0.95 }}>
          {value === o.value && <motion.span layoutId={`chip-${id}`} className="chip__bg" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
          <span>{o.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
