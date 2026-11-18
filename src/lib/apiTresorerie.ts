// Endpoints de FEATURE-n3-recettes-depenses.md : trésorerie Projet / Achat, en lecture.
import { request } from './api';
import type { UUID } from '../types';
import type {
  AffectationLigneDto,
  DecaissementFicheDto,
  DecaissementLigneDto,
  FiltresTresorerie,
  ListeTresorerieDto,
  RecettesDto,
  SensTresorerie,
  TotauxAffectationsDto,
  TotauxDecaissementsDto,
  VueRecette,
} from '../types/tresorerie';

const RACINE = '/api/tresorerie';

export function getDecaissements(
  filtres: FiltresTresorerie,
): Promise<ListeTresorerieDto<DecaissementLigneDto, TotauxDecaissementsDto>> {
  return request('GET', `${RACINE}/decaissements`, { query: { ...filtres } });
}

/** 404 si le décaissement est inconnu ou invisible. */
export function getDecaissement(id: UUID): Promise<DecaissementFicheDto> {
  return request('GET', `${RACINE}/decaissements/${id}`);
}

export function getAffectations(
  sens: SensTresorerie,
  filtres: FiltresTresorerie,
): Promise<ListeTresorerieDto<AffectationLigneDto, TotauxAffectationsDto>> {
  return request('GET', `${RACINE}/affectations`, { query: { ...filtres, sens } });
}

export function getRecettes(vue: VueRecette, filtres: FiltresTresorerie): Promise<RecettesDto> {
  return request('GET', `${RACINE}/recettes/${vue}`, { query: { ...filtres } });
}
