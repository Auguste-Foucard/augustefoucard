import { GenArt } from './GenArt';
import { asset } from '../lib/util';
import { useLang } from '../i18n/lang';

/** Image réelle si fournie, sinon visuel génératif temporaire clairement étiqueté. */
export function Media({ src, alt, seed, accent, label = true, eager }: { src: string | null | undefined; alt: string; seed: string; accent?: string; label?: boolean; eager?: boolean }) {
  const { t } = useLang();
  const url = asset(src);
  if (url) return <img src={url} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
  return <GenArt seed={seed} accent={accent} label={label ? t('placeholder.visual') : undefined} />;
}
