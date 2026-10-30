// Endpoints de FEATURE-admin-roles.md, Administrateur seul (403 sinon).
import { request } from './api';
import type { PageDto, UUID } from '../types';
import type {
  DroitsRoleEcritureDto,
  FiltresRoles,
  NoeudDroitDto,
  RoleDto,
  RoleEcritureDto,
  RoleLigneDto,
} from '../types/roles';

const RACINE_ROLES = '/api/administration/roles';
/** Pour `useExportListe`. */
export const EXPORT_ROLES = `${RACINE_ROLES}/export`;

export function listRoles(filtres: FiltresRoles & { page?: number; size?: number }): Promise<PageDto<RoleLigneDto>> {
  return request('GET', RACINE_ROLES, { query: { ...filtres } });
}

export function getArbreDroits(): Promise<NoeudDroitDto[]> {
  return request('GET', `${RACINE_ROLES}/arbre-droits`);
}

export function getRole(id: UUID): Promise<RoleDto> {
  return request('GET', `${RACINE_ROLES}/${id}`);
}

/** 400 code manquant ou trop long, 409 code déjà pris. */
export function creerRole(body: RoleEcritureDto): Promise<RoleDto> {
  return request('POST', RACINE_ROLES, { body });
}

/** 409 sur le rôle Administrateur. */
export function modifierRole(id: UUID, body: RoleEcritureDto): Promise<RoleDto> {
  return request('PATCH', `${RACINE_ROLES}/${id}`, { body });
}

/** 400 code absent de l'arbre, 409 sur le rôle Administrateur. */
export function remplacerDroitsRole(id: UUID, body: DroitsRoleEcritureDto): Promise<RoleDto> {
  return request('PUT', `${RACINE_ROLES}/${id}/droits`, { body });
}

/** 409 rôle Administrateur ou rôle lié, message du serveur à afficher tel quel. */
export function supprimerRole(id: UUID): Promise<void> {
  return request('DELETE', `${RACINE_ROLES}/${id}`);
}
