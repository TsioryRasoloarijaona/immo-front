import { RotateCcw, Search } from 'lucide-react';
import MultiSelectDropdown from '../MultiSelectDropdown';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CHAMP_DATE_IMPAYE_ITEMS, ECHU_ITEMS, type FiltresImpayes } from '../../lib/impayes';

type Item = { label: string; value: string };

/** Valeur sentinelle du choix « Tous » : sans elle, un filtre choisi ne se retire qu'en réinitialisant tout. */
const TOUS = '__tous';

function avecTous(libelle: string, items: Item[]): Item[] {
  return [{ label: libelle, value: TOUS }, ...items];
}

function sansTous(v: string | null): string | null {
  return v === TOUS ? null : v;
}

function ChoixUnique({
  items,
  value,
  placeholder,
  largeur,
  onChange,
}: Readonly<{ items: Item[]; value: string | null; placeholder?: string; largeur: string; onChange: (v: string | null) => void }>) {
  return (
    <Select items={items} value={value} onValueChange={(v) => onChange(v)}>
      <SelectTrigger className={largeur}>
        <SelectValue placeholder={placeholder} />
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

/** Filtres serveur de l'écran « Impayés » ; `changer` remet la pagination à zéro côté page. */
export default function FiltresImpayesPanneau({
  filtres,
  changer,
  reinitialiser,
  projets,
  tranches,
  commerciaux,
  categories,
}: Readonly<{
  filtres: FiltresImpayes;
  changer: <K extends keyof FiltresImpayes>(cle: K, valeur: FiltresImpayes[K]) => void;
  reinitialiser: () => void;
  projets: Item[];
  tranches: Item[];
  commerciaux: Item[];
  categories: Item[];
}>) {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="min-w-55 flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Recherche — notes, catégorie, tranche, projet, société, dossier…"
            value={filtres.q}
            onChange={(e) => changer('q', e.target.value)}
          />
        </InputGroup>
        <Input placeholder="Client" className="w-40" value={filtres.client} onChange={(e) => changer('client', e.target.value)} />
        <Input
          placeholder="Article (code exact)"
          className="w-40"
          value={filtres.article}
          onChange={(e) => changer('article', e.target.value)}
        />
        <MultiSelectDropdown label="Projet" placeholder="Tous" value={filtres.projetId} onChange={(v) => changer('projetId', v)} items={projets} />
        <MultiSelectDropdown label="Tranche" placeholder="Toutes" value={filtres.trancheId} onChange={(v) => changer('trancheId', v)} items={tranches} />
        <Button type="button" variant="outline" size="sm" onClick={reinitialiser}>
          <RotateCcw data-icon="inline-start" /> Réinitialiser
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ChoixUnique
          items={ECHU_ITEMS}
          value={filtres.echu}
          largeur="w-60"
          onChange={(v) => changer('echu', (v ?? 'ECHEANCE') as FiltresImpayes['echu'])}
        />
        <ChoixUnique
          items={CHAMP_DATE_IMPAYE_ITEMS}
          value={filtres.champDate}
          largeur="w-40"
          onChange={(v) => changer('champDate', (v ?? 'ECHEANCE') as FiltresImpayes['champDate'])}
        />
        <div className="flex items-center gap-1.5">
          <InputGroup className="w-32.5">
            <InputGroupInput type="date" aria-label="Du" value={filtres.du} onChange={(e) => changer('du', e.target.value)} />
          </InputGroup>
          <InputGroup className="w-32.5">
            <InputGroupInput type="date" aria-label="Au" value={filtres.au} onChange={(e) => changer('au', e.target.value)} />
          </InputGroup>
        </div>
        <ChoixUnique
          items={avecTous('Tous les commerciaux', commerciaux)}
          value={filtres.commercialId}
          placeholder="Commercial…"
          largeur="w-48"
          onChange={(v) => changer('commercialId', sansTous(v))}
        />
        <ChoixUnique
          items={avecTous('Toutes les catégories', categories)}
          value={filtres.categorieId}
          placeholder="Catégorie…"
          largeur="w-44"
          onChange={(v) => changer('categorieId', sansTous(v))}
        />
      </div>
    </div>
  );
}
