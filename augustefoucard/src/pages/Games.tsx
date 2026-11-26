import { useLang } from '../i18n/lang';
import { useMeta } from '../lib/hooks';
import { Collection } from '../components/Collection';

/** Page « Mes créations » : même collection que sous l'accueil, en pleine page. */
export default function Games() {
  const { t } = useLang();
  useMeta(t('games.title'), t('home.creations.sub'));
  return (
    <div className="page-creations">
      <Collection as="h1" />
    </div>
  );
}
