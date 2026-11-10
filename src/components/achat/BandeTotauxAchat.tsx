import type { TotauxDocumentsAchatDto } from '../../types/achat';
import { formatCurrency, pluriel } from '../../lib/format';

function Chiffre({ libelle, valeur, alerte }: Readonly<{ libelle: string; valeur: string; alerte?: boolean }>) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-micro font-semibold tracking-wide text-muted-foreground uppercase">{libelle}</span>
      <span className={alerte ? 'text-label font-semibold text-destructive tabular-nums' : 'text-label font-semibold text-foreground tabular-nums'}>{valeur}</span>
    </span>
  );
}

/** Totaux serveur de tout le filtre (toutes pages) ; le reste dû ne compte que les restes positifs. */
export default function BandeTotauxAchat({ totaux }: Readonly<{ totaux: TotauxDocumentsAchatDto }>) {
  return (
    <div role="status" className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-border bg-card px-3 py-1.5">
      <Chiffre libelle="Pièces" valeur={pluriel(totaux.nombre, 'pièce')} />
      <Chiffre libelle="À payer" valeur={formatCurrency(totaux.montantAPayer)} />
      <Chiffre libelle="Réglé" valeur={formatCurrency(totaux.montantRegle)} />
      <Chiffre libelle="Reste dû" valeur={formatCurrency(totaux.resteDu)} alerte />
    </div>
  );
}
