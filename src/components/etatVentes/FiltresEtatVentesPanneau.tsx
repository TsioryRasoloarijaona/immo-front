import { RotateCcw, Search } from 'lucide-react';
import ChoixUnique from '../ChoixUnique';
import MultiSelectDropdown from '../MultiSelectDropdown';
import { Button } from '../ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import {
  CHAMP_DATE_ITEMS,
  NATURE_ITEMS,
  type ChampDateEtatVentes,
  type FiltresListeEtatVentes,
  type NatureEtatVentes,
} from '../../lib/etatVentes';

type Item = { label: string; value: string };

/** Filtres serveur de la liste de l'état des ventes ; `changer` remet la pagination à zéro côté page. */
export default function FiltresEtatVentesPanneau({
  filtres,
  changer,
  reinitialiser,
  projets,
  tranches,
  categories,
  statuts,
  types,
}: Readonly<{
  filtres: FiltresListeEtatVentes;
  changer: <K extends keyof FiltresListeEtatVentes>(cle: K, valeur: FiltresListeEtatVentes[K]) => void;
  reinitialiser: () => void;
  projets: Item[];
  tranches: Item[];
  categories: Item[];
  statuts: Item[];
  types: Item[];
}>) {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="min-w-55 flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Recherche — article, catégorie, type, client, dossier, téléphone, CIN…"
            value={filtres.search}
            onChange={(e) => changer('search', e.target.value)}
          />
        </InputGroup>
        <ChoixUnique
          items={projets}
          tous="Tous les projets"
          value={filtres.projetId}
          placeholder="Projet…"
          largeur="w-44"
          onChange={(v) => changer('projetId', v)}
        />
        <MultiSelectDropdown label="Tranche" placeholder="Toutes" value={filtres.trancheId} onChange={(v) => changer('trancheId', v)} items={tranches} />
        <MultiSelectDropdown label="Catégorie" placeholder="Toutes" value={filtres.categorieId} onChange={(v) => changer('categorieId', v)} items={categories} />
        <MultiSelectDropdown label="Statut" placeholder="Tous" value={filtres.statut} onChange={(v) => changer('statut', v)} items={statuts} />
        <Button type="button" variant="outline" size="sm" onClick={reinitialiser}>
          <RotateCcw data-icon="inline-start" /> Réinitialiser
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelectDropdown label="Type" placeholder="Tous" value={filtres.typeId} onChange={(v) => changer('typeId', v)} items={types} />
        <ChoixUnique
          items={NATURE_ITEMS}
          value={filtres.nature}
          largeur="w-52"
          onChange={(v) => changer('nature', (v ?? 'TOUS') as NatureEtatVentes)}
        />
        <ChoixUnique
          items={CHAMP_DATE_ITEMS}
          value={filtres.champDate}
          largeur="w-44"
          onChange={(v) => changer('champDate', (v ?? 'RESERVATION') as ChampDateEtatVentes)}
        />
        <div className="flex items-center gap-1.5">
          <InputGroup className="w-32.5">
            <InputGroupInput type="date" aria-label="Du" value={filtres.du} onChange={(e) => changer('du', e.target.value)} />
          </InputGroup>
          <InputGroup className="w-32.5">
            <InputGroupInput type="date" aria-label="Au" value={filtres.au} onChange={(e) => changer('au', e.target.value)} />
          </InputGroup>
        </div>
      </div>
    </div>
  );
}
