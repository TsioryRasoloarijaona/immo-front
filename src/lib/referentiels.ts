import { useEffect, useState } from 'react';
import * as api from './api';
import { getReferentielContenances, getReferentielPatrimoine } from './apiPatrimoine';
import { onCacheClear } from './apiCache';
import { errorMessage } from './useApi';
import type { ReferentielItemDto } from '../types';

interface CacheEntry<T> {
  promise: Promise<T> | null;
  data: T | null;
  error: string | null;
}

function makeCachedListHook<T>(fetcher: () => Promise<T[]>) {
  const cache: CacheEntry<T[]> = { promise: null, data: null, error: null };
  // Référence stable : un `[]` neuf à chaque rendu relancerait les effets qui en dépendent.
  const vide: T[] = [];
  const abonnes = new Set<() => void>();
  const prevenir = () => {
    for (const abonne of abonnes) abonne();
  };

  function charger(revalider = false): void {
    if (!revalider && (cache.data || cache.promise)) return;
    cache.error = null;
    const promise: Promise<T[]> = fetcher();
    cache.promise = promise;
    promise
      .then((result) => {
        if (cache.promise !== promise) return;
        cache.data = result;
        prevenir();
      })
      .catch((err: unknown) => {
        if (cache.promise !== promise) return;
        // `promise` remis à zéro : le prochain montage réessaie.
        cache.promise = null;
        cache.data = null;
        cache.error = errorMessage(err);
        prevenir();
      });
  }

  // Vidé avec `clearApiCache` (logout, login, mutation) : un autre compte peut
  // avoir un autre périmètre. Écran monté : l'ancienne liste reste affichée
  // pendant le rechargement, et tombe si celui-ci échoue.
  const vider = () => {
    cache.data = null;
    cache.error = null;
  };
  onCacheClear(() => {
    cache.promise = null;
    if (abonnes.size === 0) {
      vider();
      return;
    }
    // Différé : au logout, l'écran est démonté avant et rien ne repart sans cookie.
    setTimeout(() => {
      if (abonnes.size === 0) vider();
      else charger(true);
    }, 0);
  });

  return function useCachedList(): { data: T[]; loading: boolean; error: string | null } {
    const [, forceUpdate] = useState(0);

    useEffect(() => {
      const abonne = () => forceUpdate((n) => n + 1);
      abonnes.add(abonne);
      charger();
      return () => {
        abonnes.delete(abonne);
      };
    }, []);

    return { data: cache.data ?? vide, loading: !cache.data && !cache.error, error: cache.error };
  };
}

export const useVocations = makeCachedListHook(api.getVocations);
export const useTypesResidence = makeCachedListHook(api.getTypesResidence);
export const useTypesRelationContact = makeCachedListHook(api.getTypesRelationContact);
export const useTypesPieceIdentite = makeCachedListHook(api.getTypesPieceIdentite);
export const useTypesPieceJointe = makeCachedListHook(api.getTypesPieceJointe);
export const useTypesContactProspection = makeCachedListHook(api.getTypesContactProspection);
export const useTypesBienReferentiel = makeCachedListHook(api.getTypesBienReferentiel);
export const useTitres = makeCachedListHook(api.getTitres);
export const useTierTypes = makeCachedListHook(api.getTierTypes);
export const useSituationsFamiliales = makeCachedListHook(api.getSituationsFamiliales);
export const useSexes = makeCachedListHook(api.getSexes);
export const useSalaires = makeCachedListHook(api.getSalaires);
export const useRegimesMatrimoniaux = makeCachedListHook(api.getRegimesMatrimoniaux);
export const useRaisonsCloture = makeCachedListHook(api.getRaisonsCloture);
export const useSupportsOrigine = makeCachedListHook(api.getSupportsOrigine);
export const useProfilsProspection = makeCachedListHook(api.getProfilsProspection);
/** @public référentiel servi, pas encore branché sur un écran */
export const useProfessions = makeCachedListHook(api.getProfessions);
export const usePays = makeCachedListHook(api.getPays);
/** Triées ici, sur le libellé affiché : tous les combos « Origine » doivent avoir le même ordre. */
export const useOriginesProspection = makeCachedListHook(() =>
  api.getOriginesProspection().then((list) =>
    [...list].sort((a, b) =>
      (a.description || a.code || a.id).localeCompare(b.description || b.code || b.id, 'fr', { numeric: true, sensitivity: 'base' }),
    ),
  ),
);
export const useNationalites = makeCachedListHook(api.getNationalites);
export const useEtapesProspection = makeCachedListHook(api.getEtapesProspection);
export const useCategoriesBien = makeCachedListHook(api.getCategoriesBien);
export const useCategoriesEcheance = makeCachedListHook(api.getCategoriesEcheance);
export const useActionsCommerciales = makeCachedListHook(api.getActionsCommerciales);
export const useModesPaiement = makeCachedListHook(api.getModesPaiement);
export const useTypesReglement = makeCachedListHook(api.getTypesReglement);
export const useBanques = makeCachedListHook(api.getBanques);
export const useEntitesReferentiel = makeCachedListHook(api.getEntitesReferentiel);
export const useNatures = makeCachedListHook(api.getNatures);
export const useEtages = makeCachedListHook(api.getEtages);
// Formulaires d'article : un hook par variante filtrée (un cache par fetcher, voir plus bas).
export const useImmeubles = makeCachedListHook(api.getImmeubles);
export const useVocationsArticle = makeCachedListHook(() => api.getVocations(true));
export const useCategoriesArticle = makeCachedListHook(() => api.getCategoriesBien(false));
export const useCategoriesSousArticle = makeCachedListHook(() => api.getCategoriesBien(true));
export const useTypesArticle = makeCachedListHook(() => api.getTypesBienReferentiel(false));
export const useTypesSousArticle = makeCachedListHook(() => api.getTypesBienReferentiel(true));
export const useComptesReferentiel = makeCachedListHook(() => api.getComptesReferentiel());
export const useDepotsReferentiel = makeCachedListHook(api.getDepotsReferentiel);
export const useResultatsInteraction = makeCachedListHook(api.getResultatsInteraction);
export const useProjetsReferentiel = makeCachedListHook(api.getProjetsReferentiel);

export const useTranchesReferentiel = makeCachedListHook(api.getTranchesReferentiel);

export const useTranchesFiltre = makeCachedListHook(() =>
  api.listTranches(undefined, { page: 0, size: 500 }).then((page) => page.content),
);

/* Un hook par catalogue de colonnes, pas un hook paramétré : `makeCachedListHook`
   referme un cache sur son fetcher, un hook unique servirait le même catalogue partout. */

export const useColonnesProspections = makeCachedListHook(api.getColonnesProspections);

export const useColonnesDossiers = makeCachedListHook(api.getColonnesDossiers);

export const useColonnesProspects = makeCachedListHook(api.getColonnesProspects);

export const useColonnesEncaissements = makeCachedListHook(api.getColonnesEncaissements);

export const useColonnesSuiviActions = makeCachedListHook(api.getColonnesSuiviActions);

export const useColonnesImpayes = makeCachedListHook(api.getColonnesImpayes);

export const useColonnesTranches = makeCachedListHook(api.getColonnesTranches);

export const useColonnesEtatVentes = makeCachedListHook(api.getColonnesEtatVentes);

export const useColonnesSuiviCommerciaux = makeCachedListHook(api.getColonnesSuiviCommerciaux);

// Fiches programme et tranche (`/api/referentiels-patrimoine`).
export const useStandings = makeCachedListHook(() => getReferentielPatrimoine('standings'));
export const useNiveauxTerrain = makeCachedListHook(() => getReferentielPatrimoine('niveaux-terrain'));
export const useRubriquesTranche = makeCachedListHook(() => getReferentielPatrimoine('rubriques-tranche'));
export const usePersonnels = makeCachedListHook(() => getReferentielPatrimoine('personnels'));
export const usePlansComptables = makeCachedListHook(() => getReferentielPatrimoine('plans-comptables'));
export const useTiersAutrui = makeCachedListHook(() => getReferentielPatrimoine('tiers-autrui'));
export const useOrientations = makeCachedListHook(() => getReferentielPatrimoine('orientations'));
export const useCategoriesCharge = makeCachedListHook(() => getReferentielPatrimoine('categories-charge'));
export const useFacades = makeCachedListHook(() => getReferentielPatrimoine('facades'));
export const useVues = makeCachedListHook(() => getReferentielPatrimoine('vues'));
export const useContenances = makeCachedListHook(getReferentielContenances);

export function referentielItems(list: ReferentielItemDto[]): { label: string; value: string }[] {
  return list.map((r) => ({ label: r.description || r.code || r.id, value: r.id }));
}
