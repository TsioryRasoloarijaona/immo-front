import { useEffect, useState } from 'react';
import * as api from './api';
import { onCacheClear } from './apiCache';
import { errorMessage } from './useApi';
import type { ReferentielItemDto } from '../types';

// Every /api/referentiels/* endpoint below is small, static-ish lookup data
// (title/sex/country/étape lists, …) shared across many forms — cached at
// module scope (like the old prototype's useData, but per-endpoint and
// lazy) instead of refetched on every mount.

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
export const useProfilsProspection = makeCachedListHook(api.getProfilsProspection);
export const useProfessions = makeCachedListHook(api.getProfessions);
export const usePays = makeCachedListHook(api.getPays);
/** Triées une fois ici, sur le libellé affiché, pour que tous les combos et
 * filtres « Source de contact » / « Origine » aient le même ordre (OMRAN 0001166). */
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
export const useComptesReferentiel = makeCachedListHook(api.getComptesReferentiel);
export const useDepotsReferentiel = makeCachedListHook(api.getDepotsReferentiel);
export const useResultatsInteraction = makeCachedListHook(api.getResultatsInteraction);
/** `CfgProject` — premier maillon de la cascade Projet → Tranche → Article,
 * et source du filtre avancé `projetId` sur la liste des prospections. */
export const useProjetsReferentiel = makeCachedListHook(api.getProjetsReferentiel);

export const useTranchesReferentiel = makeCachedListHook(api.getTranchesReferentiel);

/** Toutes les tranches visibles, pour les filtres des listes (une seule page de 500). */
export const useTranchesFiltre = makeCachedListHook(() =>
  api.listTranches(undefined, { page: 0, size: 500 }).then((page) => page.content),
);

/* Les trois catalogues de colonnes. Seuls référentiels d'ici qui ne soient pas
   des listes `{id, code, description}` — ils alimentent le sélecteur de
   colonnes, et non un `Select`. Mis en cache comme les autres : petits,
   immuables pendant une session, et lus à chaque montage de leur écran.

   Trois hooks et non un seul paramétré : `makeCachedListHook` referme un cache
   sur son fetcher, donc une fonction unique partagerait un cache entre trois
   catalogues distincts et servirait le premier arrivé aux trois écrans. */

/** Consommé par la liste des prospections **et** celle des pré-prospections —
 * cette dernière en filtre deux groupes, le catalogue est le même. */
export const useColonnesProspections = makeCachedListHook(api.getColonnesProspections);

/** Liste des dossiers de vente. 40 colonnes, 13 par défaut. */
export const useColonnesDossiers = makeCachedListHook(api.getColonnesDossiers);

/** Liste des prospects. 47 colonnes, 10 par défaut. */
export const useColonnesProspects = makeCachedListHook(api.getColonnesProspects);

/** Liste des encaissements. 40 colonnes, 27 par défaut — dont **sept clés
 * UUID**, d'où le `masquees` le plus fourni des quatre dispositions. */
export const useColonnesEncaissements = makeCachedListHook(api.getColonnesEncaissements);

/** Suivi des actions. 35 colonnes ; par défaut celles de la doc OMRAN qui
 * portent de l'information, les identifiants et l'audit hors défaut. */
export const useColonnesSuiviActions = makeCachedListHook(api.getColonnesSuiviActions);

/** {id, code, description} → Select `items` shape, description preferred. */
export function referentielItems(list: ReferentielItemDto[]): { label: string; value: string }[] {
  return list.map((r) => ({ label: r.description || r.code || r.id, value: r.id }));
}
