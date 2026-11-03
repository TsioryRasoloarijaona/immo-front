import { useParams } from 'react-router-dom';
import { Globe, MapPin, Tags } from 'lucide-react';
import PageShell from '../../components/PageShell';
import TableReferentiel from '../../components/configuration/TableReferentiel';
import { ErrorState, LoadingState } from '../../components/ui';
import { listDescripteursReferentiels } from '../../lib/apiReferentielsAdmin';
import { useApi } from '../../lib/useApi';

const GEOGRAPHIE: Partial<Record<string, typeof Globe>> = { pays: Globe, villes: MapPin };

/** Pays, villes et listes des tiers (famille TIERS) : une page, le slug vient de la route. */
export default function ReferentielTiersPage() {
  const { slug = '' } = useParams();
  const { data, loading, error } = useApi(listDescripteursReferentiels, [], 'referentiels-admin-descripteurs');
  const descripteur = data?.find((d) => d.slug === slug && d.famille === 'TIERS');
  const Icone = GEOGRAPHIE[slug] ?? Tags;
  const groupe = GEOGRAPHIE[slug] ? [] : [{ label: 'Tiers' }];

  return (
    <PageShell title={descripteur?.libelle ?? 'Configuration'} icon={<Icone />} fullHeight
      crumbs={[{ label: 'Administration' }, { label: 'Configuration' }, ...groupe, { label: descripteur?.libelle ?? slug }]}>
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && !descripteur && <ErrorState message="Référentiel introuvable." />}
      {!error && descripteur && <TableReferentiel key={slug} descripteur={descripteur} />}
    </PageShell>
  );
}
