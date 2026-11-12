import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { getDemandesAchatLot } from '../../../lib/apiProjet';
import { useApi } from '../../../lib/useApi';
import type { DemandeAchatLotDto } from '../../../types/projet';

const COLONNES: ColonneGrille<DemandeAchatLotDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 6 },
  { nom: 'date', libelle: 'Date', type: 'DATE', largeur: 6 },
  { nom: 'procedureAchat', libelle: 'Procédure', largeur: 8 },
  { nom: 'statutDescription', libelle: 'Statut', largeur: 8 },
  { nom: 'description', libelle: 'Description', largeur: 20 },
  { nom: 'fournisseurNom', libelle: 'Fournisseur', largeur: 14 },
  { nom: 'notes', libelle: 'Notes', largeur: 14 },
];

export default function OngletDemandesAchat({ lotId }: Readonly<{ lotId: string }>) {
  const { data, loading, error } = useApi(() => getDemandesAchatLot(lotId), [lotId]);
  if (error) return <ErrorState message={error} />;
  if (!data) return loading ? <LoadingState /> : null;
  if (data.length === 0) return <EmptyState title="Aucune demande interne d'achat pour ce lot" />;
  return <DataGrid rows={data} colonnes={COLONNES} cleOrdre="projet-lot-demandes-achat" bandeauRegroupement={false} />;
}
