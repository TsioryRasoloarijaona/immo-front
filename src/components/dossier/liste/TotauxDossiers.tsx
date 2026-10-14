import { formatCurrency } from '../../../lib/format';
import type { PageGroupesDto, ValeurAgregat } from '../../../types';

const LIBELLES: { cle: string; libelle: string }[] = [
  { cle: 'prixHt', libelle: 'Σ Prix HT' },
  { cle: 'prix', libelle: 'Σ Prix TTC' },
  { cle: 'totalAPayer', libelle: 'Σ Total à payer' },
];

function nombre(valeur: ValeurAgregat | undefined): number | null {
  if (typeof valeur === 'number') return valeur;
  if (typeof valeur === 'string' && valeur.trim() !== '') return Number(valeur);
  return null;
}

/** Totaux Σ en tête de la liste, calculés par le serveur sur tout le résultat filtré (hors lots libres). */
export default function TotauxDossiers({ totaux }: Readonly<{ totaux: PageGroupesDto | null | undefined }>) {
  if (!totaux) return null;
  return (
    <dl className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-body" aria-label="Totaux de la liste">
      {LIBELLES.map(({ cle, libelle }) => (
        <div key={cle} className="flex items-baseline gap-1.5">
          <dt className="text-muted-foreground">{libelle}</dt>
          <dd className="font-semibold tabular-nums">{formatCurrency(nombre(totaux.totaux[cle]))}</dd>
        </div>
      ))}
    </dl>
  );
}
