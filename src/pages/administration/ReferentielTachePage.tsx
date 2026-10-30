import { useLocation } from 'react-router-dom';
import { Gauge, Settings2 } from 'lucide-react';
import PageShell from '../../components/PageShell';
import TableReferentiel from '../../components/configuration/TableReferentiel';
import { ErrorState, LoadingState } from '../../components/ui';
import { listDescripteursReferentiels } from '../../lib/apiReferentielsAdmin';
import { useApi } from '../../lib/useApi';

const ECRANS = {
  '/administration/type-tache': { slug: 'types-tache', titre: 'Type de tâche', crumb: 'Type', Icone: Settings2 },
  '/administration/priorite-tache': { slug: 'priorites-tache', titre: 'Priorité de tâche', crumb: 'Priorité', Icone: Gauge },
} as const;

/** Une page pour les deux référentiels de tâches : le slug se déduit de la route. */
export default function ReferentielTachePage() {
  const { pathname } = useLocation();
  const ecran = pathname.startsWith('/administration/priorite-tache') ? ECRANS['/administration/priorite-tache'] : ECRANS['/administration/type-tache'];
  const { data, loading, error } = useApi(listDescripteursReferentiels, [], 'referentiels-admin-descripteurs');
  const descripteur = data?.find((d) => d.slug === ecran.slug);

  return (
    <PageShell title={ecran.titre} icon={<ecran.Icone />} fullHeight
      crumbs={[{ label: 'Administration' }, { label: 'Configuration' }, { label: 'Tâches' }, { label: ecran.crumb }]}>
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && !descripteur && <ErrorState message="Référentiel introuvable." />}
      {!error && descripteur && <TableReferentiel key={ecran.slug} descripteur={descripteur} />}
    </PageShell>
  );
}
