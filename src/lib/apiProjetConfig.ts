// Endpoints de FEATURE-projet-config.md : projets et référentiels Administrateur seul (403 sinon), statuts de lot pour tous.
// Types de lot : moteur /api/referentiels-admin/types-lot (famille PROJET), voir apiReferentielsAdmin.ts.
import { request } from './api';
import type { UUID } from '../types';
import type {
  ProjetConfigDto,
  ProjetConfigRequest,
  ReferentielsProjetConfigDto,
  StatutLotDto,
} from '../types/projetConfig';

const RACINE = '/api/projet/config';
const PROJETS = `${RACINE}/projets`;

export function listProjetsConfig(): Promise<ProjetConfigDto[]> {
  return request('GET', PROJETS);
}

/** 400 champ obligatoire manquant, 409 code déjà utilisé. */
export function createProjetConfig(body: ProjetConfigRequest): Promise<ProjetConfigDto> {
  return request('POST', PROJETS, { body });
}

export function updateProjetConfig(id: UUID, body: ProjetConfigRequest): Promise<ProjetConfigDto> {
  return request('PUT', `${PROJETS}/${id}`, { body });
}

/** 409 « Utilisé par … », message du serveur à afficher tel quel. */
export function deleteProjetConfig(id: UUID): Promise<void> {
  return request('DELETE', `${PROJETS}/${id}`);
}

export function getReferentielsProjetConfig(): Promise<ReferentielsProjetConfigDto> {
  return request('GET', `${RACINE}/referentiels`);
}

export function listStatutsLot(): Promise<StatutLotDto[]> {
  return request('GET', `${RACINE}/statuts-lot`);
}
