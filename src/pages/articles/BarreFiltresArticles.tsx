import { RotateCcw, Search } from 'lucide-react';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  referentielItems,
  useCategoriesBien,
  useEntitesReferentiel,
  useEtages,
  useNatures,
  useTranchesReferentiel,
  useTypesBienReferentiel,
  useVocations,
} from '../../lib/referentiels';
import type { FiltresArticles, StatutFilter } from './filtresArticles';

const STATUT_ITEMS: { label: string; value: StatutFilter }[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Disponible', value: 'DISPONIBLE' },
  { label: 'Occupé', value: 'OCCUPE' },
];

type Item = { label: string; value: string };

function SelectFiltre({
  items,
  valeur,
  onChange,
  placeholder,
  largeur,
}: Readonly<{ items: Item[]; valeur: string | null; onChange: (v: string | null) => void; placeholder: string; largeur: string }>) {
  return (
    <Select items={items} value={valeur} onValueChange={(v) => onChange(v)}>
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

/** Les filtres de la liste OMRAN des articles ; `avecTranche` faux dans la fiche d'une tranche. */
export default function BarreFiltresArticles({ filtres, avecTranche = true }: Readonly<{ filtres: FiltresArticles; avecTranche?: boolean }>) {
  const categories = useCategoriesBien();
  const types = useTypesBienReferentiel();
  const entites = useEntitesReferentiel();
  const natures = useNatures();
  const vocations = useVocations();
  const etages = useEtages();
  const tranches = useTranchesReferentiel();
  const v = filtres.valeurs;
  const attente = (charge: boolean, libelle: string) => (charge ? 'Chargement…' : libelle);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <InputGroup className="min-w-55 flex-1">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput placeholder="Recherche — code, description…" value={v.search} onChange={(e) => filtres.setSearch(e.target.value)} />
      </InputGroup>
      {avecTranche && (
        <MultiSelectDropdown
          label="Tranche"
          placeholder={attente(tranches.loading, 'Toutes')}
          value={v.trancheId}
          onChange={filtres.setTrancheId}
          items={tranches.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }))}
        />
      )}
      <Select items={STATUT_ITEMS} value={v.statut} onValueChange={(s) => filtres.setStatut(s as StatutFilter)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {STATUT_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <MultiSelectDropdown label="Catégorie" placeholder="Toutes" value={v.categorieId} onChange={filtres.setCategorieId} items={referentielItems(categories.data)} />
      <MultiSelectDropdown label="Type" placeholder="Tous" value={v.typeId} onChange={filtres.setTypeId} items={referentielItems(types.data)} />
      <SelectFiltre items={referentielItems(entites.data)} valeur={v.entiteId} onChange={filtres.setEntiteId} placeholder={attente(entites.loading, 'Entité…')} largeur="w-38" />
      <SelectFiltre items={referentielItems(natures.data)} valeur={v.natureId} onChange={filtres.setNatureId} placeholder={attente(natures.loading, 'Nature…')} largeur="w-34" />
      <SelectFiltre items={referentielItems(vocations.data)} valeur={v.vocationId} onChange={filtres.setVocationId} placeholder={attente(vocations.loading, 'Vocation…')} largeur="w-38" />
      <SelectFiltre items={referentielItems(etages.data)} valeur={v.etageId} onChange={filtres.setEtageId} placeholder={attente(etages.loading, 'Étage…')} largeur="w-34" />
      <div className="flex items-center gap-1.5">
        <Input type="number" placeholder="Prix de" aria-label="Prix de" className="w-27.5" value={v.prixDe} onChange={(e) => filtres.setPrixDe(e.target.value)} />
        <Input type="number" placeholder="à" aria-label="Prix à" className="w-22" value={v.prixA} onChange={(e) => filtres.setPrixA(e.target.value)} />
      </div>
      <div className="flex items-center gap-1.5">
        <Input type="number" placeholder="Surface de" aria-label="Surface de" className="w-27.5" value={v.surfaceDe} onChange={(e) => filtres.setSurfaceDe(e.target.value)} />
        <Input type="number" placeholder="à" aria-label="Surface à" className="w-22" value={v.surfaceA} onChange={(e) => filtres.setSurfaceA(e.target.value)} />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={filtres.reinitialiser}>
        <RotateCcw data-icon="inline-start" /> Réinitialiser
      </Button>
    </div>
  );
}
