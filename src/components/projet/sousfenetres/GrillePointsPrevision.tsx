import { formatCurrency, formatPercent } from '../../../lib/format';
import { montantPoint, type PointEdite } from '../../../lib/saisiePrevisions';
import { cn } from '../../../lib/utils';

const CHAMP = 'h-6 w-full min-w-0 rounded-sm border border-transparent bg-transparent px-1 text-body hover:border-border focus:border-ring focus:outline-none disabled:opacity-70';
const ENTETE = 'px-1 py-1 text-left text-micro font-medium text-muted-foreground';

/** Points d'un onglet de prévisions : date et avancement saisis, temps, paiement et montant en lecture. */
export default function GrillePointsPrevision({
  points,
  prix,
  editable,
  selection,
  onSelection,
  onChanger,
}: Readonly<{
  points: PointEdite[];
  prix: number | null;
  editable: boolean;
  selection: string | null;
  onSelection: (cle: string) => void;
  onChanger: (cle: string, patch: Partial<Pick<PointEdite, 'date' | 'avancement'>>) => void;
}>) {
  return (
    <div className="max-h-64 overflow-auto rounded-md border">
      <table className="w-full border-collapse text-body">
        <thead className="sticky top-0 bg-background">
          <tr className="border-b">
            <th className={ENTETE}>Date</th>
            <th className={ENTETE}>Avancement %</th>
            <th className={ENTETE}>Temps</th>
            <th className={ENTETE}>Paiement</th>
            <th className={cn(ENTETE, 'text-right')}>Montant</th>
          </tr>
        </thead>
        <tbody>
          {points.length === 0 && (
            <tr>
              <td colSpan={5} className="px-2 py-3 text-center text-muted-foreground">
                Aucun point
              </td>
            </tr>
          )}
          {points.map((p) => (
            <tr key={p.cle} onClick={() => onSelection(p.cle)} className={cn('border-b last:border-b-0', selection === p.cle && 'bg-muted')}>
              <td>
                <input type="date" aria-label="Date" disabled={!editable} className={CHAMP} value={p.date} onChange={(e) => onChanger(p.cle, { date: e.target.value })} />
              </td>
              <td>
                <input
                  type="number"
                  step="any"
                  min={0}
                  max={100}
                  aria-label="Avancement en pourcentage"
                  disabled={!editable}
                  className={cn(CHAMP, 'text-right')}
                  value={p.avancement ?? ''}
                  onChange={(e) => onChanger(p.cle, { avancement: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </td>
              <td className="px-1">{formatPercent(p.temps)}</td>
              <td className="px-1">{formatPercent(p.paiement)}</td>
              <td className="px-1 text-right whitespace-nowrap">{formatCurrency(montantPoint(p, prix))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
