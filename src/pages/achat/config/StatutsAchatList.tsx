import { RefreshCw, Tags } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import PageShell from '../../../components/PageShell';
import { PastilleCouleur } from '../../../components/configuration/SelecteurCouleur';
import { Button } from '../../../components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { listStatutsAchat } from '../../../lib/apiAchatConfig';
import { useApi } from '../../../lib/useApi';
import type { StatutAchatConfigDto } from '../../../types/achatConfig';

/** Les noms .NET (`LimeGreen`…) sont des noms CSS ; un nom inconnu donne un gris neutre. */
const couleurAffichee = (nom: string) => (CSS.supports('color', nom) ? nom : 'gray');

const COLONNES: ColonneGrille<StatutAchatConfigDto>[] = [
  { nom: 'ordre', libelle: 'Ordre', type: 'NOMBRE', largeur: 5 },
  { nom: 'code', libelle: 'Code', largeur: 14 },
  { nom: 'description', libelle: 'Description', largeur: 22 },
  { nom: 'categorie', libelle: 'Catégorie', largeur: 12 },
  {
    nom: 'couleur', libelle: 'Couleur', largeur: 10,
    rendu: (s) => (s.couleur ? <span className="flex items-center gap-2"><PastilleCouleur nom={couleurAffichee(s.couleur)} />{s.couleur}</span> : '—'),
  },
  { nom: 'okPourPaiement', libelle: 'OK paiement', type: 'BOOLEEN', largeur: 8 },
  { nom: 'valideComptabilite', libelle: 'Validé compta', type: 'BOOLEEN', largeur: 8 },
  { nom: 'lectureSeule', libelle: 'Lecture seule', type: 'BOOLEEN', largeur: 8 },
  { nom: 'dureeVieJours', libelle: 'Durée de vie (jours)', type: 'NOMBRE', largeur: 8 },
  { nom: 'nombrePieces', libelle: 'Pièces', type: 'NOMBRE', largeur: 6 },
];

/** Statuts des pièces d'achat en lecture seule, triés par ordre. */
export default function StatutsAchatList() {
  const { data, loading, error, refetch } = useApi(listStatutsAchat, [], 'achat-config-statuts');
  const lignes = [...(data ?? [])].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

  return (
    <PageShell title="Statuts des pièces" icon={<Tags />}
      crumbs={[{ label: 'Achat' }, { label: 'Configuration' }, { label: 'Statuts' }]}
      actions={<Button type="button" variant="ghost" size="sm" onClick={() => void refetch()}><RefreshCw /> Rafraîchir</Button>}>
      <div className="flex flex-col gap-5 p-4 md:px-7">
        {loading && !data && <LoadingState />}
        {error && (
          <>
            <ErrorState message={error} />
            <Button type="button" variant="outline" className="self-center" onClick={() => void refetch()}>Réessayer</Button>
          </>
        )}
        {!error && data && data.length === 0 && <EmptyState title="Aucun statut configuré" />}
        {!error && lignes.length > 0 && (
          <div className="overflow-auto rounded-xl border border-border bg-card">
            <DataGrid cleOrdre="achat-config-statuts" rows={lignes} colonnes={COLONNES} />
          </div>
        )}
      </div>
    </PageShell>
  );
}
