import { formatCurrency } from '../../lib/format';

type Total = { libelle: string; valeur: number; ton?: 'debit' | 'credit' };

const CLASSE_TON = { debit: 'text-(--warning)', credit: 'text-(--success)', neutre: 'text-foreground' };

/** Σ de toute la liste filtrée (hors annulés), pas de la seule page affichée. */
export default function TotauxTresorerie({ totaux }: Readonly<{ totaux: Total[] }>) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 px-1 text-body" aria-label="Totaux">
      <span className="font-semibold text-muted-foreground">Σ</span>
      {totaux.map((t) => (
        <span key={t.libelle} className="tabular-nums">
          <span className="text-muted-foreground">{t.libelle} : </span>
          <span className={`font-semibold ${CLASSE_TON[t.ton ?? 'neutre']}`}>{formatCurrency(t.valeur)}</span>
        </span>
      ))}
    </div>
  );
}
