import { Field as FormField, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import type { Periode } from './periode';

export default function ChampsPeriode({
  prefixe,
  valeur,
  onChange,
}: Readonly<{ prefixe: string; valeur: Periode; onChange: (p: Periode) => void }>) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <FormField>
        <FieldLabel htmlFor={`${prefixe}-debut`}>Il commence le</FieldLabel>
        <Input id={`${prefixe}-debut`} type="date" value={valeur.debut} onChange={(e) => onChange({ ...valeur, debut: e.target.value })} />
      </FormField>
      <FormField>
        <FieldLabel htmlFor={`${prefixe}-duree`}>Pendant (mois)</FieldLabel>
        <Input id={`${prefixe}-duree`} inputMode="numeric" value={valeur.duree} onChange={(e) => onChange({ ...valeur, duree: e.target.value })} />
      </FormField>
      <FormField>
        <FieldLabel htmlFor={`${prefixe}-tarif`}>Montant par mois (DH)</FieldLabel>
        <Input id={`${prefixe}-tarif`} inputMode="decimal" value={valeur.tarif} onChange={(e) => onChange({ ...valeur, tarif: e.target.value })} />
      </FormField>
    </div>
  );
}
