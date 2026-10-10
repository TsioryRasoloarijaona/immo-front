import { AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/format';
import type { PropositionExercice } from './types';

/** Ce que deviendrait l'exercice, calculé par le service (mêmes règles que l'ouverture), et ce qui l'empêche. */
export default function ApercuExercice({
  proposition: p,
  erreur,
  tous,
}: Readonly<{ proposition: PropositionExercice | null; erreur: string | null; tous: boolean }>) {
  if (erreur) return <p className="text-body text-destructive">{erreur}</p>;
  if (!p) return null;
  const libres = p.lots - p.obstacles.length;
  return (
    <div className="flex flex-col gap-2">
      <p className="rounded-md bg-muted px-3 py-2 text-body text-foreground">
        Ce sera l’exercice <strong>{p.label}</strong>. Il se terminera le <strong>{formatDate(p.fin)}</strong>. Montant dû :{' '}
        <strong>{formatCurrency(p.du)}</strong>
        {tous && ' par appartement'}.
        {!tous && p.dernier && ` Le précédent (${p.dernier.label}) s’est terminé le ${formatDate(p.dernier.fin)}.`}
      </p>
      {tous && (
        <p className="text-body text-muted-foreground">
          {libres} appartement{libres > 1 ? 's' : ''} sur {p.lots} le recevront.
        </p>
      )}
      {p.obstacles.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-(--amber) bg-(--amber-bg) px-3 py-2 text-body text-(--amber)">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {tous ? (
            <span>
              Laissés tels quels : {p.obstacles.map((o) => o.appartement).join(', ')}.
            </span>
          ) : (
            <span>{p.obstacles[0]?.raison}</span>
          )}
        </div>
      )}
    </div>
  );
}
