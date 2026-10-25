// « Imprimer les premières relances » d'une tranche (Administrateur) : 400 sans date de 1re relance, 404 tranche invisible.
import { API_BASE_URL, fetchByteEndpointBlob, request } from './api';
import type { UUID } from '../types';
import type { ApercuPremieresRelancesDto, ResultatPremieresRelancesDto } from '../types/premieresRelances';

const base = (trancheId: UUID) => `/api/tranches/${encodeURIComponent(trancheId)}/premieres-relances`;

export function getApercuPremieresRelances(trancheId: UUID): Promise<ApercuPremieresRelancesDto> {
  return request<ApercuPremieresRelancesDto>('GET', `${base(trancheId)}/apercu`);
}

/** Une transaction : dates des dossiers + alertes. */
export function executerPremieresRelances(trancheId: UUID): Promise<ResultatPremieresRelancesDto> {
  return request<ResultatPremieresRelancesDto>('POST', base(trancheId));
}

/** Une page par dossier relancé ; 400 « Aucun dossier à imprimer ». */
export function lettresPremieresRelances(trancheId: UUID): Promise<Blob> {
  return fetchByteEndpointBlob(`${API_BASE_URL}${base(trancheId)}.pdf`, 'application/pdf');
}
