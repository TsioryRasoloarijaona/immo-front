import type { DependencyList } from 'react';
import type { DossierFilterParams } from './api';
import { getTotauxDossiers } from './apiDossierListe';
import { demandeTotauxNature } from './dossierListe';
import { useApi } from './useApi';
import type { ColonneDto } from '../types';

/**
 * Σ des montants par nature (`GET /api/dossiers/totaux`) : appelé seulement si une de ces colonnes est
 * affichée, la requête relisant l'échéancier de tout le filtre. Lots libres seuls : rien à additionner.
 */
export function useTotauxNature(filtres: DossierFilterParams, cles: DependencyList, colonnes: readonly ColonneDto[]) {
  const actif = filtres.lignes !== 'LIBRES' && demandeTotauxNature(colonnes);
  return useApi(
    () => (actif ? getTotauxDossiers(filtres) : Promise.resolve(null)),
    [...cles, actif],
    'dossiers-totaux-nature',
  );
}
