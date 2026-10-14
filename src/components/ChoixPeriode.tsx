import SelectFiltre from './SelectFiltre';
import { InputGroup, InputGroupInput } from './ui/input-group';
import type { FiltreTriple, ProspectionFilterBarState } from '../lib/domain';
import { plagePeriode, raccourciCourant, RACCOURCIS_PERIODE, type RaccourciPeriode } from '../lib/periodes';
import type { PeriodeSur } from '../types';

type ChoixRaccourci = RaccourciPeriode | 'perso';

const RACCOURCIS: { label: string; value: ChoixRaccourci }[] = [
  ...RACCOURCIS_PERIODE,
  { label: 'Période personnalisée', value: 'perso' },
];

const DATES: { label: string; value: PeriodeSur }[] = [
  { label: 'Sur : Date', value: 'DATE' },
  { label: "Sur : Date d'archivage", value: 'ARCHIVAGE' },
];

const RENSEIGNEE: { label: string; value: FiltreTriple }[] = [
  { label: 'Entre les dates', value: 'tous' },
  { label: 'Date renseignée', value: 'oui' },
  { label: 'Date non renseignée', value: 'non' },
];

/** Période d'OMRAN : raccourcis, deux dates, et pour les prospections la date visée et sa présence
 * (qui rend les bornes sans effet, d'où leur désactivation). */
export default function ChoixPeriode({
  state,
  onChange,
  avecDateChoisie,
}: Readonly<{
  state: ProspectionFilterBarState;
  onChange: <K extends keyof ProspectionFilterBarState>(key: K, value: ProspectionFilterBarState[K]) => void;
  avecDateChoisie: boolean;
}>) {
  const bornesInactives = avecDateChoisie && state.dateRenseignee !== 'tous';

  function appliquer(choix: ChoixRaccourci) {
    if (choix === 'perso') return;
    const plage = plagePeriode(choix);
    onChange('dateDebut', plage.debut);
    onChange('dateFin', plage.fin);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {avecDateChoisie && (
        <SelectFiltre ariaLabel="Date filtrée" items={DATES} value={state.periodeSur} onChange={(v) => onChange('periodeSur', v)} />
      )}
      <SelectFiltre
        ariaLabel="Raccourci de période"
        items={RACCOURCIS}
        value={raccourciCourant(state.dateDebut, state.dateFin) ?? 'perso'}
        onChange={appliquer}
        disabled={bornesInactives}
      />
      <InputGroup className="w-32.5">
        <InputGroupInput
          type="date"
          aria-label="Du"
          disabled={bornesInactives}
          value={state.dateDebut}
          onChange={(e) => onChange('dateDebut', e.target.value)}
        />
      </InputGroup>
      <InputGroup className="w-32.5">
        <InputGroupInput
          type="date"
          aria-label="Au"
          disabled={bornesInactives}
          value={state.dateFin}
          onChange={(e) => onChange('dateFin', e.target.value)}
        />
      </InputGroup>
      {avecDateChoisie && (
        <SelectFiltre
          ariaLabel="Présence de la date"
          items={RENSEIGNEE}
          value={state.dateRenseignee}
          onChange={(v) => onChange('dateRenseignee', v)}
        />
      )}
    </div>
  );
}
