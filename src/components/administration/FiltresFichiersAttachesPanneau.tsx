import { Download, Eraser, RefreshCw } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import MultiSelectDropdown from '../MultiSelectDropdown';
import SelectFiltre from '../SelectFiltre';
import PeriodeFiltre from '../liste/PeriodeFiltre';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { EtatFichierAssocie, EtatFiltresFichiers } from '../../lib/fichiersAttaches';
import type { FiltresFichiersAttachesDto } from '../../types/administration';

const FICHIER: { label: string; value: EtatFichierAssocie }[] = [
  { label: 'Fichier associé : tous', value: 'tous' },
  { label: 'Fichier associé : avec', value: 'avec' },
  { label: 'Fichier associé : sans', value: 'sans' },
];

function choixGroupes(choix: FiltresFichiersAttachesDto | undefined) {
  const groupes = (choix?.groupes ?? []).map((g) => ({ label: g, value: g }));
  const nonDefini = choix?.groupeNonDefini;
  return nonDefini ? [{ label: nonDefini.libelle, value: nonDefini.code }, ...groupes] : groupes;
}

export default function FiltresFichiersAttachesPanneau({
  filtres,
  choix,
  exportEnCours,
  onChange,
  onRafraichir,
  onEffacer,
  onExporter,
}: Readonly<{
  filtres: EtatFiltresFichiers;
  choix: FiltresFichiersAttachesDto | undefined;
  exportEnCours: boolean;
  onChange: (f: EtatFiltresFichiers) => void;
  onRafraichir: () => void;
  onEffacer: () => void;
  onExporter: () => void;
}>) {
  const types = (choix?.types ?? []).map((t) => ({ label: t.libelle ?? '—', value: t.id }));
  const categories = (choix?.categories ?? []).map((c) => ({ label: c.libelle, value: c.code }));
  return (
    <div className="flex flex-wrap items-center gap-2 pb-2.5">
      <PeriodeFiltre etiquette="Créé le" debut={filtres.debut} fin={filtres.fin} onChange={(debut, fin) => onChange({ ...filtres, debut, fin })} />
      <PeriodeFiltre
        etiquette="Modifié le"
        debut={filtres.modifieDebut}
        fin={filtres.modifieFin}
        onChange={(modifieDebut, modifieFin) => onChange({ ...filtres, modifieDebut, modifieFin })}
      />
      <MultiSelectDropdown ariaLabel="Type" placeholder="Type : tous" items={types} value={filtres.typeIds} onChange={(typeIds) => onChange({ ...filtres, typeIds })} />
      <MultiSelectDropdown
        ariaLabel="Catégorie"
        placeholder="Catégorie : toutes"
        items={categories}
        value={filtres.categories}
        onChange={(categories) => onChange({ ...filtres, categories })}
      />
      <MultiSelectDropdown
        ariaLabel="Groupe"
        placeholder="Groupe : tous"
        items={choixGroupes(choix)}
        value={filtres.groupes}
        onChange={(groupes) => onChange({ ...filtres, groupes })}
      />
      <SelectFiltre ariaLabel="Fichier associé" items={FICHIER} value={filtres.fichier} onChange={(fichier) => onChange({ ...filtres, fichier })} />
      <Input
        type="search"
        aria-label="Recherche"
        placeholder="Recherche…"
        className="w-48"
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
        <Button type="button" variant="ghost" size="sm" disabled={exportEnCours} onClick={onExporter}>
          <Download /> Exporter
        </Button>
      </BarreIcones>
    </div>
  );
}
