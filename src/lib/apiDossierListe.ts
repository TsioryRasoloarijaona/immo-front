// Endpoints de FEATURE-dossiers-liste-complete.md : Σ des montants par nature de la liste des dossiers.
import { request, type DossierFilterParams } from './api';
import type { TotauxDossiersDto } from '../types/dossierListe';

/** Mêmes filtres que `listDossiers` (périmètre commercial compris), sur tout le résultat, pas la page. */
export function getTotauxDossiers(params: DossierFilterParams): Promise<TotauxDossiersDto> {
  return request('GET', '/api/dossiers/totaux', { query: params });
}
