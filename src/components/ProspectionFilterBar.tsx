import type { ReactNode } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import ChoixPeriode from './ChoixPeriode';
import MultiSelectDropdown from './MultiSelectDropdown';
import SelectFiltre from './SelectFiltre';
import { Button } from './ui/button';
import { DropdownMenuCheckboxItem, DropdownMenuSeparator } from './ui/dropdown-menu';
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group';
import { emptyProspectionFilters, type FiltreTriple, type ProspectionFilterBarState } from '../lib/domain';

/* Le nom du filtre est dans chaque libellé : le déclencheur n'affiche que la
   valeur choisie, et « Non » seul ne dirait pas de quoi. */
const ARCHIVE_ITEMS: { label: string; value: ProspectionFilterBarState['archive'] }[] = [
  { label: 'Archivé : Non', value: 'non' },
  { label: 'Archivé : Oui', value: 'oui' },
  { label: 'Archivé : Tous', value: 'tous' },
];

const ABOUTIE_ITEMS: { label: string; value: FiltreTriple }[] = [
  { label: 'Aboutie : Tous', value: 'tous' },
  { label: 'Aboutie : Oui', value: 'oui' },
  { label: 'Aboutie : Non', value: 'non' },
];

/** Libellé du bouton Tranche quand « Non affectés » est coché : sinon il dirait « Toutes ». */
function resumeNonAffectes(trancheIds: string[], items: { label: string; value: string }[]): string {
  if (trancheIds.length === 0) return 'Non affectés';
  if (trancheIds.length === 1) {
    const libelle = items.find((i) => i.value === trancheIds[0])?.label ?? '1 tranche';
    return `${libelle} + non affectés`;
  }
  return `${trancheIds.length} tranches + non affectés`;
}

export default function ProspectionFilterBar({
  state,
  onChange,
  etapeItems,
  origineItems,
  commercialItems,
  trancheItems,
  extra,
  defauts,
  mode = 'prospections',
  onReset,
}: Readonly<{
  state: ProspectionFilterBarState;
  /** À passer quand les défauts dépendent de la session (commercial connecté). */
  defauts?: ProspectionFilterBarState;
  /** Le parent remet lui-même la page à 0 (via `set`). */
  onChange: <K extends keyof ProspectionFilterBarState>(key: K, value: ProspectionFilterBarState[K]) => void;
  etapeItems: { label: string; value: string }[];
  origineItems: { label: string; value: string }[];
  commercialItems: { label: string; value: string }[];
  trancheItems: { label: string; value: string }[];
  /** Contrôles propres à la page : volet avancé (prospections), projet (pré-prospections). */
  extra?: ReactNode;
  /** Aboutie et date visée : prospections ; « Non affectés » : pré-prospections. */
  mode?: 'prospections' | 'pre-prospections';
  /** Appelé par « Réinitialiser » après la barre : remet aussi les filtres tenus par la page (`extra`). */
  onReset?: () => void;
}>) {
  const prospections = mode === 'prospections';

  function reset() {
    const empty = defauts ?? emptyProspectionFilters();
    (Object.keys(empty) as (keyof ProspectionFilterBarState)[]).forEach((key) => onChange(key, empty[key]));
    onReset?.();
  }

  const resumeTranche = !prospections && state.sansTranche ? resumeNonAffectes(state.trancheId, trancheItems) : undefined;

  // « Non affectés » d'OMRAN : avec des tranches cochées, les ajoute ; seule, ne garde que les lignes sans tranche.
  const sansTranche = prospections ? undefined : (
    <>
      <DropdownMenuCheckboxItem checked={state.sansTranche} onCheckedChange={(v) => onChange('sansTranche', v)}>
        Non affectés (sans tranche)
      </DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
    </>
  );

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
        <InputGroup className="min-w-55 flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Recherche multi-critère — nom, téléphone, CIN, code…"
            value={state.search}
            onChange={(e) => onChange('search', e.target.value)}
          />
        </InputGroup>
        <SelectFiltre ariaLabel="Archivé" items={ARCHIVE_ITEMS} value={state.archive} onChange={(v) => onChange('archive', v)} />
        {prospections && (
          <SelectFiltre ariaLabel="Aboutie" items={ABOUTIE_ITEMS} value={state.aboutie} onChange={(v) => onChange('aboutie', v)} />
        )}
        <MultiSelectDropdown label="Étape" placeholder="Toutes" value={state.etape} onChange={(v) => onChange('etape', v)} items={etapeItems} />
        <MultiSelectDropdown label="Origine" placeholder="Toutes" value={state.origine} onChange={(v) => onChange('origine', v)} items={origineItems} />
        <MultiSelectDropdown
          label="Tranche"
          placeholder="Toutes"
          value={state.trancheId}
          onChange={(v) => onChange('trancheId', v)}
          items={trancheItems}
          entete={sansTranche}
          resume={resumeTranche}
        />
        <MultiSelectDropdown label="Commercial" placeholder="Tous" value={state.commercial} onChange={(v) => onChange('commercial', v)} items={commercialItems} />
        <ChoixPeriode state={state} onChange={onChange} avecDateChoisie={prospections} />
        {extra}
        <Button type="button" variant="outline" size="sm" onClick={reset}>
          <RotateCcw data-icon="inline-start" /> Réinitialiser
        </Button>
    </div>
  );
}
