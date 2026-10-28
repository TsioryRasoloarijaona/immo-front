import { Input } from '../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { bornesPeriode, periodeDepuis, PERIODES, type CodePeriode } from '../../lib/periodes';

/** Période + « du » / « au » : choisir une période remplit les dates, saisir une date passe en « Personnalisée ». */
export default function PeriodeFiltre({
  debut,
  fin,
  onChange,
}: Readonly<{ debut: string; fin: string; onChange: (debut: string, fin: string) => void }>) {
  const courante = periodeDepuis(debut, fin);
  const items = PERIODES.filter((p) => p.code !== 'perso' || courante === 'perso').map((p) => ({
    label: p.libelle,
    value: p.code,
  }));

  function choisir(code: CodePeriode) {
    const bornes = bornesPeriode(code);
    if (bornes) onChange(bornes.debut, bornes.fin);
  }

  return (
    <>
      <Select items={items} value={courante} onValueChange={(v) => choisir(v as CodePeriode)}>
        <SelectTrigger className="w-36" aria-label="Période">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <span className="flex items-center gap-1.5 text-body text-muted-foreground">
        du
        <Input type="date" aria-label="Du" className="w-32.5" value={debut} onChange={(e) => onChange(e.target.value, fin)} />
      </span>
      <span className="flex items-center gap-1.5 text-body text-muted-foreground">
        au
        <Input type="date" aria-label="Au" className="w-32.5" value={fin} onChange={(e) => onChange(debut, e.target.value)} />
      </span>
    </>
  );
}
