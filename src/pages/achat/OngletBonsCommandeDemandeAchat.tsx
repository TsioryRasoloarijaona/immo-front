import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { getBonsCommandeDemandeAchat } from '../../lib/apiDemandesAchat';
import { useApi } from '../../lib/useApi';
import type { BonCommandeDemandeAchat, DemandeAchatFiche } from '../../types/demandesAchat';

const COLONNES: ColonneGrille<BonCommandeDemandeAchat>[] = [
  { nom: 'code', libelle: 'N°', largeur: 8 },
  { nom: 'date', libelle: 'Date', type: 'DATE', largeur: 6 },
  { nom: 'fournisseur', libelle: 'Fournisseur', largeur: 14, valeur: (b) => b.fournisseur?.libelle ?? '', rendu: (b) => b.fournisseur?.libelle ?? '—' },
  { nom: 'statut', libelle: 'Statut', largeur: 8, valeur: (b) => b.statut?.libelle ?? '', rendu: (b) => b.statut?.libelle ?? '—' },
  { nom: 'montantTTC', libelle: 'Montant TTC', type: 'MONTANT', largeur: 8 },
];

/** Pièces d'achat liées à la demande, en lecture seule (le contrat n'expose pas de génération depuis l'offre). */
export default function OngletBonsCommandeDemandeAchat({ fiche }: Readonly<{ fiche: DemandeAchatFiche; verrouille: boolean }>) {
  const bons = useApi(() => getBonsCommandeDemandeAchat(fiche.id), [fiche.id]);
  if (bons.error) return <ErrorState message={bons.error} />;
  if (!bons.data) return <LoadingState />;
  if (bons.data.length === 0) return <EmptyState title="Aucun bon de commande lié" />;
  return <DataGrid rows={bons.data} colonnes={COLONNES} cleOrdre="achat-demande-bons-commande" bandeauRegroupement={false} />;
}
