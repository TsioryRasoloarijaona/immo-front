import { Eraser, LockOpen, RefreshCw, Unlock } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import SelectFiltre from '../SelectFiltre';
import PeriodeFiltre from '../liste/PeriodeFiltre';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { EtatFiltreFiche, EtatFiltresFiches } from '../../lib/fichesVerrouillees';

const ETATS: { label: string; value: EtatFiltreFiche }[] = [
  { label: 'Etat : tous', value: 'tous' },
  { label: 'Etat : Verrouillée', value: 'VERROUILLEE' },
  { label: 'Etat : Non verrouillée', value: 'NON_VERROUILLEE' },
];

export default function FiltresFichesVerrouilleesPanneau({
  filtres,
  deverrouillable,
  toutDeverrouillable,
  onChange,
  onRafraichir,
  onEffacer,
  onDeverrouiller,
  onDeverrouillerTout,
}: Readonly<{
  filtres: EtatFiltresFiches;
  deverrouillable: boolean;
  toutDeverrouillable: boolean;
  onChange: (f: EtatFiltresFiches) => void;
  onRafraichir: () => void;
  onEffacer: () => void;
  onDeverrouiller: () => void;
  onDeverrouillerTout: () => void;
}>) {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-2.5">
      <PeriodeFiltre debut={filtres.debut} fin={filtres.fin} onChange={(debut, fin) => onChange({ ...filtres, debut, fin })} />
      <SelectFiltre ariaLabel="Etat" items={ETATS} value={filtres.etat} onChange={(etat) => onChange({ ...filtres, etat })} />
      <Input
        type="search"
        aria-label="Recherche"
        placeholder="Entité, libellé, utilisateur…"
        className="w-56"
        value={filtres.recherche}
        onChange={(e) => onChange({ ...filtres, recherche: e.target.value })}
      />
      <BarreIcones className="ml-auto flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onRafraichir}>
          <RefreshCw /> Rafraîchir
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onEffacer}>
          <Eraser /> Effacer les filtres
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={!deverrouillable} onClick={onDeverrouiller}>
          <LockOpen /> Déverrouiller
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={!toutDeverrouillable} onClick={onDeverrouillerTout}>
          <Unlock /> Déverrouiller tout
        </Button>
      </BarreIcones>
    </div>
  );
}
