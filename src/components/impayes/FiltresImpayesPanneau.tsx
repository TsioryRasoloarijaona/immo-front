import { Input } from '../ui/input';
import PanneauFiltresCoches from '../liste/PanneauFiltresCoches';
import BoiteFiltre from '../liste/BoiteFiltre';
import FiltreEntiteProjetTranche from '../liste/FiltreEntiteProjetTranche';
import { pucesCascade, type CascadeTranches, type SelectionCascade } from '../../lib/cascadeTranches';
import { puceUnique } from '../../lib/pucesFiltres';
import { CHAMP_DATE_IMPAYE_ITEMS, ECHU_ITEMS, type FiltresImpayes } from '../../lib/impayes';

type Item = { label: string; value: string };

/** Filtres serveur de l'écran « Impayés » ; `changer` remet la pagination à zéro côté page. */
export default function FiltresImpayesPanneau({
  filtres,
  changer,
  reinitialiser,
  ferme,
  onBasculer,
  cascade,
  commerciaux,
  categories,
}: Readonly<{
  filtres: FiltresImpayes;
  changer: <K extends keyof FiltresImpayes>(cle: K, valeur: FiltresImpayes[K]) => void;
  reinitialiser: () => void;
  ferme: boolean;
  onBasculer: () => void;
  cascade: CascadeTranches;
  commerciaux: Item[];
  categories: Item[];
}>) {
  function changerCascade(sel: SelectionCascade) {
    changer('entiteId', sel.entiteId);
    changer('projetId', sel.projetId);
    changer('trancheId', sel.trancheId);
  }

  const puces = [
    ...pucesCascade(cascade, filtres),
    ...puceUnique(commerciaux, filtres.commercialId),
    ...puceUnique(categories, filtres.categorieId),
    ...(filtres.echu === 'ECHEANCE' ? [] : puceUnique(ECHU_ITEMS, filtres.echu)),
    ...(filtres.client ? [`Client : ${filtres.client}`] : []),
    ...(filtres.article ? [`Article : ${filtres.article}`] : []),
    ...(filtres.q ? [`« ${filtres.q} »`] : []),
  ];

  return (
    <PanneauFiltresCoches
      ferme={ferme}
      onBasculer={onBasculer}
      puces={puces}
      champDate={{
        items: CHAMP_DATE_IMPAYE_ITEMS,
        valeur: filtres.champDate,
        onChange: (v) => changer('champDate', v as FiltresImpayes['champDate']),
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
        valeur: filtres.q,
        onChange: (v) => changer('q', v),
        placeholder: 'Notes, catégorie, tranche, projet, dossier…',
      }}
      onReinitialiser={reinitialiser}
      champs={
        <>
          <Input aria-label="Client" placeholder="Client" className="w-35" value={filtres.client} onChange={(e) => changer('client', e.target.value)} />
          <Input
            aria-label="Article (code exact)"
            placeholder="Article (code exact)"
            className="w-40"
            value={filtres.article}
            onChange={(e) => changer('article', e.target.value)}
          />
        </>
      }
    >
      <FiltreEntiteProjetTranche valeur={filtres} onChange={changerCascade} cascade={cascade} />
      <BoiteFiltre
        titre="Échu à"
        mode="unique"
        items={ECHU_ITEMS}
        valeur={filtres.echu}
        onChange={(v) => changer('echu', (v ?? 'TOUS') as FiltresImpayes['echu'])}
      />
      <BoiteFiltre titre="Commercial" mode="unique" items={commerciaux} valeur={filtres.commercialId} onChange={(v) => changer('commercialId', v)} />
      <BoiteFiltre titre="Catégorie" mode="unique" items={categories} valeur={filtres.categorieId} onChange={(v) => changer('categorieId', v)} />
    </PanneauFiltresCoches>
  );
}
