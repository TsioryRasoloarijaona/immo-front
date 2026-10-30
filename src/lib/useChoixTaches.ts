import { getEntitesReferentiel } from './api';
import { getReferentielPatrimoine } from './apiPatrimoine';
import { listLignesReferentiel } from './apiReferentielsAdmin';
import { listModulesTaches } from './apiTaches';
import { choixDepuisLignes } from './fraisTerrain';
import { referentielItems } from './referentiels';
import { useApi } from './useApi';
import type { ListeChoix } from './saisieTache';

export type ChoixTaches = Record<ListeChoix, { label: string; value: string }[]>;

/** Listes de choix de l'écran Tâches ; projets = `PrjProject` (`projets-facturation`), pas le référentiel des tranches. */
export function useChoixTaches(): ChoixTaches {
  const types = useApi(() => listLignesReferentiel('types-tache'), [], 'taches-types');
  const priorites = useApi(() => listLignesReferentiel('priorites-tache'), [], 'taches-priorites');
  const personnes = useApi(() => getReferentielPatrimoine('personnels'), [], 'taches-personnes');
  const modules = useApi(listModulesTaches, [], 'taches-modules');
  const entites = useApi(getEntitesReferentiel, [], 'taches-entites');
  const projets = useApi(() => getReferentielPatrimoine('projets-facturation'), [], 'taches-projets');
  return {
    types: referentielItems(choixDepuisLignes(types.data ?? undefined)),
    priorites: referentielItems(choixDepuisLignes(priorites.data ?? undefined)),
    personnes: referentielItems(personnes.data ?? []),
    modules: referentielItems(modules.data ?? []),
    entites: referentielItems(entites.data ?? []),
    projets: referentielItems(projets.data ?? []),
  };
}
