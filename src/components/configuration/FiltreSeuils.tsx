import SearchableSelect from '../SearchableSelect';
import { GLOBAL, TOUTES } from '../../lib/referentielsAdmin';
import type { Choix } from '../../lib/saisiePatrimoine';

/** Filtre d'un référentiel par tranche : toutes, « Global » (sans tranche) ou une tranche. */
export default function FiltreSeuils({ valeur, onChange, tranches }: Readonly<{
  valeur: string;
  onChange: (valeur: string) => void;
  tranches: Choix;
}>) {
  const items = [{ label: 'Toutes les tranches', value: TOUTES }, { label: 'Global (sans tranche)', value: GLOBAL }, ...tranches];
  return (
    <SearchableSelect items={items} value={valeur} onValueChange={(v) => onChange(v ?? TOUTES)} className="w-64"
      label="Filtrer par tranche" emptyMessage="Aucune tranche" />
  );
}
