import { formatCurrency } from '../../lib/format';
import { cn } from '../../lib/utils';

export type LigneRecap = { libelle: string; valeurs: number[]; total?: boolean };

/** Récapitulatif de calcul : une ligne par grandeur, une colonne par jeu de valeurs (cumul, précédent, période…). */
export default function TableauRecap({ titre, entetes, lignes }: Readonly<{ titre: string; entetes: string[]; lignes: LigneRecap[] }>) {
  return (
    <section className="mt-3 rounded-xl border border-border bg-card">
      <h3 className="border-b border-border px-3 py-1.5 text-body font-medium">{titre}</h3>
      <table className="w-full text-body">
        <thead>
          <tr className="text-micro text-muted-foreground">
            <th className="px-3 py-1 text-left font-medium">Grandeur</th>
            {entetes.map((e) => (
              <th key={e} className="px-3 py-1 text-right font-medium">{e}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => (
            <tr key={l.libelle} className={cn('border-t border-border/60', l.total && 'bg-muted/50 font-semibold')}>
              <td className="px-3 py-1">{l.libelle}</td>
              {l.valeurs.map((v, k) => (
                <td key={entetes[k]} className="px-3 py-1 text-right tabular-nums">{formatCurrency(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
