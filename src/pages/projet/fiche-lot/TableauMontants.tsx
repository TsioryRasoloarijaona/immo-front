import { cn } from '../../../lib/utils';
import { formatCurrency } from '../../../lib/format';

export interface LigneMontants {
  label: string;
  valeurs: (number | null)[];
}

/** Tableau lecture seule : libellé + un montant par colonne ; `null` → « — », négatif en rouge et jamais ramené à 0. */
export default function TableauMontants({ colonnes, lignes }: Readonly<{ colonnes: string[]; lignes: LigneMontants[] }>) {
  return (
    <table className="w-full text-body">
      <thead>
        <tr className="border-b text-micro text-muted-foreground">
          <th scope="col" className="py-1 pr-2 text-left font-medium"><span className="sr-only">Libellé</span></th>
          {colonnes.map((c) => (
            <th key={c} scope="col" className="px-2 py-1 text-right font-medium">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {lignes.map((l) => (
          <tr key={l.label} className="border-b last:border-0">
            <th scope="row" className="py-1 pr-2 text-left font-normal">{l.label}</th>
            {l.valeurs.map((v, i) => (
              <td key={colonnes[i]} className={cn('px-2 py-1 text-right tabular-nums', v !== null && v < 0 && 'text-destructive')}>
                {formatCurrency(v)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
