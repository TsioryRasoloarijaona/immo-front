import PanneauFiltresCoches from '../liste/PanneauFiltresCoches';
import BoiteFiltre from '../liste/BoiteFiltre';
import FiltreEntiteProjetTranche from '../liste/FiltreEntiteProjetTranche';
import { pucesCascade, type CascadeTranches, type SelectionCascade } from '../../lib/cascadeTranches';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import { ETAT_PIECE_ITEMS, SENS_ITEMS, type FiltresListeAffectations, type SensAffectation } from '../../lib/suiviAffectations';

type Item = { label: string; value: string };

/** « Tous » = aucune case cochée : les deux sens réels seulement. */
const SENS_CHOISIS = SENS_ITEMS.filter((s) => s.value !== 'TOUS');

export type ChoixFiltresAffectations = {
  categories: Item[];
  types: Item[];
  statuts: Item[];
};

/** Filtres serveur de la liste ; `changer` remet la pagination à zéro côté page. */
export default function FiltresAffectationsPanneau({
  filtres,
  changer,
  changerCascade,
  cascade,
  reinitialiser,
  ferme,
  onBasculer,
  choix,
}: Readonly<{
  filtres: FiltresListeAffectations;
  changer: <K extends keyof FiltresListeAffectations>(cle: K, valeur: FiltresListeAffectations[K]) => void;
  changerCascade: (sel: SelectionCascade) => void;
  cascade: CascadeTranches;
  reinitialiser: () => void;
  ferme: boolean;
  onBasculer: () => void;
  choix: ChoixFiltresAffectations;
}>) {
  const puces = [
    ...pucesCascade(cascade, filtres),
    ...puceSelection('Catégorie', choix.categories, filtres.categorieId),
    ...puceSelection('Type', choix.types, filtres.typeId),
    ...puceSelection('Statut', choix.statuts, filtres.statut),
    ...puceSelection('État', ETAT_PIECE_ITEMS, filtres.etatPiece),
    ...(filtres.sens === 'TOUS' ? [] : puceUnique(SENS_CHOISIS, filtres.sens)),
    ...(filtres.search ? [`« ${filtres.search} »`] : []),
  ];

  return (
    <PanneauFiltresCoches
      ferme={ferme}
      onBasculer={onBasculer}
      puces={puces}
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
        placeholder: 'Tiers, dossier, article, pièce…',
      }}
      onReinitialiser={reinitialiser}
    >
      <FiltreEntiteProjetTranche valeur={filtres} onChange={changerCascade} cascade={cascade} />
      <BoiteFiltre titre="Catégorie" mode="multiple" items={choix.categories} valeur={filtres.categorieId} onChange={(v) => changer('categorieId', v)} />
      <BoiteFiltre titre="Type de pièce" mode="multiple" items={choix.types} valeur={filtres.typeId} onChange={(v) => changer('typeId', v)} />
      <BoiteFiltre titre="Statut du dossier" mode="multiple" items={choix.statuts} valeur={filtres.statut} onChange={(v) => changer('statut', v)} />
      <BoiteFiltre titre="État de la pièce" mode="multiple" items={ETAT_PIECE_ITEMS} valeur={filtres.etatPiece} onChange={(v) => changer('etatPiece', v)} />
      <BoiteFiltre
        titre="Sens"
        mode="unique"
        items={SENS_CHOISIS}
        valeur={filtres.sens === 'TOUS' ? null : filtres.sens}
        onChange={(v) => changer('sens', (v ?? 'TOUS') as SensAffectation)}
      />
    </PanneauFiltresCoches>
  );
}
