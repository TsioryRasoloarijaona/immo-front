import { RotateCcw, Search } from 'lucide-react';
import MultiSelectDropdown from '../MultiSelectDropdown';
import { Button } from '../ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { FiltresHistorique, ModeDate } from '../../lib/historiqueVentes';

type Option = { label: string; value: string };

const TOUS = '__TOUS__';

const MODES_DATE: Option[] = [
  { label: 'Période', value: 'PERIODE' },
  { label: 'Date vide', value: 'VIDE' },
  { label: 'Date renseignée', value: 'RENSEIGNEE' },
];

/** Liste déroulante à choix unique ; `tous` en tête vaut « aucun filtre » (chaîne vide). */
function ChoixUnique({
  libelle,
  tous,
  options,
  valeur,
  onChange,
}: Readonly<{ libelle: string; tous?: string; options: Option[]; valeur: string; onChange: (v: string) => void }>) {
  const items = tous ? [{ label: tous, value: TOUS }, ...options] : options;
  return (
    <Select items={items} value={valeur || TOUS} onValueChange={(v) => onChange(v === TOUS ? '' : (v as string))}>
      <SelectTrigger aria-label={libelle}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start" className="w-auto min-w-(--anchor-width) max-w-[min(30rem,90vw)]">
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value} className="whitespace-normal">
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function Saisie({
  libelle,
  type = 'text',
  valeur,
  onChange,
  className,
}: Readonly<{ libelle: string; type?: string; valeur: string; onChange: (v: string) => void; className: string }>) {
  return (
    <InputGroup className={className}>
      <InputGroupInput
        type={type}
        inputMode={type === 'text' ? 'decimal' : undefined}
        placeholder={type === 'text' ? libelle : undefined}
        aria-label={libelle}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
      />
    </InputGroup>
  );
}

/** Barre de filtres de l'Historique des ventes : annulés et résiliés toujours inclus, pas de case pour les exclure. */
export default function FiltresHistoriqueVentes({
  filtres,
  onChange,
  onReinitialiser,
  options,
}: Readonly<{
  filtres: FiltresHistorique;
  onChange: (patch: Partial<FiltresHistorique>) => void;
  onReinitialiser: () => void;
  options: { societes: Option[]; projets: Option[]; tranches: Option[]; statuts: Option[]; champsDate: Option[]; commerciaux: Option[] };
}>) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <InputGroup className="min-w-55 flex-1">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Recherche — client, co-acquéreur, article, code…"
          aria-label="Recherche"
          value={filtres.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </InputGroup>
      <ChoixUnique libelle="Société" tous="Toutes les sociétés" options={options.societes} valeur={filtres.societeId} onChange={(v) => onChange({ societeId: v })} />
      <ChoixUnique libelle="Projet" tous="Tous les projets" options={options.projets} valeur={filtres.projet} onChange={(v) => onChange({ projet: v })} />
      <MultiSelectDropdown label="Tranche" placeholder="Toutes" value={filtres.trancheIds} onChange={(v) => onChange({ trancheIds: v })} items={options.tranches} />
      <MultiSelectDropdown label="Statut" placeholder="Tous les statuts" value={filtres.statuts} onChange={(v) => onChange({ statuts: v })} items={options.statuts} />
      <div className="flex items-center gap-1.5">
        <ChoixUnique libelle="Champ date" options={options.champsDate} valeur={filtres.champDate} onChange={(v) => onChange({ champDate: v })} />
        <ChoixUnique libelle="Mode de date" options={MODES_DATE} valeur={filtres.modeDate} onChange={(v) => onChange({ modeDate: v as ModeDate })} />
        {filtres.modeDate === 'PERIODE' && (
          <>
            <Saisie libelle="Du" type="date" className="w-32.5" valeur={filtres.dateDebut} onChange={(v) => onChange({ dateDebut: v })} />
            <Saisie libelle="Au" type="date" className="w-32.5" valeur={filtres.dateFin} onChange={(v) => onChange({ dateFin: v })} />
          </>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Saisie libelle="Total de" className="w-28" valeur={filtres.totalMin} onChange={(v) => onChange({ totalMin: v })} />
        <Saisie libelle="à" className="w-28" valeur={filtres.totalMax} onChange={(v) => onChange({ totalMax: v })} />
      </div>
      <ChoixUnique libelle="Commercial" tous="Tous les commerciaux" options={options.commerciaux} valeur={filtres.commercial} onChange={(v) => onChange({ commercial: v })} />
      <Button type="button" variant="outline" size="sm" onClick={onReinitialiser}>
        <RotateCcw data-icon="inline-start" /> Réinitialiser
      </Button>
    </div>
  );
}
