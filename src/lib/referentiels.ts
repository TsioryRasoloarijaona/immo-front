import { useEffect, useRef, useState } from 'react';
import * as api from './api';
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

  return function useCachedList(): { data: T[]; loading: boolean; error: string | null } {
    const [, forceUpdate] = useState(0);
    const mounted = useRef(true);
    useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
      };
    }, []);

    useEffect(() => {
      if (cache.data || cache.promise) return;
      cache.promise = fetcher()
        .then((result) => {
          cache.data = result;
          if (mounted.current) forceUpdate((n) => n + 1);
          return result;
        })
        .catch((err: unknown) => {
          cache.error = err instanceof Error ? err.message : 'Erreur inconnue.';
          if (mounted.current) forceUpdate((n) => n + 1);
          return [];
        });
    }, []);

    return { data: cache.data ?? [], loading: !cache.data && !cache.error, error: cache.error };
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
export const useOriginesProspection = makeCachedListHook(api.getOriginesProspection);
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

/** {id, code, description} → Select `items` shape, description preferred. */
export function referentielItems(list: ReferentielItemDto[]): { label: string; value: string }[] {
  return list.map((r) => ({ label: r.description || r.code || r.id, value: r.id }));
}
