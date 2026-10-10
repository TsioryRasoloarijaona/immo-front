import { Input } from '../../../components/ui/input';
import { formatCurrency } from '../../../lib/format';
import { soldeChaqueReste, type Lot } from './lots';

/** RM-07 : le total ne se répartit tout seul que s'il solde exactement chaque reste ; sinon on demande le détail.
 * Ici, seulement l'affichage : c'est le service qui décide et qui refuse un détail faux. */
export default function DetailGroupe({
  lots,
  total,
  detail,
  onDetail,
}: Readonly<{ lots: Lot[]; total: number | null; detail: Record<string, string>; onDetail: (d: Record<string, string>) => void }>) {
  if (total === null) return null;
  if (soldeChaqueReste(total, lots)) {
    return <p className="text-body text-muted-foreground">Le total règle exactement chaque appartement : il sera réparti tout seul.</p>;
  }
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-label font-medium text-foreground">
        Le total ne règle pas exactement chaque appartement : combien pour chacun ?
      </legend>
      {lots.map((l) => (
        <div key={l.code} className="grid grid-cols-[6rem_minmax(0,1fr)_8rem] items-center gap-2 text-body">
          <span className="font-mono">{l.code}</span>
          <span className="text-muted-foreground">reste {formatCurrency(l.reste)}</span>
          <Input
            inputMode="decimal"
            placeholder="0,00"
            aria-label={`Montant pour ${l.code}`}
            value={detail[l.code] ?? ''}
            onChange={(e) => onDetail({ ...detail, [l.code]: e.target.value })}
          />
        </div>
      ))}
    </fieldset>
  );
}
