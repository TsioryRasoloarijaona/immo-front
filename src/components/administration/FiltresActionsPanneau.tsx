import { Eraser, RefreshCw } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import PeriodeFiltre from '../liste/PeriodeFiltre';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { EtatFiltresActions } from '../../lib/actions';

export default function FiltresActionsPanneau({
  filtres,
  onChange,
  onRafraichir,
  onEffacer,
}: Readonly<{
  filtres: EtatFiltresActions;
  onChange: (f: EtatFiltresActions) => void;
  onRafraichir: () => void;
  onEffacer: () => void;
}>) {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-2.5">
      <PeriodeFiltre
        etiquette="Création"
        debut={filtres.creationDebut}
        fin={filtres.creationFin}
        onChange={(creationDebut, creationFin) => onChange({ ...filtres, creationDebut, creationFin })}
      />
      <PeriodeFiltre
        etiquette="Modification"
        debut={filtres.modificationDebut}
        fin={filtres.modificationFin}
        onChange={(modificationDebut, modificationFin) => onChange({ ...filtres, modificationDebut, modificationFin })}
      />
      <Input
        type="search"
        aria-label="Recherche"
        placeholder="Code, action, description, utilisateur…"
        className="w-64"
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
      </BarreIcones>
    </div>
  );
}
