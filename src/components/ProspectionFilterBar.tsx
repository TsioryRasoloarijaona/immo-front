import type { ReactNode } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import MultiSelectDropdown from './MultiSelectDropdown';
import { Button } from './ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { emptyProspectionFilters, type ProspectionFilterBarState } from '../lib/domain';

export default function ProspectionFilterBar({
  state,
  onChange,
  etapeItems,
  origineItems,
  commercialItems,
  trancheItems,
  extra,
  defauts,
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
  /** Vide côté pré-prospections : `/api/pre-prospections` n'accepte pas les filtres avancés. */
  extra?: ReactNode;
}>) {
  /* Le nom du filtre est dans chaque libellé : le déclencheur n'affiche que la
     valeur choisie, et « Non » seul ne dirait pas de quoi. */
  const archiveItems: { label: string; value: ProspectionFilterBarState['archive'] }[] = [
    { label: 'Archivé : Non', value: 'non' },
    { label: 'Archivé : Oui', value: 'oui' },
    { label: 'Archivé : Tous', value: 'tous' },
  ];

  function reset() {
    const empty = defauts ?? emptyProspectionFilters();
    (Object.keys(empty) as (keyof ProspectionFilterBarState)[]).forEach((key) => onChange(key, empty[key]));
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
        <InputGroup className="min-w-55 flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Recherche multi-critère — nom, code…"
            value={state.search}
            onChange={(e) => onChange('search', e.target.value)}
          />
        </InputGroup>
        <Select items={archiveItems} value={state.archive} onValueChange={(v) => onChange('archive', v as ProspectionFilterBarState['archive'])}>
          <SelectTrigger aria-label="Archivé">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {archiveItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <MultiSelectDropdown label="Étape" placeholder="Toutes" value={state.etape} onChange={(v) => onChange('etape', v)} items={etapeItems} />
        <MultiSelectDropdown label="Origine" placeholder="Toutes" value={state.origine} onChange={(v) => onChange('origine', v)} items={origineItems} />
        <MultiSelectDropdown label="Tranche" placeholder="Toutes" value={state.trancheId} onChange={(v) => onChange('trancheId', v)} items={trancheItems} />
        <MultiSelectDropdown label="Commercial" placeholder="Tous" value={state.commercial} onChange={(v) => onChange('commercial', v)} items={commercialItems} />
        <div className="flex items-center gap-1.5">
          <InputGroup className="w-32.5">
            <InputGroupInput type="date" aria-label="Du" value={state.dateDebut} onChange={(e) => onChange('dateDebut', e.target.value)} />
          </InputGroup>
          <InputGroup className="w-32.5">
            <InputGroupInput type="date" aria-label="Au" value={state.dateFin} onChange={(e) => onChange('dateFin', e.target.value)} />
          </InputGroup>
        </div>
        {extra}
        <Button type="button" variant="outline" size="sm" onClick={reset}>
          <RotateCcw data-icon="inline-start" /> Réinitialiser
        </Button>
    </div>
  );
}
