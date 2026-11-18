import type { ReactNode } from 'react';
import PageShell from '../../../components/PageShell';
import TableReferentiel from '../../../components/configuration/TableReferentiel';
import { ErrorState, LoadingState } from '../../../components/ui';
import { listDescripteursReferentiels } from '../../../lib/apiReferentielsAdmin';
import { useApi } from '../../../lib/useApi';

/** Référentiel du module Projet servi par le moteur de référentiels (slug du descripteur). */
export default function ReferentielProjetPage({ slug, titre, icone }: Readonly<{ slug: string; titre: string; icone: ReactNode }>) {
  const { data, loading, error } = useApi(listDescripteursReferentiels, [], 'referentiels-admin-descripteurs');
  const descripteur = data?.find((d) => d.slug === slug);

  return (
    <PageShell title={titre} icon={icone} fullHeight crumbs={[{ label: 'Projet' }, { label: 'Configuration' }, { label: titre }]}>
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && !descripteur && <ErrorState message="Référentiel introuvable." />}
      {!error && descripteur && <TableReferentiel key={slug} descripteur={descripteur} />}
    </PageShell>
  );
}
