import BoiteFiltre from '../liste/BoiteFiltre';
import PanneauFiltresCoches from '../liste/PanneauFiltresCoches';
import {
  CHAMP_DATE_ITEMS,
  NATURE_ITEMS,
  type ChampDateEtatVentes,
  type FiltresListeEtatVentes,
  type NatureEtatVentes,
} from '../../lib/etatVentes';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';

type Item = { label: string; value: string };

const NATURES_FILTRANTES = NATURE_ITEMS.filter((n) => n.value !== 'TOUS');

/** Panneau « Filtres » de la liste ; `changer` remet la pagination à zéro côté page. */
export default function FiltresEtatVentesPanneau({
  filtres,
  changer,
  changerEntites,
  reinitialiser,
  entites,
  projets,
  tranches,
  categories,
  statuts,
  types,
}: Readonly<{
  filtres: FiltresListeEtatVentes;
  changer: <K extends keyof FiltresListeEtatVentes>(cle: K, valeur: FiltresListeEtatVentes[K]) => void;
  changerEntites: (entiteId: string[]) => void;
  reinitialiser: () => void;
  entites: Item[];
  projets: Item[];
  /** Déjà limitées aux entités cochées. */
  tranches: Item[];
  categories: Item[];
  statuts: Item[];
  types: Item[];
}>) {
  const [ferme, basculer] = useBooleenMemorise(cleFiltresFermes('etat-des-ventes'));
  const nature = filtres.nature === 'TOUS' ? null : filtres.nature;
  const puces = [
    ...puceSelection('Entité', entites, filtres.entiteId),
    ...puceSelection('Tranche', tranches, filtres.trancheId),
    ...puceSelection('Statut', statuts, filtres.statut),
    ...puceSelection('Catégorie', categories, filtres.categorieId),
    ...puceSelection('Type', types, filtres.typeId),
    ...puceUnique(projets, filtres.projetId),
    ...puceUnique(NATURES_FILTRANTES, nature),
    ...(filtres.search ? [`« ${filtres.search} »`] : []),
  ];

  return (
    <PanneauFiltresCoches
      ferme={ferme}
      onBasculer={basculer}
      puces={puces}
      champDate={{
        items: CHAMP_DATE_ITEMS,
        valeur: filtres.champDate,
        onChange: (v) => changer('champDate', v as ChampDateEtatVentes),
      }}
      periode={{
        debut: filtres.du,
        fin: filtres.au,
        onChange: (debut, fin) => {
          changer('du', debut);
          changer('au', fin);
        },
      }}
      recherche={{
        valeur: filtres.search,
        onChange: (v) => changer('search', v),
        placeholder: 'Article, client, dossier, téléphone, CIN…',
      }}
      onReinitialiser={reinitialiser}
    >
      <BoiteFiltre titre="Entité" mode="multiple" items={entites} valeur={filtres.entiteId} onChange={changerEntites} />
      <BoiteFiltre titre="Projet" mode="unique" items={projets} valeur={filtres.projetId} onChange={(v) => changer('projetId', v)} />
      <BoiteFiltre titre="Tranche" mode="multiple" items={tranches} valeur={filtres.trancheId} onChange={(v) => changer('trancheId', v)} />
      <BoiteFiltre titre="Statut" mode="multiple" items={statuts} valeur={filtres.statut} onChange={(v) => changer('statut', v)} />
      <BoiteFiltre titre="Catégorie" mode="multiple" items={categories} valeur={filtres.categorieId} onChange={(v) => changer('categorieId', v)} />
      <BoiteFiltre titre="Type" mode="multiple" items={types} valeur={filtres.typeId} onChange={(v) => changer('typeId', v)} />
      <BoiteFiltre
        titre="Nature"
        mode="unique"
        items={NATURES_FILTRANTES}
        valeur={nature}
        onChange={(v) => changer('nature', (v ?? 'TOUS') as NatureEtatVentes)}
      />
    </PanneauFiltresCoches>
  );
}
