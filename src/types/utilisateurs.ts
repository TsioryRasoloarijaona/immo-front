// Fil de FEATURE-admin-utilisateurs.md, noms exacts de l'OpenAPI.
import type { ReferentielItemDto, UUID } from '../types';
import type { RestrictionsRoleDto } from './roles';

export interface FiltresUtilisateurs {
  search?: string;
  disabled?: boolean;
  roleId?: UUID;
  personnelId?: UUID;
}

/** PATCH : absent ou null = inchangé, `""` = vidé pour les textes ; `code` ignoré. */
export interface UtilisateurEcritureDto {
  code?: string;
  description?: string;
  email?: string;
  telephone?: string;
  mobile?: string;
  personnelId?: UUID;
  /** POST : vrai si absent. `true` coupe chat, mobile et la session du compte. */
  inactif?: boolean;
  avecNotification?: boolean;
  peutMasquerNotification?: boolean;
  accesMobile?: boolean;
  smtpServeur?: string;
  smtpPort?: number;
  smtpSsl?: boolean;
  cultureWebId?: UUID;
  roleWebId?: UUID;
  /** PATCH : remet le lien à NULL, prime sur `personnelId`. */
  viderPersonnel?: boolean;
  /** PATCH : remet le lien à NULL, prime sur `roleWebId`. */
  viderRoleWeb?: boolean;
}

export interface PersonnelReferenceDto {
  id: UUID;
  code?: string;
  description?: string;
  email?: string | null;
  mobile?: string | null;
  telephone?: string | null;
}

export interface UtilisateurFicheDto {
  id: UUID;
  code?: string | null;
  description?: string | null;
  email?: string | null;
  telephone?: string | null;
  mobile?: string | null;
  personnelId?: UUID | null;
  personnelNom?: string | null;
  inactif: boolean;
  avecNotification: boolean;
  peutMasquerNotification: boolean;
  accesMobile: boolean;
  smtpServeur?: string | null;
  smtpPort?: number | null;
  smtpSsl: boolean;
  cultureWebId?: UUID | null;
  roleWebId?: UUID | null;
  roleIds: UUID[];
  compteDepotIds: UUID[];
  /** Calculées, lecture seule : levée si au moins un rôle a false. */
  restrictions: RestrictionsRoleDto;
  compteWeb: boolean;
  creePar?: string | null;
  creeLe?: string | null;
  modifiePar?: string | null;
  modifieLe?: string | null;
}

export interface UtilisateurReferencesDto {
  roles: ReferentielItemDto[];
  cultures: ReferentielItemDto[];
  personnels: PersonnelReferenceDto[];
  comptesDepot: ReferentielItemDto[];
}

export type TypeHabilitation = 'SOCIETE' | 'PROJET' | 'TRANCHE' | 'PROJET_TRAVAUX';

export interface CibleHabilitationDto {
  type: TypeHabilitation;
  id: UUID;
}

export interface NoeudHabilitationDto extends CibleHabilitationDto {
  libelle: string;
  coche: boolean;
  /** Ligne à plusieurs cibles gérée dans OMRAN : cochée, non modifiable. */
  figee: boolean;
  enfants: NoeudHabilitationDto[];
}
