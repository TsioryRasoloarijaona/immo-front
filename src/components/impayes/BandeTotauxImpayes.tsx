import { formatCurrency, pluriel } from '../../lib/format';
import type { ImpayesPageDto } from '../../types';

/** Totaux du filtre complet (serveur), pas de la page affichée. */
export default function BandeTotauxImpayes({ page }: Readonly<{ page: ImpayesPageDto }>) {
  const { totaux } = page;
  return (
    <div className="flex shrink-0 flex-wrap items-baseline gap-x-5 gap-y-1 rounded-lg border border-border bg-card px-3 py-2 text-body">
      <span className="font-semibold text-foreground">Total :</span>
      <span className="text-muted-foreground">
        À payer <span className="tabular-nums text-foreground">{formatCurrency(totaux.montantAPayer)}</span>
      </span>
      <span className="text-muted-foreground">
        Réglé <span className="tabular-nums text-foreground">{formatCurrency(totaux.montantRegle)}</span>
      </span>
      <span className="text-muted-foreground">
        Reste <span className="font-semibold tabular-nums text-destructive">{formatCurrency(totaux.montantReste)}</span>
      </span>
      <span className="ml-auto text-muted-foreground">
        {pluriel(page.total, 'échéance')} · {pluriel(totaux.nombreDossiers, 'dossier')}
      </span>
    </div>
  );
}
