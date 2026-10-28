// Endpoints de FEATURE-patrimoine-lotissements.md (la liste reste `listTerrains('lotissements', …)`, filtre `trancheId`).
import { API_BASE_URL, fetchByteEndpointBlob, request } from './api';
import type { UUID } from '../types';
import type { LotissementDetailDto, LotissementEcritureDto } from '../types/lotissements';

const LOTISSEMENTS = '/api/lotissements';

/** 404 : pas un lot (terrain sans tranche, article) ou entité inactive. */
export function getLotissement(id: UUID): Promise<LotissementDetailDto> {
  return request('GET', `${LOTISSEMENTS}/${id}`);
}

/** Administrateur. 400 champ invalide (message nommant le champ) ; 409 code déjà pris dans la tranche. */
export function createLotissement(saisie: LotissementEcritureDto): Promise<LotissementDetailDto> {
  return request('POST', LOTISSEMENTS, { body: saisie });
}

/** Administrateur. 409 champ protégé d'un lot occupé, ou changement de tranche refusé. */
export function updateLotissement(id: UUID, saisie: LotissementEcritureDto): Promise<LotissementDetailDto> {
  return request('PATCH', `${LOTISSEMENTS}/${id}`, { body: saisie });
}

/** Administrateur. 409 lot occupé, frais validé ou encore référencé (message du serveur). */
export function deleteLotissement(id: UUID): Promise<void> {
  return request('DELETE', `${LOTISSEMENTS}/${id}`);
}

/** PDF `inline`, mêmes droit et visibilité que le détail. */
export function ficheLotissementPdf(id: UUID): Promise<Blob> {
  return fetchByteEndpointBlob(`${API_BASE_URL}${LOTISSEMENTS}/${encodeURIComponent(id)}/fiche.pdf`, 'application/pdf');
}
