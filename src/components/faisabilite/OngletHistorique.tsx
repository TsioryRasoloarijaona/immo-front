import { EmptyState, ErrorState, LoadingState } from '../ui';
import TableauLecture, { type ColonneLecture } from '../patrimoine/TableauLecture';
import { listHistoriqueEtude } from '../../lib/apiFaisabilite';
import { formatDateTime } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { HistoriqueStatutEtudeDto } from '../../types/faisabilite';

const COLONNES: ColonneLecture<HistoriqueStatutEtudeDto>[] = [
  { titre: 'Date', rendu: (h) => formatDateTime(h.date) },
  { titre: 'Statut', rendu: (h) => h.statutLibelle || h.statutCode || '—' },
  { titre: 'Code', rendu: (h) => h.statutCode || '—' },
  { titre: 'Utilisateur', rendu: (h) => h.utilisateur || '—' },
];

/** Historique des statuts de l'étude, lecture seule ; `version` (statut courant) relit la liste après une transition. */
export default function OngletHistorique({ etudeId, version }: Readonly<{ etudeId: string; version?: string | null }>) {
  const historique = useApi(() => listHistoriqueEtude(etudeId), [etudeId, version]);
  if (historique.error) return <ErrorState message={historique.error} />;
  if (!historique.data) return <LoadingState />;
  if (historique.data.length === 0) return <EmptyState title="Aucun historique" />;
  return <TableauLecture lignes={historique.data} colonnes={COLONNES} cle={(h) => h.id} />;
}
