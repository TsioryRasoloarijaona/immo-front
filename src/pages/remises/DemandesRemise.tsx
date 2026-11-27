import { useState } from 'react';
import { Check, Percent, X } from 'lucide-react';
import BarreIcones from '../../components/BarreIcones';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import PageShell from '../../components/PageShell';
import DialogueAccepterRemise from '../../components/remises/DialogueAccepterRemise';
import DialogueRefuserRemise from '../../components/remises/DialogueRefuserRemise';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { listerDemandesRemise } from '../../lib/apiRemise';
import { formatCurrency, formatDate, formatPercentValue } from '../../lib/format';
import { useToast } from '../../lib/toastContext';
import { useApi } from '../../lib/useApi';
import type { DemandeRemiseDto } from '../../types/remise';

const COLONNES: ColonneGrille<DemandeRemiseDto>[] = [
  { nom: 'agence', libelle: 'Agence', largeur: 12, valeur: (d) => d.agence ?? '' },
  { nom: 'vendeur', libelle: 'Vendeur', largeur: 14, valeur: (d) => d.vendeur ?? '' },
  { nom: 'dossierCode', libelle: 'Dossier', largeur: 12 },
  { nom: 'lot', libelle: 'Lot', largeur: 12, valeur: (d) => d.lot ?? '' },
  { nom: 'prix', libelle: 'Prix négocié', type: 'MONTANT', largeur: 12, valeur: (d) => d.prix, rendu: (d) => formatCurrency(d.prix) },
  { nom: 'tauxActuel', libelle: 'Taux actuel', type: 'NOMBRE', largeur: 8, valeur: (d) => d.tauxActuel, rendu: (d) => formatPercentValue(d.tauxActuel) },
  { nom: 'tauxDemande', libelle: 'Taux demandé', type: 'NOMBRE', largeur: 8, valeur: (d) => d.tauxDemande, rendu: (d) => formatPercentValue(d.tauxDemande) },
  { nom: 'demandeLe', libelle: 'Date', type: 'DATE', largeur: 9, valeur: (d) => d.demandeLe, rendu: (d) => formatDate(d.demandeLe) },
  { nom: 'motif', libelle: 'Motif', largeur: 24 },
];

type Action = { demande: DemandeRemiseDto; accepter: boolean };

/** File du siège valideur : demandes de remise des agences en attente (403 du serveur si le droit manque). */
export default function DemandesRemise() {
  const demandes = useApi(() => listerDemandesRemise('EN_ATTENTE'), [], 'demandes-remise');
  const toast = useToast();
  const [action, setAction] = useState<Action | null>(null);

  function traitee(message: string) {
    setAction(null);
    toast(message);
    void demandes.refetch();
  }

  return (
    <PageShell title="Demandes de remise" icon={<Percent />} crumbs={[{ label: 'Vente' }, { label: 'Demandes de remise' }]}>
      <div className="flex flex-col gap-3 p-4 md:px-7">
        {demandes.loading && !demandes.data && <LoadingState />}
        {demandes.error && <ErrorState message={demandes.error} />}
        {!demandes.error && demandes.data?.length === 0 && (
          <EmptyState title="Aucune demande en attente" message="Les demandes des agences apparaissent ici." />
        )}
        {!demandes.error && demandes.data && demandes.data.length > 0 && (
          <div className="overflow-auto rounded-xl border border-border bg-card">
            <DataGrid
              cleOrdre="demandes-remise"
              rows={demandes.data}
              colonnes={COLONNES}
              libelleLigne={(d) => d.dossierCode}
              actions={(d) => (
                <BarreIcones className="flex items-center justify-center gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAction({ demande: d, accepter: true })}><Check /> Accepter</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAction({ demande: d, accepter: false })}><X /> Refuser</Button>
                </BarreIcones>
              )}
            />
          </div>
        )}
      </div>
      {action?.accepter && (
        <DialogueAccepterRemise demande={action.demande} onFermer={() => setAction(null)} onTraitee={() => traitee('Remise accordée.')} />
      )}
      {action && !action.accepter && (
        <DialogueRefuserRemise demande={action.demande} onFermer={() => setAction(null)} onTraitee={() => traitee('Demande refusée.')} />
      )}
    </PageShell>
  );
}
