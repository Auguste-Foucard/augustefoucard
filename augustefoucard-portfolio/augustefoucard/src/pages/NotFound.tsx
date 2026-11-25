import { useLang } from '../i18n/lang';
import { useMeta } from '../lib/hooks';
import { Button, SplitTitle } from '../components/Motion';

export default function NotFound() {
  const { t, to } = useLang();
  useMeta(t('notFound.title'));
  return (
    <section className="notfound">
      <div style={{ display: 'grid', gap: '1.5rem', justifyItems: 'center' }}>
        <span className="code">404</span>
        <SplitTitle text={t('notFound.title')} />
        <p className="muted">{t('notFound.text')}</p>
        <Button to={to('/')}>{t('notFound.back')}</Button>
      </div>
    </section>
  );
}
