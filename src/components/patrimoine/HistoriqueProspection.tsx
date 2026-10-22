import { EmptyState, ErrorState, LoadingState } from '../ui';
import TableauLecture, { type ColonneLecture } from './TableauLecture';
import { getHistoriqueProspectionTerrain } from '../../lib/apiProspectionsTerrain';
import { formatDateTime } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { HistoriqueStatutProspectionDto } from '../../types/prospectionsTerrain';

const COLONNES: ColonneLecture<HistoriqueStatutProspectionDto>[] = [
  { titre: 'Date', rendu: (h) => formatDateTime(h.dateUtilisateur ?? h.date) },
  { titre: 'Utilisateur', rendu: (h) => h.utilisateur || '—' },
  { titre: 'Transition', rendu: (h) => h.transition || h.description || '—' },
  { titre: 'Statut', rendu: (h) => h.statut || '—' },
  { titre: 'Commentaire', rendu: (h) => <span className="whitespace-pre-wrap">{h.commentaire || '—'}</span> },
];

/** Historique des statuts (StrHistory) : création puis une ligne par transition. */
export default function HistoriqueProspection({ id, version }: Readonly<{ id: string; version?: string | null }>) {
  const historique = useApi(() => getHistoriqueProspectionTerrain(id), [id, version]);
  if (historique.error) return <ErrorState message={historique.error} />;
  if (!historique.data) return <LoadingState />;
  if (historique.data.length === 0) return <EmptyState title="Aucun historique" />;
  return <TableauLecture lignes={historique.data} colonnes={COLONNES} cle={(h) => h.id} />;
}
