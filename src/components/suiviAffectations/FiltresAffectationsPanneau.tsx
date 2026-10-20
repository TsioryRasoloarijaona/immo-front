import { RotateCcw, Search } from 'lucide-react';
import ChoixUnique from '../ChoixUnique';
import MultiSelectDropdown from '../MultiSelectDropdown';
import { Button } from '../ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import { ETAT_PIECE_ITEMS, SENS_ITEMS, type FiltresListeAffectations, type SensAffectation } from '../../lib/suiviAffectations';

type Item = { label: string; value: string };

export type ChoixFiltresAffectations = {
  entites: Item[];
  projets: Item[];
  tranches: Item[];
  categories: Item[];
  types: Item[];
  statuts: Item[];
};

/** Filtres serveur de la liste ; `changer` remet la pagination à zéro côté page. */
export default function FiltresAffectationsPanneau({
  filtres,
  changer,
  reinitialiser,
  choix,
}: Readonly<{
  filtres: FiltresListeAffectations;
  changer: <K extends keyof FiltresListeAffectations>(cle: K, valeur: FiltresListeAffectations[K]) => void;
  reinitialiser: () => void;
  choix: ChoixFiltresAffectations;
}>) {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="min-w-55 flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Recherche — tiers, dossier, article, pièce, banque, notes…"
            value={filtres.search}
            onChange={(e) => changer('search', e.target.value)}
          />
        </InputGroup>
        <MultiSelectDropdown label="Entité" placeholder="Toutes" value={filtres.entiteId} onChange={(v) => changer('entiteId', v)} items={choix.entites} />
        <ChoixUnique
          items={choix.projets}
          tous="Tous les projets"
          value={filtres.projetId}
          placeholder="Projet…"
          largeur="w-44"
          onChange={(v) => changer('projetId', v)}
        />
        <MultiSelectDropdown label="Tranche" placeholder="Toutes" value={filtres.trancheId} onChange={(v) => changer('trancheId', v)} items={choix.tranches} />
        <Button type="button" variant="outline" size="sm" onClick={reinitialiser}>
          <RotateCcw data-icon="inline-start" /> Réinitialiser
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelectDropdown label="Catégorie" placeholder="Toutes" value={filtres.categorieId} onChange={(v) => changer('categorieId', v)} items={choix.categories} />
        <MultiSelectDropdown label="Type de pièce" placeholder="Tous" value={filtres.typeId} onChange={(v) => changer('typeId', v)} items={choix.types} />
        <MultiSelectDropdown label="Statut du dossier" placeholder="Tous" value={filtres.statut} onChange={(v) => changer('statut', v)} items={choix.statuts} />
        <MultiSelectDropdown label="État de la pièce" placeholder="Tous" value={filtres.etatPiece} onChange={(v) => changer('etatPiece', v)} items={ETAT_PIECE_ITEMS} />
        <ChoixUnique
          items={SENS_ITEMS}
          value={filtres.sens}
          largeur="w-44"
          onChange={(v) => changer('sens', (v ?? 'TOUS') as SensAffectation)}
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
