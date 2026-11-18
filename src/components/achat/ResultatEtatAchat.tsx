import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import { Button } from '../ui/button';
import type { Issue } from '../../lib/rapports';
import type { ApiState } from '../../lib/useApi';

/** États d'un état Achat : chargement, 403 « Accès refusé », erreur, vide, puis le contenu. */
export default function ResultatEtatAchat<T>({
  api,
  vide,
  children,
}: Readonly<{ api: ApiState<Issue<T>>; vide: (d: T) => boolean; children: (d: T) => ReactNode }>) {
  const { data, loading, error, refetch } = api;
  let contenu: ReactNode = null;
  if (error) {
    contenu = (
      <div className="flex flex-col items-center gap-2">
        <ErrorState message={error} />
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
          <RotateCcw data-icon="inline-start" /> Réessayer
        </Button>
      </div>
    );
  } else if (data && 'statut' in data) {
    contenu = <EmptyState title="Accès refusé" message="Vous n'avez pas le droit de consulter cet état." />;
  } else if (data) {
    contenu = (
      <ResultsRegion loading={loading}>
        {vide(data.donnees) ? <EmptyState title="Aucune pièce sur la période" /> : children(data.donnees)}
      </ResultsRegion>
    );
  } else if (loading) {
    contenu = <LoadingState />;
  }
  return <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto px-3 pt-2 pb-12">{contenu}</div>;
}
