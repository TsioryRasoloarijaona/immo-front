// Demandes de remise des agences (FEATURE-agences-vente.md A3).
import { request } from './api';
import type { UUID } from '../types';
import type {
  AccepterRemiseRequest,
  DemandeRemiseDto,
  DemanderRemiseRequest,
  RefuserRemiseRequest,
  StatutDemandeRemise,
} from '../types/remise';

const RACINE = '/api/demandes-remise';
const duDossier = (dossierId: UUID) => `/api/dossiers/${dossierId}/demandes-remise`;

export function demanderRemise(dossierId: UUID, corps: DemanderRemiseRequest): Promise<DemandeRemiseDto> {
  return request('POST', duDossier(dossierId), { body: corps });
}

export function listerDemandesRemiseDossier(dossierId: UUID): Promise<DemandeRemiseDto[]> {
  return request('GET', duDossier(dossierId));
}

export function annulerDemandeRemise(id: UUID): Promise<DemandeRemiseDto> {
  return request('POST', `${RACINE}/${id}/annulation`);
}

/** File du siège valideur ; 403 si le compte n'a pas `validationRemise`. */
export function listerDemandesRemise(statut: StatutDemandeRemise = 'EN_ATTENTE'): Promise<DemandeRemiseDto[]> {
  return request('GET', RACINE, { query: { statut } });
}

export function accepterDemandeRemise(id: UUID, corps: AccepterRemiseRequest = {}): Promise<DemandeRemiseDto> {
  return request('POST', `${RACINE}/${id}/acceptation`, { body: corps });
}

export function refuserDemandeRemise(id: UUID, corps: RefuserRemiseRequest): Promise<DemandeRemiseDto> {
  return request('POST', `${RACINE}/${id}/refus`, { body: corps });
}
