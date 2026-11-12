import { Input } from '../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { EtatFiltresAchat } from '../../lib/documentsAchat';
import { plagePeriode, raccourciCourant, RACCOURCIS_PERIODE, type RaccourciPeriode } from '../../lib/periodes';

const CHAMPS = [
  { label: 'Date pièce', value: 'DATE_PIECE' },
  { label: 'Date échéance', value: 'ECHEANCE' },
];
const RENSEIGNEE = 'renseignee';
const PERSO = 'perso';

function ListeChoix({ items, valeur, libelle, onChoisir, className }: Readonly<{
  items: { label: string; value: string }[];
  valeur: string;
  libelle: string;
  onChoisir: (valeur: string) => void;
  className?: string;
}>) {
  return (
    <Select items={items} value={valeur} onValueChange={(v) => onChoisir(v as string)}>
      <SelectTrigger className={className} aria-label={libelle}>
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
  );
}

/** Champ de date (pièce / échéance), préréglage OMRAN (dont « Renseignée ») et bornes du / au. */
export default function ChoixPeriodeAchat({
  etat,
  onChange,
}: Readonly<{ etat: EtatFiltresAchat; onChange: (patch: Partial<EtatFiltresAchat>) => void }>) {
  const { champDate, dateRenseignee, du, au } = etat;
  const courant = dateRenseignee ? RENSEIGNEE : (raccourciCourant(du, au) ?? PERSO);
  const items = [
    ...RACCOURCIS_PERIODE,
    { label: 'Renseignée', value: RENSEIGNEE },
    ...(courant === PERSO ? [{ label: 'Personnalisée', value: PERSO }] : []),
  ];

  function choisir(code: string) {
    if (code === RENSEIGNEE) onChange({ dateRenseignee: true, du: '', au: '' });
    else if (code !== PERSO) {
      const plage = plagePeriode(code as RaccourciPeriode);
      onChange({ dateRenseignee: false, du: plage.debut, au: plage.fin });
    }
  }

  return (
    <>
      <ListeChoix items={CHAMPS} valeur={champDate} libelle="Champ de date" onChoisir={(v) => onChange({ champDate: v as EtatFiltresAchat['champDate'] })} />
      <ListeChoix items={items} valeur={courant} libelle="Période" onChoisir={choisir} className="w-40" />
      <span className="flex items-center gap-1.5 text-body text-muted-foreground">
        du
        <Input type="date" aria-label="Du" className="w-32.5" disabled={dateRenseignee} value={du} onChange={(e) => onChange({ du: e.target.value, au })} />
      </span>
      <span className="flex items-center gap-1.5 text-body text-muted-foreground">
        au
        <Input type="date" aria-label="Au" className="w-32.5" disabled={dateRenseignee} value={au} onChange={(e) => onChange({ du, au: e.target.value })} />
      </span>
    </>
  );
}
