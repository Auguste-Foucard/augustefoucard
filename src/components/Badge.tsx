import { useLang } from '../i18n/lang';

export function PlaceholderBadge({ show = true }: { show?: boolean }) {
  const { t } = useLang();
  if (!show) return null;
  return <span className="badge" title={t('placeholder')}>{t('placeholder')}</span>;
}
