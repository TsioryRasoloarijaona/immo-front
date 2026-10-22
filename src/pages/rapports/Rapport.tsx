import { useParams } from 'react-router-dom';
import AccesRapport from '../../components/rapports/AccesRapport';
import VisionneuseRapport from '../../components/rapports/VisionneuseRapport';
import PageShell from '../../components/PageShell';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui';
import { Skeleton } from '../../components/ui/skeleton';
import { getDescripteurRapport } from '../../lib/apiRapports';
import { enIssue } from '../../lib/rapports';
import { useApi } from '../../lib/useApi';
import type { ModuleRapport } from '../../types/rapports';

/** Page d'un rapport : charge le descripteur (403/404 gérés) puis délègue à la visionneuse générique. */
export default function Rapport({ module }: Readonly<{ module: ModuleRapport }>) {
  const { code = '' } = useParams();
  const { data, loading, error, refetch } = useApi(() => enIssue(getDescripteurRapport(module, code), [403, 404]), [module, code]);

  if (data && 'statut' in data) return <AccesRapport statut={data.statut} titre="Rapport" />;
  if (data) return <VisionneuseRapport key={`${module}/${code}`} descripteur={data.donnees} />;
  return (
    <PageShell title="Rapport" crumbs={[{ label: 'Rapports', to: '/rapports' }]}>
      {loading && !error && <Skeleton className="h-24 w-full" />}
      {error && (
        <EmptyState
          title="Impossible de charger le rapport"
          message={error}
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Réessayer
            </Button>
          }
        />
      )}
    </PageShell>
  );
}
