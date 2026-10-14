import { request } from './api';
import type { ReferentielItemDto, UUID } from '../types';
import type { DossierModifieDto, DroitsEditionDto, ModifierDossierRequest } from '../types/edition';

export function modifierDossier(id: UUID, corps: ModifierDossierRequest): Promise<DossierModifieDto> {
  return request('PATCH', `/api/dossiers/${id}`, { body: corps });
}

export function getDroitsEdition(id: UUID): Promise<DroitsEditionDto> {
  return request('GET', `/api/dossiers/${id}/edition`);
}

export function listDecisionsMeilleurTaux(): Promise<ReferentielItemDto[]> {
  return request('GET', '/api/dossiers/decisions-meilleurtaux');
}
