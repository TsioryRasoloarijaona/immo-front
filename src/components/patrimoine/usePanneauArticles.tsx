import type { ReactNode } from 'react';
import BoiteFiltre from '../liste/BoiteFiltre';
import { Input } from '../ui/input';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
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

type Item = { label: string; value: string };

const sansTous = (items: Item[]) => items.filter((i) => i.value !== 'all');
const ou = (v: string) => (v === 'all' ? null : v);

const fourchette = (titre: string, de: string, a: string, onDe: (v: string) => void, onA: (v: string) => void) => [
  <Input key="de" type="number" placeholder={`${titre} de`} aria-label={`${titre} de`} className="w-27.5" value={de} onChange={(e) => onDe(e.target.value)} />,
  <Input key="a" type="number" placeholder="à" aria-label={`${titre} à`} className="w-22" value={a} onChange={(e) => onA(e.target.value)} />,
];

/**
 * Panneau de filtres des listes `/articles` et `/sous-articles` : `tranche` (état propre à l'écran) puis catégorie, type,
 * statut ou état, entité, nature, vocation, étage en boîtes ; code parent, prix et surface en champs libres.
 * `entiteObligatoire` : l'entité se change mais ne se vide pas (voir `useEntiteObligatoire`).
 */
export default function usePanneauArticles({ filtres, sousArticles, entiteObligatoire, tranche, recherche }: Readonly<{
  filtres: FiltresArticles;
  sousArticles: boolean;
  entiteObligatoire: boolean;
  tranche: { items: Item[]; valeur: string[]; onChange: (v: string[]) => void };
  recherche: string;
}>): { puces: string[]; champs: ReactNode; children: ReactNode } {
  const categories = referentielItems(useCategoriesBien().data);
  const types = referentielItems(useTypesBienReferentiel().data);
  const entites = referentielItems(useEntitesReferentiel().data);
  const natures = referentielItems(useNatures().data);
  const vocations = referentielItems(useVocations().data);
  const etages = referentielItems(useEtages().data);
  const { valeurs: v, modifier: m } = filtres;
  const itemsEtatOuStatut = sansTous(sousArticles ? ETAT_ITEMS : STATUT_ITEMS);
  const etatOuStatut = sousArticles ? v.etat : v.statut;

  const puces = [
    ...puceSelection('Tranche', tranche.items, tranche.valeur),
    ...puceSelection('Catégorie', categories, v.categorieId),
    ...puceSelection('Type', types, v.typeId),
    ...puceUnique(itemsEtatOuStatut, ou(etatOuStatut)),
    ...puceUnique(entites, v.entiteId),
    ...puceUnique(natures, v.natureId),
    ...puceUnique(vocations, v.vocationId),
    ...puceUnique(etages, v.etageId),
    ...(v.codeParent ? [`Parent ${v.codeParent}`] : []),
    ...(v.prixDe || v.prixA ? [`Prix ${v.prixDe || '…'} – ${v.prixA || '…'}`] : []),
    ...(v.surfaceDe || v.surfaceA ? [`Surface ${v.surfaceDe || '…'} – ${v.surfaceA || '…'}`] : []),
    ...(recherche ? [`« ${recherche} »`] : []),
  ];

  const champs = (
    <>
      {sousArticles && (
        <Input placeholder="Code parent" aria-label="Code parent" className="w-32" value={v.codeParent} onChange={(e) => m.codeParent(e.target.value)} />
      )}
      {fourchette('Prix', v.prixDe, v.prixA, m.prixDe, m.prixA)}
      {fourchette('Surface', v.surfaceDe, v.surfaceA, m.surfaceDe, m.surfaceA)}
    </>
  );

  const children = (
    <>
      <BoiteFiltre titre="Tranche" mode="multiple" items={tranche.items} valeur={tranche.valeur} onChange={tranche.onChange} />
      <BoiteFiltre titre="Catégorie" mode="multiple" items={categories} valeur={v.categorieId} onChange={m.categorieId} />
      <BoiteFiltre titre="Type" mode="multiple" items={types} valeur={v.typeId} onChange={m.typeId} />
      <BoiteFiltre
        titre={sousArticles ? 'État' : 'Statut'}
        mode="unique"
        items={itemsEtatOuStatut}
        valeur={ou(etatOuStatut)}
        onChange={(s) => (sousArticles ? m.etat((s ?? 'all') as EtatFilter) : m.statut((s ?? 'all') as StatutFilter))}
      />
      <BoiteFiltre titre="Entité" mode="unique" items={entites} valeur={v.entiteId} onChange={(e) => { if (e || !entiteObligatoire) m.entiteId(e); }} />
      <BoiteFiltre titre="Nature" mode="unique" items={natures} valeur={v.natureId} onChange={m.natureId} />
      <BoiteFiltre titre="Vocation" mode="unique" items={vocations} valeur={v.vocationId} onChange={m.vocationId} />
      <BoiteFiltre titre="Étage" mode="unique" items={etages} valeur={v.etageId} onChange={m.etageId} />
    </>
  );

  return { puces, champs, children };
}
