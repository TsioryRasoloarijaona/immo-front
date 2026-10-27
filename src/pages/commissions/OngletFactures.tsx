import { RotateCcw } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { getFacturesCommission } from '../../lib/apiCommissions';
import { useApi } from '../../lib/useApi';
import type { UUID } from '../../types';
import type { DocumentCommissionDto } from '../../types/commissions';
import { lire } from './lecture';

const COLONNES_DOCUMENTS: ColonneGrille<DocumentCommissionDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 8, classe: 'font-medium text-foreground' },
  { nom: 'date', libelle: 'Date', type: 'DATE', largeur: 6 },
  { nom: 'commercial', libelle: 'Commercial', largeur: 12 },
  { nom: 'montant', libelle: 'Montant TTC', type: 'MONTANT', largeur: 8 },
  { nom: 'reste', libelle: 'À payer', type: 'MONTANT', largeur: 8, classe: 'font-bold text-destructive' },
  { nom: 'regle', libelle: 'Réglé', type: 'MONTANT', largeur: 8, classe: 'font-bold text-(--success)' },
  { nom: 'statut', libelle: 'Statut', largeur: 8 },
];

export default function OngletFactures({ trancheId }: Readonly<{ trancheId: UUID }>) {
  const factures = useApi(() => lire(() => getFacturesCommission(trancheId)), [trancheId]);

  if (factures.error) {
    return (
      <div className="flex flex-col items-center gap-2">
        <ErrorState message={factures.error} />
        <Button type="button" variant="outline" size="sm" onClick={() => void factures.refetch()}>
          <RotateCcw data-icon="inline-start" /> Réessayer
        </Button>
      </div>
    );
  }
  if (!factures.data) return <LoadingState />;
  if (factures.data.length === 0) return <EmptyState title="Aucun document à payer." />;
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
      <DataGrid rows={factures.data} colonnes={COLONNES_DOCUMENTS} bandeauRegroupement={false} libelleLigne={(d) => d.code ?? d.id} />
    </div>
  );
}
