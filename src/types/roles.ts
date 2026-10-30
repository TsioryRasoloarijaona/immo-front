// Fil de /api/administration/roles (FEATURE-admin-roles.md), noms exacts de l'OpenAPI.
import type { UUID } from '../types';

export interface RoleLigneDto {
  id: UUID;
  code: string | null;
  description: string | null;
  utilisateurs: number;
  droits: number;
}

/** Jamais null à la lecture ; en écriture, une case absente vaut true à la création et reste inchangée en modification. */
export interface RestrictionsRoleDto {
  ajoutPiecesJointes?: boolean | null;
  modificationPiecesJointes?: boolean | null;
  suppressionPiecesJointes?: boolean | null;
  ajoutActions?: boolean | null;
  modificationActions?: boolean | null;
  suppressionActions?: boolean | null;
  rapports?: boolean | null;
  audits?: boolean | null;
  champsSpecifiques?: boolean | null;
  sequences?: boolean | null;
}

export interface RoleDto {
  id: UUID;
  code: string | null;
  description: string | null;
  restrictions: Record<keyof RestrictionsRoleDto, boolean>;
  codesDroits: string[];
  droitsHorsArbre: number;
  verrouille: boolean;
}

export interface RoleEcritureDto {
  /** Création seulement, ignoré en modification. */
  code?: string | null;
  description?: string | null;
  restrictions?: RestrictionsRoleDto | null;
}

export interface NoeudDroitDto {
  code: string;
  description: string | null;
  profondeur: number | null;
  /** Module, Form, Group ou Action. */
  type: string | null;
}

export interface DroitsRoleEcritureDto {
  codes: string[];
}

export interface FiltresRoles {
  texte?: string;
}
