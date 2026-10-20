import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import MultiSelectDropdown from '../MultiSelectDropdown';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  referentielItems,
  useCategoriesBien,
  useEntitesReferentiel,
  useEtages,
  useNatures,
  useTypesBienReferentiel,
  useVocations,
} from '../../lib/referentiels';
import { ETAT_ITEMS, STATUT_ITEMS, type EtatFilter, type FiltresArticles, type StatutFilter } from '../../lib/articlesListe';

function ChoixUnique({ items, valeur, onChange, placeholder, largeur }: Readonly<{
  items: { label: string; value: string }[];
  valeur: string | null;
  onChange: (v: string | null) => void;
  placeholder: string;
  largeur: string;
}>) {
  return (
    <Select items={items} value={valeur} onValueChange={onChange}>
      <SelectTrigger className={largeur}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/** Barre de filtres des articles ; `avant` : champs propres à l'écran (recherche, tranche) ; `sousArticles` : état et code parent. */
export default function BarreFiltresArticles({ filtres, avant, onReinitialiser, sousArticles = false }: Readonly<{
  filtres: FiltresArticles;
  avant?: ReactNode;
  onReinitialiser: () => void;
  sousArticles?: boolean;
}>) {
  const categories = useCategoriesBien();
  const types = useTypesBienReferentiel();
  const entites = useEntitesReferentiel();
  const natures = useNatures();
  const vocations = useVocations();
  const etages = useEtages();
  const { valeurs: v, modifier: m } = filtres;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {avant}
      {sousArticles ? (
        <>
          <ChoixUnique items={ETAT_ITEMS} valeur={v.etat} onChange={(s) => m.etat((s ?? 'all') as EtatFilter)}
            placeholder="État" largeur="w-36" />
          <Input placeholder="Code parent" aria-label="Code parent" className="w-32" value={v.codeParent}
            onChange={(e) => m.codeParent(e.target.value)} />
        </>
      ) : (
        <ChoixUnique items={STATUT_ITEMS} valeur={v.statut} onChange={(s) => m.statut((s ?? 'all') as StatutFilter)}
          placeholder="Statut" largeur="w-40" />
      )}
      <MultiSelectDropdown label="Catégorie" placeholder="Toutes" value={v.categorieId} onChange={m.categorieId}
        items={referentielItems(categories.data)} />
      <MultiSelectDropdown label="Type" placeholder="Tous" value={v.typeId} onChange={m.typeId}
        items={referentielItems(types.data)} />
      <ChoixUnique items={referentielItems(entites.data)} valeur={v.entiteId} onChange={m.entiteId}
        placeholder={entites.loading ? 'Chargement…' : 'Entité…'} largeur="w-38" />
      <ChoixUnique items={referentielItems(natures.data)} valeur={v.natureId} onChange={m.natureId}
        placeholder={natures.loading ? 'Chargement…' : 'Nature…'} largeur="w-34" />
      <ChoixUnique items={referentielItems(vocations.data)} valeur={v.vocationId} onChange={m.vocationId}
        placeholder={vocations.loading ? 'Chargement…' : 'Vocation…'} largeur="w-38" />
      <ChoixUnique items={referentielItems(etages.data)} valeur={v.etageId} onChange={m.etageId}
        placeholder={etages.loading ? 'Chargement…' : 'Étage…'} largeur="w-34" />
      <div className="flex items-center gap-1.5">
        <Input type="number" placeholder="Prix de" aria-label="Prix de" className="w-27.5" value={v.prixDe}
          onChange={(e) => m.prixDe(e.target.value)} />
        <Input type="number" placeholder="à" aria-label="Prix à" className="w-22" value={v.prixA}
          onChange={(e) => m.prixA(e.target.value)} />
      </div>
      <div className="flex items-center gap-1.5">
        <Input type="number" placeholder="Surface de" aria-label="Surface de" className="w-27.5" value={v.surfaceDe}
          onChange={(e) => m.surfaceDe(e.target.value)} />
        <Input type="number" placeholder="à" aria-label="Surface à" className="w-22" value={v.surfaceA}
          onChange={(e) => m.surfaceA(e.target.value)} />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onReinitialiser}>
        <RotateCcw data-icon="inline-start" /> Réinitialiser
      </Button>
    </div>
  );
}
