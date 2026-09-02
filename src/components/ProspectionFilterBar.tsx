import { RotateCcw, Search } from 'lucide-react';
import { Card } from './ui';
import MultiSelectDropdown from './MultiSelectDropdown';
import { Button } from './ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { emptyProspectionFilters, type ProspectionFilterBarState } from '../lib/domain';

/**
 * Shared filter bar for Prospections / Pré-prospections — same Dossiers-style
 * layout (single-row Card, dropdown multi-selects, date range, Réinitialiser)
 * applied to the prospection side of the pipeline. Every field here is a
 * real server-side param on both `/api/prospections` and
 * `/api/pre-prospections` (see ProspectionFilterParams in lib/api.ts).
 */

export default function ProspectionFilterBar({
  state,
  onChange,
  etapeItems,
  origineItems,
  commercialItems,
  trancheItems,
}: {
  state: ProspectionFilterBarState;
  /** Called with the field to patch already reset to page 0 by the caller (via `set`). */
  onChange: <K extends keyof ProspectionFilterBarState>(key: K, value: ProspectionFilterBarState[K]) => void;
  etapeItems: { label: string; value: string }[];
  origineItems: { label: string; value: string }[];
  commercialItems: { label: string; value: string }[];
  trancheItems: { label: string; value: string }[];
}) {
  const ouvertesItems: { label: string; value: ProspectionFilterBarState['ouvertes'] }[] = [
    { label: 'Ouvertes', value: 'open' },
    { label: 'Clôturées', value: 'closed' },
    { label: 'Toutes', value: 'all' },
  ];

  function reset() {
    const empty = emptyProspectionFilters();
    (Object.keys(empty) as (keyof ProspectionFilterBarState)[]).forEach((key) => onChange(key, empty[key]));
  }

  return (
    <Card padded={false} className="shrink-0">
      <div className="flex flex-wrap items-center gap-2.5 p-3">
        <InputGroup className="min-w-55 flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Recherche multi-critère — nom, code…" aria-label="Rechercher une prospection"
            value={state.search}
            onChange={(e) => onChange('search', e.target.value)}
          />
        </InputGroup>
        <Select items={ouvertesItems} value={state.ouvertes} onValueChange={(v) => onChange('ouvertes', v as ProspectionFilterBarState['ouvertes'])}>
          <SelectTrigger aria-label="Prospections ouvertes ou clôturées">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {ouvertesItems.map((item) => (
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
        <Button type="button" variant="outline" size="sm" onClick={reset}>
          <RotateCcw data-icon="inline-start" /> Réinitialiser
        </Button>
      </div>
    </Card>
  );
}
