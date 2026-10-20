import { formatCurrency, pluriel } from '../../lib/format';
import type { DesistementsPageDto } from '../../types';

/** Totaux du filtre complet (serveur), pas de la page affichée. */
export default function BandeTotauxDesistements({ page }: Readonly<{ page: DesistementsPageDto }>) {
  const { totaux } = page;
  const montants = [
    { libelle: 'Réglé', valeur: totaux.totalRegle },
    { libelle: 'Pénalité après remise', valeur: totaux.penaliteApresRemise },
    { libelle: 'Reste frais', valeur: totaux.resteFraisARegler },
  ];
  return (
    <div className="flex shrink-0 flex-wrap items-baseline gap-x-5 gap-y-1 rounded-lg border border-border bg-card px-3 py-2 text-body">
      <span className="font-semibold text-foreground">Total :</span>
      {montants.map((m) => (
        <span key={m.libelle} className="text-muted-foreground">
          {m.libelle} <span className="tabular-nums text-foreground">{formatCurrency(m.valeur)}</span>
        </span>
      ))}
      <span className="text-muted-foreground">
        À rembourser <span className="font-semibold tabular-nums text-foreground">{formatCurrency(totaux.aRembourser)}</span>
      </span>
      <span className="ml-auto text-muted-foreground">{pluriel(page.total, 'désistement')}</span>
    </div>
  );
}
