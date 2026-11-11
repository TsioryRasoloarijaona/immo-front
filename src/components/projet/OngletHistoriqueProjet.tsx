import DataGrid, { type ColonneGrille } from '../DataGrid';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { listHistoriqueProjet } from '../../lib/apiProjetConfig';
import { formatDateTime } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { UUID } from '../../types';
import type { HistoriqueProjetDto } from '../../types/projetConfig';

const COLONNES: ColonneGrille<HistoriqueProjetDto>[] = [
  { nom: 'date', libelle: 'Date', largeur: 10, valeur: (h) => formatDateTime(h.date) },
  {
    nom: 'transition', libelle: 'Transition', largeur: 16,
    valeur: (h) => h.transition ?? h.description ?? '',
  },
  { nom: 'statut', libelle: 'Statut', largeur: 10 },
  { nom: 'utilisateur', libelle: 'Utilisateur', largeur: 12 },
  { nom: 'commentaire', libelle: 'Note', largeur: 24 },
];

/** Historique des changements de statut du projet, lecture seule. */
export default function OngletHistoriqueProjet({ projetId }: Readonly<{ projetId: UUID }>) {
  const { data, loading, error } = useApi(() => listHistoriqueProjet(projetId), [projetId]);
  return (
    <>
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && (data.length === 0 ? (
        <EmptyState title="Aucun historique" />
      ) : (
        <div className="max-h-72 overflow-auto rounded-xl border border-border bg-card">
          <DataGrid rows={data} colonnes={COLONNES} bandeauRegroupement={false} />
        </div>
      ))}
    </>
  );
}
